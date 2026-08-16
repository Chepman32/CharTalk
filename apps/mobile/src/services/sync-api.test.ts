import { describe, expect, it } from 'vitest'

import { MemoryAppRepository } from '@chartalk/app-core'
import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  emptySyncState,
  type SyncState,
  type SyncStateStore,
} from '../persistence/sync-state'

import { flushSyncOutbox, pullSyncRun } from './sync-api'

class MemorySyncStateStore implements SyncStateStore {
  private state = emptySyncState()

  async readSyncState(): Promise<SyncState> {
    return { ...this.state }
  }

  async writeSyncState(patch: Partial<SyncState>): Promise<SyncState> {
    this.state = { ...this.state, ...patch }
    return { ...this.state }
  }

  async clearSyncState(): Promise<void> {
    this.state = emptySyncState()
  }
}

const repositoryWithOutbox = async () => {
  const repository = new MemoryAppRepository(sampleContentPackage, {
    now: () => '2026-08-14T00:00:00.000Z',
  })
  const run = await repository.createRun('story.ira.after-deadline')
  await repository.commitChoice({
    runId: run.runId,
    operationId: 'sync-client.operation.1',
    expectedSequence: 0,
    expectedNodeId: run.activeNodeId,
    choiceId: 'story.ira.after-deadline.choice.open.1',
  })
  return repository
}

describe('sync-api', () => {
  it('keeps sync disabled or unconfigured without touching the outbox', async () => {
    const repository = await repositoryWithOutbox()
    const disabledState = new MemorySyncStateStore()
    const disabled = await flushSyncOutbox({
      repository,
      stateStore: disabledState,
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
    })
    expect(disabled.status).toBe('disabled')
    await disabledState.writeSyncState({ enabled: true })
    const unconfigured = await flushSyncOutbox({
      repository,
      stateStore: disabledState,
      baseUrl: 'http://insecure.example',
      accessToken: 'session-token',
      deviceId: 'device.1',
    })
    expect(unconfigured.status).toBe('unconfigured')
    expect(unconfigured.remaining).toBe(1)
  })

  it('backs off network failures and accepts a cursor pull envelope', async () => {
    const repository = await repositoryWithOutbox()
    const stateStore = new MemorySyncStateStore()
    await stateStore.writeSyncState({ enabled: true })
    await repository.markSyncEventAttempt(
      (await repository.listSyncOutbox())[0]!.event.eventId,
      'NETWORK_UNAVAILABLE',
      '2026-08-14T00:00:00.000Z',
    )
    const idle = await flushSyncOutbox({
      repository,
      stateStore,
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
      now: () => '2026-08-14T00:00:00.100Z',
      random: () => 0,
    })
    expect(idle.status).toBe('idle')

    const pulled = await pullSyncRun({
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
      runId: 'run.1',
      after: '4',
      fetchImpl: async input => {
        expect(input).toContain('after=4')
        return new Response(
          JSON.stringify({
            data: { cursor: '5', events: [], runs: [], hasMore: false },
          }),
          { status: 200 },
        )
      },
    })
    expect(pulled).toMatchObject({ cursor: '5', hasMore: false })
  })

  it('records unavailable and invalid responses without acknowledging events', async () => {
    const repository = await repositoryWithOutbox()
    const stateStore = new MemorySyncStateStore()
    await stateStore.writeSyncState({ enabled: true })
    const unavailable = await flushSyncOutbox({
      repository,
      stateStore,
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
      now: () => '2026-08-14T00:00:00.000Z',
      fetchImpl: async () => {
        throw new Error('offline')
      },
    })
    expect(unavailable.status).toBe('unavailable')
    expect(unavailable.remaining).toBe(1)

    const invalid = await flushSyncOutbox({
      repository,
      stateStore,
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
      now: () => '2026-08-14T00:02:00.000Z',
      fetchImpl: async () => new Response('{"data":{}}', { status: 200 }),
    })
    expect(invalid.status).toBe('unavailable')
    expect((await repository.listSyncOutbox())[0]?.attempts).toBe(2)
  })

  it('acknowledges accepted events and persists the server cursor', async () => {
    const repository = await repositoryWithOutbox()
    const stateStore = new MemorySyncStateStore()
    await stateStore.writeSyncState({ enabled: true })

    const result = await flushSyncOutbox({
      repository,
      stateStore,
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
      now: () => '2026-08-14T00:00:00.000Z',
      fetchImpl: async (_input, init) => {
        const body = JSON.parse(
          typeof init?.body === 'string' ? init.body : '{}',
        ) as {
          events: Array<{ eventId: string }>
          run: Record<string, unknown>
        }
        return new Response(
          JSON.stringify({
            data: {
              cursor: '7',
              run: body.run,
              acceptedEventIds: [body.events[0]!.eventId],
              duplicateEventIds: [],
              conflict: null,
            },
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        )
      },
    })

    expect(result.status).toBe('synced')
    expect(result.acknowledgedEventIds).toHaveLength(1)
    expect(result.remaining).toBe(0)
    expect(result.state.cursor).toBe('7')
    expect(result.state.lastSuccessAt).toBe('2026-08-14T00:00:00.000Z')
  })

  it('keeps conflicting events local and records retry metadata', async () => {
    const repository = await repositoryWithOutbox()
    const stateStore = new MemorySyncStateStore()
    await stateStore.writeSyncState({ enabled: true })

    const result = await flushSyncOutbox({
      repository,
      stateStore,
      baseUrl: 'https://api.chartalk.app',
      accessToken: 'session-token',
      deviceId: 'device.1',
      now: () => '2026-08-14T00:00:00.000Z',
      fetchImpl: async () => {
        const outbox = await repository.listSyncOutbox()
        return new Response(
          JSON.stringify({
            data: {
              cursor: '3',
              run: outbox[0]!.run,
              acceptedEventIds: [],
              duplicateEventIds: [],
              conflict: {
                code: 'RUN_SEQUENCE_CONFLICT',
                runId: outbox[0]!.run.runId,
                serverSequence: 1,
                clientSequence: 1,
                existingEventId: 'server.event.1',
                messageKey: 'sync.run_sequence_conflict',
                forkRunId: 'fork:server',
              },
            },
          }),
          { status: 409, headers: { 'content-type': 'application/json' } },
        )
      },
    })

    expect(result.status).toBe('conflict')
    expect(result.conflict?.code).toBe('RUN_SEQUENCE_CONFLICT')
    expect(result.remaining).toBe(1)
    expect((await repository.listSyncOutbox())[0]?.attempts).toBe(1)
    expect(result.state.lastErrorCode).toBe('RUN_SEQUENCE_CONFLICT')
  })
})
