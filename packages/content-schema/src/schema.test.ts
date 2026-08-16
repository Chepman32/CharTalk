import { describe, expect, it } from 'vitest'

import {
  contentPackageSchema,
  conditionSchema,
  decisionNodeSchema,
  effectSchema,
  initialNarrativeState,
  narrativeMessageSchema,
  choiceCandidateSchema,
} from './index'

const validChoice = (slot: 1 | 2 | 3 | 4) => ({
  slot,
  candidates: [
    {
      choiceId: `choice.${slot}`,
      text: `Ответ ${slot}`,
      intent: `intent_${slot}`,
      priority: 0,
      when: { op: 'all' as const, args: [] },
      effects: [
        {
          effectId: `effect.${slot}`,
          op: 'setMemory' as const,
          key: `memory.reply.${slot}`,
          value: true,
        },
      ],
      nextNodeId: `reaction.${slot}`,
    },
  ],
})

describe('decisionNodeSchema', () => {
  it('accepts every editorial lifecycle status', () => {
    for (const status of [
      'outline',
      'graph-ready',
      'draft',
      'voice-review',
      'continuity-review',
      'rating-review',
      'logic-qa',
      'device-qa',
      'approved',
      'scheduled',
      'published',
      'deprecated',
      'fixture',
    ] as const) {
      const result = decisionNodeSchema.safeParse({
        nodeId: 'decision.lifecycle',
        type: 'decision',
        sceneId: 'scene.lifecycle',
        messageVariants: [
          {
            variantId: 'message.lifecycle',
            priority: 0,
            when: { op: 'all', args: [] },
            messages: [
              {
                messageId: 'message.lifecycle',
                speakerId: 'char.lifecycle',
                text: 'Проверка жизненного цикла.',
                delayMs: 0,
              },
            ],
          },
        ],
        choiceSlots: [
          validChoice(1),
          validChoice(2),
          validChoice(3),
          validChoice(4),
        ],
        checkpointPolicy: 'none',
        editorial: {
          writerId: 'writer.lifecycle',
          voiceEditorId: 'editor.lifecycle',
          continuityEditorId: 'continuity.lifecycle',
          status,
          voiceCardVersion: 'voice.lifecycle.1',
          warningProfileId: null,
        },
      })
      expect(result.success).toBe(true)
    }
  })

  it('accepts a decision with four ordered slots', () => {
    const result = decisionNodeSchema.safeParse({
      nodeId: 'decision.start',
      type: 'decision',
      sceneId: 'scene.start',
      messageVariants: [
        {
          variantId: 'message.default',
          priority: 0,
          when: { op: 'all', args: [] },
          messages: [
            {
              messageId: 'message.1',
              speakerId: 'char.ira',
              text: 'Ты всё-таки здесь.',
              delayMs: 0,
            },
          ],
        },
      ],
      choiceSlots: [
        validChoice(1),
        validChoice(2),
        validChoice(3),
        validChoice(4),
      ],
      checkpointPolicy: 'none',
      editorial: {
        writerId: 'fixture.writer',
        voiceEditorId: 'fixture.editor',
        continuityEditorId: 'fixture.continuity',
        status: 'fixture',
        voiceCardVersion: 'voice.1',
        warningProfileId: null,
      },
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing, duplicate, or unordered slots', () => {
    const base = {
      nodeId: 'decision.start',
      type: 'decision',
      sceneId: 'scene.start',
      messageVariants: [],
      checkpointPolicy: 'none',
      editorial: {
        writerId: 'fixture.writer',
        voiceEditorId: 'fixture.editor',
        continuityEditorId: 'fixture.continuity',
        status: 'fixture',
        voiceCardVersion: 'voice.1',
        warningProfileId: null,
      },
    }

    expect(
      decisionNodeSchema.safeParse({
        ...base,
        choiceSlots: [validChoice(1), validChoice(2), validChoice(3)],
      }).success,
    ).toBe(false)
    expect(
      decisionNodeSchema.safeParse({
        ...base,
        choiceSlots: [
          validChoice(1),
          validChoice(2),
          validChoice(2),
          validChoice(4),
        ],
      }).success,
    ).toBe(false)
    expect(
      decisionNodeSchema.safeParse({
        ...base,
        choiceSlots: [
          validChoice(2),
          validChoice(1),
          validChoice(3),
          validChoice(4),
        ],
      }).success,
    ).toBe(false)
  })
})

describe('contentPackageSchema', () => {
  it('rejects a package whose engine range or locale is invalid', () => {
    const result = contentPackageSchema.safeParse({
      manifest: {
        packId: 'pack.fixture',
        locale: 'en-US',
        schemaVersion: 1,
        contentVersion: '1.0.0',
        buildId: 'fixture-1',
        minEngineVersion: '2.0.0',
        maxEngineVersion: '1.0.0',
        createdAt: '2026-08-13T00:00:00.000Z',
        checksum: 'sha256:test',
        signature: 'ed25519:test',
      },
      characters: [],
      stories: [],
      episodes: [],
      nodes: [],
    })

    expect(result.success).toBe(false)
  })
})

describe('authored text metadata', () => {
  it('accepts explicit intentional repetition and typo markers', () => {
    expect(
      narrativeMessageSchema.safeParse({
        messageId: 'message.marked',
        speakerId: 'char.ira',
        text: 'Ну да.',
        intentionalRepeatId: 'motif.night',
        intentionalTypo: true,
        delayMs: 0,
      }).success,
    ).toBe(true)
    expect(
      choiceCandidateSchema.safeParse({
        ...validChoice(1).candidates[0],
        intentionalRepeatId: 'motif.night',
        intentionalTypo: true,
      }).success,
    ).toBe(true)
  })
})

describe('history-aware DSL', () => {
  it('accepts memory, choice-history, seen-node, and recent-turn conditions', () => {
    for (const condition of [
      { op: 'hasMemory', key: 'memory.mode' },
      { op: 'hasMemory', key: 'memory.mode', value: 'practical' },
      { op: 'chosen', choiceId: 'choice.practical' },
      { op: 'seen', nodeId: 'node.open' },
      { op: 'withinLastTurns', choiceId: 'choice.practical', turns: 2 },
    ]) {
      expect(conditionSchema.safeParse(condition).success).toBe(true)
    }
  })

  it('accepts structured promise, arc, memory, and cooldown effects', () => {
    for (const effect of [
      {
        effectId: 'memory.add',
        op: 'addMemory',
        key: 'memory.mode',
        value: 'practical',
      },
      { effectId: 'memory.remove', op: 'removeMemory', key: 'memory.mode' },
      { effectId: 'promise.add', op: 'addPromise', promiseId: 'promise.call' },
      {
        effectId: 'promise.resolve',
        op: 'resolvePromise',
        promiseId: 'promise.call',
        outcome: 'kept',
      },
      {
        effectId: 'arc.advance',
        op: 'advanceArc',
        arcId: 'arc.main',
        phase: 'after-call',
      },
      {
        effectId: 'cooldown.start',
        op: 'startCooldown',
        cooldownId: 'cooldown.call',
        turns: 3,
      },
    ]) {
      expect(effectSchema.safeParse(effect).success).toBe(true)
    }
  })
})

describe('initialNarrativeState', () => {
  it('creates isolated empty state maps', () => {
    const first = initialNarrativeState()
    const second = initialNarrativeState()

    expect(first).toEqual(second)
    expect(first.memories).not.toBe(second.memories)
    expect(first.relationships).not.toBe(second.relationships)
  })
})
