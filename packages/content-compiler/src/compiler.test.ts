import { describe, expect, it } from 'vitest'

import type {
  Condition,
  ContentNode,
  ContentPackage,
} from '@chartalk/content-schema'

import {
  compileContentPackage,
  conditionsMayOverlap,
  evaluateProductionRelease,
  isValidConditionPath,
  isValidStableId,
  normalizeRussianText,
  partitionContentPackage,
} from './index'
import { generateBulkFixtureContentPackage } from '@chartalk/test-fixtures'

const fixture = (overrides?: Partial<ContentPackage>): ContentPackage => ({
  manifest: {
    packId: 'pack.fixture',
    locale: 'ru-RU',
    schemaVersion: 1,
    contentVersion: '1.0.0',
    buildId: 'fixture-build-1',
    minEngineVersion: '1.0.0',
    maxEngineVersion: '1.x',
    createdAt: '2026-08-13T00:00:00.000Z',
    checksum: 'sha256:fixture',
    signature: 'ed25519:fixture',
  },
  characters: [
    {
      characterId: 'char.ira',
      name: 'Ира',
      ageLabel: '27 лет',
      isAdult: true,
      hook: 'Ушла из редакции и не говорит почему.',
      description: 'Современная камерная драма.',
      genres: ['драма'],
      dynamics: ['доверие'],
      portraitAssetId: 'portrait.ira',
      accent: 'ember',
    },
  ],
  stories: [
    {
      storyId: 'story.ira',
      characterId: 'char.ira',
      title: 'После дедлайна',
      premise: 'Один поздний разговор меняет планы на осень.',
      status: 'complete',
      rating: '16+',
      durationMinutes: 15,
      warningIds: [],
      episodeIds: ['episode.ira.1'],
    },
  ],
  episodes: [
    {
      episodeId: 'episode.ira.1',
      storyId: 'story.ira',
      title: 'Свет в редакции',
      ordinal: 1,
      entryNodeId: 'decision.1',
      downloadBytes: 1024,
      isBundled: true,
      checkpointIds: [],
    },
  ],
  nodes: [
    {
      nodeId: 'decision.1',
      type: 'decision',
      sceneId: 'scene.1',
      onEnterEffects: [],
      messageVariants: [
        {
          variantId: 'variant.1',
          priority: 0,
          when: { op: 'all', args: [] },
          messages: [
            {
              messageId: 'message.1',
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
                key: `memory.choice.${slot}`,
                value: true,
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
    },
    ...[1, 2, 3, 4].map((slot): ContentNode => ({
      nodeId: `reaction.${slot}`,
      type: 'reaction' as const,
      sceneId: 'scene.1',
      messages: [
        {
          messageId: `reaction.message.${slot}`,
          speakerId: 'char.ira',
          text: `Реакция ${slot}`,
          delayMs: 0,
          kind: 'message' as const,
        },
      ],
      nextNodeId: `ending.${slot}`,
      effects: [],
      editorial: {
        writerId: 'fixture.writer',
        voiceEditorId: 'fixture.editor',
        continuityEditorId: 'fixture.continuity',
        status: 'fixture',
        voiceCardVersion: 'voice.1',
        warningProfileId: null,
      },
    })),
    ...[1, 2, 3, 4].map((slot): ContentNode => ({
      nodeId: `ending.${slot}`,
      type: 'ending' as const,
      sceneId: 'scene.1',
      endingId: `ending.outcome.${slot}`,
      title: `Финал ${slot}`,
      messages: [],
      epilogueFacts: [],
      editorial: {
        writerId: 'fixture.writer',
        voiceEditorId: 'fixture.editor',
        continuityEditorId: 'fixture.continuity',
        status: 'fixture',
        voiceCardVersion: 'voice.1',
        warningProfileId: null,
      },
    })),
  ],
  warnings: [],
  assets: [
    {
      assetId: 'portrait.ira',
      kind: 'portrait',
      path: 'portraits/ira.webp',
      checksum: 'sha256:portrait',
      width: 1024,
      height: 1024,
      altText: 'Иллюстрированный портрет Иры.',
      provenance: 'generated-fixture',
    },
  ],
  ...overrides,
})

const validFixture = (): ContentPackage =>
  generateBulkFixtureContentPackage({ storyCount: 1, stageCount: 50 })

describe('compileContentPackage', () => {
  it('blocks a story that can reach an ending before fifty choice points', () => {
    const report = compileContentPackage(fixture())

    expect(report.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'STORY_TOO_SHORT',
          path: 'story.ira',
        }),
      ]),
    )
  })

  it('accepts a fifty-choice package and reports fixture counts', () => {
    const report = compileContentPackage(validFixture())

    expect(report.blockers).toEqual([])
    expect(report.counts.decisionNodeCount).toBe(50)
    expect(report.counts.choiceCandidateCount).toBe(200)
    expect(report.counts.uniqueDecisionCharacterTextCount).toBeGreaterThan(0)
    expect(report.counts.approvedTextUnitCount).toBe(0)
    expect(report.counts.fixtureTextUnitCount).toBeGreaterThan(0)
    expect(report.analysis.nodeTypeCounts).toEqual({
      decision: 50,
      reaction: 200,
      bridge: 0,
      checkpoint: 0,
      ending: 4,
    })
    expect(report.analysis.baselineExactlyFourDecisionCount).toBe(50)
    expect(report.analysis.decisionWithCompleteFallbackCount).toBe(50)
    expect(report.analysis.staticReachabilityBasisPoints).toBe(10_000)
    expect(report.analysis.writtenNeverReadPaths).toEqual([])
    expect(report.analysis.packageSourceBytes).toBeGreaterThan(0)
  })

  it('indexes history-aware conditions and every structured effect write', () => {
    const pack = structuredClone(validFixture())
    const speakerId = pack.characters[0]?.characterId
    if (!speakerId) throw new Error('fixture changed')
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.messageVariants.unshift({
      variantId: 'variant.memory-aware',
      priority: 30,
      when: { op: 'hasMemory', key: 'memory.choice.1', value: true },
      messages: [
        {
          messageId: 'message.memory-aware',
          speakerId,
          text: 'Я помню твой ответ.',
          delayMs: 0,
          kind: 'message',
        },
      ],
    })
    decision.messageVariants.unshift({
      variantId: 'variant.seen-aware',
      priority: 29,
      when: { op: 'seen', nodeId: 'node.seen-marker' },
      messages: [
        {
          messageId: 'message.seen-aware',
          speakerId,
          text: 'Я вижу, что мы уже были здесь.',
          delayMs: 0,
          kind: 'message',
        },
      ],
    })
    decision.messageVariants.unshift({
      variantId: 'variant.history-aware',
      priority: 28,
      when: {
        op: 'all',
        args: [
          { op: 'chosen', choiceId: 'choice.first' },
          { op: 'withinLastTurns', choiceId: 'choice.first', turns: 3 },
        ],
      },
      messages: [
        {
          messageId: 'message.history-aware',
          speakerId,
          text: 'Я помню, что это было недавно.',
          delayMs: 0,
          kind: 'message',
        },
      ],
    })
    decision.choiceSlots[0]!.candidates[0]!.effects.push(
      {
        effectId: 'effect.add-memory',
        op: 'addMemory',
        key: 'memory.extra',
        value: 'да',
      },
      {
        effectId: 'effect.remove-memory',
        op: 'removeMemory',
        key: 'memory.extra',
      },
      {
        effectId: 'effect.add-promise',
        op: 'addPromise',
        promiseId: 'promise.editorial',
      },
      {
        effectId: 'effect.resolve-promise',
        op: 'resolvePromise',
        promiseId: 'promise.editorial',
        outcome: 'kept',
      },
      {
        effectId: 'effect.advance-arc',
        op: 'advanceArc',
        arcId: 'arc.ira',
        phase: 'trust',
      },
      {
        effectId: 'effect.cooldown',
        op: 'startCooldown',
        cooldownId: 'cooldown.ira',
        turns: 2,
      },
    )

    const report = compileContentPackage(pack)

    expect(report.blockers).toEqual([])
    expect(report.analysis.readStatePaths).toContain('memories.memory.choice.1')
    expect(report.analysis.readStatePaths).toContain(
      'seenNodes.node.seen-marker',
    )
    expect(report.analysis.readStatePaths).toContain(
      'choiceHistory.choice.first',
    )
    expect(report.analysis.writtenStatePaths).toEqual(
      expect.arrayContaining([
        'memories.memory.extra',
        'promises.promise.editorial',
        'arcState.arc.ira.phase',
        'cooldowns.cooldown.ira',
      ]),
    )
  })

  it('blocks dangling references', () => {
    const pack = fixture()
    const broken = structuredClone(pack)
    const decision = broken.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[0]!.candidates[0]!.nextNodeId = 'node.missing'

    const report = compileContentPackage(broken)

    expect(report.blockers.map(item => item.code)).toContain(
      'DANGLING_REFERENCE',
    )
  })

  it('blocks duplicate visible reactions and duplicate next outcomes', () => {
    const pack = fixture()
    const broken = structuredClone(pack)
    const secondReaction = broken.nodes.find(
      node => node.nodeId === 'reaction.2',
    )
    if (secondReaction?.type !== 'reaction') throw new Error('fixture changed')
    secondReaction.messages[0]!.text = 'Реакция 1'
    secondReaction.nextNodeId = 'ending.1'

    const report = compileContentPackage(broken)

    expect(report.blockers.map(item => item.code)).toContain(
      'DUPLICATE_REACTION_SIGNATURE',
    )
    expect(report.blockers.map(item => item.code)).toContain(
      'DUPLICATE_NEXT_OUTCOME_SIGNATURE',
    )
  })

  it('blocks choices without choice-specific state effects', () => {
    const pack = fixture()
    const broken = structuredClone(pack)
    const decision = broken.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[3]!.candidates[0]!.effects = []

    const report = compileContentPackage(broken)

    expect(report.blockers.map(item => item.code)).toContain(
      'MISSING_SPECIFIC_MEMORY',
    )
  })

  it('blocks decision variants and slots without an unconditional fallback', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.messageVariants[0]!.when = { op: 'never' }
    decision.choiceSlots[0]!.candidates[0]!.when = { op: 'never' }

    const report = compileContentPackage(pack)

    expect(
      report.blockers.filter(item => item.code === 'FALLBACK_MISSING'),
    ).toHaveLength(2)
  })

  it('blocks candidates that can overlap at the same priority', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    const original = decision.choiceSlots[0]!.candidates[0]!
    decision.choiceSlots[0]!.candidates.push({
      ...structuredClone(original),
      choiceId: 'choice.1.overlap',
      effects: [
        {
          effectId: 'effect.1.overlap',
          op: 'setMemory',
          key: 'memory.choice.1.overlap',
          value: true,
        },
      ],
    })

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'AMBIGUOUS_PRIORITY',
    )
  })

  it('blocks duplicate visible choice text in the resolved set', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[1]!.candidates[0]!.text =
      decision.choiceSlots[0]!.candidates[0]!.text

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'DUPLICATE_CHOICE_SIGNATURE',
    )
  })

  it('blocks choices that produce the same resulting state', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[1]!.candidates[0]!.effects = structuredClone(
      decision.choiceSlots[0]!.candidates[0]!.effects,
    ).map(effect => ({ ...effect, effectId: `${effect.effectId}.duplicate` }))

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'DUPLICATE_STATE_SIGNATURE',
    )
  })

  it('blocks unsafe effect paths before publication', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.onEnterEffects.push({
      effectId: 'effect.unsafe',
      op: 'set',
      path: 'profile.nickname',
      value: 'leak',
    })

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain('INVALID_EFFECT')
  })

  it('blocks unsafe condition reads and non-ASCII stable IDs', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[0]!.candidates[0]!.choiceId = 'выбор.1'
    decision.messageVariants.push({
      variantId: 'variant.unsafe-condition',
      priority: 100,
      when: { op: 'eq', path: 'profile.nickname', value: 'Ира' },
      messages: [
        {
          messageId: 'message.unsafe-condition',
          speakerId: 'char.ira',
          text: 'Это условие не должно читать профиль.',
          delayMs: 0,
          kind: 'message',
        },
      ],
    })

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'INVALID_CONTENT_REFERENCE',
    )
    expect(report.blockers.map(item => item.code)).toContain(
      'INVALID_STABLE_ID',
    )
  })

  it('blocks approved choice writes with no reachable downstream reader', () => {
    const pack = fixture()
    for (const node of pack.nodes) node.editorial.status = 'approved'

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'MISSING_MEMORY_PAYOFF',
    )
  })

  it('blocks unknown narrative speakers', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.messageVariants[0]!.messages[0]!.speakerId = 'char.missing'

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'INVALID_CONTENT_REFERENCE',
    )
  })

  it('blocks relationship penalties on authored safe routes', () => {
    const pack = fixture()
    pack.stories[0]!.warningIds = ['warning.unsafe']
    pack.warnings = [
      {
        warningId: 'warning.unsafe',
        category: 'psychological-pressure',
        severity: 'high',
        summary: 'Напряжённый разговор.',
        detail: 'Сцену можно безопасно пропустить.',
        sceneId: 'scene.1',
        safeRoute: {
          summary: 'Разговор пропущен без штрафа.',
          effects: [
            {
              effectId: 'effect.safe-route.penalty',
              op: 'increment',
              path: 'relationships.char.ira.trust',
              by: -1,
              min: -100,
              max: 100,
            },
          ],
          nextNodeId: 'ending.1',
        },
      },
    ]

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'UNSAFE_SAFE_ROUTE',
    )
  })

  it('blocks unbounded automatic cycles', () => {
    const pack = fixture()
    const reaction = pack.nodes.find(node => node.nodeId === 'reaction.1')
    if (reaction?.type !== 'reaction') throw new Error('fixture changed')
    reaction.nextNodeId = reaction.nodeId

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain('AUTOMATIC_CYCLE')
  })

  it('blocks unmarked generated assets from production approval', () => {
    const pack = fixture()
    const broken = structuredClone(pack)
    const asset = broken.assets[0]
    if (!asset) throw new Error('fixture changed')
    asset.provenance = 'unknown'

    const report = compileContentPackage(broken)

    expect(report.blockers.map(item => item.code)).toContain(
      'ASSET_PROVENANCE_MISSING',
    )
  })

  it('blocks unsafe media paths and unresolved image messages', () => {
    const pack = fixture()
    const asset = pack.assets[0]!
    asset.path = '../portrait.png'
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.messageVariants[0]!.messages[0] = {
      ...decision.messageVariants[0]!.messages[0]!,
      kind: 'image',
      assetId: 'missing.asset',
    }

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'UNSAFE_ASSET_PATH',
    )
    expect(report.blockers.map(item => item.code)).toContain(
      'IMAGE_ASSET_INVALID',
    )
  })

  it('blocks a story preview that is missing or is not a cover asset', () => {
    const pack = validFixture()
    pack.stories[0]!.previewAssetId = 'portrait.ira'

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'PREVIEW_ASSET_MISSING',
    )
  })

  it('blocks unsupported or incomplete authored placeholders', () => {
    const pack = fixture()
    const decision = pack.nodes[0]
    if (decision?.type !== 'decision') throw new Error('fixture changed')
    decision.choiceSlots[0]!.candidates[0]!.text =
      '{{form:готов||готово}} {{unknown}}'

    const report = compileContentPackage(pack)

    expect(report.blockers.map(item => item.code)).toContain(
      'UNSUPPORTED_PLACEHOLDER',
    )
  })

  it('keeps a valid development fixture behind the production release gate', () => {
    const source = validFixture()
    const { report, gate } = evaluateProductionRelease(source)

    expect(report.blockers).toEqual([])
    expect(gate).toMatchObject({
      eligible: false,
      nonApprovedNodes: source.nodes.length,
      fixtureAssets: 4,
      approvedTextUnits: 0,
      requiredApprovedTextUnits: 300_000,
      decisionNodes: 50,
      requiredDecisionNodes: 60_000,
      uniqueDecisionCharacterTexts:
        report.counts.uniqueDecisionCharacterTextCount,
      requiredUniqueDecisionCharacterTexts: 60_000,
      uniquePlayerChoiceTexts: report.counts.uniquePlayerChoiceTextCount,
      requiredUniquePlayerChoiceTexts: 240_000,
      characters: 1,
      requiredCharacters: 12,
      completedArcs: 1,
      requiredCompletedArcs: 3,
      minimumEndingsPerCharacter: 4,
      requiredEndingsPerCharacter: 5,
      adultOnlyStories: 0,
      allowedAdultOnlyStories: 0,
      signingKeyId: null,
    })
  })

  it('counts approved text units uniquely after Russian normalization', () => {
    const pack = fixture()
    for (const node of pack.nodes) node.editorial.status = 'approved'
    const ending = pack.nodes.find(node => node.type === 'ending')
    if (ending?.type !== 'ending') throw new Error('fixture changed')
    ending.epilogueFacts = ['Ещё.', 'Еще']

    const report = compileContentPackage(pack)

    expect(report.counts.approvedTextUnitCount).toBe(
      report.counts.uniquePublishedTextUnitCount,
    )
  })

  it('treats scheduled and published content as release-approved', () => {
    const baseline = compileContentPackage(fixture())
    for (const status of ['scheduled', 'published'] as const) {
      const pack = structuredClone(fixture())
      for (const node of pack.nodes) node.editorial.status = status

      const report = compileContentPackage(pack)
      const { gate } = evaluateProductionRelease(pack)

      expect(report.counts.approvedTextUnitCount).toBe(
        baseline.counts.uniquePublishedTextUnitCount,
      )
      expect(gate.nonApprovedNodes).toBe(0)
    }
  })

  it('computes per-character ending coverage from an indexed catalog', () => {
    const pack = generateBulkFixtureContentPackage({
      storyCount: 16,
      stageCount: 50,
    })
    const { report, gate } = evaluateProductionRelease(pack)

    expect(report.blockers).toEqual([])
    expect(gate.characters).toBe(16)
    expect(gate.minimumEndingsPerCharacter).toBe(4)
    expect(gate.decisionNodes).toBe(800)
    expect(gate.uniqueDecisionCharacterTexts).toBe(4_000)
  })

  it('partitions a catalog into deterministic story shards with exact local graphs', () => {
    const source = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })
    const shards = partitionContentPackage(source, { maxStoriesPerShard: 3 })
    const repeated = partitionContentPackage(source, {
      maxStoriesPerShard: 3,
    })

    expect(shards).toHaveLength(3)
    expect(JSON.stringify(shards)).toBe(JSON.stringify(repeated))
    expect(shards.flatMap(shard => shard.stories)).toHaveLength(8)
    expect(
      new Set(shards.flatMap(shard => shard.nodes.map(node => node.nodeId)))
        .size,
    ).toBe(source.nodes.length)
    expect(shards.every(shard => shard.stories.length <= 3)).toBe(true)
    expect(
      shards.every(shard => shard.manifest.checksum.startsWith('sha256:')),
    ).toBe(true)
    expect(
      shards.every(shard => shard.manifest.signature.startsWith('ed25519:')),
    ).toBe(true)
    expect(shards[0]?.manifest.packId).toContain('.shard.001')
    expect(
      shards.every(shard => {
        const assetIds = new Set(shard.assets.map(asset => asset.assetId))
        return shard.stories.every(
          story =>
            story.previewAssetId !== undefined &&
            assetIds.has(story.previewAssetId),
        )
      }),
    ).toBe(true)
  })
})

describe('normalizeRussianText', () => {
  it('normalizes insignificant differences for duplicate detection', () => {
    expect(normalizeRussianText('  Всё-таки…  ')).toBe(
      normalizeRussianText('всё-таки...'),
    )
    expect(normalizeRussianText('Ещё')).toBe(normalizeRussianText('еще'))
    expect(normalizeRussianText('Ещё! ✨')).toBe(normalizeRussianText('еще'))
  })
})

describe('condition overlap proof', () => {
  const compare = (
    op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte',
    value: string | number | boolean | null,
  ): Condition => ({ op, path: 'counters.score', value })

  it('proves unconditional, impossible, and unknown boolean shapes safely', () => {
    expect(conditionsMayOverlap({ op: 'always' }, { op: 'never' })).toBe(false)
    expect(
      conditionsMayOverlap(
        { op: 'any', args: [compare('eq', 1), compare('eq', 2)] },
        { op: 'always' },
      ),
    ).toBe(true)
    expect(
      conditionsMayOverlap(
        {
          op: 'not',
          arg: { op: 'any', args: [compare('eq', 1)] },
        },
        { op: 'always' },
      ),
    ).toBe(true)
    expect(
      conditionsMayOverlap(
        { op: 'all', args: [{ op: 'never' }] },
        { op: 'always' },
      ),
    ).toBe(false)
  })

  it.each([
    [{ op: 'not', arg: compare('eq', 5) }, compare('eq', 5)],
    [{ op: 'not', arg: compare('neq', 5) }, compare('neq', 5)],
    [{ op: 'not', arg: compare('gt', 5) }, compare('gt', 5)],
    [{ op: 'not', arg: compare('gte', 5) }, compare('gte', 5)],
    [{ op: 'not', arg: compare('lt', 5) }, compare('lt', 5)],
    [{ op: 'not', arg: compare('lte', 5) }, compare('lte', 5)],
  ] satisfies [Condition, Condition][])(
    'inverts comparison %j',
    (left, right) => {
      expect(conditionsMayOverlap(left, right)).toBe(false)
    },
  )

  it('handles existence, equality, inequality, and distinct paths', () => {
    expect(
      conditionsMayOverlap(
        { op: 'exists', path: 'memories.answer' },
        {
          op: 'not',
          arg: { op: 'exists', path: 'memories.answer' },
        },
      ),
    ).toBe(false)
    expect(conditionsMayOverlap(compare('eq', 'a'), compare('eq', 'b'))).toBe(
      false,
    )
    expect(
      conditionsMayOverlap(compare('eq', true), compare('neq', true)),
    ).toBe(false)
    expect(
      conditionsMayOverlap(compare('eq', 1), {
        op: 'eq',
        path: 'counters.other',
        value: 2,
      }),
    ).toBe(true)
  })

  it('proves non-overlap for memory-presence predicates and stays conservative for history', () => {
    expect(
      conditionsMayOverlap(
        { op: 'hasMemory', key: 'memories.answer' },
        { op: 'not', arg: { op: 'hasMemory', key: 'memories.answer' } },
      ),
    ).toBe(false)
    expect(
      conditionsMayOverlap(
        { op: 'hasMemory', key: 'memories.answer', value: 'да' },
        { op: 'hasMemory', key: 'memories.answer', value: 'нет' },
      ),
    ).toBe(false)
    expect(
      conditionsMayOverlap(
        { op: 'chosen', choiceId: 'choice.a' },
        { op: 'not', arg: { op: 'chosen', choiceId: 'choice.a' } },
      ),
    ).toBe(true)
  })

  it.each([
    [compare('eq', 5), compare('gt', 5), false],
    [compare('eq', 5), compare('gte', 6), false],
    [compare('eq', 5), compare('lt', 5), false],
    [compare('eq', 5), compare('lte', 4), false],
    [compare('eq', 5), compare('gte', 5), true],
    [compare('eq', 5), compare('lte', 5), true],
  ] satisfies [Condition, Condition, boolean][])(
    'checks numeric equality against a range',
    (left, right, expected) => {
      expect(conditionsMayOverlap(left, right)).toBe(expected)
    },
  )

  it.each([
    [compare('gt', 5), compare('lt', 5), false],
    [compare('gte', 5), compare('lt', 5), false],
    [compare('gt', 5), compare('lte', 5), false],
    [compare('gte', 5), compare('lte', 5), true],
    [compare('gt', 1), compare('lt', 10), true],
  ] satisfies [Condition, Condition, boolean][])(
    'checks range intersections',
    (left, right, expected) => {
      expect(conditionsMayOverlap(left, right)).toBe(expected)
    },
  )

  it('keeps the strongest lower and upper bounds in conjunctions', () => {
    expect(
      conditionsMayOverlap(
        {
          op: 'all',
          args: [compare('gt', 1), compare('gte', 3), compare('gt', 3)],
        },
        {
          op: 'all',
          args: [compare('lt', 9), compare('lte', 7), compare('lt', 7)],
        },
      ),
    ).toBe(true)
  })
})

describe('compiler identifier and state-path guards', () => {
  it.each([
    ['story.ira', true],
    ['prod-2026:q3', true],
    ['выбор.ira', false],
    ['bad id', false],
    ['', false],
  ])('validates stable ID %j', (id, expected) => {
    expect(isValidStableId(id)).toBe(expected)
  })

  it.each([
    ['memories.answer', true],
    ['counters.intent.support', true],
    ['relationships.char.ira.trust', true],
    ['characterState.char.ira.phase', true],
    ['arcState.arc.ira.phase', true],
    ['promises', true],
    ['', false],
    ['profile.nickname', false],
    ['memories', false],
    ['relationships.char', false],
    ['memories..answer', false],
    ['memories.__proto__', false],
    ['memories.bad$value', false],
  ])('validates condition path %j', (path, expected) => {
    expect(isValidConditionPath(path)).toBe(expected)
  })
})
