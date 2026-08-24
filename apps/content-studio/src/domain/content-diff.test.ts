import { sampleContentPackage } from '@razvilka/test-fixtures'
import { describe, expect, it } from 'vitest'

import { diffContentPackages } from './content-diff'

describe('content studio content diff', () => {
  it('separates authored text changes from state and graph changes', () => {
    const before = structuredClone(sampleContentPackage)
    const after = structuredClone(sampleContentPackage)
    const decision = after.nodes.find(node => node.type === 'decision')
    if (!decision || decision.type !== 'decision') throw new Error('fixture')
    const message = decision.messageVariants[0]?.messages[0]
    const choice = decision.choiceSlots[0]?.candidates[0]
    if (!message || !choice) throw new Error('fixture')
    message.text = 'Новый текст после редакторской правки.'
    choice.intent = 'ask-directly-updated'
    choice.effects = [
      ...choice.effects,
      {
        effectId: 'effect.diff',
        op: 'setMemory',
        key: 'memory.diff',
        value: true,
      },
    ]

    const diff = diffContentPackages(before, after)

    const messageDiff = diff.text.find(
      change => change.unitId === message.messageId,
    )
    expect(messageDiff?.nodeId).toBe(decision.nodeId)
    expect(messageDiff?.before).toEqual(expect.any(String))
    expect(messageDiff?.after).toBe(message.text)
    const logicDiff = diff.logic.find(
      change => change.nodeId === decision.nodeId,
    )
    expect(logicDiff?.path.endsWith('.logic')).toBe(true)
    expect(diff.text.every(change => change.path.includes('.text'))).toBe(true)
  })

  it('returns an empty diff for an unchanged package', () => {
    const diff = diffContentPackages(sampleContentPackage, sampleContentPackage)

    expect(diff).toEqual({ text: [], logic: [] })
  })
})
