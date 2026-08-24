import type {
  CatalogData,
  CatalogWarning,
  Character,
  ContentWarning,
  ContentPackage,
  Episode,
  Story,
} from '@razvilka/content-schema'
import { catalogDataSchema } from '@razvilka/content-schema'

export interface CachedCatalog {
  data: CatalogData
  etag: string | null
  fetchedAt: string
}

export const parseCachedCatalog = (value: unknown): CachedCatalog | null => {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Record<string, unknown>
  const data = catalogDataSchema.safeParse(candidate.data)
  if (!data.success) return null
  if (
    (candidate.etag !== null &&
      candidate.etag !== undefined &&
      typeof candidate.etag !== 'string') ||
    typeof candidate.fetchedAt !== 'string'
  ) {
    return null
  }
  return {
    data: data.data,
    etag:
      candidate.etag === null || candidate.etag === undefined
        ? null
        : candidate.etag,
    fetchedAt: candidate.fetchedAt,
  }
}

export interface DiscoveryCatalog {
  manifest: ContentPackage['manifest']
  characters: Character[]
  stories: Story[]
  episodes: Episode[]
  warnings: DiscoveryWarning[]
  nodes: ContentPackage['nodes']
  assets: ContentPackage['assets']
}

export type DiscoveryWarning = CatalogWarning & {
  safeRoute?: ContentWarning['safeRoute']
}

export type CatalogContent = Pick<
  DiscoveryCatalog,
  'characters' | 'stories' | 'warnings'
>

const mergeById = <T>(
  first: readonly T[],
  second: readonly T[],
  id: (item: T) => string,
): T[] => {
  const values = new Map<string, T>()
  for (const item of first) values.set(id(item), item)
  for (const item of second) values.set(id(item), item)
  return [...values.values()]
}

/**
 * Joins cacheable discovery metadata with installed exact-build content.
 * Installed records win on stable IDs so a story never displays stale local
 * copy after its signed package has been activated. The cache may refresh
 * labels for installed records, but it can never expand the playable catalog:
 * every visible story must have its nodes, assets, and episode already on the
 * device. This keeps the reader fully usable without an extra download.
 */
export const mergeDiscoveryCatalog = (
  installed: ContentPackage,
  cached: CachedCatalog | null,
): DiscoveryCatalog => {
  if (!cached) {
    return {
      manifest: installed.manifest,
      characters: installed.characters,
      stories: installed.stories,
      episodes: installed.episodes,
      warnings: installed.warnings,
      nodes: installed.nodes,
      assets: installed.assets,
    }
  }

  const installedCharacterIds = new Set(
    installed.characters.map(item => item.characterId),
  )
  const installedStoryIds = new Set(installed.stories.map(item => item.storyId))
  const installedEpisodeIds = new Set(
    installed.episodes.map(item => item.episodeId),
  )
  const installedWarningIds = new Set(
    installed.warnings.map(item => item.warningId),
  )

  return {
    manifest: installed.manifest,
    characters: mergeById(
      cached.data.characters,
      installed.characters,
      item => item.characterId,
    ).filter(item => installedCharacterIds.has(item.characterId)),
    stories: mergeById(
      cached.data.stories,
      installed.stories,
      item => item.storyId,
    ).filter(item => installedStoryIds.has(item.storyId)),
    episodes: mergeById(
      cached.data.episodes,
      installed.episodes,
      item => item.episodeId,
    ).filter(item => installedEpisodeIds.has(item.episodeId)),
    warnings: mergeById(
      cached.data.warnings,
      installed.warnings,
      item => item.warningId,
    ).filter(item => installedWarningIds.has(item.warningId)),
    nodes: installed.nodes,
    assets: installed.assets,
  }
}

export const installedStoryIds = (
  installedPackages: readonly ContentPackage[],
): ReadonlySet<string> =>
  new Set(
    installedPackages.flatMap(content =>
      content.stories.map(story => story.storyId),
    ),
  )

export const packageForStory = (
  installedPackages: readonly ContentPackage[],
  storyId: string,
): ContentPackage | null =>
  installedPackages.find(content =>
    content.stories.some(story => story.storyId === storyId),
  ) ?? null
