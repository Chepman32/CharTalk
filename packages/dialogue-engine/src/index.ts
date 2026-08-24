import { bytesToHex } from '@noble/hashes/utils.js'
import { sha256 } from '@noble/hashes/sha2.js'

import type {
  ChoiceCandidate,
  ChoiceEvent,
  Condition,
  ContentNode,
  DecisionNode,
  Effect,
  NarrativeMessage,
  NarrativeState,
  Scalar,
} from '@razvilka/content-schema'

const FORBIDDEN_PATH_SEGMENTS = new Set([
  '__proto__',
  'prototype',
  'constructor',
])

export type DialogueEngineErrorCode =
  | 'CHOICE_NOT_AVAILABLE'
  | 'CONTENT_BUILD_MISMATCH'
  | 'CONTENT_FATAL'
  | 'NODE_MISMATCH'
  | 'SEQUENCE_CONFLICT'

export class DialogueEngineError extends Error {
  constructor(
    readonly code: DialogueEngineErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'DialogueEngineError'
  }
}

export interface ResolvedChoice extends ChoiceCandidate {
  slot: 1 | 2 | 3 | 4
}

export interface ResolvedDecision {
  nodeId: string
  messages: NarrativeMessage[]
  choices: [ResolvedChoice, ResolvedChoice, ResolvedChoice, ResolvedChoice]
}

export interface OutgoingMessage {
  entryId: string
  speakerId: 'player'
  text: string
  choiceId: string
}

export interface ApplyChoiceRequest {
  operationId: string
  runId: string
  expectedSequence: number
  expectedNodeId: string
  contentBuildId: string
  choiceId: string
  state: NarrativeState
  node: DecisionNode
  nodes: ReadonlyMap<string, ContentNode>
  committedAt?: string
}

export interface ApplyChoiceResult {
  eventId: string
  newSequence: number
  outgoing: OutgoingMessage
  reaction: NarrativeMessage[]
  nextNodeId: string
  resultingStateHash: string
  state: NarrativeState
  event: ChoiceEvent
}

function safeSegments(path: string): string[] | null {
  const segments = path.split('.').filter(Boolean)
  if (
    segments.length === 0 ||
    segments.some(segment => FORBIDDEN_PATH_SEGMENTS.has(segment))
  ) {
    return null
  }
  return segments
}

function getPath(source: unknown, path: string): unknown {
  const segments = safeSegments(path)
  if (!segments) return undefined

  if (typeof source !== 'object' || source === null) return undefined
  const root = source as Record<string, unknown>
  const namespace = segments[0]
  if (!namespace || !Object.prototype.hasOwnProperty.call(root, namespace))
    return undefined

  const namespaceValue = root[namespace]
  const remainder = segments.slice(1)
  if (namespace === 'promises' && remainder.length > 0) {
    const promiseId = remainder.join('.')
    const statuses = root.promiseStates
    if (typeof statuses === 'object' && statuses !== null) {
      const status = (statuses as Record<string, unknown>)[promiseId]
      if (status !== undefined) return status
    }
    return Array.isArray(namespaceValue) && namespaceValue.includes(promiseId)
      ? 'open'
      : undefined
  }
  if (namespace === 'choiceHistory' && remainder.length > 0) {
    const choiceId = remainder.join('.')
    return Array.isArray(namespaceValue) && namespaceValue.includes(choiceId)
      ? true
      : undefined
  }
  if (typeof namespaceValue !== 'object' || namespaceValue === null)
    return undefined
  const namespaceRecord = namespaceValue as Record<string, unknown>

  if (
    [
      'memories',
      'counters',
      'cooldowns',
      'seenNodes',
      'promiseStates',
    ].includes(namespace)
  ) {
    return namespaceRecord[remainder.join('.')]
  }

  if (['relationships', 'characterState', 'arcState'].includes(namespace)) {
    if (remainder.length < 2) return undefined
    const ownerId = remainder.slice(0, -1).join('.')
    const field = remainder.at(-1)
    const owner = namespaceRecord[ownerId]
    if (typeof owner !== 'object' || owner === null || !field) return undefined
    return (owner as Record<string, unknown>)[field]
  }

  let cursor: unknown = namespaceValue
  for (const segment of remainder) {
    if (typeof cursor !== 'object' || cursor === null) return undefined
    if (!Object.prototype.hasOwnProperty.call(cursor, segment)) return undefined
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return cursor
}

function compare(left: unknown, right: Scalar, op: Condition['op']): boolean {
  switch (op) {
    case 'eq':
      return left === right
    case 'neq':
      return left !== right
    case 'gt':
      return (
        typeof left === 'number' && typeof right === 'number' && left > right
      )
    case 'gte':
      return (
        typeof left === 'number' && typeof right === 'number' && left >= right
      )
    case 'lt':
      return (
        typeof left === 'number' && typeof right === 'number' && left < right
      )
    case 'lte':
      return (
        typeof left === 'number' && typeof right === 'number' && left <= right
      )
    default:
      return false
  }
}

export function evaluateCondition(
  condition: Condition,
  state: NarrativeState,
): boolean {
  switch (condition.op) {
    case 'all':
      return condition.args.every(item => evaluateCondition(item, state))
    case 'any':
      return condition.args.some(item => evaluateCondition(item, state))
    case 'not':
      return !evaluateCondition(condition.arg, state)
    case 'hasMemory': {
      const current = state.memories?.[condition.key]
      return (
        current !== undefined &&
        (condition.value === undefined || current === condition.value)
      )
    }
    case 'chosen':
      return state.choiceHistory?.includes(condition.choiceId) ?? false
    case 'seen':
      return state.seenNodes?.[condition.nodeId] === true
    case 'withinLastTurns': {
      const history = state.choiceHistory ?? []
      return history.slice(-condition.turns).includes(condition.choiceId)
    }
    case 'exists':
      return getPath(state, condition.path) !== undefined
    case 'always':
      return true
    case 'never':
      return false
    case 'eq':
    case 'neq':
    case 'gt':
    case 'gte':
    case 'lt':
    case 'lte':
      return compare(
        getPath(state, condition.path),
        condition.value,
        condition.op,
      )
  }
}

function selectVariant<T extends { priority: number; when: Condition }>(
  variants: readonly T[],
  state: NarrativeState,
): T | undefined {
  return [...variants]
    .sort((left, right) => right.priority - left.priority)
    .find(variant => evaluateCondition(variant.when, state))
}

export function resolveDecision(
  node: DecisionNode,
  state: NarrativeState,
): ResolvedDecision {
  const messageVariant = selectVariant(node.messageVariants, state)
  if (!messageVariant) {
    throw new DialogueEngineError(
      'CONTENT_FATAL',
      `No message variant resolved at ${node.nodeId}`,
    )
  }

  const choices = node.choiceSlots.map(slot => {
    const candidate = selectVariant(slot.candidates, state)
    if (!candidate) {
      throw new DialogueEngineError(
        'CONTENT_FATAL',
        `Choice slot ${slot.slot} did not resolve at ${node.nodeId}`,
      )
    }
    return { ...candidate, slot: slot.slot }
  })

  if (choices.length !== 4) {
    throw new DialogueEngineError(
      'CONTENT_FATAL',
      `Decision ${node.nodeId} resolved ${choices.length} choices instead of four`,
    )
  }

  return {
    nodeId: node.nodeId,
    messages: messageVariant.messages,
    choices: choices as ResolvedDecision['choices'],
  }
}

function cloneState(state: NarrativeState): NarrativeState {
  return structuredClone(state)
}

function setPath(
  target: Record<string, unknown>,
  path: string,
  value: Scalar | string[],
): boolean {
  const segments = safeSegments(path)
  if (!segments) return false

  const namespace = segments[0]
  if (!namespace) return false

  if (['memories', 'counters', 'cooldowns', 'seenNodes'].includes(namespace)) {
    const key = segments.slice(1).join('.')
    if (!key) return false
    const current = target[namespace]
    if (
      typeof current !== 'object' ||
      current === null ||
      Array.isArray(current)
    ) {
      target[namespace] = Object.create(null) as Record<string, unknown>
    }
    ;(target[namespace] as Record<string, unknown>)[key] = value
    return true
  }

  if (['relationships', 'characterState', 'arcState'].includes(namespace)) {
    if (segments.length < 3) return false
    const ownerId = segments.slice(1, -1).join('.')
    const field = segments.at(-1)
    if (!field) return false
    const current = target[namespace]
    if (
      typeof current !== 'object' ||
      current === null ||
      Array.isArray(current)
    ) {
      target[namespace] = Object.create(null) as Record<string, unknown>
    }
    const namespaceRecord = target[namespace] as Record<string, unknown>
    const owner = namespaceRecord[ownerId]
    if (typeof owner !== 'object' || owner === null || Array.isArray(owner)) {
      namespaceRecord[ownerId] = Object.create(null) as Record<string, unknown>
    }
    ;(namespaceRecord[ownerId] as Record<string, unknown>)[field] = value
    return true
  }

  if (namespace === 'promises' && segments.length === 1) {
    target.promises = value
    return true
  }

  return false
}

export function applyEffects(
  state: NarrativeState,
  effects: readonly Effect[],
): NarrativeState {
  const next = cloneState(state)
  for (const effect of effects) {
    if (effect.op === 'setMemory' || effect.op === 'addMemory') {
      next.memories = { ...next.memories, [effect.key]: effect.value }
      continue
    }

    if (effect.op === 'removeMemory') {
      const memories = { ...next.memories }
      delete memories[effect.key]
      next.memories = memories
      continue
    }

    if (effect.op === 'addPromise') {
      const promises = Array.isArray(next.promises)
        ? next.promises.filter(
            (value): value is string => typeof value === 'string',
          )
        : []
      next.promises = promises.includes(effect.promiseId)
        ? promises
        : [...promises, effect.promiseId]
      next.promiseStates = {
        ...(next.promiseStates ?? {}),
        [effect.promiseId]: 'open',
      }
      continue
    }

    if (effect.op === 'resolvePromise') {
      const promises = Array.isArray(next.promises) ? next.promises : []
      if (!promises.includes(effect.promiseId)) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Cannot resolve missing promise: ${effect.promiseId}`,
        )
      }
      next.promiseStates = {
        ...(next.promiseStates ?? {}),
        [effect.promiseId]: effect.outcome,
      }
      continue
    }

    if (effect.op === 'advanceArc') {
      if (
        !setPath(
          next as unknown as Record<string, unknown>,
          `arcState.${effect.arcId}.phase`,
          effect.phase,
        )
      ) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Unsafe arc effect: ${effect.arcId}`,
        )
      }
      continue
    }

    if (effect.op === 'startCooldown') {
      if (
        !setPath(
          next as unknown as Record<string, unknown>,
          `cooldowns.${effect.cooldownId}`,
          effect.turns,
        )
      ) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Unsafe cooldown effect: ${effect.cooldownId}`,
        )
      }
      continue
    }

    if (effect.op === 'increment') {
      if (
        ![
          'relationships',
          'characterState',
          'arcState',
          'counters',
          'cooldowns',
        ].includes(effect.path.split('.')[0] ?? '')
      ) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Unsafe effect path: ${effect.path}`,
        )
      }
      const current = getPath(next, effect.path)
      const numeric = typeof current === 'number' ? current : 0
      const updated = Math.min(
        effect.max,
        Math.max(effect.min, numeric + effect.by),
      )
      if (
        !setPath(
          next as unknown as Record<string, unknown>,
          effect.path,
          updated,
        )
      ) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Unsafe effect path: ${effect.path}`,
        )
      }
      continue
    }

    if (effect.op === 'set') {
      if (
        ![
          'relationships',
          'characterState',
          'arcState',
          'memories',
          'counters',
          'cooldowns',
          'seenNodes',
        ].includes(effect.path.split('.')[0] ?? '')
      ) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Unsafe effect path: ${effect.path}`,
        )
      }
      if (
        !setPath(
          next as unknown as Record<string, unknown>,
          effect.path,
          effect.value,
        )
      ) {
        throw new DialogueEngineError(
          'CONTENT_FATAL',
          `Unsafe effect path: ${effect.path}`,
        )
      }
      continue
    }

    if (effect.path !== 'promises') {
      throw new DialogueEngineError(
        'CONTENT_FATAL',
        `Unsafe effect path: ${effect.path}`,
      )
    }
    const existing = getPath(next, effect.path)
    const values = Array.isArray(existing)
      ? existing.filter((value): value is string => typeof value === 'string')
      : []
    const updated = values.includes(effect.value)
      ? values
      : [...values, effect.value]
    setPath(next as unknown as Record<string, unknown>, effect.path, updated)
  }
  return next
}

export function enterDecision(
  node: DecisionNode,
  state: NarrativeState,
): NarrativeState {
  return applyEffects(state, node.onEnterEffects)
}

function canonicalize(value: unknown): string {
  if (
    value === null ||
    typeof value === 'boolean' ||
    typeof value === 'string'
  ) {
    return JSON.stringify(value)
  }
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new DialogueEngineError(
        'CONTENT_FATAL',
        'Canonical state only supports safe integers',
      )
    }
    return String(value)
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => canonicalize(item)).join(',')}]`
  }
  if (typeof value === 'object' && value !== null) {
    return `{${Object.entries(value)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => `${JSON.stringify(key)}:${canonicalize(item)}`)
      .join(',')}}`
  }
  throw new DialogueEngineError(
    'CONTENT_FATAL',
    'Unsupported value in canonical state',
  )
}

export function canonicalHash(value: unknown): string {
  const encoded = new TextEncoder().encode(canonicalize(value))
  return `sha256:${bytesToHex(sha256(encoded))}`
}

interface AdvanceResult {
  reaction: NarrativeMessage[]
  nextNodeId: string
  state: NarrativeState
}

function advanceFromNode(
  startNodeId: string,
  state: NarrativeState,
  nodes: ReadonlyMap<string, ContentNode>,
): AdvanceResult {
  let cursor = startNodeId
  let nextState = state
  const messages: NarrativeMessage[] = []
  const visited = new Set<string>()

  while (true) {
    if (visited.has(cursor)) {
      throw new DialogueEngineError(
        'CONTENT_FATAL',
        `Unbounded automatic loop at ${cursor}`,
      )
    }
    visited.add(cursor)

    const node = nodes.get(cursor)
    if (!node) {
      throw new DialogueEngineError('CONTENT_FATAL', `Missing node ${cursor}`)
    }

    if (node.type === 'decision') {
      return {
        reaction: messages,
        nextNodeId: node.nodeId,
        state: enterDecision(node, nextState),
      }
    }
    if (node.type === 'ending') {
      return { reaction: messages, nextNodeId: node.nodeId, state: nextState }
    }

    if (node.type === 'checkpoint') {
      cursor = node.nextNodeId
      continue
    }

    messages.push(...node.messages)
    nextState = applyEffects(nextState, node.effects ?? [])
    cursor = node.nextNodeId
  }
}

export function applyChoice(request: ApplyChoiceRequest): ApplyChoiceResult {
  if (request.node.nodeId !== request.expectedNodeId) {
    throw new DialogueEngineError(
      'NODE_MISMATCH',
      'Active node changed before commit',
    )
  }
  if (request.expectedSequence < 0) {
    throw new DialogueEngineError(
      'SEQUENCE_CONFLICT',
      'Expected sequence is invalid',
    )
  }

  const resolved = resolveDecision(request.node, request.state)
  const choice = resolved.choices.find(
    item => item.choiceId === request.choiceId,
  )
  if (!choice) {
    throw new DialogueEngineError(
      'CHOICE_NOT_AVAILABLE',
      'Choice is not in the resolved set',
    )
  }

  const beforeStateHash = canonicalHash({
    contentBuildId: request.contentBuildId,
    state: request.state,
  })
  const stateAfterChoice = applyEffects(request.state, choice.effects)
  const advanced = advanceFromNode(
    choice.nextNodeId,
    stateAfterChoice,
    request.nodes,
  )
  const state = {
    ...advanced.state,
    seenNodes: {
      ...advanced.state.seenNodes,
      [request.node.nodeId]: true,
      [choice.nextNodeId]: true,
    },
    choiceHistory: [
      ...(advanced.state.choiceHistory ?? request.state.choiceHistory ?? []),
      choice.choiceId,
    ],
  }
  const resultingStateHash = canonicalHash({
    contentBuildId: request.contentBuildId,
    state,
  })
  const newSequence = request.expectedSequence + 1
  const eventId = `${request.runId}:${request.operationId}`
  const committedAt = request.committedAt ?? '1970-01-01T00:00:00.000Z'
  const event: ChoiceEvent = {
    eventId,
    operationId: request.operationId,
    runId: request.runId,
    sequence: newSequence,
    nodeId: request.node.nodeId,
    choiceId: choice.choiceId,
    contentBuildId: request.contentBuildId,
    frozenEffects: choice.effects,
    beforeStateHash,
    afterStateHash: resultingStateHash,
    committedAt,
  }

  return {
    eventId,
    newSequence,
    outgoing: {
      entryId: `${eventId}:outgoing`,
      speakerId: 'player',
      text: choice.text,
      choiceId: choice.choiceId,
    },
    reaction: advanced.reaction,
    nextNodeId: advanced.nextNodeId,
    resultingStateHash,
    state,
    event,
  }
}

export interface ReplayRequest {
  initialState: NarrativeState
  entryNodeId: string
  contentBuildId: string
  nodes: ReadonlyMap<string, ContentNode>
  events: readonly ChoiceEvent[]
}

export interface ReplayResult {
  state: NarrativeState
  stateHash: string
  activeNodeId: string
  sequence: number
  events: ChoiceEvent[]
}

export function replayEvents(request: ReplayRequest): ReplayResult {
  let state = cloneState(request.initialState)
  let activeNodeId = request.entryNodeId
  const entryNode = request.nodes.get(activeNodeId)
  if (entryNode?.type === 'decision') state = enterDecision(entryNode, state)
  let sequence = 0
  const resultsByOperation = new Set<string>()
  const applied: ChoiceEvent[] = []

  for (const event of request.events) {
    if (resultsByOperation.has(event.operationId)) continue
    if (event.contentBuildId !== request.contentBuildId) {
      throw new DialogueEngineError(
        'CONTENT_BUILD_MISMATCH',
        `Event ${event.eventId} belongs to another content build`,
      )
    }
    const node = request.nodes.get(activeNodeId)
    if (node?.type !== 'decision') {
      throw new DialogueEngineError(
        'NODE_MISMATCH',
        `Expected decision at ${activeNodeId}`,
      )
    }
    if (event.sequence !== sequence + 1 || event.nodeId !== activeNodeId) {
      throw new DialogueEngineError(
        'SEQUENCE_CONFLICT',
        `Invalid event sequence at ${event.eventId}`,
      )
    }

    const result = applyChoice({
      operationId: event.operationId,
      runId: event.runId,
      expectedSequence: sequence,
      expectedNodeId: activeNodeId,
      contentBuildId: request.contentBuildId,
      choiceId: event.choiceId,
      state,
      node,
      nodes: request.nodes,
      committedAt: event.committedAt,
    })
    if (
      result.event.beforeStateHash !== event.beforeStateHash ||
      JSON.stringify(result.event.frozenEffects) !==
        JSON.stringify(event.frozenEffects)
    ) {
      throw new DialogueEngineError(
        'CONTENT_BUILD_MISMATCH',
        `Authored event mismatch at ${event.eventId}`,
      )
    }
    if (result.resultingStateHash !== event.afterStateHash) {
      throw new DialogueEngineError(
        'CONTENT_BUILD_MISMATCH',
        `State hash mismatch at ${event.eventId}`,
      )
    }

    state = result.state
    activeNodeId = result.nextNodeId
    sequence = result.newSequence
    resultsByOperation.add(event.operationId)
    applied.push(event)
  }

  return {
    state,
    stateHash: canonicalHash({ contentBuildId: request.contentBuildId, state }),
    activeNodeId,
    sequence,
    events: applied,
  }
}
