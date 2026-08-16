import type { ContentPackage } from '@chartalk/content-schema'

export type GrammarProfile = 'masculine' | 'feminine' | 'neutral'

export interface GrammarPreviewRow {
  profile: GrammarProfile
  label: string
  text: string
  unresolvedTokens: string[]
}

export interface AnnotatedTextUnit {
  unitId: string
  nodeId: string
  text: string
  intentionalRepeatId: string | null
  intentionalTypo: boolean
  speaker: 'player' | 'character'
}

const profiles: readonly {
  profile: GrammarProfile
  label: string
  formIndex: number
}[] = [
  { profile: 'masculine', label: 'Мужской', formIndex: 0 },
  { profile: 'feminine', label: 'Женский', formIndex: 1 },
  { profile: 'neutral', label: 'Нейтральный', formIndex: 2 },
]

const placeholderPattern = /\{\{[^{}]+\}\}/g
const formPattern = /\{\{form:([^|{}]*)\|([^|{}]*)\|([^|{}]*)\}\}/g

const renderProfile = (
  text: string,
  displayName: string,
  formIndex: number,
): { text: string; unresolvedTokens: string[] } => {
  const rendered = text
    .replaceAll('{{name}}', displayName)
    .replace(
      formPattern,
      (_token: string, masculine: string, feminine: string, neutral: string) =>
        [masculine, feminine, neutral][formIndex] ?? neutral,
    )
  return {
    text: rendered,
    unresolvedTokens: [...new Set(rendered.match(placeholderPattern) ?? [])],
  }
}

export function grammarPreviewRows(
  text: string,
  displayName = 'Читатель',
): GrammarPreviewRow[] {
  return profiles.map(({ profile, label, formIndex }) => ({
    profile,
    label,
    ...renderProfile(text, displayName, formIndex),
  }))
}

export function collectAnnotatedTextUnits(
  content: ContentPackage,
): AnnotatedTextUnit[] {
  return content.nodes.flatMap(node => {
    if (node.type === 'decision') {
      return [
        ...node.messageVariants.flatMap(variant =>
          variant.messages.map(message => ({
            unitId: message.messageId,
            nodeId: node.nodeId,
            text: message.text,
            intentionalRepeatId: message.intentionalRepeatId ?? null,
            intentionalTypo: message.intentionalTypo ?? false,
            speaker: 'character' as const,
          })),
        ),
        ...node.choiceSlots.flatMap(slot =>
          slot.candidates.map(candidate => ({
            unitId: candidate.choiceId,
            nodeId: node.nodeId,
            text: candidate.text,
            intentionalRepeatId: candidate.intentionalRepeatId ?? null,
            intentionalTypo: candidate.intentionalTypo ?? false,
            speaker: 'player' as const,
          })),
        ),
      ]
    }
    if (node.type === 'checkpoint') {
      return [
        {
          unitId: node.nodeId,
          nodeId: node.nodeId,
          text: node.label,
          intentionalRepeatId: null,
          intentionalTypo: false,
          speaker: 'character' as const,
        },
        ...node.recapFacts.map((text, index) => ({
          unitId: `${node.nodeId}:fact:${index}`,
          nodeId: node.nodeId,
          text,
          intentionalRepeatId: null,
          intentionalTypo: false,
          speaker: 'character' as const,
        })),
      ]
    }
    if (node.type === 'ending') {
      return [
        {
          unitId: `${node.nodeId}:title`,
          nodeId: node.nodeId,
          text: node.title,
          intentionalRepeatId: null,
          intentionalTypo: false,
          speaker: 'character' as const,
        },
        ...node.messages.map(message => ({
          unitId: message.messageId,
          nodeId: node.nodeId,
          text: message.text,
          intentionalRepeatId: message.intentionalRepeatId ?? null,
          intentionalTypo: message.intentionalTypo ?? false,
          speaker: 'character' as const,
        })),
        ...node.epilogueFacts.map((text, index) => ({
          unitId: `${node.nodeId}:fact:${index}`,
          nodeId: node.nodeId,
          text,
          intentionalRepeatId: null,
          intentionalTypo: false,
          speaker: 'character' as const,
        })),
      ]
    }
    return node.messages.map(message => ({
      unitId: message.messageId,
      nodeId: node.nodeId,
      text: message.text,
      intentionalRepeatId: message.intentionalRepeatId ?? null,
      intentionalTypo: message.intentionalTypo ?? false,
      speaker: 'character' as const,
    }))
  })
}
