import type { ContentPackage } from '@chartalk/content-schema'

const mergeById = <T>(
  packages: readonly ContentPackage[],
  select: (content: ContentPackage) => readonly T[],
  id: (item: T) => string,
): T[] => {
  const values = new Map<string, T>()
  for (const content of packages) {
    for (const item of select(content)) values.set(id(item), item)
  }
  return [...values.values()]
}

/**
 * Produces the discovery catalog. Later installed builds replace stable IDs,
 * while the runtime repository still resolves every active run by exact build.
 */
export const mergeContentPackages = (
  packages: readonly ContentPackage[],
): ContentPackage => {
  const current = packages.at(-1)
  if (!current) throw new Error('At least one content package is required')
  return {
    manifest: current.manifest,
    characters: mergeById(
      packages,
      item => item.characters,
      item => item.characterId,
    ),
    stories: mergeById(
      packages,
      item => item.stories,
      item => item.storyId,
    ),
    episodes: mergeById(
      packages,
      item => item.episodes,
      item => item.episodeId,
    ),
    nodes: mergeById(
      packages,
      item => item.nodes,
      item => item.nodeId,
    ),
    warnings: mergeById(
      packages,
      item => item.warnings,
      item => item.warningId,
    ),
    assets: mergeById(
      packages,
      item => item.assets,
      item => item.assetId,
    ),
  }
}
