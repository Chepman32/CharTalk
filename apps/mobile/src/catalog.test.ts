import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import { mergeDiscoveryCatalog, packageForStory } from './catalog'

describe('discovery catalog merge', () => {
  it('shows cached stories while keeping installed records authoritative', () => {
    const remoteStory = {
      ...sampleContentPackage.stories[0]!,
      title: 'Новая карточка из каталога',
    }
    const cache = {
      data: {
        packId: sampleContentPackage.manifest.packId,
        locale: 'ru-RU' as const,
        buildId: 'remote-build',
        contentVersion: '2.0.0',
        checksum: 'sha256:remote',
        characters: sampleContentPackage.characters,
        stories: [remoteStory],
        episodes: sampleContentPackage.episodes,
        warnings: [],
      },
      etag: null,
      fetchedAt: '2026-08-14T08:00:00.000Z',
    }

    const merged = mergeDiscoveryCatalog(sampleContentPackage, cache)

    expect(merged.stories).toHaveLength(sampleContentPackage.stories.length)
    expect(
      merged.stories.find(item => item.storyId === remoteStory.storyId)?.title,
    ).toBe(
      sampleContentPackage.stories.find(
        item => item.storyId === remoteStory.storyId,
      )?.title,
    )
    expect(merged.nodes).toBe(sampleContentPackage.nodes)
  })

  it('does not expose a catalog-only story that is not available offline', () => {
    const remoteStory = {
      ...sampleContentPackage.stories[0]!,
      storyId: 'story.remote',
      title: 'Ещё одна история',
    }
    const merged = mergeDiscoveryCatalog(sampleContentPackage, {
      data: {
        packId: sampleContentPackage.manifest.packId,
        locale: 'ru-RU',
        buildId: 'remote-build',
        contentVersion: '2.0.0',
        checksum: 'sha256:remote',
        characters: sampleContentPackage.characters,
        stories: [...sampleContentPackage.stories, remoteStory],
        episodes: sampleContentPackage.episodes,
        warnings: [],
      },
      etag: null,
      fetchedAt: '2026-08-14T08:00:00.000Z',
    })

    expect(merged.stories.some(item => item.storyId === 'story.remote')).toBe(
      false,
    )
    expect(
      merged.characters.every(item =>
        sampleContentPackage.characters.some(
          installed => installed.characterId === item.characterId,
        ),
      ),
    ).toBe(true)
    expect(
      merged.nodes.some(item => item.nodeId.startsWith('node.remote')),
    ).toBe(false)
  })

  it('resolves the package identity for a story across multiple bundled packs', () => {
    const bulkFixture = {
      ...sampleContentPackage,
      manifest: {
        ...sampleContentPackage.manifest,
        packId: 'pack.bulk.fixture',
        buildId: 'bulk-build',
      },
      stories: sampleContentPackage.stories.map(story => ({
        ...story,
        storyId: `bulk.${story.storyId}`,
      })),
    }

    expect(
      packageForStory(
        [sampleContentPackage, bulkFixture],
        'bulk.story.ira.after-deadline',
      )?.manifest.packId,
    ).toBe('pack.bulk.fixture')
    expect(packageForStory([sampleContentPackage], 'missing')).toBeNull()
  })
})
