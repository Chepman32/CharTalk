import { describe, expect, it } from 'vitest'

import type { StoryRun } from '@razvilka/app-core'

import {
  contentBuildKey,
  missingContentBuildsForRestore,
} from './content-recovery'

const run = (overrides: Partial<StoryRun>): StoryRun => ({
  runId: overrides.runId ?? 'run-1',
  storyId: 'story-1',
  episodeId: 'episode-1',
  characterId: 'character-1',
  contentBuildId: overrides.contentBuildId ?? 'build-1',
  activeNodeId: 'node-1',
  sequence: 0,
  state: {} as StoryRun['state'],
  transcript: [],
  events: [],
  status: 'active',
  startedAt: '2026-08-13T00:00:00.000Z',
  updatedAt: '2026-08-13T00:00:00.000Z',
  ...overrides,
})

describe('missingContentBuildsForRestore', () => {
  it('returns each missing pinned build once', () => {
    expect(
      missingContentBuildsForRestore(
        [
          run({ runId: 'one', packId: 'pack-a' }),
          run({ runId: 'two', packId: 'pack-a' }),
          run({
            runId: 'three',
            contentBuildId: 'build-2',
            packId: 'pack-b',
          }),
        ],
        new Set(),
      ),
    ).toEqual([
      { buildId: 'build-1', packId: 'pack-a' },
      { buildId: 'build-2', packId: 'pack-b' },
    ])
  })

  it('never guesses a pack for legacy runs without pack metadata', () => {
    expect(
      missingContentBuildsForRestore(
        [run({ packId: undefined }), run({ contentBuildId: 'build-2' })],
        new Set([contentBuildKey('pack-a', 'build-1')]),
      ),
    ).toEqual([])
  })

  it('matches installed versions by package and build, not build ID alone', () => {
    expect(
      missingContentBuildsForRestore(
        [run({ packId: 'pack-a', contentBuildId: 'shared-build' })],
        new Set([contentBuildKey('pack-b', 'shared-build')]),
      ),
    ).toEqual([{ buildId: 'shared-build', packId: 'pack-a' }])
  })
})
