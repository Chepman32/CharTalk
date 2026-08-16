import { describe, expect, it } from 'vitest'

import { DurableAppRepository } from '@chartalk/app-core'
import { resolveDecision } from '@chartalk/dialogue-engine'
import {
  generateBulkFixtureContentPackage,
  sampleContentPackage,
} from '@chartalk/test-fixtures'

import { WebSnapshotStore } from './web-store'
import { contentPackageByteCount } from './content-store'

describe('WebSnapshotStore content registry', () => {
  it('seeds multiple bundled packages for catalog discovery', async () => {
    const bulkFixture = generateBulkFixtureContentPackage({
      storyCount: 2,
      stageCount: 3,
    })
    const store = new WebSnapshotStore([sampleContentPackage, bulkFixture])

    const packages = await store.readContentPackages()
    expect(packages.map(item => item.manifest.packId)).toEqual([
      sampleContentPackage.manifest.packId,
      bulkFixture.manifest.packId,
    ])
    expect(await store.listContentPackages()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          packId: sampleContentPackage.manifest.packId,
          buildId: sampleContentPackage.manifest.buildId,
          status: 'bundled',
          byteCount: contentPackageByteCount(sampleContentPackage),
        }),
        expect.objectContaining({
          packId: bulkFixture.manifest.packId,
          buildId: bulkFixture.manifest.buildId,
          status: 'bundled',
          byteCount: contentPackageByteCount(bulkFixture),
        }),
      ]),
    )
  })

  it('persists catalog metadata independently from installed narrative packages', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)
    const cache = {
      data: {
        packId: sampleContentPackage.manifest.packId,
        locale: 'ru-RU' as const,
        buildId: sampleContentPackage.manifest.buildId,
        contentVersion: sampleContentPackage.manifest.contentVersion,
        checksum: sampleContentPackage.manifest.checksum,
        characters: sampleContentPackage.characters,
        stories: sampleContentPackage.stories,
        episodes: sampleContentPackage.episodes,
        warnings: [],
      },
      etag: 'W/"catalog"',
      fetchedAt: '2026-08-14T08:00:00.000Z',
    }
    await store.writeCatalog(cache)
    expect(await store.readCatalog()).toEqual(cache)
    await store.clearCatalog()
    expect(await store.readCatalog()).toBeNull()
    expect((await store.readContentPackages())[0]?.manifest.buildId).toBe(
      sampleContentPackage.manifest.buildId,
    )
  })

  it('queues stable diagnostics in FIFO order and deduplicates retries', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)
    const first = {
      eventId: 'event-1',
      eventName: 'choice_committed' as const,
      contentBuildId: sampleContentPackage.manifest.buildId,
      occurredAt: '2026-08-13T08:00:00.000Z',
    }
    const second = {
      ...first,
      eventId: 'event-2',
      eventName: 'response_rendered' as const,
    }

    await store.enqueue(first)
    await store.enqueue(first)
    await store.enqueue(second)
    expect(await store.list()).toEqual([first, second])

    await store.remove(first.eventId)
    expect(await store.list()).toEqual([second])
    await store.clearOutbox()
    expect(await store.list()).toEqual([])
  })

  it('clears diagnostics without deleting the reader snapshot', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)
    const repository = new DurableAppRepository([sampleContentPackage], store)
    await repository.completeOnboarding({
      displayName: 'Саша',
      selectedCharacterId: 'char.ira',
    })
    await store.enqueue({
      eventId: 'event-privacy',
      eventName: 'app_opened',
      contentBuildId: sampleContentPackage.manifest.buildId,
      occurredAt: '2026-08-13T08:00:00.000Z',
    })

    await store.clearOutbox()

    expect((await repository.getSnapshot()).profile?.displayName).toBe('Саша')
    expect(await store.list()).toEqual([])
  })

  it('keeps build IDs immutable and can reset downloads to bundled content', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)
    const downloaded = structuredClone(sampleContentPackage)
    downloaded.manifest.buildId = 'downloaded-build-2'
    downloaded.manifest.contentVersion = '2.0.0'
    await store.activateContentPackage(downloaded, 5_000)

    const tampered = structuredClone(downloaded)
    tampered.stories[0]!.title = 'Подмена'
    await expect(store.activateContentPackage(tampered, 5_000)).rejects.toThrow(
      'неизменяема',
    )

    expect(await store.listContentPackages()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildId: 'downloaded-build-2',
          status: 'active',
        }),
      ]),
    )
    await store.resetDownloadedContent()
    expect(await store.listContentPackages()).toEqual([
      expect.objectContaining({
        buildId: sampleContentPackage.manifest.buildId,
        status: 'bundled',
      }),
    ])
  })

  it('persists and clears transcript anchors independently from snapshots', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)

    await store.writeTranscriptAnchor('run-1', 'entry-4999')
    expect(await store.readTranscriptAnchor('run-1')).toBe('entry-4999')

    await store.writeTranscriptAnchor('run-1', null)
    expect(await store.readTranscriptAnchor('run-1')).toBeNull()
  })

  it('rolls back to last-known-good content without losing exact-build progress', async () => {
    const store = new WebSnapshotStore(sampleContentPackage)
    const lastKnownGood = structuredClone(sampleContentPackage)
    lastKnownGood.manifest.buildId = 'downloaded-build-2'
    lastKnownGood.manifest.contentVersion = '2.0.0'
    const defective = structuredClone(lastKnownGood)
    defective.manifest.buildId = 'downloaded-build-3'
    defective.manifest.contentVersion = '3.0.0'
    defective.stories[0]!.title = 'Дефектная версия'

    await store.activateContentPackage(lastKnownGood, 5_000)
    const beforeUpdate = new DurableAppRepository(
      await store.readContentPackages(),
      store,
    )
    let run = await beforeUpdate.createRun('story.ira.after-deadline')
    const opening = lastKnownGood.nodes.find(
      node => node.nodeId === run.activeNodeId,
    )
    if (opening?.type !== 'decision') throw new Error('fixture changed')
    run = (
      await beforeUpdate.commitChoice({
        runId: run.runId,
        operationId: 'before-defective-update',
        expectedSequence: run.sequence,
        expectedNodeId: run.activeNodeId,
        choiceId: resolveDecision(opening, run.state).choices[0].choiceId,
      })
    ).run

    await store.activateContentPackage(defective, 5_100)
    await expect(
      store.removeContentPackage(
        lastKnownGood.manifest.packId,
        lastKnownGood.manifest.buildId,
        [run.contentBuildId],
      ),
    ).rejects.toThrow('активного прохождения')
    await store.activateContentPackage(lastKnownGood, 5_000)

    expect(await store.listContentPackages()).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          buildId: lastKnownGood.manifest.buildId,
          status: 'active',
        }),
        expect.objectContaining({
          buildId: defective.manifest.buildId,
          status: 'rollback',
        }),
      ]),
    )
    const reopened = new DurableAppRepository(
      await store.readContentPackages(),
      store,
    )
    const recovered = await reopened.getRun(run.runId)
    expect(recovered).toMatchObject({
      contentBuildId: lastKnownGood.manifest.buildId,
      sequence: 1,
    })
    expect(recovered?.events).toHaveLength(1)
    expect(recovered?.transcript).toEqual(run.transcript)
    expect(
      (await reopened.createRun('story.ira.after-deadline')).contentBuildId,
    ).toBe(lastKnownGood.manifest.buildId)
  })
})
