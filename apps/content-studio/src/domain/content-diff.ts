import type { ContentNode, ContentPackage } from '@razvilka/content-schema'

import { collectAnnotatedTextUnits } from './text-preview'

export interface TextDiffEntry {
  path: string
  unitId: string
  nodeId: string
  before: string | null
  after: string | null
}

export interface LogicDiffEntry {
  path: string
  nodeId: string
  before: string | null
  after: string | null
}

export interface ContentDiff {
  text: TextDiffEntry[]
  logic: LogicDiffEntry[]
}

const json = (value: unknown): string => JSON.stringify(value)

const textPath = (node: ContentNode, unitId: string): string =>
  node.type === 'decision'
    ? node.messageVariants.some(variant =>
        variant.messages.some(message => message.messageId === unitId),
      )
      ? `nodes.${node.nodeId}.message.${unitId}.text`
      : `nodes.${node.nodeId}.choice.${unitId}.text`
    : node.type === 'checkpoint'
      ? unitId === node.nodeId
        ? `nodes.${node.nodeId}.label`
        : `nodes.${node.nodeId}.recapFacts.${unitId.split(':fact:')[1] ?? '?'}`
      : node.type === 'ending' && unitId === `${node.nodeId}:title`
        ? `nodes.${node.nodeId}.title`
        : node.type === 'ending' && unitId.includes(':fact:')
          ? `nodes.${node.nodeId}.epilogueFacts.${unitId.split(':fact:')[1] ?? '?'}`
          : `nodes.${node.nodeId}.message.${unitId}.text`

const textDiff = (
  before: ContentPackage,
  after: ContentPackage,
): TextDiffEntry[] => {
  const beforeUnits = new Map(
    collectAnnotatedTextUnits(before).map(unit => [unit.unitId, unit]),
  )
  const afterUnits = new Map(
    collectAnnotatedTextUnits(after).map(unit => [unit.unitId, unit]),
  )
  const ids = new Set([...beforeUnits.keys(), ...afterUnits.keys()])
  const changes: TextDiffEntry[] = []
  for (const unitId of ids) {
    const left = beforeUnits.get(unitId)
    const right = afterUnits.get(unitId)
    if (left?.text === right?.text) continue
    const nodeId = right?.nodeId ?? left?.nodeId ?? ''
    const node =
      after.nodes.find(item => item.nodeId === nodeId) ??
      before.nodes.find(item => item.nodeId === nodeId)
    if (!node) continue
    changes.push({
      path: textPath(node, unitId),
      unitId,
      nodeId,
      before: left?.text ?? null,
      after: right?.text ?? null,
    })
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path))
}

const logicSignature = (node: ContentNode): unknown => {
  if (node.type === 'decision') {
    return {
      type: node.type,
      sceneId: node.sceneId,
      onEnterEffects: node.onEnterEffects,
      checkpointPolicy: node.checkpointPolicy,
      variants: node.messageVariants.map(variant => ({
        variantId: variant.variantId,
        priority: variant.priority,
        when: variant.when,
        messages: variant.messages.map(message => ({
          messageId: message.messageId,
          speakerId: message.speakerId,
          delayMs: message.delayMs,
          kind: message.kind,
          assetId: message.assetId,
        })),
      })),
      choices: node.choiceSlots.map(slot => ({
        slot: slot.slot,
        candidates: slot.candidates.map(candidate => ({
          choiceId: candidate.choiceId,
          intent: candidate.intent,
          priority: candidate.priority,
          when: candidate.when,
          effects: candidate.effects,
          nextNodeId: candidate.nextNodeId,
        })),
      })),
    }
  }
  if (node.type === 'checkpoint') {
    return {
      type: node.type,
      sceneId: node.sceneId,
      checkpointId: node.checkpointId,
      nextNodeId: node.nextNodeId,
    }
  }
  if (node.type === 'ending') {
    return {
      type: node.type,
      sceneId: node.sceneId,
      endingId: node.endingId,
      epilogueFacts: node.epilogueFacts,
    }
  }
  return {
    type: node.type,
    sceneId: node.sceneId,
    nextNodeId: node.nextNodeId,
    effects: node.effects,
    messages: node.messages.map(message => ({
      messageId: message.messageId,
      speakerId: message.speakerId,
      delayMs: message.delayMs,
      kind: message.kind,
      assetId: message.assetId,
    })),
  }
}

const logicDiff = (
  before: ContentPackage,
  after: ContentPackage,
): LogicDiffEntry[] => {
  const beforeNodes = new Map(before.nodes.map(node => [node.nodeId, node]))
  const afterNodes = new Map(after.nodes.map(node => [node.nodeId, node]))
  const ids = new Set([...beforeNodes.keys(), ...afterNodes.keys()])
  const changes: LogicDiffEntry[] = []
  for (const nodeId of ids) {
    const left = beforeNodes.get(nodeId)
    const right = afterNodes.get(nodeId)
    const beforeValue = left ? json(logicSignature(left)) : null
    const afterValue = right ? json(logicSignature(right)) : null
    if (beforeValue === afterValue) continue
    changes.push({
      path: `nodes.${nodeId}.logic`,
      nodeId,
      before: beforeValue,
      after: afterValue,
    })
  }
  return changes.sort((a, b) => a.path.localeCompare(b.path))
}

export function diffContentPackages(
  before: ContentPackage,
  after: ContentPackage,
): ContentDiff {
  return {
    text: textDiff(before, after),
    logic: logicDiff(before, after),
  }
}
