import { createHash } from 'node:crypto'

import {
  initialNarrativeState,
  type ContentPackage,
} from '@razvilka/content-schema'
import { replayEvents } from '@razvilka/dialogue-engine'
import {
  compareEventChain,
  syncConflictCodeSchema,
  syncEventSchema,
  syncRunDescriptorSchema,
  type SyncConflict,
  type SyncConflictCode,
  type SyncEvent,
  type SyncPullResponse,
  type SyncPushRequest,
  type SyncPushResponse,
  type SyncRunDescriptor,
} from '@razvilka/sync-protocol'

export interface SyncPrincipal {
  accountId: string
  deviceId: string
}

export interface SyncStoreDependencies {
  getPackage(packId: string, buildId: string): Promise<ContentPackage | null>
  now(): string
}

export interface SyncStore {
  push(
    principal: SyncPrincipal,
    request: SyncPushRequest,
    dependencies: SyncStoreDependencies,
  ): Promise<SyncPushResponse>
  pull(
    principal: SyncPrincipal,
    runId: string,
    afterCursor: string | null,
  ): Promise<SyncPullResponse>
}

interface StoredRun {
  descriptor: SyncRunDescriptor
  events: SyncEvent[]
  quarantined: boolean
  quarantineCode?: SyncConflictCode
}

export interface SyncChange {
  cursor: number
  runId: string
  event: SyncEvent
}

interface AccountState {
  cursor: number
  runs: Map<string, StoredRun>
  changes: SyncChange[]
}

export interface SyncAccountSnapshot {
  cursor: number
  runs: Array<{
    descriptor: SyncRunDescriptor
    events: SyncEvent[]
    quarantined: boolean
    quarantineCode?: SyncConflictCode
  }>
  changes: SyncChange[]
}

const clone = <T>(value: T): T => structuredClone(value)

const conflict = (
  code: SyncConflictCode,
  request: SyncPushRequest,
  serverSequence: number | null,
  clientSequence: number | null,
  existingEventId: string | null,
  messageKey: string,
  forkRunId: string | null,
): SyncConflict => ({
  code,
  runId: request.run.runId,
  serverSequence,
  clientSequence,
  existingEventId,
  messageKey,
  forkRunId,
})

const forkIdFor = (runId: string, event: SyncEvent): string => {
  const digest = createHash('sha256')
    .update(`${runId}\u0000${event.eventId}\u0000${event.sequence}`)
    .digest('hex')
  return `fork:${digest}`
}

const forkEvent = (forkRunId: string, event: SyncEvent): SyncEvent => ({
  ...clone(event),
  eventId: `${forkRunId}:event:${event.sequence}`,
  operationId: `${forkRunId}:operation:${event.sequence}`,
  runId: forkRunId,
})

const inferStatus = (
  packageContent: ContentPackage,
  activeNodeId: string,
  existingStatus?: SyncRunDescriptor['status'],
): SyncRunDescriptor['status'] => {
  if (existingStatus === 'archived') return 'archived'
  const node = packageContent.nodes.find(item => item.nodeId === activeNodeId)
  return node?.type === 'ending' ? 'completed' : 'active'
}

const findEntryNode = (
  packageContent: ContentPackage,
  storyId: string,
  episodeId: string,
): string | null => {
  const story = packageContent.stories.find(item => item.storyId === storyId)
  const episode = packageContent.episodes.find(
    item => item.episodeId === episodeId,
  )
  if (!story || !episode || !story.episodeIds.includes(episode.episodeId)) {
    return null
  }
  return episode.entryNodeId
}

const replayCanonical = (
  packageContent: ContentPackage,
  run: SyncRunDescriptor,
  events: readonly SyncEvent[],
):
  | { stateHash: string; sequence: number; activeNodeId: string }
  | { code: 'CONTENT_BUILD_UNAVAILABLE' | 'STATE_HASH_MISMATCH' } => {
  const entryNodeId = findEntryNode(packageContent, run.storyId, run.episodeId)
  if (!entryNodeId) return { code: 'CONTENT_BUILD_UNAVAILABLE' }
  try {
    const replay = replayEvents({
      initialState: initialNarrativeState(),
      entryNodeId,
      contentBuildId: run.contentBuildId,
      nodes: new Map(packageContent.nodes.map(node => [node.nodeId, node])),
      events,
    })
    if (
      replay.sequence !== run.sequence ||
      replay.activeNodeId !== run.activeNodeId ||
      replay.stateHash !== run.stateHash
    ) {
      return { code: 'STATE_HASH_MISMATCH' }
    }
    return {
      stateHash: replay.stateHash,
      sequence: replay.sequence,
      activeNodeId: replay.activeNodeId,
    }
  } catch {
    return { code: 'STATE_HASH_MISMATCH' }
  }
}

const descriptorWithReplay = (
  input: SyncRunDescriptor,
  packageContent: ContentPackage,
  replay: { stateHash: string; sequence: number; activeNodeId: string },
  existingStatus?: SyncRunDescriptor['status'],
): SyncRunDescriptor =>
  syncRunDescriptorSchema.parse({
    ...input,
    sequence: replay.sequence,
    activeNodeId: replay.activeNodeId,
    stateHash: replay.stateHash,
    status: inferStatus(packageContent, replay.activeNodeId, existingStatus),
  })

/**
 * A storage-backed sync implementation used by the API seam and tests.
 * Production deployments can replace it with a database implementation while
 * retaining the exact protocol and replay invariants.
 */
export class MemorySyncStore implements SyncStore {
  private readonly accounts = new Map<string, AccountState>()

  private account(accountId: string): AccountState {
    let state = this.accounts.get(accountId)
    if (!state) {
      state = { cursor: 0, runs: new Map(), changes: [] }
      this.accounts.set(accountId, state)
    }
    return state
  }

  private response(
    state: AccountState,
    run: SyncRunDescriptor,
    acceptedEventIds: string[],
    duplicateEventIds: string[],
    syncConflict: SyncConflict | null,
  ): SyncPushResponse {
    return {
      cursor: String(state.cursor),
      run: clone(run),
      acceptedEventIds: [...acceptedEventIds],
      duplicateEventIds: [...duplicateEventIds],
      conflict: syncConflict ? clone(syncConflict) : null,
    }
  }

  private appendChanges(
    state: AccountState,
    runId: string,
    events: readonly SyncEvent[],
  ): void {
    for (const event of events) {
      state.cursor += 1
      state.changes.push({ cursor: state.cursor, runId, event: clone(event) })
    }
  }

  private preserveConflictBranch(
    state: AccountState,
    request: SyncPushRequest,
    packageContent: ContentPackage,
    syncConflict: SyncConflict,
  ): string | null {
    const divergent = request.events.find(
      event => event.sequence === syncConflict.clientSequence,
    )
    if (!divergent) return null
    const forkRunId = forkIdFor(request.run.runId, divergent)
    if (state.runs.has(forkRunId)) return forkRunId

    const events = request.events
      .slice()
      .sort((left, right) => left.sequence - right.sequence)
      .map(event => forkEvent(forkRunId, event))
    const inputDescriptor = syncRunDescriptorSchema.parse({
      ...request.run,
      runId: forkRunId,
      parentRunId: request.run.runId,
      branchFromSequence: Math.max(0, syncConflict.serverSequence ?? 0),
      label: request.run.label ?? 'Ветка после конфликта синхронизации',
    })
    const replay = replayCanonical(packageContent, inputDescriptor, events)
    if ('code' in replay) {
      state.runs.set(forkRunId, {
        descriptor: inputDescriptor,
        events,
        quarantined: true,
        quarantineCode: replay.code,
      })
      return forkRunId
    }
    const descriptor = descriptorWithReplay(
      inputDescriptor,
      packageContent,
      replay,
    )
    state.runs.set(forkRunId, {
      descriptor,
      events,
      quarantined: false,
    })
    this.appendChanges(state, forkRunId, events)
    return forkRunId
  }

  async push(
    principal: SyncPrincipal,
    request: SyncPushRequest,
    dependencies: SyncStoreDependencies,
  ): Promise<SyncPushResponse> {
    const state = this.account(principal.accountId)
    const current = state.runs.get(request.run.runId)
    const baseRun = current?.descriptor ?? request.run
    if (current?.quarantined) {
      return this.response(
        state,
        baseRun,
        [],
        [],
        conflict(
          'RUN_QUARANTINED',
          request,
          current.events.at(-1)?.sequence ?? null,
          request.run.sequence,
          current.events.at(-1)?.eventId ?? null,
          'sync.run_quarantined',
          null,
        ),
      )
    }

    const packageContent = await dependencies.getPackage(
      request.run.packId,
      request.run.contentBuildId,
    )
    if (!packageContent) {
      return this.response(
        state,
        baseRun,
        [],
        [],
        conflict(
          'CONTENT_BUILD_UNAVAILABLE',
          request,
          current?.descriptor.sequence ?? null,
          request.run.sequence,
          null,
          'sync.content_build_unavailable',
          null,
        ),
      )
    }

    if (
      request.events.some(
        event =>
          event.runId !== request.run.runId ||
          event.contentBuildId !== request.run.contentBuildId,
      )
    ) {
      const invalid = conflict(
        'STATE_HASH_MISMATCH',
        request,
        current?.descriptor.sequence ?? null,
        request.run.sequence,
        null,
        'sync.event_run_mismatch',
        null,
      )
      if (current) current.quarantined = true
      return this.response(state, baseRun, [], [], invalid)
    }

    const comparison = compareEventChain(current?.events ?? [], request.events)
    if (comparison.conflict) {
      const forkRunId = this.preserveConflictBranch(
        state,
        request,
        packageContent,
        comparison.conflict,
      )
      const preserved = {
        ...comparison.conflict,
        forkRunId,
      }
      return this.response(
        state,
        baseRun,
        comparison.accepted.map(event => event.eventId),
        comparison.duplicates.map(event => event.eventId),
        preserved,
      )
    }

    const candidateEvents = [
      ...(current?.events ?? []),
      ...comparison.accepted,
    ].sort((left, right) => left.sequence - right.sequence)
    const replay = replayCanonical(packageContent, request.run, candidateEvents)
    if ('code' in replay) {
      if (replay.code === 'CONTENT_BUILD_UNAVAILABLE') {
        return this.response(
          state,
          baseRun,
          [],
          comparison.duplicates.map(event => event.eventId),
          conflict(
            replay.code,
            request,
            current?.descriptor.sequence ?? null,
            request.run.sequence,
            current?.events.at(-1)?.eventId ?? null,
            'sync.content_build_unavailable',
            null,
          ),
        )
      }
      if (current) {
        current.quarantined = true
        current.quarantineCode = replay.code
      }
      return this.response(
        state,
        baseRun,
        [],
        comparison.duplicates.map(event => event.eventId),
        conflict(
          'STATE_HASH_MISMATCH',
          request,
          current?.descriptor.sequence ?? null,
          request.run.sequence,
          current?.events.at(-1)?.eventId ?? null,
          'sync.state_hash_mismatch',
          null,
        ),
      )
    }

    if (
      request.run.sequence !== replay.sequence ||
      request.run.activeNodeId !== replay.activeNodeId ||
      request.run.stateHash !== replay.stateHash
    ) {
      if (current) {
        current.quarantined = true
        current.quarantineCode = 'STATE_HASH_MISMATCH'
      }
      return this.response(
        state,
        baseRun,
        [],
        comparison.duplicates.map(event => event.eventId),
        conflict(
          'STATE_HASH_MISMATCH',
          request,
          current?.descriptor.sequence ?? null,
          request.run.sequence,
          current?.events.at(-1)?.eventId ?? null,
          'sync.state_hash_mismatch',
          null,
        ),
      )
    }

    const descriptor = descriptorWithReplay(
      request.run,
      packageContent,
      replay,
      current?.descriptor.status,
    )
    const stored: StoredRun = {
      descriptor,
      events: candidateEvents,
      quarantined: false,
    }
    state.runs.set(request.run.runId, stored)
    this.appendChanges(state, request.run.runId, comparison.accepted)
    return this.response(
      state,
      descriptor,
      comparison.accepted.map(event => event.eventId),
      comparison.duplicates.map(event => event.eventId),
      null,
    )
  }

  async pull(
    principal: SyncPrincipal,
    runId: string,
    afterCursor: string | null,
  ): Promise<SyncPullResponse> {
    const state = this.account(principal.accountId)
    const parsedCursor = afterCursor === null ? 0 : Number(afterCursor)
    const cursor =
      Number.isInteger(parsedCursor) && parsedCursor >= 0 ? parsedCursor : 0
    const matching = state.changes.filter(
      change => change.runId === runId && change.cursor > cursor,
    )
    const page = matching.slice(0, 100)
    const record = state.runs.get(runId)
    return {
      cursor: String(state.cursor),
      events: page.map(change => clone(change.event)),
      runs: record ? [clone(record.descriptor)] : [],
      hasMore: matching.length > page.length,
    }
  }

  /** Exposes a read-only snapshot for operational health checks and tests. */
  getAccountSnapshot(accountId: string): {
    cursor: number
    runs: SyncRunDescriptor[]
  } {
    const state = this.account(accountId)
    return {
      cursor: state.cursor,
      runs: [...state.runs.values()].map(item => clone(item.descriptor)),
    }
  }

  exportAccountSnapshot(accountId: string): SyncAccountSnapshot {
    const state = this.account(accountId)
    return {
      cursor: state.cursor,
      runs: [...state.runs.values()].map(run => ({
        descriptor: clone(run.descriptor),
        events: clone(run.events),
        quarantined: run.quarantined,
        ...(run.quarantineCode ? { quarantineCode: run.quarantineCode } : {}),
      })),
      changes: clone(state.changes),
    }
  }

  importAccountSnapshot(
    accountId: string,
    snapshot: SyncAccountSnapshot,
  ): void {
    if (!Number.isInteger(snapshot.cursor) || snapshot.cursor < 0) {
      throw new Error('Invalid sync cursor')
    }
    const runs = snapshot.runs.map(run => {
      const descriptor = syncRunDescriptorSchema.parse(run.descriptor)
      const events = run.events.map(event => syncEventSchema.parse(event))
      if (
        events.some(
          event =>
            event.runId !== descriptor.runId ||
            event.contentBuildId !== descriptor.contentBuildId,
        )
      ) {
        throw new Error('Invalid sync event lineage')
      }
      const quarantineCode = run.quarantineCode
        ? syncConflictCodeSchema.parse(run.quarantineCode)
        : undefined
      return {
        descriptor,
        events,
        quarantined: run.quarantined === true,
        ...(quarantineCode ? { quarantineCode } : {}),
      }
    })
    const changes = snapshot.changes.map(change => {
      const cursor = Number(change.cursor)
      const runId = syncRunDescriptorSchema.shape.runId.parse(change.runId)
      const event = syncEventSchema.parse(change.event)
      if (!Number.isInteger(cursor) || cursor < 1) {
        throw new Error('Invalid sync change cursor')
      }
      return {
        cursor,
        runId,
        event,
      }
    })
    if (changes.some(change => change.runId !== change.event.runId)) {
      throw new Error('Invalid sync change lineage')
    }
    if (changes.some(change => change.cursor > snapshot.cursor)) {
      throw new Error('Sync cursor precedes change')
    }
    const state: AccountState = {
      cursor: snapshot.cursor,
      runs: new Map(
        runs.map(run => [
          run.descriptor.runId,
          {
            descriptor: clone(run.descriptor),
            events: clone(run.events),
            quarantined: run.quarantined,
            ...(run.quarantineCode
              ? { quarantineCode: run.quarantineCode }
              : {}),
          },
        ]),
      ),
      changes: clone(changes),
    }
    this.accounts.set(accountId, state)
  }
}

export const isSyncConflictCode = (value: string): value is SyncConflictCode =>
  syncConflictCodeSchema.safeParse(value).success
