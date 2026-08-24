import type { StoryRun } from '@razvilka/app-core'

export interface MissingContentBuild {
  buildId: string
  packId: string
}

export const contentBuildKey = (packId: string, buildId: string): string =>
  JSON.stringify([packId, buildId])

/**
 * Finds pinned builds that a reader can recover. Runs without pack metadata
 * are deliberately omitted: guessing a package identity could fetch the wrong
 * immutable artifact.
 */
export const missingContentBuildsForRestore = (
  runs: readonly StoryRun[],
  installedBuildKeys: ReadonlySet<string>,
): MissingContentBuild[] => {
  const unique = new Map<string, MissingContentBuild>()
  for (const run of runs) {
    if (!run.packId) continue
    const key = contentBuildKey(run.packId, run.contentBuildId)
    if (installedBuildKeys.has(key)) continue
    unique.set(key, {
      buildId: run.contentBuildId,
      packId: run.packId,
    })
  }
  return [...unique.values()]
}
