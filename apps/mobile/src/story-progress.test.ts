import { describe, expect, it } from 'vitest'

import type { StoryRun } from '@chartalk/app-core'

import {
  discoveredEndingCountForStory,
  latestActiveRunForStory,
} from './story-progress'

const run = (overrides: Partial<StoryRun>): StoryRun => ({
  runId: 'run.default',
  storyId: 'story.ira',
  episodeId: 'episode.ira.1',
  characterId: 'character.ira',
  contentBuildId: 'build.fixture',
  activeNodeId: 'node.1',
  sequence: 0,
  state: {
    relationships: {},
    characterState: {},
    arcState: {},
    memories: {},
    promises: [],
    counters: {},
    cooldowns: {},
    seenNodes: {},
  },
  transcript: [],
  events: [],
  status: 'active',
  startedAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('story progress helpers', () => {
  it('returns the latest active run and leaves the input order untouched', () => {
    const runs = [
      run({ runId: 'run.old', updatedAt: '2026-01-01T00:00:00.000Z' }),
      run({ runId: 'run.latest', updatedAt: '2026-01-02T00:00:00.000Z' }),
      run({
        runId: 'run.completed',
        status: 'completed',
        updatedAt: '2026-01-03T00:00:00.000Z',
      }),
    ]

    expect(latestActiveRunForStory(runs, 'story.ira')?.runId).toBe('run.latest')
    expect(runs.map(item => item.runId)).toEqual([
      'run.old',
      'run.latest',
      'run.completed',
    ])
  })

  it('counts distinct discovered endings and ignores other stories or active runs', () => {
    const runs = [
      run({ runId: 'run.one', endingId: 'ending.a', status: 'completed' }),
      run({
        runId: 'run.duplicate',
        endingId: 'ending.a',
        status: 'completed',
      }),
      run({ runId: 'run.two', endingId: 'ending.b', status: 'completed' }),
      run({ runId: 'run.active', status: 'active' }),
      run({
        runId: 'run.other-story',
        storyId: 'story.asya',
        endingId: 'ending.c',
        status: 'completed',
      }),
    ]

    expect(discoveredEndingCountForStory(runs, 'story.ira')).toBe(2)
  })
})
