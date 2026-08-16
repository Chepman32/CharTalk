import { DatabaseSync } from 'node:sqlite'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'
import { initialNarrativeState } from '@chartalk/content-schema'
import { applyChoice } from '@chartalk/dialogue-engine'

import { SqliteApiStore } from './storage'

describe('SqliteApiStore', () => {
  it('persists operational writes in normalized tables', async () => {
    const store = new SqliteApiStore(':memory:', sampleContentPackage)
    await store.saveReport({
      reportId: 'report-1',
      runId: null,
      nodeId: 'node-1',
      choiceId: null,
      contentBuildId: 'build-1',
      appVersion: '1.0.0',
      platform: 'test',
      diagnosticCode: null,
      category: 'typo',
      note: 'Запятая.',
      consentGrantedAt: '2026-08-13T07:59:00.000Z',
      receivedAt: '2026-08-13T08:00:00.000Z',
    })
    await store.saveReport({
      reportId: 'report-1',
      runId: null,
      nodeId: 'node-1',
      choiceId: null,
      contentBuildId: 'build-1',
      appVersion: '1.0.0',
      platform: 'test',
      diagnosticCode: null,
      category: 'typo',
      note: 'Запятая.',
      consentGrantedAt: '2026-08-13T07:59:00.000Z',
      receivedAt: '2026-08-13T08:00:00.000Z',
    })
    await store.saveDiagnostic({
      eventId: 'event-12345678',
      eventName: 'app_opened',
      contentBuildId: 'build-1',
      occurredAt: '2026-08-13T08:00:00.000Z',
      networkClass: 'wifi',
    })
    await store.saveDiagnostic({
      eventId: 'event-12345678',
      eventName: 'app_opened',
      contentBuildId: 'build-1',
      occurredAt: '2026-08-13T08:00:00.000Z',
      networkClass: 'wifi',
    })

    expect(store.getOperationalCounts()).toEqual({ reports: 1, diagnostics: 1 })
    expect((await store.getCurrentPackage()).manifest.buildId).toBe(
      sampleContentPackage.manifest.buildId,
    )
    expect(
      await store.getPackage(
        sampleContentPackage.manifest.packId,
        sampleContentPackage.manifest.buildId,
      ),
    ).toMatchObject({
      manifest: { buildId: sampleContentPackage.manifest.buildId },
    })
    expect(await store.getPackage('missing', 'missing')).toBeNull()
    store.close()
  })

  it('never mutates an existing content build ID', async () => {
    const store = new SqliteApiStore(':memory:', sampleContentPackage)
    const tampered = structuredClone(sampleContentPackage)
    tampered.stories[0]!.title = 'Подменённое название'

    await expect(store.publish(tampered)).rejects.toThrow('is immutable')
    expect((await store.getCurrentPackage()).stories[0]!.title).toBe(
      sampleContentPackage.stories[0]!.title,
    )
    store.close()
  })

  it('keeps the pack/build tuple as the immutable package identity', async () => {
    const store = new SqliteApiStore(':memory:', sampleContentPackage)
    const otherPack = structuredClone(sampleContentPackage)
    otherPack.manifest.packId = 'pack.other'

    await store.publish(otherPack)

    await expect(
      store.getPackage(
        sampleContentPackage.manifest.packId,
        sampleContentPackage.manifest.buildId,
      ),
    ).resolves.toMatchObject({
      manifest: { packId: sampleContentPackage.manifest.packId },
    })
    await expect(
      store.getPackage('pack.other', sampleContentPackage.manifest.buildId),
    ).resolves.toMatchObject({ manifest: { packId: 'pack.other' } })
    store.close()
  })

  it('migrates the legacy build-only primary key without losing the bundle', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'chartalk-api-'))
    const databasePath = join(directory, 'api.db')
    const legacy = new DatabaseSync(databasePath)
    legacy.exec(`
      CREATE TABLE content_packages (
        build_id TEXT PRIMARY KEY,
        pack_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        checksum TEXT NOT NULL,
        signature TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        published_at TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 0
      );
      CREATE UNIQUE INDEX idx_one_current_package
        ON content_packages(is_current) WHERE is_current = 1;
      INSERT INTO content_packages(
        build_id, pack_id, content_version, checksum, signature,
        payload_json, published_at, is_current
      ) VALUES (
        '${sampleContentPackage.manifest.buildId}',
        '${sampleContentPackage.manifest.packId}',
        '${sampleContentPackage.manifest.contentVersion}',
        '${sampleContentPackage.manifest.checksum}',
        '${sampleContentPackage.manifest.signature}',
        '${JSON.stringify(sampleContentPackage).replaceAll("'", "''")}',
        '2026-08-14T08:00:00.000Z',
        1
      );
    `)
    legacy.close()

    const store = new SqliteApiStore(databasePath, sampleContentPackage)
    expect(store.getOperationalCounts()).toEqual({ reports: 0, diagnostics: 0 })
    await expect(store.getCurrentPackage()).resolves.toMatchObject({
      manifest: { packId: sampleContentPackage.manifest.packId },
    })
    store.close()
    rmSync(directory, { recursive: true, force: true })
  })

  it('persists acknowledged sync chains across API restarts', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'chartalk-sync-'))
    const databasePath = join(directory, 'api.db')
    const store = new SqliteApiStore(databasePath, sampleContentPackage)
    const story = sampleContentPackage.stories.find(
      item => item.storyId === 'story.ira.after-deadline',
    )!
    const episode = sampleContentPackage.episodes.find(
      item => item.episodeId === story.episodeIds[0],
    )!
    const nodes = new Map(
      sampleContentPackage.nodes.map(node => [node.nodeId, node]),
    )
    const entry = nodes.get(episode.entryNodeId)
    if (!entry || entry.type !== 'decision') throw new Error('fixture changed')
    const choice = entry.choiceSlots.flatMap(slot => slot.candidates)[0]!
    const result = applyChoice({
      operationId: 'sqlite.sync.operation.1',
      runId: 'sqlite.sync.run.1',
      expectedSequence: 0,
      expectedNodeId: entry.nodeId,
      contentBuildId: sampleContentPackage.manifest.buildId,
      choiceId: choice.choiceId,
      state: initialNarrativeState(),
      node: entry,
      nodes,
      committedAt: '2026-08-14T00:00:00.000Z',
    })
    const request = {
      deviceId: 'device.sqlite',
      run: {
        runId: 'sqlite.sync.run.1',
        storyId: story.storyId,
        episodeId: episode.episodeId,
        characterId: story.characterId,
        packId: sampleContentPackage.manifest.packId,
        contentBuildId: sampleContentPackage.manifest.buildId,
        sequence: result.newSequence,
        activeNodeId: result.nextNodeId,
        stateHash: result.resultingStateHash,
        status: 'active' as const,
      },
      events: [result.event],
    }
    const principal = { accountId: 'account.sqlite', deviceId: 'device.sqlite' }
    const dependencies = {
      getPackage: (packId: string, buildId: string) =>
        store.getPackage(packId, buildId),
      now: () => '2026-08-14T00:00:00.000Z',
    }
    await expect(
      store.push(principal, request, dependencies),
    ).resolves.toMatchObject({
      acceptedEventIds: [result.event.eventId],
    })
    store.close()

    const reopened = new SqliteApiStore(databasePath, sampleContentPackage)
    await expect(
      reopened.pull(principal, request.run.runId, '0'),
    ).resolves.toMatchObject({
      events: [result.event],
      runs: [{ runId: request.run.runId, sequence: 1 }],
    })
    reopened.close()
    rmSync(directory, { recursive: true, force: true })
  })
})
