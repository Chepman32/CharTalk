import type { AppRepository } from '@razvilka/app-core'
import {
  syncPullResponseSchema,
  syncPushRequestSchema,
  syncPushResponseSchema,
  type SyncConflict,
  type SyncPullResponse,
  type SyncOutboxEntry,
} from '@razvilka/sync-protocol'

import type { SyncState, SyncStateStore } from '../persistence/sync-state'

import { secureServiceBaseUrl } from './secure-endpoint'

export type SyncFlushStatus =
  'disabled' | 'unconfigured' | 'idle' | 'synced' | 'conflict' | 'unavailable'

export interface SyncFlushOptions {
  repository: AppRepository
  stateStore: SyncStateStore
  baseUrl?: string
  accessToken?: string
  deviceId: string
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
  now?: () => string
  random?: () => number
  maxBatches?: number
}

export interface SyncFlushResult {
  status: SyncFlushStatus
  acknowledgedEventIds: string[]
  remaining: number
  conflict: SyncConflict | null
  state: SyncState
}

export interface SyncPullOptions {
  baseUrl?: string
  accessToken?: string
  deviceId: string
  runId: string
  after?: string | null
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
}

const retryDelayMs = (attempts: number, random: () => number): number =>
  Math.min(60_000, 1_000 * 2 ** Math.min(6, Math.max(0, attempts))) *
  (0.5 + Math.min(1, Math.max(0, random())))

const isRetryDue = (
  entry: SyncOutboxEntry,
  nowMs: number,
  random: () => number,
): boolean => {
  if (!entry.lastAttemptAt) return true
  const lastAttemptMs = Date.parse(entry.lastAttemptAt)
  if (!Number.isFinite(lastAttemptMs)) return true
  return nowMs - lastAttemptMs >= retryDelayMs(entry.attempts, random)
}

const envelopeData = (value: unknown): unknown =>
  typeof value === 'object' && value !== null && 'data' in value
    ? value.data
    : value

const headersFor = (options: {
  accessToken?: string
  deviceId: string
}): Record<string, string> => ({
  accept: 'application/json',
  'content-type': 'application/json',
  'x-device-id': options.deviceId,
  ...(options.accessToken
    ? { authorization: `Bearer ${options.accessToken}` }
    : {}),
})

const markAttempt = async (
  repository: AppRepository,
  entries: readonly SyncOutboxEntry[],
  errorCode: string,
  attemptedAt: string,
): Promise<void> => {
  for (const entry of entries) {
    await repository.markSyncEventAttempt(
      entry.event.eventId,
      errorCode,
      attemptedAt,
    )
  }
}

/**
 * Flushes the durable local outbox. The function is deliberately transport-
 * agnostic: account/session tokens are supplied by the host auth layer, and
 * a failed request only advances retry metadata, never deletes local events.
 */
export async function flushSyncOutbox(
  options: SyncFlushOptions,
): Promise<SyncFlushResult> {
  const now = options.now ?? (() => new Date().toISOString())
  const random = options.random ?? Math.random
  let state = await options.stateStore.readSyncState()
  const baseUrl = secureServiceBaseUrl(
    options.baseUrl ?? process.env.EXPO_PUBLIC_RAZVILKA_API_URL,
  )
  if (!state.enabled) {
    return {
      status: 'disabled',
      acknowledgedEventIds: [],
      remaining: (await options.repository.listSyncOutbox()).length,
      conflict: null,
      state,
    }
  }
  if (!baseUrl || !options.accessToken || !options.deviceId) {
    return {
      status: 'unconfigured',
      acknowledgedEventIds: [],
      remaining: (await options.repository.listSyncOutbox()).length,
      conflict: null,
      state,
    }
  }

  const entries = await options.repository.listSyncOutbox(100)
  const dueEntries = entries.filter(entry =>
    isRetryDue(entry, Date.parse(now()) || Date.now(), random),
  )
  if (dueEntries.length === 0) {
    return {
      status: 'idle',
      acknowledgedEventIds: [],
      remaining: entries.length,
      conflict: null,
      state,
    }
  }

  const groups = new Map<string, SyncOutboxEntry[]>()
  for (const entry of dueEntries) {
    const group = groups.get(entry.run.runId) ?? []
    group.push(entry)
    groups.set(entry.run.runId, group)
  }
  const acknowledgedEventIds: string[] = []
  const maxBatches = Math.max(1, Math.min(20, options.maxBatches ?? 4))
  let batches = 0
  for (const group of groups.values()) {
    if (batches >= maxBatches) break
    const batch = group.slice(0, 100)
    const payload = syncPushRequestSchema.parse({
      deviceId: options.deviceId,
      cursor: state.cursor,
      run: batch.at(-1)!.run,
      events: batch.map(entry => entry.event),
    })
    let response: Response
    try {
      response = await (options.fetchImpl ?? fetch)(
        `${baseUrl}/v1/runs/${encodeURIComponent(batch[0]!.run.runId)}/events:push`,
        {
          method: 'POST',
          headers: headersFor(options),
          body: JSON.stringify(payload),
        },
      )
    } catch {
      const attemptedAt = now()
      await markAttempt(
        options.repository,
        batch,
        'NETWORK_UNAVAILABLE',
        attemptedAt,
      )
      state = await options.stateStore.writeSyncState({
        enabled: true,
        lastErrorCode: 'NETWORK_UNAVAILABLE',
      })
      return {
        status: 'unavailable',
        acknowledgedEventIds,
        remaining: (await options.repository.listSyncOutbox()).length,
        conflict: null,
        state,
      }
    }

    let raw: unknown
    try {
      raw = await response.json()
    } catch {
      raw = null
    }
    const parsed = syncPushResponseSchema.safeParse(envelopeData(raw))
    if (!parsed.success) {
      await markAttempt(
        options.repository,
        batch,
        'INVALID_SERVER_RESPONSE',
        now(),
      )
      state = await options.stateStore.writeSyncState({
        enabled: true,
        lastErrorCode: 'INVALID_SERVER_RESPONSE',
      })
      return {
        status: 'unavailable',
        acknowledgedEventIds,
        remaining: (await options.repository.listSyncOutbox()).length,
        conflict: null,
        state,
      }
    }

    const acknowledged = [
      ...parsed.data.acceptedEventIds,
      ...parsed.data.duplicateEventIds,
    ]
    if (acknowledged.length > 0) {
      await options.repository.markSyncEventsAcknowledged(acknowledged)
      acknowledgedEventIds.push(...acknowledged)
    }
    if (parsed.data.conflict) {
      await markAttempt(
        options.repository,
        batch.filter(entry => !acknowledged.includes(entry.event.eventId)),
        parsed.data.conflict.code,
        now(),
      )
      state = await options.stateStore.writeSyncState({
        enabled: true,
        cursor: parsed.data.cursor,
        lastErrorCode: parsed.data.conflict.code,
      })
      return {
        status: 'conflict',
        acknowledgedEventIds,
        remaining: (await options.repository.listSyncOutbox()).length,
        conflict: parsed.data.conflict,
        state,
      }
    }

    if (acknowledged.length !== batch.length) {
      await markAttempt(options.repository, batch, 'ACK_INCOMPLETE', now())
      state = await options.stateStore.writeSyncState({
        enabled: true,
        lastErrorCode: 'ACK_INCOMPLETE',
      })
      return {
        status: 'unavailable',
        acknowledgedEventIds,
        remaining: (await options.repository.listSyncOutbox()).length,
        conflict: null,
        state,
      }
    }
    state = await options.stateStore.writeSyncState({
      enabled: true,
      cursor: parsed.data.cursor,
      lastSuccessAt: now(),
      lastErrorCode: null,
    })
    batches += 1
  }

  return {
    status: acknowledgedEventIds.length > 0 ? 'synced' : 'idle',
    acknowledgedEventIds,
    remaining: (await options.repository.listSyncOutbox()).length,
    conflict: null,
    state,
  }
}

export async function pullSyncRun(
  options: SyncPullOptions,
): Promise<SyncPullResponse | null> {
  const baseUrl = secureServiceBaseUrl(
    options.baseUrl ?? process.env.EXPO_PUBLIC_RAZVILKA_API_URL,
  )
  if (!baseUrl || !options.accessToken || !options.deviceId) return null
  try {
    const response = await (options.fetchImpl ?? fetch)(
      `${baseUrl}/v1/runs/${encodeURIComponent(options.runId)}/events${
        options.after ? `?after=${encodeURIComponent(options.after)}` : ''
      }`,
      { headers: headersFor(options) },
    )
    if (!response.ok) return null
    const value = envelopeData((await response.json()) as unknown)
    const parsed = syncPullResponseSchema.safeParse(value)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}
