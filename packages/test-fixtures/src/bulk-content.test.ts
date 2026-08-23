import { describe, expect, it } from 'vitest'

import { compileContentPackage } from '@chartalk/content-compiler'
import { auditRussianQuality } from '@chartalk/content-integrity'

import {
  BULK_FIXTURE_DEFAULTS,
  BULK_FIXTURE_SCALE_DEFAULTS,
  generateBulkFixtureContentPackage,
} from './bulk-content'

describe('bulk fixture content generator', () => {
  it('creates a deterministic, schema-valid corpus with four authored choices', () => {
    const first = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })
    const second = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    expect(first.characters).toHaveLength(8)
    expect(first.stories).toHaveLength(8)
    expect(first.episodes).toHaveLength(8)
    expect(new Set(first.nodes.map(node => node.nodeId)).size).toBe(
      first.nodes.length,
    )
    expect(
      first.nodes
        .filter(node => node.type === 'decision')
        .every(node => node.choiceSlots.length === 4),
    ).toBe(true)

    const report = compileContentPackage(first)
    expect(report.blockers).toEqual([])
    expect(report.counts.decisionNodeCount).toBeGreaterThan(100)
    expect(report.counts.choiceCandidateCount).toBeGreaterThan(400)
    expect(report.counts.approvedTextUnitCount).toBe(0)
    expect(report.counts.fixtureTextUnitCount).toBeGreaterThan(500)
  })

  it('ships the requested hundreds-of-stories and tens-of-thousands-of-nodes fixture scale', () => {
    const bulk = generateBulkFixtureContentPackage()
    const decisionCount = bulk.nodes.filter(
      node => node.type === 'decision',
    ).length
    const choiceCount = bulk.nodes
      .filter(node => node.type === 'decision')
      .reduce(
        (total, node) =>
          total +
          node.choiceSlots.reduce(
            (sum, slot) => sum + slot.candidates.length,
            0,
          ),
        0,
      )

    expect(BULK_FIXTURE_DEFAULTS.storyCount).toBeGreaterThanOrEqual(200)
    expect(bulk.stories).toHaveLength(BULK_FIXTURE_DEFAULTS.storyCount)
    expect(decisionCount).toBeGreaterThanOrEqual(5_000)
    expect(bulk.nodes.length).toBeGreaterThanOrEqual(20_000)
    expect(choiceCount).toBeGreaterThanOrEqual(20_000)
    expect(bulk.manifest.packId).toBe('pack.ru.bulk.fixture')
    expect(bulk.episodes.every(episode => episode.isBundled)).toBe(true)
    expect(
      bulk.episodes.every(episode =>
        bulk.stories.some(story => story.storyId === episode.storyId),
      ),
    ).toBe(true)
    const assetIds = new Set(bulk.assets.map(asset => asset.assetId))
    expect(
      bulk.characters.every(character =>
        assetIds.has(character.portraitAssetId),
      ),
    ).toBe(true)
    expect(bulk.nodes.every(node => node.editorial.status === 'fixture')).toBe(
      true,
    )
  })

  it('documents the structural scale candidate separately from bundled content', () => {
    const decisionsPerStory = BULK_FIXTURE_SCALE_DEFAULTS.stageCount

    expect(
      BULK_FIXTURE_SCALE_DEFAULTS.storyCount * decisionsPerStory,
    ).toBeGreaterThanOrEqual(60_000)
    expect(BULK_FIXTURE_SCALE_DEFAULTS.storyCount).toBeGreaterThan(
      BULK_FIXTURE_DEFAULTS.storyCount,
    )
  })

  it('keeps generated Russian prompts grammatically safe across contexts', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 240,
      stageCount: 50,
    })
    const texts = content.nodes
      .filter(node => node.type === 'decision')
      .flatMap(node =>
        node.messageVariants.flatMap(variant =>
          variant.messages.map(message => message.text),
        ),
      )

    expect(texts.some(text => /поступить с границу/i.test(text))).toBe(false)
    expect(texts.some(text => /выводов про границу/i.test(text))).toBe(false)
    expect(texts.some(text => /разберёмся с /i.test(text))).toBe(false)
    expect(texts.some(text => /события вокруг /i.test(text))).toBe(false)
    expect(texts.every(text => !text.includes('{context}'))).toBe(true)
    expect(texts.every(text => !text.includes(': давай'))).toBe(true)
    expect(texts.every(text => !text.includes(': пазл'))).toBe(true)
  })

  it('does not repeat generated text across a fifty-choice story', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 1,
      stageCount: 50,
    })

    const duplicateIssues = auditRussianQuality(content).issues.filter(
      issue => issue.code === 'DUPLICATE_TEXT_UNIT',
    )

    expect(duplicateIssues).toEqual([])
  })

  it('keeps generated choices conversational instead of label-like', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })
    const decisions = content.nodes.filter(node => node.type === 'decision')
    const choices = decisions.flatMap(node =>
      node.choiceSlots.map(slot => slot.candidates[0]!.text),
    )
    const reactions = content.nodes
      .filter(node => node.type === 'reaction')
      .flatMap(node => node.messages.map(message => message.text))

    expect(choices.every(text => !/граница ясна:\s*границ/i.test(text))).toBe(
      true,
    )
    expect(
      choices.every(
        text => !/сверим факты по (первую|последнюю|следующий)/i.test(text),
      ),
    ).toBe(true)
    expect(
      choices.every(
        text => !/\bс (первая|обещание|граница|союзник)\b/i.test(text),
      ),
    ).toBe(true)
    expect(
      choices.some(text => /не (будем )?(рубить|рубим) с плеча/i.test(text)),
    ).toBe(true)
    expect(reactions.every(text => !/выбрано —/i.test(text))).toBe(true)
    expect(reactions.every(text => !/держим в фокусе/i.test(text))).toBe(true)
    expect(
      reactions.every(text => !/в голосе становится спокойнее/i.test(text)),
    ).toBe(true)
    expect(
      reactions.some(text => /спасибо, что не отмахиваешься/i.test(text)),
    ).toBe(true)
    expect(
      [...choices, ...reactions].every(
        text =>
          !/\bсверил(?:а|и)?\s+(?:первой детали|сроках|источнике|риске|обещании|границе|союзнике|следующего шага|старой записи|разговоре|маршруте|тишине|письме|доказательстве|свидетеле|выходе|последней версии|своём времени|чужой просьбе|плане)\b/i.test(
            text,
          ),
      ),
    ).toBe(true)
    expect(
      reactions.every(text => !/вокруг (первую|границу)/i.test(text)),
    ).toBe(true)
  })

  it('keeps bulk prose contextual instead of concatenating template fragments', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })
    const decisions = content.nodes.filter(node => node.type === 'decision')
    const decisionTexts = decisions.flatMap(node =>
      node.messageVariants.flatMap(variant =>
        variant.messages.map(message => message.text),
      ),
    )
    const choices = decisions.flatMap(node =>
      node.choiceSlots.map(slot => slot.candidates[0]!.text),
    )
    const reactions = content.nodes
      .filter(node => node.type === 'reaction')
      .flatMap(node => node.messages.map(message => message.text))
    const endings = content.nodes
      .filter(node => node.type === 'ending')
      .flatMap(node => node.messages.map(message => message.text))

    expect(
      decisionTexts.every(
        text =>
          !/Смотри: .*Там есть деталь, которую я не могу отпустить/i.test(text),
      ),
    ).toBe(true)
    expect(
      decisionTexts.every(
        text => !/сверилась с в |На в .* нашлась/i.test(text),
      ),
    ).toBe(true)
    expect(
      choices.every(
        text =>
          !/^(Проверим|Разберёмся с|Рядом\. Проверим|Не рубим с плеча):/i.test(
            text,
          ),
      ),
    ).toBe(true)
    expect(
      choices.some(text =>
        /не (?:будем )?рубить с плеча.*разберём/i.test(text),
      ),
    ).toBe(true)
    expect(
      choices.every(
        text =>
          !/^(Рамки|Место|Точка|Здесь|Там):/i.test(text) &&
          !/:[^.!?]+:/i.test(text),
      ),
    ).toBe(true)
    expect(
      reactions.every(
        text => !/открывает записи .* и отмечает новую зацепку/i.test(text),
      ),
    ).toBe(true)
    expect(
      reactions.every(
        text =>
          !/начнём с (первую|обещание|границу|следующий шаг)/i.test(text) &&
          !/возвращается к в /i.test(text),
      ),
    ).toBe(true)
    expect(reactions.some(text => /«Давай начнём с .*»/i.test(text))).toBe(true)
    expect(endings.every(text => !/В этой истории в /i.test(text))).toBe(true)
  })

  it('keeps the catalogue readable instead of exposing fixture labels as story copy', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 32,
      stageCount: 50,
    })

    const titles = content.stories.map(story => story.title)
    const hooks = content.characters.map(character => character.hook)

    expect(new Set(titles).size).toBe(titles.length)
    expect(titles.every(title => !/\bлиния\s+\d+\b/i.test(title))).toBe(true)
    expect(
      hooks.filter(hook => hook.startsWith('Нашла связь между')).length,
    ).toBeLessThan(hooks.length / 2)
    expect(
      new Set(content.characters.map(character => character.description)).size,
    ).toBeGreaterThan(12)
  })

  it('carries each authored intent into a later decision prompt', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 1,
      stageCount: 50,
    })
    const decisions = content.nodes.filter(node => node.type === 'decision')
    const laterDecision = decisions.find(node =>
      node.nodeId.includes('.decision.01'),
    )

    expect(laterDecision).toBeDefined()
    expect(laterDecision?.messageVariants).toHaveLength(5)
    expect(
      laterDecision?.messageVariants.some(
        variant => variant.when.op === 'hasMemory',
      ),
    ).toBe(true)
    expect(
      laterDecision?.messageVariants.some(variant =>
        variant.messages[0]?.text.includes('После твоего'),
      ),
    ).toBe(true)
    expect(
      decisions[0]?.choiceSlots.every(slot =>
        slot.candidates[0]?.effects.some(
          effect =>
            effect.op === 'setMemory' &&
            effect.key.endsWith('.memory.lastIntent'),
        ),
      ),
    ).toBe(true)
  })

  it('keeps catalog premises and hooks grammatically complete', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 32,
      stageCount: 50,
    })
    const premises = content.stories.map(story => story.premise)
    const hooks = content.characters.map(character => character.hook)

    expect(
      hooks.every(
        text => !/но (?:в|у|на) .+ не сходится с обычной версией/i.test(text),
      ),
    ).toBe(true)
    expect(hooks.every(text => text.length <= 160)).toBe(true)
    expect(
      premises.every(
        text => !/как (?:в|у|на) .+ одна деталь меняет разговор/i.test(text),
      ),
    ).toBe(true)
    expect(
      premises.every(
        text => !/персонаж запомнит не правильный ответ/i.test(text),
      ),
    ).toBe(true)
  })

  it('uses the natural Russian с/со form before instrumental phrases', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })
    const copy = content.nodes.flatMap(node => {
      if (node.type === 'reaction')
        return node.messages.map(message => message.text)
      if (node.type === 'ending') {
        return [
          ...node.messages.map(message => message.text),
          ...(node.epilogueFacts ?? []),
        ]
      }
      return []
    })
    const malformed =
      /с (сроками|следующим шагом|старой записью|свидетелем|своим временем)/i

    expect(copy.some(text => malformed.test(text))).toBe(false)
    expect(
      copy.some(text =>
        /со сроками|со следующим шагом|со старой записью|со свидетелем|со своим временем/i.test(
          text,
        ),
      ),
    ).toBe(true)
  })

  it('does not expose generator IDs in reader-facing Russian copy', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 8,
      stageCount: 50,
    })
    const visibleCopy = [
      ...content.stories.map(story => story.premise),
      ...content.characters.flatMap(character => [
        character.hook,
        character.description,
      ]),
      ...content.nodes.flatMap(node =>
        node.type === 'ending' ? (node.epilogueFacts ?? []) : [],
      ),
    ]

    expect(visibleCopy.some(text => /линия\s+\d+/i.test(text))).toBe(false)
    expect(visibleCopy.some(text => /линии\s+\d+/i.test(text))).toBe(false)
  })
})
