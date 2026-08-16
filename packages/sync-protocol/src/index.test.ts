import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  compareEventChain,
  syncOutboxEntrySchema,
  syncPushRequestSchema,
  toSyncEvent,
  type SyncEvent,
} from './index'

const event: SyncEvent = {
  eventId: 'event.1',
  operationId: 'operation.1',
  runId: 'run.1',
  sequence: 1,
  nodeId: 'node.1',
  choiceId: 'choice.1',
  contentBuildId: 'build.1',
  frozenEffects: [],
  beforeStateHash: `sha256:${'a'.repeat(64)}`,
  afterStateHash: `sha256:${'b'.repeat(64)}`,
  committedAt: '2026-08-14T00:00:00.000Z',
}

const run = {
  runId: 'run.1',
  storyId: 'story.1',
  episodeId: 'episode.1',
  characterId: 'character.1',
  packId: 'pack.1',
  contentBuildId: 'build.1',
  sequence: 1,
  activeNodeId: 'node.2',
  stateHash: event.afterStateHash,
  status: 'active' as const,
}

describe('sync protocol', () => {
  it('accepts strict event batches and run descriptors', () => {
    expect(
      syncPushRequestSchema.parse({
        deviceId: 'device.1',
        cursor: null,
        run,
        events: [event],
      }),
    ).toMatchObject({ deviceId: 'device.1', events: [event] })
    expect(
      syncOutboxEntrySchema.parse({
        entryId: event.eventId,
        event,
        run,
        enqueuedAt: event.committedAt,
        attempts: 0,
      }),
    ).toMatchObject({ entryId: event.eventId })
  })

  it('rejects malformed hashes and unknown fields', () => {
    expect(() =>
      syncPushRequestSchema.parse({
        deviceId: 'device.1',
        run,
        events: [{ ...event, afterStateHash: 'tampered' }],
      }),
    ).toThrow()
    expect(() =>
      syncPushRequestSchema.parse({
        deviceId: 'device.1',
        run,
        events: [event],
        ignored: true,
      }),
    ).toThrow()
  })

  it('is idempotent for exact retries and rejects same-sequence divergence', () => {
    const first = compareEventChain([], [event])
    expect(first.accepted).toHaveLength(1)
    const retry = compareEventChain([event], [event])
    expect(retry.duplicates).toHaveLength(1)
    expect(retry.conflict).toBeNull()

    const divergent = compareEventChain(
      [event],
      [{ ...event, eventId: 'event.other', operationId: 'operation.other' }],
    )
    expect(divergent.conflict).toMatchObject({
      code: 'RUN_SEQUENCE_CONFLICT',
      serverSequence: 1,
      clientSequence: 1,
    })
  })

  it('requires contiguous sequence numbers and preserves authored event shape', () => {
    const gap = compareEventChain([], [{ ...event, sequence: 3 }])
    expect(gap.conflict?.code).toBe('RUN_SEQUENCE_GAP')
    const fixtureEvent = sampleContentPackage.nodes.filter(
      node => node.type === 'decision',
    )[0]?.choiceSlots[0]?.candidates[0]
    expect(fixtureEvent).toBeTruthy()
    expect(() => toSyncEvent(event)).not.toThrow()
  })
})
