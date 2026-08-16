import { describe, expect, it } from 'vitest'
import fc from 'fast-check'

import type {
  Condition,
  ContentNode,
  DecisionNode,
  NarrativeState,
} from '@chartalk/content-schema'
import { initialNarrativeState } from '@chartalk/content-schema'

import {
  DialogueEngineError,
  applyChoice,
  applyEffects,
  canonicalHash,
  enterDecision,
  evaluateCondition,
  replayEvents,
  resolveDecision,
} from './index'

const decision: DecisionNode = {
  nodeId: 'decision.start',
  type: 'decision',
  sceneId: 'scene.start',
  onEnterEffects: [],
  messageVariants: [
    {
      variantId: 'variant.default',
      priority: 0,
      when: { op: 'all', args: [] },
      messages: [
        {
          messageId: 'message.start',
          speakerId: 'char.ira',
          text: 'Ты всё-таки здесь.',
          delayMs: 0,
          kind: 'message',
        },
      ],
    },
  ],
  choiceSlots: [1, 2, 3, 4].map(slot => ({
    slot: slot as 1 | 2 | 3 | 4,
    candidates: [
      {
        choiceId: `choice.${slot}`,
        text: `Ответ ${slot}`,
        intent: `intent_${slot}`,
        priority: 0,
        when: { op: 'all', args: [] },
        effects: [
          {
            effectId: `effect.${slot}`,
            op: 'setMemory',
            key: 'memory.replyMode',
            value: `reply_${slot}`,
          },
          {
            effectId: `counter.${slot}`,
            op: 'increment',
            path: `counters.intent_${slot}`,
            by: 1,
            min: 0,
            max: 100,
          },
        ],
        nextNodeId: `reaction.${slot}`,
      },
    ],
  })),
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

const nodes = new Map<string, ContentNode>([
  [decision.nodeId, decision],
  ...[1, 2, 3, 4].map((slot): [string, ContentNode] => [
    `reaction.${slot}`,
    {
      nodeId: `reaction.${slot}`,
      type: 'reaction' as const,
      sceneId: 'scene.start',
      messages: [
        {
          messageId: `reaction.message.${slot}`,
          speakerId: 'char.ira',
          text: `Реакция ${slot}`,
          delayMs: 0,
          kind: 'message',
        },
      ],
      nextNodeId: `ending.${slot}`,
      effects: [],
      editorial: decision.editorial,
    },
  ]),
  ...[1, 2, 3, 4].map((slot): [string, ContentNode] => [
    `ending.${slot}`,
    {
      nodeId: `ending.${slot}`,
      type: 'ending' as const,
      sceneId: 'scene.start',
      endingId: `ending.outcome.${slot}`,
      title: `Финал ${slot}`,
      messages: [],
      epilogueFacts: [],
      editorial: decision.editorial,
    },
  ]),
])

describe('evaluateCondition', () => {
  const state: NarrativeState = {
    ...initialNarrativeState(),
    relationships: { 'char.ira': { trust: 62 } },
    memories: { 'memory.met': true, 'memory.mode': 'direct' },
    counters: { clues: 3 },
  }

  it('evaluates nested allowlisted predicates without code execution', () => {
    const condition: Condition = {
      op: 'all',
      args: [
        { op: 'gte', path: 'relationships.char.ira.trust', value: 60 },
        { op: 'eq', path: 'memories.memory.mode', value: 'direct' },
        { op: 'not', arg: { op: 'exists', path: 'memories.memory.blocked' } },
      ],
    }

    expect(evaluateCondition(condition, state)).toBe(true)
  })

  it('returns false for unknown paths', () => {
    expect(
      evaluateCondition(
        { op: 'gt', path: '__proto__.polluted', value: 0 },
        state,
      ),
    ).toBe(false)
  })

  it('covers every bounded predicate and supported state namespace', () => {
    const richState: NarrativeState = {
      ...state,
      characterState: { 'char.ira': { mood: 'steady' } },
      arcState: { 'arc.main': { stage: 2 } },
      cooldowns: { reminder: 0 },
      seenNodes: { intro: true },
    }
    const cases: Array<[Condition, boolean]> = [
      [{ op: 'always' }, true],
      [{ op: 'never' }, false],
      [{ op: 'any', args: [{ op: 'never' }, { op: 'always' }] }, true],
      [{ op: 'neq', path: 'memories.memory.mode', value: 'quiet' }, true],
      [{ op: 'gt', path: 'counters.clues', value: 2 }, true],
      [{ op: 'gte', path: 'arcState.arc.main.stage', value: 2 }, true],
      [{ op: 'lt', path: 'relationships.char.ira.trust', value: 70 }, true],
      [{ op: 'lte', path: 'cooldowns.reminder', value: 0 }, true],
      [
        { op: 'eq', path: 'characterState.char.ira.mood', value: 'steady' },
        true,
      ],
      [{ op: 'exists', path: 'seenNodes.intro' }, true],
      [{ op: 'gt', path: 'memories.memory.mode', value: 1 }, false],
      [{ op: 'exists', path: 'relationships.char.ira' }, false],
      [{ op: 'exists', path: 'missing.value' }, false],
      [{ op: 'exists', path: '' }, false],
    ]

    for (const [condition, expected] of cases) {
      expect(evaluateCondition(condition, richState)).toBe(expected)
    }
  })

  it('treats malformed runtime state containers as unavailable data', () => {
    const exists = (path: string): Condition => ({ op: 'exists', path })

    expect(
      evaluateCondition(
        exists('memories.value'),
        null as unknown as NarrativeState,
      ),
    ).toBe(false)
    expect(
      evaluateCondition(exists('memories.value'), {
        memories: 42,
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('relationships.char.ira'), {
        relationships: {},
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('custom.deep.value'), {
        custom: 1,
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('custom.deep'), {
        custom: {},
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('custom.deep.value'), {
        custom: { deep: { value: 7 } },
      } as unknown as NarrativeState),
    ).toBe(true)
    expect(
      evaluateCondition(exists('custom.deep.length'), {
        custom: { deep: 'abc' },
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('custom.deep.value'), {
        custom: { deep: null },
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('memories.length'), {
        memories: 'abc',
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('relationships.ira.trust'), {
        relationships: { ira: { trust: 1 } },
      } as unknown as NarrativeState),
    ).toBe(true)
    expect(
      evaluateCondition(exists('relationships.owner'), {
        relationships: { '': { owner: true } },
      } as unknown as NarrativeState),
    ).toBe(false)
    expect(
      evaluateCondition(exists('relationships.ira.trust'), {
        relationships: { ira: null },
      } as unknown as NarrativeState),
    ).toBe(false)

    const dottedState = {
      ...initialNarrativeState(),
      memories: { 'memory.mode': 'direct' },
      counters: { 'deep.key': 7 },
      cooldowns: { 'deep.key': 3 },
      seenNodes: { 'deep.key': true },
    }
    expect(
      evaluateCondition(
        { op: 'eq', path: 'memories..memory.mode', value: 'direct' },
        dottedState,
      ),
    ).toBe(true)
    for (const path of [
      'counters.deep.key',
      'cooldowns.deep.key',
      'seenNodes.deep.key',
    ]) {
      expect(evaluateCondition(exists(path), dottedState)).toBe(true)
    }

    let opReads = 0
    const adversarialCondition = {
      get op() {
        opReads += 1
        return opReads === 1 ? 'eq' : 'unsupported'
      },
      path: 'memories.memory.mode',
      value: 'direct',
    } as unknown as Condition
    expect(evaluateCondition(adversarialCondition, state)).toBe(false)
  })

  it('distinguishes every numeric comparison boundary and invalid operand type', () => {
    const comparisonState: NarrativeState = {
      ...initialNarrativeState(),
      counters: { value: 5 },
      memories: { text: 'five' },
    }
    const cases: Array<[Condition, boolean]> = [
      [{ op: 'eq', path: 'counters.value', value: 5 }, true],
      [{ op: 'eq', path: 'counters.value', value: 4 }, false],
      [{ op: 'neq', path: 'counters.value', value: 4 }, true],
      [{ op: 'neq', path: 'counters.value', value: 5 }, false],
      [{ op: 'gt', path: 'counters.value', value: 4 }, true],
      [{ op: 'gt', path: 'counters.value', value: 6 }, false],
      [{ op: 'gt', path: 'memories.text', value: 1 }, false],
      [{ op: 'gt', path: 'counters.value', value: '4' }, false],
      [{ op: 'gte', path: 'counters.value', value: 5 }, true],
      [{ op: 'gte', path: 'counters.value', value: 6 }, false],
      [{ op: 'gte', path: 'memories.text', value: 1 }, false],
      [{ op: 'gte', path: 'counters.value', value: '5' }, false],
      [{ op: 'lt', path: 'counters.value', value: 6 }, true],
      [{ op: 'lt', path: 'counters.value', value: 4 }, false],
      [{ op: 'lt', path: 'memories.text', value: 6 }, false],
      [{ op: 'lt', path: 'counters.value', value: '6' }, false],
      [{ op: 'lte', path: 'counters.value', value: 5 }, true],
      [{ op: 'lte', path: 'counters.value', value: 4 }, false],
      [{ op: 'lte', path: 'memories.text', value: 5 }, false],
      [{ op: 'lte', path: 'counters.value', value: '5' }, false],
    ]

    for (const [condition, expected] of cases) {
      expect(evaluateCondition(condition, comparisonState)).toBe(expected)
    }
  })

  it('evaluates authored memory, history, seen-node, and recent-turn predicates', () => {
    const historyState: NarrativeState = {
      ...initialNarrativeState(),
      memories: { 'memory.replyMode': 'practical', 'memory.flag': true },
      seenNodes: { 'node.open': true },
      choiceHistory: ['choice.first', 'choice.practical', 'choice.latest'],
    }

    expect(
      evaluateCondition(
        { op: 'hasMemory', key: 'memory.replyMode', value: 'practical' },
        historyState,
      ),
    ).toBe(true)
    expect(
      evaluateCondition({ op: 'hasMemory', key: 'memory.flag' }, historyState),
    ).toBe(true)
    expect(
      evaluateCondition(
        { op: 'chosen', choiceId: 'choice.practical' },
        historyState,
      ),
    ).toBe(true)
    expect(
      evaluateCondition({ op: 'seen', nodeId: 'node.open' }, historyState),
    ).toBe(true)
    expect(
      evaluateCondition(
        { op: 'withinLastTurns', choiceId: 'choice.practical', turns: 2 },
        historyState,
      ),
    ).toBe(true)
    expect(
      evaluateCondition(
        { op: 'withinLastTurns', choiceId: 'choice.first', turns: 2 },
        historyState,
      ),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'hasMemory', key: 'memory.replyMode', value: 'warm' },
        historyState,
      ),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'hasMemory', key: 'memory.missing' },
        historyState,
      ),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'chosen', choiceId: 'choice.missing' },
        historyState,
      ),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'chosen', choiceId: 'choice.missing' },
        (() => {
          const legacy = structuredClone(historyState)
          delete legacy.choiceHistory
          return legacy
        })(),
      ),
    ).toBe(false)
    expect(
      evaluateCondition({ op: 'seen', nodeId: 'node.missing' }, historyState),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'withinLastTurns', choiceId: 'choice.first', turns: 2 },
        (() => {
          const legacy = structuredClone(historyState)
          delete legacy.choiceHistory
          return legacy
        })(),
      ),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'eq', path: 'choiceHistory.choice.practical', value: true },
        historyState,
      ),
    ).toBe(true)
    expect(
      evaluateCondition(
        { op: 'exists', path: 'choiceHistory.choice.missing' },
        historyState,
      ),
    ).toBe(false)
  })

  it('reads structured and legacy promise state safely', () => {
    const structured: NarrativeState = {
      ...initialNarrativeState(),
      promises: ['promise.legacy'],
      promiseStates: { 'promise.kept': 'kept' },
    }
    expect(
      evaluateCondition(
        { op: 'eq', path: 'promises.promise.kept', value: 'kept' },
        structured,
      ),
    ).toBe(true)
    expect(
      evaluateCondition(
        { op: 'eq', path: 'promises.promise.legacy', value: 'open' },
        structured,
      ),
    ).toBe(true)
    expect(
      evaluateCondition(
        { op: 'exists', path: 'promises.promise.missing' },
        structured,
      ),
    ).toBe(false)
    expect(
      evaluateCondition(
        { op: 'eq', path: 'promises.promise.legacy', value: 'open' },
        { ...structured, promiseStates: null } as unknown as NarrativeState,
      ),
    ).toBe(true)
  })
})

describe('applyEffects and canonical state', () => {
  it('immutably applies every effect type across allowlisted namespaces', () => {
    const original = initialNarrativeState()
    const state = applyEffects(original, [
      { effectId: 'memory', op: 'setMemory', key: 'met', value: true },
      {
        effectId: 'relationship',
        op: 'increment',
        path: 'relationships.char.ira.trust',
        by: 20,
        min: 0,
        max: 10,
      },
      {
        effectId: 'character',
        op: 'set',
        path: 'characterState.char.ira.mood',
        value: 'calm',
      },
      {
        effectId: 'arc',
        op: 'set',
        path: 'arcState.arc.main.stage',
        value: 2,
      },
      {
        effectId: 'promise-1',
        op: 'addToSet',
        path: 'promises',
        value: 'call',
      },
      {
        effectId: 'promise-2',
        op: 'addToSet',
        path: 'promises',
        value: 'call',
      },
    ])

    expect(original).toEqual(initialNarrativeState())
    expect(state.memories.met).toBe(true)
    expect(state.relationships['char.ira']?.trust).toBe(10)
    expect(state.characterState['char.ira']?.mood).toBe('calm')
    expect(state.arcState['arc.main']?.stage).toBe(2)
    expect(state.promises).toEqual(['call'])
  })

  it('uses zero for a missing counter and clamps at the lower bound', () => {
    const state = applyEffects(initialNarrativeState(), [
      {
        effectId: 'counter',
        op: 'increment',
        path: 'counters.distance',
        by: -5,
        min: -2,
        max: 10,
      },
    ])
    expect(state.counters.distance).toBe(-2)
  })

  it('rejects unsafe mutation paths for set, increment, and sets', () => {
    const unsafeEffects = [
      { effectId: 'set', op: 'set', path: '__proto__.polluted', value: true },
      {
        effectId: 'increment',
        op: 'increment',
        path: 'constructor.value',
        by: 1,
        min: 0,
        max: 2,
      },
      {
        effectId: 'increment-set-only-path',
        op: 'increment',
        path: 'promises',
        by: 1,
        min: 0,
        max: 2,
      },
      {
        effectId: 'set-add',
        op: 'addToSet',
        path: 'prototype.values',
        value: 'x',
      },
      {
        effectId: 'nested-promises-add',
        op: 'addToSet',
        path: 'promises.deep.value',
        value: 'x',
      },
      {
        effectId: 'unknown-root',
        op: 'set',
        path: 'invented.value',
        value: true,
      },
      {
        effectId: 'set-set-only-path',
        op: 'set',
        path: 'promises',
        value: true,
      },
      {
        effectId: 'wrong-array',
        op: 'addToSet',
        path: 'memories.values',
        value: 'x',
      },
    ] as const

    for (const effect of unsafeEffects) {
      expect(() => applyEffects(initialNarrativeState(), [effect])).toThrow(
        /Unsafe effect path/,
      )
    }
  })

  it('normalizes malformed containers and rejects incomplete allowlisted paths', () => {
    const invalidEffects = [
      {
        effectId: 'counter-root',
        op: 'increment',
        path: 'counters',
        by: 1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'counter-forbidden',
        op: 'increment',
        path: 'counters.__proto__.value',
        by: 1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'relationship-owner-only',
        op: 'increment',
        path: 'relationships.owner',
        by: 1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'memory-root',
        op: 'set',
        path: 'memories',
        value: true,
      },
    ] as const
    for (const effect of invalidEffects) {
      expect(() => applyEffects(initialNarrativeState(), [effect])).toThrow(
        /Unsafe effect path/,
      )
    }

    const normalized = applyEffects(
      {
        ...initialNarrativeState(),
        counters: null,
        relationships: null,
        promises: null,
      } as unknown as NarrativeState,
      [
        {
          effectId: 'counter',
          op: 'increment',
          path: 'counters.retries',
          by: 1,
          min: 0,
          max: 10,
        },
        {
          effectId: 'relationship',
          op: 'increment',
          path: 'relationships.char.ira.trust',
          by: 2,
          min: 0,
          max: 10,
        },
        {
          effectId: 'promise',
          op: 'addToSet',
          path: 'promises',
          value: 'return',
        },
      ],
    )
    expect(normalized.counters.retries).toBe(1)
    expect(normalized.relationships['char.ira']?.trust).toBe(2)
    expect(normalized.promises).toEqual(['return'])

    const updatedExisting = applyEffects(
      {
        ...initialNarrativeState(),
        relationships: { 'char.ira': { trust: 3 } },
        promises: [1, 'kept'] as unknown as string[],
      },
      [
        {
          effectId: 'existing-relationship',
          op: 'increment',
          path: 'relationships.char.ira.trust',
          by: 2,
          min: 0,
          max: 10,
        },
        {
          effectId: 'filtered-promise',
          op: 'addToSet',
          path: 'promises',
          value: 'new',
        },
      ],
    )
    expect(updatedExisting.relationships['char.ira']?.trust).toBe(5)
    expect(updatedExisting.promises).toEqual(['kept', 'new'])

    const normalizedArrays = applyEffects(
      {
        ...initialNarrativeState(),
        relationships: [] as unknown as NarrativeState['relationships'],
      },
      [
        {
          effectId: 'array-namespace',
          op: 'increment',
          path: 'relationships.char.ira.trust',
          by: 1,
          min: 0,
          max: 10,
        },
      ],
    )
    expect(normalizedArrays.relationships['char.ira']?.trust).toBe(1)

    const normalizedOwner = applyEffects(
      {
        ...initialNarrativeState(),
        relationships: {
          'char.ira': [] as unknown as NarrativeState['relationships'][string],
        },
      },
      [
        {
          effectId: 'array-owner',
          op: 'increment',
          path: 'relationships.char.ira.trust',
          by: 1,
          min: 0,
          max: 10,
        },
      ],
    )
    expect(normalizedOwner.relationships['char.ira']?.trust).toBe(1)
  })

  it('updates every allowed namespace without replacing sibling state', () => {
    const state: NarrativeState = {
      ...initialNarrativeState(),
      relationships: { ira: { trust: 3, bond: 7 } },
      characterState: { ira: { energy: 2 } },
      arcState: { main: { stage: 1 } },
      counters: { target: 2, kept: 9 },
      cooldowns: { reminder: 2, kept: 8 },
      seenNodes: { intro: true },
    }
    const updated = applyEffects(state, [
      {
        effectId: 'relationship-increment',
        op: 'increment',
        path: 'relationships.ira.trust',
        by: 2,
        min: 0,
        max: 10,
      },
      {
        effectId: 'character-increment',
        op: 'increment',
        path: 'characterState.ira.energy',
        by: 1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'arc-increment',
        op: 'increment',
        path: 'arcState.main.stage',
        by: 1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'counter-increment',
        op: 'increment',
        path: 'counters.target',
        by: 1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'cooldown-increment',
        op: 'increment',
        path: 'cooldowns.reminder',
        by: -1,
        min: 0,
        max: 10,
      },
      {
        effectId: 'relationship-set',
        op: 'set',
        path: 'relationships.ira.mood',
        value: 6,
      },
      {
        effectId: 'memory-set',
        op: 'set',
        path: 'memories.flag',
        value: true,
      },
      {
        effectId: 'counter-set',
        op: 'set',
        path: 'counters.mode',
        value: 'careful',
      },
      {
        effectId: 'cooldown-set',
        op: 'set',
        path: 'cooldowns.ready',
        value: 0,
      },
      {
        effectId: 'seen-set',
        op: 'set',
        path: 'seenNodes.outro',
        value: true,
      },
    ])

    expect(updated.relationships.ira).toEqual({
      trust: 5,
      bond: 7,
      mood: 6,
    })
    expect(updated.characterState.ira?.energy).toBe(3)
    expect(updated.arcState.main?.stage).toBe(2)
    expect(updated.counters).toMatchObject({
      target: 3,
      kept: 9,
      mode: 'careful',
    })
    expect(updated.cooldowns).toMatchObject({
      reminder: 1,
      kept: 8,
      ready: 0,
    })
    expect(updated.memories.flag).toBe(true)
    expect(updated.seenNodes).toMatchObject({ intro: true, outro: true })
  })

  it('supports structured memories, promises, arc phases, and cooldowns', () => {
    const added = applyEffects(initialNarrativeState(), [
      {
        effectId: 'memory.add',
        op: 'addMemory',
        key: 'memory.promiseMade',
        value: true,
      },
      {
        effectId: 'promise.add',
        op: 'addPromise',
        promiseId: 'promise.callBack',
      },
      {
        effectId: 'promise.add-duplicate',
        op: 'addPromise',
        promiseId: 'promise.callBack',
      },
      {
        effectId: 'arc.advance',
        op: 'advanceArc',
        arcId: 'arc.main',
        phase: 'after-confession',
      },
      {
        effectId: 'cooldown.start',
        op: 'startCooldown',
        cooldownId: 'cooldown.follow-up',
        turns: 3,
      },
    ])

    expect(added.memories['memory.promiseMade']).toBe(true)
    expect(added.promises).toContain('promise.callBack')
    expect(added.promiseStates?.['promise.callBack']).toBe('open')
    expect(added.arcState['arc.main']?.phase).toBe('after-confession')
    expect(added.cooldowns['cooldown.follow-up']).toBe(3)

    const resolved = applyEffects(added, [
      {
        effectId: 'promise.resolve',
        op: 'resolvePromise',
        promiseId: 'promise.callBack',
        outcome: 'kept',
      },
      {
        effectId: 'memory.remove',
        op: 'removeMemory',
        key: 'memory.promiseMade',
      },
    ])

    expect(resolved.promiseStates?.['promise.callBack']).toBe('kept')
    expect(resolved.memories['memory.promiseMade']).toBeUndefined()
  })

  it('normalizes promise containers and rejects impossible structured effects', () => {
    const normalized = applyEffects(
      {
        ...initialNarrativeState(),
        promises: [1] as unknown as string[],
      },
      [
        {
          effectId: 'promise.recover',
          op: 'addPromise',
          promiseId: 'promise.recover',
        },
      ],
    )
    expect(normalized.promises).toEqual(['promise.recover'])

    expect(() =>
      applyEffects(initialNarrativeState(), [
        {
          effectId: 'promise.missing',
          op: 'resolvePromise',
          promiseId: 'promise.missing',
          outcome: 'broken',
        },
      ]),
    ).toThrow(/Cannot resolve missing promise/)
    expect(() =>
      applyEffects(initialNarrativeState(), [
        {
          effectId: 'arc.unsafe',
          op: 'advanceArc',
          arcId: '__proto__',
          phase: 'blocked',
        },
      ]),
    ).toThrow(/Unsafe arc effect/)
    expect(() =>
      applyEffects(initialNarrativeState(), [
        {
          effectId: 'cooldown.unsafe',
          op: 'startCooldown',
          cooldownId: '__proto__',
          turns: 1,
        },
      ]),
    ).toThrow(/Unsafe cooldown effect/)
  })

  it('applies decision entry effects and hashes key order canonically', () => {
    const entered = enterDecision(
      {
        ...decision,
        onEnterEffects: [
          {
            effectId: 'arrival',
            op: 'increment',
            path: 'counters.arrival',
            by: 1,
            min: 0,
            max: 10,
          },
        ],
      },
      initialNarrativeState(),
    )
    expect(entered.counters.arrival).toBe(1)
    expect(canonicalHash({ b: [true, null], a: 'x' })).toBe(
      canonicalHash({ a: 'x', b: [true, null] }),
    )
  })

  it('rejects non-canonical numbers and unsupported values', () => {
    expect(() => canonicalHash(Number.MAX_SAFE_INTEGER + 1)).toThrow(
      /safe integers/,
    )
    expect(() => canonicalHash(undefined)).toThrow(/Unsupported value/)
  })
})

describe('resolveDecision', () => {
  it('returns exactly four ordered visible choices', () => {
    const resolved = resolveDecision(decision, initialNarrativeState())

    expect(resolved.choices).toHaveLength(4)
    expect(resolved.choices.map(choice => choice.slot)).toEqual([1, 2, 3, 4])
    expect(resolved.messages[0]?.text).toBe('Ты всё-таки здесь.')
  })

  it('selects the highest-priority matching candidate per slot', () => {
    const contextual: DecisionNode = {
      ...decision,
      choiceSlots: decision.choiceSlots.map(slot =>
        slot.slot === 1
          ? {
              ...slot,
              candidates: [
                {
                  ...slot.candidates[0]!,
                  choiceId: 'choice.contextual',
                  text: 'Я помню, о чём ты говорила.',
                  priority: 100,
                  when: {
                    op: 'eq',
                    path: 'memories.memory.met',
                    value: true,
                  },
                },
                ...slot.candidates,
              ],
            }
          : slot,
      ),
    }

    const resolved = resolveDecision(contextual, {
      ...initialNarrativeState(),
      memories: { 'memory.met': true },
    })

    expect(resolved.choices[0]?.choiceId).toBe('choice.contextual')
  })

  it('raises a content-fatal error when a slot cannot resolve', () => {
    const broken: DecisionNode = {
      ...decision,
      choiceSlots: decision.choiceSlots.map(slot =>
        slot.slot === 4
          ? {
              ...slot,
              candidates: slot.candidates.map(candidate => ({
                ...candidate,
                when: { op: 'never' },
              })),
            }
          : slot,
      ),
    }

    expect(() => resolveDecision(broken, initialNarrativeState())).toThrow(
      DialogueEngineError,
    )
  })

  it('raises a content-fatal error when no message variant resolves', () => {
    const broken: DecisionNode = {
      ...decision,
      messageVariants: decision.messageVariants.map(variant => ({
        ...variant,
        when: { op: 'never' },
      })),
    }
    expect(() => resolveDecision(broken, initialNarrativeState())).toThrow(
      /No message variant resolved/,
    )
  })

  it('defensively rejects malformed content with fewer than four slots', () => {
    const broken = {
      ...decision,
      choiceSlots: decision.choiceSlots.slice(0, 3),
    } as DecisionNode
    expect(() => resolveDecision(broken, initialNarrativeState())).toThrow(
      /instead of four/,
    )
  })
})

describe('applyChoice and replayEvents', () => {
  it('applies immutable bounded effects and advances through a reaction', () => {
    const result = applyChoice({
      operationId: 'op.1',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.2',
      state: initialNarrativeState(),
      node: decision,
      nodes,
    })

    expect(result.newSequence).toBe(1)
    expect(result.outgoing.text).toBe('Ответ 2')
    expect(result.reaction.map(message => message.text)).toEqual(['Реакция 2'])
    expect(result.nextNodeId).toBe('ending.2')
    expect(result.state.memories['memory.replyMode']).toBe('reply_2')
    expect(result.state.counters['intent_2']).toBe(1)
    expect(result.state.choiceHistory).toEqual(['choice.2'])
  })

  it('applies destination on-enter effects before resolving the next decision', () => {
    const nextDecision: DecisionNode = {
      ...decision,
      nodeId: 'decision.next',
      onEnterEffects: [
        {
          effectId: 'effect.enter.next',
          op: 'increment',
          path: 'counters.arrivals',
          by: 1,
          min: 0,
          max: 10,
        },
      ],
    }
    const route = new Map(nodes)
    const reaction = route.get('reaction.1')!
    if (reaction.type !== 'reaction')
      throw new Error('fixture reaction missing')
    route.set('reaction.1', { ...reaction, nextNodeId: nextDecision.nodeId })
    route.set(nextDecision.nodeId, nextDecision)

    const result = applyChoice({
      operationId: 'op.enter',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
      nodes: route,
    })

    expect(result.nextNodeId).toBe(nextDecision.nodeId)
    expect(result.state.counters.arrivals).toBe(1)
  })

  it('treats omitted automatic-node effects as an empty authored list', () => {
    const route = new Map(nodes)
    const reaction = structuredClone(route.get('reaction.1'))
    if (reaction?.type !== 'reaction')
      throw new Error('fixture reaction missing')
    expect(Reflect.deleteProperty(reaction, 'effects')).toBe(true)
    route.set(reaction.nodeId, reaction)

    const result = applyChoice({
      operationId: 'op.no-effects',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
      nodes: route,
    })

    expect(result.nextNodeId).toBe('ending.1')
    expect(result.reaction.map(message => message.text)).toEqual(['Реакция 1'])
  })

  it('returns the prior result for the same operation ID', () => {
    const first = applyChoice({
      operationId: 'op.same',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
      nodes,
    })

    const replayed = replayEvents({
      initialState: initialNarrativeState(),
      entryNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      nodes,
      events: [first.event, first.event],
    })

    expect(replayed.events).toHaveLength(1)
    expect(replayed.stateHash).toBe(first.resultingStateHash)
  })

  it('produces different state hashes for all four choices', () => {
    const hashes = decision.choiceSlots.map(
      slot =>
        applyChoice({
          operationId: `op.${slot.slot}`,
          runId: 'run.1',
          expectedSequence: 0,
          expectedNodeId: decision.nodeId,
          contentBuildId: 'build.1',
          choiceId: slot.candidates[0]!.choiceId,
          state: initialNarrativeState(),
          node: decision,
          nodes,
        }).resultingStateHash,
    )

    expect(new Set(hashes).size).toBe(4)
  })

  it('is deterministic for arbitrary serializable state key order', () => {
    fc.assert(
      fc.property(fc.dictionary(fc.string(), fc.integer()), record => {
        const first = canonicalHash({ alpha: record, omega: 1 })
        const reversed = Object.fromEntries(Object.entries(record).reverse())
        const second = canonicalHash({ omega: 1, alpha: reversed })
        expect(first).toBe(second)
      }),
    )
  })

  it('rejects stale nodes, invalid sequences, and unavailable choices', () => {
    const base = {
      operationId: 'op.invalid',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
      nodes,
    }

    expect(() =>
      applyChoice({ ...base, expectedNodeId: 'decision.other' }),
    ).toThrow(/Active node changed/)
    expect(() => applyChoice({ ...base, expectedSequence: -1 })).toThrow(
      /Expected sequence is invalid/,
    )
    expect(() => applyChoice({ ...base, choiceId: 'choice.missing' })).toThrow(
      /Choice is not in the resolved set/,
    )
  })

  it('advances through checkpoints and bridges and applies automatic effects', () => {
    const route = new Map(nodes)
    const reaction = route.get('reaction.1')
    if (reaction?.type !== 'reaction')
      throw new Error('fixture reaction missing')
    route.set('reaction.1', { ...reaction, nextNodeId: 'checkpoint.1' })
    route.set('checkpoint.1', {
      nodeId: 'checkpoint.1',
      type: 'checkpoint',
      sceneId: 'scene.start',
      checkpointId: 'checkpoint.saved',
      label: 'Проверка',
      recapFacts: ['Факт'],
      nextNodeId: 'bridge.1',
      editorial: decision.editorial,
    })
    route.set('bridge.1', {
      nodeId: 'bridge.1',
      type: 'bridge',
      sceneId: 'scene.start',
      messages: [
        {
          messageId: 'bridge.message',
          speakerId: 'char.ira',
          text: 'Мост.',
          delayMs: 0,
          kind: 'message',
        },
      ],
      effects: [
        {
          effectId: 'bridge.effect',
          op: 'setMemory',
          key: 'bridge.crossed',
          value: true,
        },
      ],
      nextNodeId: 'ending.1',
      editorial: decision.editorial,
    })

    const result = applyChoice({
      operationId: 'op.route',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
      nodes: route,
      committedAt: '2026-08-13T08:00:00.000Z',
    })

    expect(result.reaction.map(item => item.text)).toEqual([
      'Реакция 1',
      'Мост.',
    ])
    expect(result.state.memories['bridge.crossed']).toBe(true)
    expect(result.event.committedAt).toBe('2026-08-13T08:00:00.000Z')
  })

  it('detects missing nodes and automatic loops', () => {
    const missingRoute = new Map(nodes)
    missingRoute.delete('reaction.1')
    const loopingRoute = new Map(nodes)
    const reaction = loopingRoute.get('reaction.1')
    if (reaction?.type !== 'reaction')
      throw new Error('fixture reaction missing')
    loopingRoute.set('reaction.1', { ...reaction, nextNodeId: 'reaction.1' })
    const base = {
      operationId: 'op.route-error',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
    }

    expect(() => applyChoice({ ...base, nodes: missingRoute })).toThrow(
      /Missing node/,
    )
    expect(() => applyChoice({ ...base, nodes: loopingRoute })).toThrow(
      /Unbounded automatic loop/,
    )
  })

  it('rejects replay build, node, sequence, and hash mismatches', () => {
    const first = applyChoice({
      operationId: 'op.replay',
      runId: 'run.1',
      expectedSequence: 0,
      expectedNodeId: decision.nodeId,
      contentBuildId: 'build.1',
      choiceId: 'choice.1',
      state: initialNarrativeState(),
      node: decision,
      nodes,
    })
    const replay = (
      events: (typeof first.event)[],
      entryNodeId = decision.nodeId,
    ) =>
      replayEvents({
        initialState: initialNarrativeState(),
        entryNodeId,
        contentBuildId: 'build.1',
        nodes,
        events,
      })

    expect(() =>
      replay([{ ...first.event, contentBuildId: 'build.other' }]),
    ).toThrow(/another content build/)
    expect(() => replay([first.event], 'ending.1')).toThrow(/Expected decision/)
    expect(() => replay([{ ...first.event, sequence: 2 }])).toThrow(
      /Invalid event sequence/,
    )
    expect(() =>
      replay([{ ...first.event, afterStateHash: 'sha256:tampered' }]),
    ).toThrow(/State hash mismatch/)
    expect(() =>
      replay([{ ...first.event, beforeStateHash: 'sha256:tampered' }]),
    ).toThrow(/Authored event mismatch/)
  })
})
