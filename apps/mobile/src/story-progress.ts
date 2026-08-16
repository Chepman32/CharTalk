import type { StoryRun } from '@chartalk/app-core'

/** Returns the most recently updated active run without mutating the snapshot. */
export const latestActiveRunForStory = (
  runs: readonly StoryRun[],
  storyId: string,
): StoryRun | undefined =>
  runs
    .filter(run => run.storyId === storyId && run.status === 'active')
    .slice()
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0]

/** Counts distinct endings discovered for one story, hiding ending names. */
export const discoveredEndingCountForStory = (
  runs: readonly StoryRun[],
  storyId: string,
): number =>
  new Set(
    runs
      .filter(run => run.storyId === storyId && run.endingId)
      .map(run => run.endingId),
  ).size
