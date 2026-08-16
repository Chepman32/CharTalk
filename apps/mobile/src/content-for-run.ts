import type { ContentPackage } from '@chartalk/content-schema'

/**
 * A run is pinned to the immutable build that created it. Never substitute the
 * discovery catalog here: its records may already belong to a newer build.
 */
export const contentForBuild = (
  packages: readonly ContentPackage[],
  buildId: string,
  packId?: string,
): ContentPackage | undefined =>
  packages.find(
    content =>
      content.manifest.buildId === buildId &&
      (!packId || content.manifest.packId === packId),
  )
