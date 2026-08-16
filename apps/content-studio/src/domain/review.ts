import type {
  Condition,
  ContentNode,
  ContentPackage,
  Effect,
} from '@chartalk/content-schema'

import { collectAnnotatedTextUnits } from './text-preview'

export interface CounterfactualRow {
  slot: 1 | 2 | 3 | 4
  choiceId: string
  text: string
  intent: string
  effectPaths: string[]
  reactionNodeId: string | null
  reactionText: string
  destinationId: string | null
  destinationType: ContentNode['type'] | null
  downstreamEffectPaths: string[]
  downstreamReads: string[]
}

export interface GraphReference {
  sourceNodeId: string
  targetNodeId: string
  kind: 'choice' | 'next'
  label: string
}

export interface NodeReferences {
  inbound: GraphReference[]
  outbound: GraphReference[]
}

export interface OverusedNgram {
  phrase: string
  count: number
  nodeIds: string[]
  intentionalRepeatIds: string[]
  unmarkedNodeIds: string[]
}

const nodeText = (node: ContentNode | undefined): string => {
  if (!node) return ''
  if (node.type === 'decision')
    return node.messageVariants[0]?.messages[0]?.text ?? ''
  if (node.type === 'checkpoint') return node.label
  if (node.type === 'ending') return node.messages[0]?.text ?? node.title
  return node.messages[0]?.text ?? ''
}

const effectPath = (effect: Effect): string => {
  switch (effect.op) {
    case 'setMemory':
    case 'addMemory':
    case 'removeMemory':
      return `memories.${effect.key}`
    case 'addPromise':
    case 'resolvePromise':
      return `promises.${effect.promiseId}`
    case 'advanceArc':
      return `arcState.${effect.arcId}.phase`
    case 'startCooldown':
      return `cooldowns.${effect.cooldownId}`
    case 'increment':
    case 'set':
    case 'addToSet':
      return effect.path
  }
}

const effectsForNode = (node: ContentNode | undefined): Effect[] => {
  if (!node) return []
  if (node.type === 'decision') return node.onEnterEffects
  if (node.type === 'reaction' || node.type === 'bridge') return node.effects
  return []
}

const conditionPaths = (condition: Condition): string[] => {
  if (condition.op === 'all' || condition.op === 'any')
    return condition.args.flatMap(conditionPaths)
  if (condition.op === 'not') return conditionPaths(condition.arg)
  if (condition.op === 'hasMemory') return [`memories.${condition.key}`]
  if (condition.op === 'seen') return [`seenNodes.${condition.nodeId}`]
  if (condition.op === 'chosen' || condition.op === 'withinLastTurns')
    return [`choiceHistory.${condition.choiceId}`]
  return 'path' in condition ? [condition.path] : []
}

const readRules = (content: ContentPackage): Map<string, string[]> => {
  const rules = new Map<string, string[]>()
  const add = (path: string, rule: string) => {
    const values = rules.get(path) ?? []
    if (!values.includes(rule)) values.push(rule)
    rules.set(path, values)
  }
  for (const node of content.nodes) {
    if (node.type !== 'decision') continue
    for (const variant of node.messageVariants) {
      for (const path of conditionPaths(variant.when))
        add(path, `${node.nodeId} · ${variant.variantId}`)
    }
    for (const slot of node.choiceSlots) {
      for (const candidate of slot.candidates) {
        for (const path of conditionPaths(candidate.when))
          add(path, `${node.nodeId} · ${candidate.choiceId}`)
      }
    }
  }
  return rules
}

export function counterfactualRows(
  content: ContentPackage,
  decisionId: string,
): CounterfactualRow[] {
  const node = content.nodes.find(candidate => candidate.nodeId === decisionId)
  if (!node || node.type !== 'decision') return []
  const rules = readRules(content)
  return node.choiceSlots.flatMap(slot => {
    const candidate = slot.candidates[0]
    if (!candidate) return []
    const reaction = content.nodes.find(
      next => next.nodeId === candidate.nextNodeId,
    )
    const destination =
      reaction && 'nextNodeId' in reaction
        ? content.nodes.find(next => next.nodeId === reaction.nextNodeId)
        : reaction?.type === 'ending'
          ? reaction
          : undefined
    const effectPaths = candidate.effects.map(effectPath)
    const downstreamEffectPaths = [
      ...effectsForNode(reaction),
      ...effectsForNode(destination),
    ].map(effectPath)
    const downstreamReads = [
      ...new Set(
        [...effectPaths, ...downstreamEffectPaths].flatMap(
          path => rules.get(path) ?? [],
        ),
      ),
    ].sort()
    return [
      {
        slot: slot.slot,
        choiceId: candidate.choiceId,
        text: candidate.text,
        intent: candidate.intent,
        effectPaths,
        reactionNodeId: reaction?.nodeId ?? null,
        reactionText: nodeText(reaction),
        destinationId: destination?.nodeId ?? null,
        destinationType: destination?.type ?? null,
        downstreamEffectPaths,
        downstreamReads,
      },
    ]
  })
}

const referencesForNode = (node: ContentNode): GraphReference[] => {
  if (node.type === 'decision')
    return node.choiceSlots.flatMap(slot =>
      slot.candidates.map(candidate => ({
        sourceNodeId: node.nodeId,
        targetNodeId: candidate.nextNodeId,
        kind: 'choice' as const,
        label: `Вариант ${slot.slot}`,
      })),
    )
  if (
    node.type === 'reaction' ||
    node.type === 'bridge' ||
    node.type === 'checkpoint'
  ) {
    return [
      {
        sourceNodeId: node.nodeId,
        targetNodeId: node.nextNodeId,
        kind: 'next',
        label: 'Далее',
      },
    ]
  }
  return []
}

export function nodeReferences(
  content: ContentPackage,
  nodeId: string,
): NodeReferences {
  const all = content.nodes.flatMap(referencesForNode)
  return {
    inbound: all.filter(reference => reference.targetNodeId === nodeId),
    outbound: all.filter(reference => reference.sourceNodeId === nodeId),
  }
}

const tokenize = (text: string): string[] =>
  text
    .normalize('NFC')
    .toLocaleLowerCase('ru-RU')
    .replace(/[«»„“”"'—–,.;:!?()[\]{}<>/\\]/g, ' ')
    .split(/\s+/u)
    .map(token => token.trim())
    .filter(Boolean)

const stopWords = new Set([
  'а',
  'без',
  'бы',
  'в',
  'во',
  'вы',
  'да',
  'для',
  'до',
  'за',
  'и',
  'из',
  'или',
  'к',
  'как',
  'не',
  'но',
  'о',
  'об',
  'от',
  'по',
  'при',
  'с',
  'со',
  'так',
  'то',
  'у',
  'что',
  'это',
  'я',
])

export function findOverusedNgrams(
  content: ContentPackage,
  options: { n?: number; minCount?: number; limit?: number } = {},
): OverusedNgram[] {
  const n = options.n ?? 3
  const minCount = options.minCount ?? 2
  const limit = options.limit ?? 20
  if (n < 1 || minCount < 2 || limit < 1) return []
  const counts = new Map<
    string,
    {
      count: number
      nodeIds: Set<string>
      intentionalRepeatIds: Set<string>
      unmarkedNodeIds: Set<string>
    }
  >()
  for (const unit of collectAnnotatedTextUnits(content)) {
    const tokens = tokenize(unit.text)
    if (tokens.length < n) continue
    const seen = new Set<string>()
    for (let index = 0; index <= tokens.length - n; index += 1) {
      const phraseTokens = tokens.slice(index, index + n)
      if (phraseTokens.every(token => stopWords.has(token))) continue
      const phrase = phraseTokens.join(' ')
      if (seen.has(phrase)) continue
      seen.add(phrase)
      const entry = counts.get(phrase) ?? {
        count: 0,
        nodeIds: new Set(),
        intentionalRepeatIds: new Set(),
        unmarkedNodeIds: new Set(),
      }
      entry.count += 1
      entry.nodeIds.add(unit.nodeId)
      if (unit.intentionalRepeatId)
        entry.intentionalRepeatIds.add(unit.intentionalRepeatId)
      else entry.unmarkedNodeIds.add(unit.nodeId)
      counts.set(phrase, entry)
    }
  }
  return [...counts.entries()]
    .filter(([, entry]) => entry.count >= minCount)
    .map(([phrase, entry]) => ({
      phrase,
      count: entry.count,
      nodeIds: [...entry.nodeIds].sort(),
      intentionalRepeatIds: [...entry.intentionalRepeatIds].sort(),
      unmarkedNodeIds: [...entry.unmarkedNodeIds].sort(),
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.phrase.localeCompare(right.phrase, 'ru-RU'),
    )
    .slice(0, limit)
}
