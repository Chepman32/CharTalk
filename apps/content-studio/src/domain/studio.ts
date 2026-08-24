import {
  evaluateProductionRelease,
  type CompilationReport,
  type ProductionReleaseGate,
} from '@razvilka/content-compiler'
import type {
  Condition,
  ContentNode,
  ContentPackage,
  NarrativeState,
} from '@razvilka/content-schema'
import { initialNarrativeState } from '@razvilka/content-schema'
import {
  applyChoice,
  enterDecision,
  resolveDecision,
  type ResolvedChoice,
} from '@razvilka/dialogue-engine'

export type StudioView =
  'overview' | 'content' | 'graph' | 'simulator' | 'review' | 'release'

const publishLoopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export const securePublishBaseUrl = (value: string): string | null => {
  try {
    const endpoint = new URL(value.trim())
    const secure = endpoint.protocol === 'https:'
    const loopback =
      endpoint.protocol === 'http:' &&
      publishLoopbackHosts.has(endpoint.hostname)
    if (
      (!secure && !loopback) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      return null
    }
    return endpoint.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

export interface StudioState {
  content: ContentPackage
  selectedNodeId: string
  query: string
  view: StudioView
  dirty: boolean
  lastSavedAt: string | null
  actorId: string
  editReason: string
  auditLog: StudioAuditEntry[]
}

export type EditorialStatus = ContentNode['editorial']['status']

export type StudioAuditAction =
  | 'edit-message'
  | 'edit-choice'
  | 'annotation-change'
  | 'status-change'
  | 'replace-content'

export type StudioAuditField =
  'message' | 'choice' | 'annotation' | 'status' | 'content'

export interface TextAnnotation {
  intentionalRepeatId?: string | undefined
  intentionalTypo?: boolean | undefined
}

export interface StudioAuditContext {
  auditId?: string
  actorId?: string
  reason?: string
  at?: string
}

export interface StudioAuditEntry {
  auditId: string
  actorId: string
  action: StudioAuditAction
  field: StudioAuditField
  nodeId: string | null
  choiceId?: string
  before: string
  after: string
  reason: string
  at: string
}

export interface StudioStateOptions {
  actorId?: string
  auditLog?: readonly StudioAuditEntry[]
}

export const MAX_AUDIT_ENTRIES = 500

const normalizeActorId = (value: string | undefined): string => {
  const actorId = value?.trim().slice(0, 80)
  return actorId || 'local-editor'
}

const normalizeReason = (value: string | undefined): string => {
  const reason = value?.trim().slice(0, 240)
  return reason || 'Причина не указана'
}

const auditValue = (value: string): string =>
  value.length > 240 ? `${value.slice(0, 237)}…` : value

const editorialTransitions: Record<
  EditorialStatus,
  readonly EditorialStatus[]
> = {
  outline: ['outline', 'graph-ready'],
  'graph-ready': ['graph-ready', 'outline', 'draft'],
  draft: ['draft', 'graph-ready', 'voice-review'],
  'voice-review': ['voice-review', 'draft', 'continuity-review'],
  'continuity-review': [
    'continuity-review',
    'voice-review',
    'rating-review',
    'logic-qa',
  ],
  'rating-review': ['rating-review', 'continuity-review', 'logic-qa'],
  'logic-qa': ['logic-qa', 'continuity-review', 'device-qa'],
  'device-qa': ['device-qa', 'logic-qa', 'approved'],
  // `qa` remains a legacy alias for imported pre-lifecycle drafts.
  qa: ['qa', 'continuity-review', 'device-qa', 'approved'],
  approved: ['approved', 'continuity-review', 'scheduled'],
  scheduled: ['scheduled', 'approved', 'published'],
  published: ['published', 'deprecated'],
  deprecated: ['deprecated'],
  fixture: ['fixture'],
}

export function canTransitionEditorialStatus(
  from: EditorialStatus,
  to: EditorialStatus,
): boolean {
  return editorialTransitions[from]?.includes(to) ?? false
}

export type StudioAction =
  | { type: 'select_node'; nodeId: string }
  | { type: 'set_query'; query: string }
  | { type: 'set_view'; view: StudioView }
  | {
      type: 'edit_message'
      nodeId: string
      text: string
      audit?: StudioAuditContext
    }
  | {
      type: 'edit_choice'
      nodeId: string
      choiceId: string
      text: string
      audit?: StudioAuditContext
    }
  | {
      type: 'set_text_annotation'
      nodeId: string
      unitId: string
      annotation: TextAnnotation
      audit?: StudioAuditContext
    }
  | {
      type: 'set_editorial_status'
      nodeId: string
      status: ContentNode['editorial']['status']
      audit?: StudioAuditContext
    }
  | {
      type: 'replace_content'
      content: ContentPackage
      audit?: StudioAuditContext
    }
  | { type: 'set_actor_id'; actorId: string }
  | { type: 'set_edit_reason'; reason: string }
  | { type: 'mark_saved'; at: string }

const clone = <T>(value: T): T => structuredClone(value)

export function createStudioState(
  content: ContentPackage,
  options: StudioStateOptions = {},
): StudioState {
  return {
    content: clone(content),
    selectedNodeId: content.nodes[0]?.nodeId ?? '',
    query: '',
    view: 'overview',
    dirty: false,
    lastSavedAt: null,
    actorId: normalizeActorId(options.actorId),
    editReason: '',
    auditLog: clone(options.auditLog ?? []).slice(-MAX_AUDIT_ENTRIES),
  }
}

const editNode = (
  content: ContentPackage,
  nodeId: string,
  change: (node: ContentNode) => ContentNode,
): ContentPackage => ({
  ...content,
  nodes: content.nodes.map(node =>
    node.nodeId === nodeId ? change(clone(node)) : node,
  ),
})

const reopenApprovedNode = (node: ContentNode): ContentNode =>
  node.editorial.status === 'approved' ||
  node.editorial.status === 'scheduled' ||
  node.editorial.status === 'published'
    ? {
        ...node,
        editorial: { ...node.editorial, status: 'continuity-review' },
      }
    : node

const primaryMessageText = (node: ContentNode): string | null => {
  if (node.type === 'checkpoint') return node.label
  const first =
    node.type === 'decision'
      ? node.messageVariants[0]?.messages[0]
      : node.messages[0]
  return first?.text ?? null
}

const choiceText = (node: ContentNode, choiceId: string): string | null => {
  if (node.type !== 'decision') return null
  return (
    node.choiceSlots
      .flatMap(slot => slot.candidates)
      .find(candidate => candidate.choiceId === choiceId)?.text ?? null
  )
}

const annotationKey = (annotation: TextAnnotation): string =>
  JSON.stringify({
    intentionalRepeatId: annotation.intentionalRepeatId ?? null,
    intentionalTypo: annotation.intentionalTypo ?? false,
  })

const annotationForUnit = (
  node: ContentNode,
  unitId: string,
): TextAnnotation | null => {
  if (node.type === 'decision') {
    for (const variant of node.messageVariants) {
      const message = variant.messages.find(item => item.messageId === unitId)
      if (message)
        return {
          intentionalRepeatId: message.intentionalRepeatId,
          intentionalTypo: message.intentionalTypo,
        }
    }
    for (const slot of node.choiceSlots) {
      const candidate = slot.candidates.find(item => item.choiceId === unitId)
      if (candidate)
        return {
          intentionalRepeatId: candidate.intentionalRepeatId,
          intentionalTypo: candidate.intentionalTypo,
        }
    }
    return null
  }
  if (node.type === 'checkpoint') return null
  const message = node.messages.find(item => item.messageId === unitId)
  return message
    ? {
        intentionalRepeatId: message.intentionalRepeatId,
        intentionalTypo: message.intentionalTypo,
      }
    : null
}

const updateAnnotation = (
  node: ContentNode,
  unitId: string,
  annotation: TextAnnotation,
): ContentNode => {
  const apply = <
    T extends {
      intentionalRepeatId?: string | undefined
      intentionalTypo?: boolean | undefined
    },
  >(
    value: T,
  ): T => {
    const next = { ...value }
    if (annotation.intentionalRepeatId?.trim())
      next.intentionalRepeatId = annotation.intentionalRepeatId.trim()
    else delete next.intentionalRepeatId
    next.intentionalTypo = annotation.intentionalTypo === true
    return next
  }
  if (node.type === 'decision') {
    return {
      ...node,
      messageVariants: node.messageVariants.map(variant => ({
        ...variant,
        messages: variant.messages.map(message =>
          message.messageId === unitId ? apply(message) : message,
        ),
      })),
      choiceSlots: node.choiceSlots.map(slot => ({
        ...slot,
        candidates: slot.candidates.map(candidate =>
          candidate.choiceId === unitId ? apply(candidate) : candidate,
        ),
      })),
    }
  }
  if (node.type === 'checkpoint') return node
  return {
    ...node,
    messages: node.messages.map(message =>
      message.messageId === unitId ? apply(message) : message,
    ),
  }
}

const appendAudit = (
  state: StudioState,
  context: StudioAuditContext | undefined,
  change: Omit<StudioAuditEntry, 'auditId' | 'actorId' | 'reason' | 'at'>,
): StudioState => {
  const at = context?.at?.trim() || new Date().toISOString()
  const auditId =
    context?.auditId?.trim() ||
    `audit-${at}-${state.auditLog.length + 1}-${change.action}`
  return {
    ...state,
    auditLog: [
      ...state.auditLog,
      {
        ...change,
        auditId,
        actorId: normalizeActorId(context?.actorId ?? state.actorId),
        reason: normalizeReason(context?.reason ?? state.editReason),
        at,
      },
    ].slice(-MAX_AUDIT_ENTRIES),
  }
}

export function studioReducer(
  state: StudioState,
  action: StudioAction,
): StudioState {
  switch (action.type) {
    case 'select_node':
      return { ...state, selectedNodeId: action.nodeId, view: 'content' }
    case 'set_query':
      return { ...state, query: action.query }
    case 'set_view':
      return { ...state, view: action.view }
    case 'edit_message': {
      const node = state.content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      const before = node ? primaryMessageText(node) : null
      if (before === null || before === action.text) return state
      const content = editNode(state.content, action.nodeId, current => {
        if (current.type === 'decision') {
          const variant = current.messageVariants[0]
          const first = variant?.messages[0]
          if (!variant || !first) return current
          variant.messages[0] = { ...first, text: action.text }
          return reopenApprovedNode(current)
        }
        if (current.type === 'checkpoint')
          return reopenApprovedNode({ ...current, label: action.text })
        const first = current.messages[0]
        if (!first) return current
        current.messages[0] = { ...first, text: action.text }
        return reopenApprovedNode(current)
      })
      const after = content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      if (!after || primaryMessageText(after) !== action.text) return state
      return appendAudit({ ...state, content, dirty: true }, action.audit, {
        action: 'edit-message',
        field: 'message',
        nodeId: action.nodeId,
        before: auditValue(before),
        after: auditValue(action.text),
      })
    }
    case 'edit_choice': {
      const node = state.content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      const before = node ? choiceText(node, action.choiceId) : null
      if (before === null || before === action.text) return state
      const content = editNode(state.content, action.nodeId, current => {
        if (current.type !== 'decision') return current
        current.choiceSlots = current.choiceSlots.map(slot => ({
          ...slot,
          candidates: slot.candidates.map(candidate =>
            candidate.choiceId === action.choiceId
              ? { ...candidate, text: action.text }
              : candidate,
          ),
        }))
        return reopenApprovedNode(current)
      })
      const after = content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      if (!after || choiceText(after, action.choiceId) !== action.text)
        return state
      return appendAudit({ ...state, content, dirty: true }, action.audit, {
        action: 'edit-choice',
        field: 'choice',
        nodeId: action.nodeId,
        choiceId: action.choiceId,
        before: auditValue(before),
        after: auditValue(action.text),
      })
    }
    case 'set_text_annotation': {
      const node = state.content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      const before = node ? annotationForUnit(node, action.unitId) : null
      if (!before || annotationKey(before) === annotationKey(action.annotation))
        return state
      const content = editNode(state.content, action.nodeId, current =>
        reopenApprovedNode(
          updateAnnotation(current, action.unitId, action.annotation),
        ),
      )
      const afterNode = content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      const after = afterNode
        ? annotationForUnit(afterNode, action.unitId)
        : null
      if (!after || annotationKey(after) === annotationKey(before)) return state
      return appendAudit({ ...state, content, dirty: true }, action.audit, {
        action: 'annotation-change',
        field: 'annotation',
        nodeId: action.nodeId,
        before: annotationKey(before),
        after: annotationKey(after),
      })
    }
    case 'set_editorial_status': {
      const node = state.content.nodes.find(
        candidate => candidate.nodeId === action.nodeId,
      )
      if (
        !node ||
        !canTransitionEditorialStatus(node.editorial.status, action.status)
      ) {
        return state
      }
      if (node.editorial.status === action.status) return state
      const content = editNode(state.content, action.nodeId, current => ({
        ...current,
        editorial: { ...current.editorial, status: action.status },
      }))
      return appendAudit({ ...state, content, dirty: true }, action.audit, {
        action: 'status-change',
        field: 'status',
        nodeId: action.nodeId,
        before: node.editorial.status,
        after: action.status,
      })
    }
    case 'replace_content':
      return appendAudit(
        createStudioState(action.content, {
          actorId: state.actorId,
          auditLog: state.auditLog,
        }),
        action.audit,
        {
          action: 'replace-content',
          field: 'content',
          nodeId: null,
          before: state.content.manifest.buildId,
          after: action.content.manifest.buildId,
        },
      )
    case 'set_actor_id':
      return { ...state, actorId: normalizeActorId(action.actorId) }
    case 'set_edit_reason':
      return { ...state, editReason: action.reason.slice(0, 240) }
    case 'mark_saved':
      return { ...state, dirty: false, lastSavedAt: action.at }
  }
}

export interface SearchResult {
  id: string
  kind: 'character' | 'story' | 'node'
  label: string
  detail: string
}

const textForNode = (node: ContentNode): string => {
  if (node.type === 'decision') {
    return [
      ...node.messageVariants.flatMap(variant =>
        variant.messages.map(message => message.text),
      ),
      ...node.choiceSlots.flatMap(slot =>
        slot.candidates.map(candidate => candidate.text),
      ),
    ].join(' ')
  }
  if (node.type === 'checkpoint')
    return [node.label, ...node.recapFacts].join(' ')
  if (node.type === 'ending') {
    return [
      node.title,
      ...node.messages.map(message => message.text),
      ...node.epilogueFacts,
    ].join(' ')
  }
  return node.messages.map(message => message.text).join(' ')
}

const conditionSearchText = (condition: Condition): string[] => {
  if (condition.op === 'all' || condition.op === 'any')
    return condition.args.flatMap(conditionSearchText)
  if (condition.op === 'not') return conditionSearchText(condition.arg)
  if (condition.op === 'hasMemory')
    return [
      condition.op,
      condition.key,
      `memories.${condition.key}`,
      String(condition.value ?? ''),
    ]
  if (condition.op === 'chosen') return [condition.op, condition.choiceId]
  if (condition.op === 'seen') return [condition.op, condition.nodeId]
  if (condition.op === 'withinLastTurns')
    return [condition.op, condition.choiceId, String(condition.turns)]
  return 'path' in condition
    ? [
        condition.path,
        'value' in condition ? String(condition.value ?? '') : '',
      ]
    : []
}

const searchableNodeText = (node: ContentNode): string => {
  const metadata = [
    node.editorial.writerId,
    node.editorial.voiceEditorId,
    node.editorial.continuityEditorId,
    node.editorial.status,
    node.editorial.voiceCardVersion,
    node.editorial.warningProfileId ?? '',
  ]
  if (node.type !== 'decision')
    return [...metadata, textForNode(node)].join(' ')
  return [
    ...metadata,
    textForNode(node),
    ...node.messageVariants.flatMap(variant =>
      variant.messages.flatMap(message => [
        message.messageId,
        message.speakerId,
        message.assetId ?? '',
      ]),
    ),
    ...node.messageVariants.flatMap(variant =>
      conditionSearchText(variant.when),
    ),
    ...node.choiceSlots.flatMap(slot =>
      slot.candidates.flatMap(candidate => [
        candidate.choiceId,
        candidate.intent,
        ...conditionSearchText(candidate.when),
        ...candidate.effects.flatMap(effect =>
          effect.op === 'setMemory' ||
          effect.op === 'addMemory' ||
          effect.op === 'removeMemory'
            ? [effect.op, effect.key, `memories.${effect.key}`]
            : effect.op === 'addPromise' || effect.op === 'resolvePromise'
              ? [effect.op, effect.promiseId, `promises.${effect.promiseId}`]
              : effect.op === 'advanceArc'
                ? [
                    effect.op,
                    effect.arcId,
                    `arcState.${effect.arcId}.phase`,
                    effect.phase,
                  ]
                : effect.op === 'startCooldown'
                  ? [
                      effect.op,
                      effect.cooldownId,
                      `cooldowns.${effect.cooldownId}`,
                      String(effect.turns),
                    ]
                  : 'path' in effect
                    ? [effect.op, effect.path]
                    : [],
        ),
      ]),
    ),
  ].join(' ')
}

export function searchContent(
  content: ContentPackage,
  query: string,
): SearchResult[] {
  const normalized = query.trim().toLocaleLowerCase('ru-RU')
  if (!normalized) return []
  const includes = (...values: string[]) =>
    values.some(value => value.toLocaleLowerCase('ru-RU').includes(normalized))
  return [
    ...content.characters
      .filter(item =>
        includes(item.characterId, item.name, item.hook, item.description),
      )
      .map(item => ({
        id: item.characterId,
        kind: 'character' as const,
        label: item.name,
        detail: item.hook,
      })),
    ...content.stories
      .filter(item => includes(item.storyId, item.title, item.premise))
      .map(item => ({
        id: item.storyId,
        kind: 'story' as const,
        label: item.title,
        detail: item.premise,
      })),
    ...content.nodes
      .filter(item =>
        includes(item.nodeId, item.sceneId, searchableNodeText(item)),
      )
      .map(item => ({
        id: item.nodeId,
        kind: 'node' as const,
        label: item.nodeId,
        detail: textForNode(item).slice(0, 120),
      })),
  ].slice(0, 30)
}

export interface ReleaseReadiness {
  ready: boolean
  report: CompilationReport
  gate: ProductionReleaseGate
  nonApprovedNodes: number
  fixtureAssets: number
  requiredApprovedTextUnits: number
}

export function releaseReadiness(content: ContentPackage): ReleaseReadiness {
  const { report, gate } = evaluateProductionRelease(content)
  return {
    ready: gate.eligible,
    report,
    gate,
    nonApprovedNodes: gate.nonApprovedNodes,
    fixtureAssets: gate.fixtureAssets,
    requiredApprovedTextUnits: gate.requiredApprovedTextUnits,
  }
}

export interface SimulatorLine {
  id: string
  speakerId: string
  text: string
}

export interface SimulatorState {
  storyId: string
  runId: string
  activeNodeId: string
  state: NarrativeState
  sequence: number
  status: 'active' | 'completed'
  choices: ResolvedChoice[]
  transcript: SimulatorLine[]
  endingTitle: string | null
}

const nodeMap = (content: ContentPackage) =>
  new Map<string, ContentNode>(content.nodes.map(node => [node.nodeId, node]))

export function createSimulator(
  content: ContentPackage,
  storyId: string,
): SimulatorState {
  const story = content.stories.find(item => item.storyId === storyId)
  const episode = content.episodes.find(
    item => item.episodeId === story?.episodeIds[0],
  )
  const node = episode ? nodeMap(content).get(episode.entryNodeId) : undefined
  if (!story || !episode || node?.type !== 'decision') {
    throw new Error('Story has no playable decision entry')
  }
  const state = enterDecision(node, initialNarrativeState())
  const resolved = resolveDecision(node, state)
  return {
    storyId,
    runId: 'studio-simulator',
    activeNodeId: node.nodeId,
    state,
    sequence: 0,
    status: 'active',
    choices: resolved.choices,
    transcript: resolved.messages.map(message => ({
      id: message.messageId,
      speakerId: message.speakerId,
      text: message.text,
    })),
    endingTitle: null,
  }
}

export function chooseInSimulator(
  content: ContentPackage,
  simulator: SimulatorState,
  choiceId: string,
): SimulatorState {
  if (simulator.status === 'completed') return simulator
  const nodes = nodeMap(content)
  const node = nodes.get(simulator.activeNodeId)
  if (node?.type !== 'decision')
    throw new Error('Simulator is not at a decision')
  const result = applyChoice({
    runId: simulator.runId,
    operationId: `studio-${simulator.sequence + 1}`,
    expectedSequence: simulator.sequence,
    expectedNodeId: simulator.activeNodeId,
    choiceId,
    contentBuildId: content.manifest.buildId,
    state: simulator.state,
    node,
    nodes,
    committedAt: new Date(0).toISOString(),
  })
  const destination = nodes.get(result.nextNodeId)
  if (!destination) throw new Error('Simulator reached a missing node')
  const destinationMessages =
    destination.type === 'decision'
      ? resolveDecision(destination, result.state).messages
      : destination.type === 'checkpoint'
        ? []
        : destination.messages
  const choices =
    destination.type === 'decision'
      ? resolveDecision(destination, result.state).choices
      : []
  return {
    ...simulator,
    activeNodeId: destination.nodeId,
    state: result.state,
    sequence: result.newSequence,
    status: destination.type === 'ending' ? 'completed' : 'active',
    choices,
    transcript: [
      ...simulator.transcript,
      {
        id: result.outgoing.entryId,
        speakerId: 'player',
        text: result.outgoing.text,
      },
      ...result.reaction.map(message => ({
        id: message.messageId,
        speakerId: message.speakerId,
        text: message.text,
      })),
      ...destinationMessages.map(message => ({
        id: message.messageId,
        speakerId: message.speakerId,
        text: message.text,
      })),
    ],
    endingTitle: destination.type === 'ending' ? destination.title : null,
  }
}
