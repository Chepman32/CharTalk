import { describe, expect, it } from 'vitest'

import { initialNarrativeState } from '@razvilka/content-schema'
import { sampleContentPackage } from '@razvilka/test-fixtures'

import {
  buildActiveRunSnapshots,
  buildInstalledDecisionShard,
  searchTextInventory,
} from './capacity-load'

const decision = sampleContentPackage.nodes.find(
  node => node.type === 'decision',
)

if (!decision || decision.type !== 'decision') {
  throw new Error('Capacity fixture has no decision node')
}

describe('capacity load helpers', () => {
  it('materializes a uniquely addressable installed decision shard', () => {
    const shard = buildInstalledDecisionShard(decision, 20_000)

    expect(shard.size).toBe(20_000)
    expect(shard.get('capacity-shard-decision-0')).toMatchObject({
      type: 'decision',
      nodeId: 'capacity-shard-decision-0',
    })
    expect(
      shard.get('capacity-shard-decision-19999')?.choiceSlots,
    ).toHaveLength(4)
  })

  it('creates independent active local run snapshots without aliasing state', () => {
    const runs = buildActiveRunSnapshots(100, 'capacity-build', decision.nodeId)

    expect(runs).toHaveLength(100)
    expect(new Set(runs.map(run => run.runId)).size).toBe(100)
    expect(runs.every(run => run.activeNodeId === decision.nodeId)).toBe(true)
    expect(runs.every(run => run.state !== initialNarrativeState())).toBe(true)
    expect(runs[0]?.state).not.toBe(runs[1]?.state)
    expect(runs[0]?.transcript).not.toBe(runs[1]?.transcript)
  })

  it('searches the complete inventory and reports deterministic hit counts', () => {
    const inventory = ['alpha signal', 'beta signal', 'alpha archive']

    expect(searchTextInventory(inventory, 'alpha')).toEqual({
      inventorySize: 3,
      hitCount: 2,
    })
    expect(searchTextInventory(inventory, '')).toEqual({
      inventorySize: 3,
      hitCount: 3,
    })
  })

  it('rejects invalid load targets and missing run identity', () => {
    expect(() => buildInstalledDecisionShard(decision, 0)).toThrow(
      'count must be a positive safe integer',
    )
    expect(() => buildActiveRunSnapshots(0, 'build', decision.nodeId)).toThrow(
      'count must be a positive safe integer',
    )
    expect(() => buildActiveRunSnapshots(1, '', decision.nodeId)).toThrow(
      'contentBuildId and activeNodeId are required',
    )
    expect(() => buildActiveRunSnapshots(1, 'build', '  ')).toThrow(
      'contentBuildId and activeNodeId are required',
    )
  })
})
