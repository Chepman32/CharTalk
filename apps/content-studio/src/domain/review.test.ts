import { describe, expect, it } from 'vitest'

import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  counterfactualRows,
  findOverusedNgrams,
  nodeReferences,
} from './review'

describe('content review diagnostics', () => {
  it('builds a four-column counterfactual table with downstream effects', () => {
    const decision = sampleContentPackage.nodes.find(
      node => node.type === 'decision',
    )!
    const rows = counterfactualRows(sampleContentPackage, decision.nodeId)

    expect(rows).toHaveLength(4)
    expect(rows.map(row => row.slot)).toEqual([1, 2, 3, 4])
    expect(rows.every(row => row.choiceId && row.text && row.intent)).toBe(true)
    expect(rows.every(row => row.effectPaths.length > 0)).toBe(true)
    expect(rows[0]?.choiceId).toBe(
      decision.choiceSlots[0]!.candidates[0]!.choiceId,
    )
    expect(typeof rows[0]?.destinationId).toBe('string')
    expect(typeof rows[0]?.reactionText).toBe('string')
    expect(Array.isArray(rows[0]?.downstreamReads)).toBe(true)
    expect(counterfactualRows(sampleContentPackage, 'missing-node')).toEqual([])
  })

  it('projects structured DSL effects into reviewable state paths', () => {
    const content = structuredClone(sampleContentPackage)
    const decision = content.nodes.find(node => node.type === 'decision')
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[0]!.candidates[0]!.effects = [
      {
        effectId: 'review.add-memory',
        op: 'addMemory',
        key: 'memory.review',
        value: true,
      },
      {
        effectId: 'review.remove-memory',
        op: 'removeMemory',
        key: 'memory.review',
      },
      {
        effectId: 'review.add-promise',
        op: 'addPromise',
        promiseId: 'promise.review',
      },
      {
        effectId: 'review.resolve-promise',
        op: 'resolvePromise',
        promiseId: 'promise.review',
        outcome: 'released',
      },
      {
        effectId: 'review.advance-arc',
        op: 'advanceArc',
        arcId: 'arc.review',
        phase: 'phase-2',
      },
      {
        effectId: 'review.cooldown',
        op: 'startCooldown',
        cooldownId: 'cooldown.review',
        turns: 3,
      },
    ]

    const row = counterfactualRows(content, decision.nodeId)[0]

    expect(row?.effectPaths).toEqual(
      expect.arrayContaining([
        'memories.memory.review',
        'promises.promise.review',
        'arcState.arc.review.phase',
        'cooldowns.cooldown.review',
      ]),
    )
  })

  it('shows both inbound and outbound graph references for a node', () => {
    const reaction = sampleContentPackage.nodes.find(
      node => node.type === 'reaction',
    )!
    const references = nodeReferences(sampleContentPackage, reaction.nodeId)

    expect(references.outbound.length).toBeGreaterThan(0)
    expect(references.outbound[0]?.sourceNodeId).toBe(reaction.nodeId)
    expect(typeof references.outbound[0]?.targetNodeId).toBe('string')
    expect(references.inbound.length).toBeGreaterThan(0)
    expect(
      references.inbound.some(
        reference => reference.targetNodeId === reaction.nodeId,
      ),
    ).toBe(true)
  })

  it('finds normalized repeated n-grams across authored units', () => {
    const content = structuredClone(sampleContentPackage)
    const decisions = content.nodes.filter(node => node.type === 'decision')
    for (const [index, node] of decisions.slice(0, 3).entries()) {
      if (node.type !== 'decision') continue
      const message = node.messageVariants[0]?.messages[0]
      if (message) {
        message.text = `Проверить источник сегодня ${index}`
        message.intentionalRepeatId = 'repeat.source'
      }
    }

    const results = findOverusedNgrams(content, { n: 2, minCount: 3 })

    expect(results).toContainEqual(
      expect.objectContaining({
        phrase: 'проверить источник',
        count: 3,
      }),
    )
    expect(
      results.find(result => result.phrase === 'проверить источник')?.nodeIds,
    ).toHaveLength(3)
    expect(
      results.find(result => result.phrase === 'проверить источник')
        ?.intentionalRepeatIds,
    ).toEqual(['repeat.source'])
  })

  it('does not report punctuation-only or single-unit repetitions', () => {
    const content = structuredClone(sampleContentPackage)
    const baseline = findOverusedNgrams(content, { n: 3, minCount: 2 })
    const decision = content.nodes.find(node => node.type === 'decision')!
    if (decision.type === 'decision') {
      const message = decision.messageVariants[0]?.messages[0]
      if (message) message.text = '— — —'
    }

    expect(findOverusedNgrams(content, { n: 3, minCount: 2 })).toEqual(baseline)
    expect(findOverusedNgrams(content, { n: 0, minCount: 2 })).toEqual([])
  })
})
