import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { describe, expect, it } from 'vitest'

import { compileContentPackage } from '@chartalk/content-compiler'
import { generateBulkFixtureContentPackage } from '@chartalk/test-fixtures'

import {
  bundledContentCatalogPackages,
  bundledContentDescriptors,
  loadBundledContentPackages,
} from './bundled-content'
import { mergeContentPackages } from './content-library'
import { packageForStory } from './catalog'
import { queryCatalogStories } from './catalog-query'
import { contentPackageByteCount } from './persistence/content-store'

const defaultCatalogQuery = {
  search: '',
  genre: null,
  tone: null,
  duration: 'any' as const,
  status: null,
  rating: null,
  downloadedOnly: false,
  sort: 'recommended' as const,
  hiddenCategories: [],
}

describe('bundled reader catalog', () => {
  it('ships every default story and episode as an offline package', async () => {
    const packages = await loadBundledContentPackages()
    const stories = packages.flatMap(content => content.stories)
    const episodes = packages.flatMap(content => content.episodes)

    expect(packages).toHaveLength(6)
    expect(stories).toHaveLength(243)
    expect(new Set(stories.map(story => story.storyId)).size).toBe(243)
    expect(episodes).toHaveLength(243)
    expect(episodes.every(episode => episode.isBundled)).toBe(true)
    expect(
      packages.every(
        packageContent =>
          contentPackageByteCount(packageContent) <= 50 * 1024 * 1024,
      ),
    ).toBe(true)
    expect(
      episodes.every(episode =>
        stories.some(story => story.episodeIds.includes(episode.episodeId)),
      ),
    ).toBe(true)
    expect(
      stories.every(story =>
        story.episodeIds.every(episodeId =>
          episodes.some(
            episode => episode.episodeId === episodeId && episode.isBundled,
          ),
        ),
      ),
    ).toBe(true)
  }, 60_000)

  it('keeps every bundled normal route at fifty choice points or longer', async () => {
    const packages = await loadBundledContentPackages()
    const shortStoryBlockers = packages.flatMap(packageContent =>
      compileContentPackage(packageContent).blockers.filter(
        issue => issue.code === 'STORY_TOO_SHORT',
      ),
    )

    expect(shortStoryBlockers).toEqual([])
  }, 60_000)

  it('keeps the startup catalog metadata separate from lazy shard payloads', () => {
    expect(bundledContentCatalogPackages).toHaveLength(6)
    expect(
      bundledContentCatalogPackages
        .slice(1)
        .every(content => content.nodes.length === 0),
    ).toBe(true)
    expect(
      bundledContentCatalogPackages
        .slice(1)
        .map(content => content.stories.length),
    ).toEqual([50, 50, 50, 50, 40])
    expect(
      bundledContentDescriptors.every(descriptor => descriptor.byteCount > 0),
    ).toBe(true)
  })

  it('keeps catalog byte counts equal to the exact lazy payloads', async () => {
    const packages = await loadBundledContentPackages()
    expect(
      bundledContentDescriptors.map(descriptor => descriptor.byteCount),
    ).toEqual(
      packages.slice(1).map(content => contentPackageByteCount(content)),
    )
  }, 30_000)

  it('reuses the immutable checked-in bulk package across runtime factories', async () => {
    const first = await loadBundledContentPackages()
    const second = await loadBundledContentPackages()

    expect(first.slice(1)).toEqual(second.slice(1))
    expect(first.slice(1).map(content => content.stories.length)).toEqual([
      50, 50, 50, 50, 40,
    ])
    expect(first[1]?.manifest.buildId).toBe(
      'ru-bulk-fixture-2026.08.23.3.shard.001',
    )
    expect(
      first
        .slice(1)
        .every(content =>
          content.manifest.packId.startsWith('pack.ru.bulk.fixture.shard.'),
        ),
    ).toBe(true)
    expect(
      first
        .slice(1)
        .flatMap(content => content.stories)
        .map(story => story.storyId),
    ).toEqual(
      generateBulkFixtureContentPackage()
        .stories.map(story => story.storyId)
        .sort((left, right) => left.localeCompare(right)),
    )
  })

  it('resolves every shipped asset locally without a download step', () => {
    const assets = bundledContentCatalogPackages.flatMap(
      content => content.assets,
    )

    expect(assets.length).toBeGreaterThan(0)
    expect(
      assets.every(asset =>
        existsSync(resolve(process.cwd(), 'apps/mobile/assets', asset.path)),
      ),
    ).toBe(true)
  })

  it('gives every bundled story a distinct local preview image', () => {
    const stories = bundledContentCatalogPackages.flatMap(
      content => content.stories,
    )
    const previewAssetIds = stories.map(story => story.previewAssetId)
    const assetById = new Map(
      bundledContentCatalogPackages.flatMap(content =>
        content.assets.map(asset => [asset.assetId, asset] as const),
      ),
    )
    const previewAssets = previewAssetIds.flatMap(assetId => {
      const asset = assetId ? assetById.get(assetId) : undefined
      return asset?.kind === 'cover' ? [asset] : []
    })

    expect(previewAssetIds.every(Boolean)).toBe(true)
    expect(new Set(previewAssetIds).size).toBe(stories.length)
    expect(previewAssets).toHaveLength(stories.length)
    expect(new Set(previewAssets.map(asset => asset.checksum)).size).toBe(
      stories.length,
    )
    for (const asset of previewAssets) {
      const bytes = readFileSync(
        resolve(process.cwd(), 'apps/mobile/assets', asset.path),
      )
      expect(`sha256:${createHash('sha256').update(bytes).digest('hex')}`).toBe(
        asset.checksum,
      )
    }
  })

  it('exposes every bundled story through the merged offline catalog', () => {
    const packages = bundledContentCatalogPackages
    const catalog = mergeContentPackages(packages)
    const stories = queryCatalogStories(catalog, defaultCatalogQuery)

    expect(stories).toHaveLength(243)
    expect(
      stories.every(story => {
        const content = packageForStory(packages, story.storyId)
        return (
          Boolean(content) &&
          story.episodeIds.every(episodeId =>
            content!.episodes.some(
              episode => episode.episodeId === episodeId && episode.isBundled,
            ),
          )
        )
      }),
    ).toBe(true)
  })
})
