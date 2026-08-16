import {
  effectSchema,
  type ChoiceEvent,
  type Effect,
} from '@chartalk/content-schema'
import { z } from 'zod'

const stableId = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/)

const stateHash = z.string().regex(/^sha256:[a-f0-9]{64}$/)

const statusSchema = z.enum(['active', 'completed', 'archived'])

export const syncRunDescriptorSchema = z
  .object({
    runId: stableId,
    storyId: stableId,
    episodeId: stableId,
    characterId: stableId,
    packId: stableId,
    contentBuildId: stableId,
    sequence: z.number().int().nonnegative(),
    activeNodeId: stableId,
    stateHash,
    status: statusSchema,
    parentRunId: stableId.optional(),
    branchFromSequence: z.number().int().nonnegative().optional(),
    label: z.string().trim().max(60).optional(),
  })
  .strict()

export type SyncRunDescriptor = z.infer<typeof syncRunDescriptorSchema>

export const syncEventSchema = z
  .object({
    eventId: stableId,
    operationId: stableId,
    runId: stableId,
    sequence: z.number().int().nonnegative(),
    nodeId: stableId,
    choiceId: stableId,
    contentBuildId: stableId,
    frozenEffects: z.array(effectSchema),
    beforeStateHash: stateHash,
    afterStateHash: stateHash,
    committedAt: z.iso.datetime(),
  })
  .strict()

export type SyncEvent = z.infer<typeof syncEventSchema>

export const syncOutboxEntrySchema = z
  .object({
    entryId: stableId,
    event: syncEventSchema,
    run: syncRunDescriptorSchema,
    enqueuedAt: z.iso.datetime(),
    attempts: z.number().int().nonnegative(),
    lastErrorCode: stableId.optional(),
    lastAttemptAt: z.iso.datetime().optional(),
  })
  .strict()

export type SyncOutboxEntry = z.infer<typeof syncOutboxEntrySchema>

export const syncPushRequestSchema = z
  .object({
    deviceId: stableId,
    cursor: z.string().trim().max(500).nullable().optional(),
    run: syncRunDescriptorSchema,
    events: z.array(syncEventSchema).min(1).max(100),
  })
  .strict()

export type SyncPushRequest = z.infer<typeof syncPushRequestSchema>

export const syncConflictCodeSchema = z.enum([
  'RUN_SEQUENCE_CONFLICT',
  'RUN_SEQUENCE_GAP',
  'STATE_HASH_MISMATCH',
  'CONTENT_BUILD_UNAVAILABLE',
  'RUN_QUARANTINED',
])

export type SyncConflictCode = z.infer<typeof syncConflictCodeSchema>

export const syncConflictSchema = z
  .object({
    code: syncConflictCodeSchema,
    runId: stableId,
    serverSequence: z.number().int().nonnegative().nullable(),
    clientSequence: z.number().int().nonnegative().nullable(),
    existingEventId: stableId.nullable(),
    messageKey: stableId,
    forkRunId: stableId.nullable(),
  })
  .strict()

export type SyncConflict = z.infer<typeof syncConflictSchema>

export const syncPushResponseSchema = z
  .object({
    cursor: z.string().min(1),
    run: syncRunDescriptorSchema,
    acceptedEventIds: z.array(stableId),
    duplicateEventIds: z.array(stableId),
    conflict: syncConflictSchema.nullable(),
  })
  .strict()

export type SyncPushResponse = z.infer<typeof syncPushResponseSchema>

export const syncPullResponseSchema = z
  .object({
    cursor: z.string().min(1),
    events: z.array(syncEventSchema),
    runs: z.array(syncRunDescriptorSchema),
    hasMore: z.boolean(),
  })
  .strict()

export type SyncPullResponse = z.infer<typeof syncPullResponseSchema>

export const syncProblemSchema = z
  .object({
    code: syncConflictCodeSchema,
    messageKey: stableId,
    retryable: z.boolean(),
    requestId: stableId,
    details: z.record(z.string(), z.unknown()).optional(),
  })
  .strict()

export type SyncProblem = z.infer<typeof syncProblemSchema>

export interface EventChainComparison {
  accepted: SyncEvent[]
  duplicates: SyncEvent[]
  conflict: SyncConflict | null
}

const sameEvent = (left: SyncEvent, right: SyncEvent): boolean =>
  JSON.stringify(left) === JSON.stringify(right)

/**
 * Compares an incoming ordered batch against the authoritative event chain.
 * A duplicate is idempotent; a different event at the same sequence is a
 * divergence and is never resolved with last-write-wins.
 */
export const compareEventChain = (
  serverEvents: readonly SyncEvent[],
  incomingEvents: readonly SyncEvent[],
): EventChainComparison => {
  const bySequence = new Map(serverEvents.map(event => [event.sequence, event]))
  const byIdentity = new Map<string, SyncEvent>()
  for (const event of serverEvents) {
    byIdentity.set(event.eventId, event)
    byIdentity.set(event.operationId, event)
  }

  const accepted: SyncEvent[] = []
  const duplicates: SyncEvent[] = []
  const sorted = [...incomingEvents].sort(
    (left, right) =>
      left.sequence - right.sequence ||
      left.eventId.localeCompare(right.eventId),
  )

  for (const event of sorted) {
    const existingByIdentity =
      byIdentity.get(event.eventId) ?? byIdentity.get(event.operationId)
    if (existingByIdentity) {
      if (sameEvent(existingByIdentity, event)) duplicates.push(event)
      else {
        return {
          accepted,
          duplicates,
          conflict: {
            code: 'RUN_SEQUENCE_CONFLICT',
            runId: event.runId,
            serverSequence: existingByIdentity.sequence,
            clientSequence: event.sequence,
            existingEventId: existingByIdentity.eventId,
            messageKey: 'sync.event_identity_conflict',
            forkRunId: null,
          },
        }
      }
      continue
    }

    const existingBySequence = bySequence.get(event.sequence)
    if (existingBySequence) {
      return {
        accepted,
        duplicates,
        conflict: {
          code: 'RUN_SEQUENCE_CONFLICT',
          runId: event.runId,
          serverSequence: existingBySequence.sequence,
          clientSequence: event.sequence,
          existingEventId: existingBySequence.eventId,
          messageKey: 'sync.run_sequence_conflict',
          forkRunId: null,
        },
      }
    }

    const latestSequence = Math.max(
      0,
      ...[...bySequence.keys(), ...accepted.map(item => item.sequence)],
    )
    if (event.sequence !== latestSequence + 1) {
      return {
        accepted,
        duplicates,
        conflict: {
          code: 'RUN_SEQUENCE_GAP',
          runId: event.runId,
          serverSequence:
            latestSequence === 0 && bySequence.size === 0
              ? null
              : latestSequence,
          clientSequence: event.sequence,
          existingEventId: null,
          messageKey: 'sync.run_sequence_gap',
          forkRunId: null,
        },
      }
    }
    accepted.push(event)
    bySequence.set(event.sequence, event)
    byIdentity.set(event.eventId, event)
    byIdentity.set(event.operationId, event)
  }

  return { accepted, duplicates, conflict: null }
}

export const toSyncEvent = (event: ChoiceEvent): SyncEvent =>
  syncEventSchema.parse(event)

export const toSyncEffects = (event: SyncEvent): Effect[] =>
  event.frozenEffects.map(effect => ({ ...effect }))
