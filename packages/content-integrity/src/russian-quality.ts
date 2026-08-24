import type {
  ContentPackage,
  ContentNode,
  NarrativeMessage,
} from '@chartalk/content-schema'

export type RussianQualityIssueCode =
  | 'UNNATURAL_SLASH_FORM'
  | 'GENERIC_THERAPY_FORMULA'
  | 'FORCED_INTERNET_SLANG'
  | 'LITERAL_TRANSLATION'
  | 'UNNATURAL_CASE_CONSTRUCTION'
  | 'REPEATED_PUNCTUATION'
  | 'DUPLICATE_TEXT_UNIT'

export interface RussianQualityIssue {
  code: RussianQualityIssueCode
  severity: 'blocker' | 'warning'
  path: string
  message: string
  text: string
}

export interface RussianQualityReport {
  textUnitCount: number
  issueCount: number
  blockingIssueCount: number
  warningIssueCount: number
  issues: RussianQualityIssue[]
}

type TextUnit = {
  path: string
  text: string
  intentionalRepeatId?: string
}

const riskPhrases: ReadonlyArray<{
  code:
    | 'GENERIC_THERAPY_FORMULA'
    | 'FORCED_INTERNET_SLANG'
    | 'LITERAL_TRANSLATION'
    | 'UNNATURAL_CASE_CONSTRUCTION'
  pattern: RegExp
  message: string
}> = [
  {
    code: 'GENERIC_THERAPY_FORMULA',
    pattern: /(?<!\p{L})я понимаю твои чувства(?!\p{L})/iu,
    message:
      'Проверьте общую психологизирующую формулу: замените её конкретной реакцией персонажа.',
  },
  {
    code: 'GENERIC_THERAPY_FORMULA',
    pattern: /(?<!\p{L})я всегда буду рядом, что бы ни случилось(?!\p{L})/iu,
    message:
      'Проверьте незаслуженное обещание близости и привяжите поддержку к сцене.',
  },
  {
    code: 'GENERIC_THERAPY_FORMULA',
    pattern: /(?<!\p{L})спасибо, что поделил(?:ся|ась) со мной(?!\p{L})/iu,
    message:
      'Проверьте шаблонную терапевтическую реакцию и замените её конкретной деталью.',
  },
  {
    code: 'GENERIC_THERAPY_FORMULA',
    pattern: /(?<!\p{L})я слышу тебя(?!\p{L})/iu,
    message:
      'Проверьте универсальную формулу эмпатии: персонаж должен сделать что-то конкретное.',
  },
  {
    code: 'GENERIC_THERAPY_FORMULA',
    pattern: /(?<!\p{L})вот это сюжетный поворот(?!\p{L})/iu,
    message:
      'Реплика комментирует сценарий вместо ситуации; проверьте голос персонажа.',
  },
  {
    code: 'GENERIC_THERAPY_FORMULA',
    pattern:
      /(?<!\p{L})(?:я рядом\.\s*попробуем|оставить себе безопасный следующий шаг|граница названа прямо|разговор можно продолжить без давления|не оставаться с ним одной|оставим вопрос открытым и попробуем)(?!\p{L})/iu,
    message:
      'Проверьте безличную формулу поддержки или границы: замените её конкретным действием, договорённостью или деталью сцены.',
  },
  {
    code: 'FORCED_INTERNET_SLANG',
    pattern: /(?<!\p{L})(?:краш|вайб|жиза|рил|буквально я)(?!\p{L})/iu,
    message:
      'Проверьте, есть ли у сленга возрастная и социальная причина в voice bible.',
  },
  {
    code: 'LITERAL_TRANSLATION',
    pattern:
      /(?<!\p{L})(?:держать пространство|я ценю это|давай проверим, где мы стоим|это имеет смысл)(?!\p{L})/iu,
    message:
      'Проверьте буквальную кальку с английского: назовите конкретное действие, факт или отношение персонажа.',
  },
  {
    code: 'UNNATURAL_CASE_CONSTRUCTION',
    pattern:
      /(?<!\p{L})(?:разобраться|разберёмся|разобрались)\s+с\s+(?:первой детали|сроков|источника|риска|обещания|границы|союзника|следующего шага|старой записи|разговора|маршрута|тишины|письма|доказательства|свидетеля|выхода|последней версии|своего времени|чужой просьбы|плана)(?!\p{L})/iu,
    message:
      'Проверьте управление падежом: после «разобраться с» нужна форма творительного падежа.',
  },
  {
    code: 'UNNATURAL_CASE_CONSTRUCTION',
    pattern:
      /(?<!\p{L})сверил(?:а|и)?\s+(?:первой детали|сроках|источнике|риске|обещании|границе|союзнике|следующего шага|старой записи|разговоре|маршруте|тишине|письме|доказательстве|свидетеле|выходе|последней версии|своём времени|чужой просьбе|плане)(?!\p{L})/iu,
    message:
      'Проверьте управление после «сверить»: назовите проверяемый предмет в винительном падеже, например «проверила первую деталь».',
  },
  {
    code: 'UNNATURAL_CASE_CONSTRUCTION',
    pattern:
      /(?<!\p{L})(?:о|об)\s+(?:сроков|риска|обещания|границы|союзника|следующего шага|разговора|маршрута|тишины|письма|доказательства|свидетеля|выхода|своего времени|чужой просьбы|плана)(?!\p{L})/iu,
    message:
      'Проверьте форму после «о/об»: нужен предложный падеж, а не родительный.',
  },
  {
    code: 'UNNATURAL_CASE_CONSTRUCTION',
    pattern:
      /(?<!\p{L})начнём\s+с\s+(?:первую деталь|сроки|источник|риск|обещание|границу|союзника|следующий шаг|старую запись|разговор|маршрут|тишину|письмо|доказательство|свидетеля|выход|последнюю версию|своё время|чужую просьбу|план|утро|разговор начистоту|помощь|паузу)(?!\p{L})/iu,
    message:
      'Проверьте форму после «начнём с»: нужен родительный падеж или явное слово «проверки».',
  },
]

const textUnitsForMessage = (
  path: string,
  message: NarrativeMessage,
): TextUnit => ({
  path,
  text: message.text,
  ...(message.intentionalRepeatId
    ? { intentionalRepeatId: message.intentionalRepeatId }
    : {}),
})

const textUnitsForNode = (nodeIndex: number, node: ContentNode): TextUnit[] => {
  const path = `nodes.${nodeIndex}`
  if (node.type === 'decision') {
    return [
      ...node.messageVariants.flatMap((variant, variantIndex) =>
        variant.messages.map((message, messageIndex) =>
          textUnitsForMessage(
            `${path}.messageVariants.${variantIndex}.messages.${messageIndex}.text`,
            message,
          ),
        ),
      ),
      ...node.choiceSlots.flatMap((slot, slotIndex) =>
        slot.candidates.map((candidate, candidateIndex) => ({
          path: `${path}.choiceSlots.${slotIndex}.candidates.${candidateIndex}.text`,
          text: candidate.text,
          ...(candidate.intentionalRepeatId
            ? { intentionalRepeatId: candidate.intentionalRepeatId }
            : {}),
        })),
      ),
    ]
  }

  if (
    node.type === 'reaction' ||
    node.type === 'bridge' ||
    node.type === 'ending'
  ) {
    const messages = node.messages.map((message, messageIndex) =>
      textUnitsForMessage(`${path}.messages.${messageIndex}.text`, message),
    )
    if (node.type === 'ending') {
      return [
        ...messages,
        { path: `${path}.title`, text: node.title },
        ...node.epilogueFacts.map((text, factIndex) => ({
          path: `${path}.epilogueFacts.${factIndex}`,
          text,
        })),
      ]
    }
    return messages
  }

  if (node.type === 'checkpoint') {
    return [
      { path: `${path}.label`, text: node.label },
      ...node.recapFacts.map((text, factIndex) => ({
        path: `${path}.recapFacts.${factIndex}`,
        text,
      })),
    ]
  }

  return []
}

const textUnitsForContent = (content: ContentPackage): TextUnit[] => [
  ...content.characters.flatMap((character, index) => [
    { path: `characters.${index}.hook`, text: character.hook },
    { path: `characters.${index}.description`, text: character.description },
  ]),
  ...content.stories.flatMap((story, index) => [
    { path: `stories.${index}.title`, text: story.title },
    { path: `stories.${index}.premise`, text: story.premise },
  ]),
  ...content.episodes.map((episode, index) => ({
    path: `episodes.${index}.title`,
    text: episode.title,
  })),
  ...content.nodes.flatMap((node, index) => textUnitsForNode(index, node)),
  ...content.warnings.flatMap((warning, index) => [
    { path: `warnings.${index}.summary`, text: warning.summary },
    { path: `warnings.${index}.detail`, text: warning.detail },
    {
      path: `warnings.${index}.safeRoute.summary`,
      text: warning.safeRoute.summary,
    },
  ]),
]

const normalizeDuplicate = (text: string): string =>
  text
    .toLocaleLowerCase('ru-RU')
    .replace(/\{\{.*?\}\}/g, '{{token}}')
    .replace(/[«»"'.,!?;:—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export function inspectRussianText(
  text: string,
  path: string,
): RussianQualityIssue[] {
  const issues: RussianQualityIssue[] = []
  const add = (
    code: RussianQualityIssueCode,
    severity: RussianQualityIssue['severity'],
    message: string,
  ) => issues.push({ code, severity, path, message, text })

  if (/\p{L}+\s*\/\s*\p{L}+/u.test(text)) {
    add(
      'UNNATURAL_SLASH_FORM',
      'blocker',
      'Slash-форма рода запрещена в опубликованной русской реплике; используйте безопасную нейтральную конструкцию или авторскую форму.',
    )
  }
  for (const risk of riskPhrases) {
    if (risk.pattern.test(text)) add(risk.code, 'warning', risk.message)
  }
  if (/(?:!|\?){2,}/u.test(text)) {
    add(
      'REPEATED_PUNCTUATION',
      'warning',
      'Повторная !/?-пунктуация требует проверки ритма и голоса персонажа.',
    )
  }
  return issues
}

export function auditRussianQuality(
  content: ContentPackage,
): RussianQualityReport {
  const units = textUnitsForContent(content)
  const issues = units.flatMap(unit => inspectRussianText(unit.text, unit.path))
  const duplicateGroups = new Map<string, TextUnit[]>()
  for (const unit of units) {
    const normalized = normalizeDuplicate(unit.text)
    if (!normalized) continue
    const group = duplicateGroups.get(normalized) ?? []
    group.push(unit)
    duplicateGroups.set(normalized, group)
  }
  for (const group of duplicateGroups.values()) {
    const unannotated = group.filter(unit => !unit.intentionalRepeatId)
    if (unannotated.length < 2) continue
    const first = unannotated[0]!
    issues.push({
      code: 'DUPLICATE_TEXT_UNIT',
      severity: 'warning',
      path: first.path,
      text: first.text,
      message: `Одинаковая текстовая единица повторяется ${unannotated.length} раз; подтвердите intentional repeat или перепишите контекст.`,
    })
  }
  return {
    textUnitCount: units.length,
    issueCount: issues.length,
    blockingIssueCount: issues.filter(issue => issue.severity === 'blocker')
      .length,
    warningIssueCount: issues.filter(issue => issue.severity === 'warning')
      .length,
    issues,
  }
}
