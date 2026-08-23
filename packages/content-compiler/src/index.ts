import type {
  ChoiceCandidate,
  Condition,
  ContentNode,
  ContentPackage,
  DecisionNode,
  EndingNode,
  Effect,
  NarrativeState,
} from '@chartalk/content-schema'
import {
  contentPackageSchema,
  initialNarrativeState,
} from '@chartalk/content-schema'
import { validateContentPlaceholders } from '@chartalk/content-integrity'
import {
  applyEffects,
  canonicalHash,
  resolveDecision,
} from '@chartalk/dialogue-engine'

export type ValidationSeverity = 'blocker' | 'warning'

/**
 * A completed reader path must give the player enough room for choices to
 * accumulate into a meaningful trajectory. This is deliberately validated at
 * package compilation time so a short graph cannot be bundled or published.
 */
export const MINIMUM_STORY_CHOICE_POINTS = 50

export interface ValidationIssue {
  code:
    | 'AMBIGUOUS_PRIORITY'
    | 'ASSET_CHECKSUM_INVALID'
    | 'ASSET_PROVENANCE_MISSING'
    | 'DANGLING_REFERENCE'
    | 'DUPLICATE_ID'
    | 'DUPLICATE_ASSET_ID'
    | 'DUPLICATE_ASSET_PATH'
    | 'DUPLICATE_NEXT_OUTCOME_SIGNATURE'
    | 'DUPLICATE_REACTION_SIGNATURE'
    | 'DUPLICATE_STATE_SIGNATURE'
    | 'DUPLICATE_STABLE_ID'
    | 'AUTOMATIC_CYCLE'
    | 'DUPLICATE_CHOICE_SIGNATURE'
    | 'FALLBACK_MISSING'
    | 'INVALID_CONTENT_REFERENCE'
    | 'INVALID_EFFECT'
    | 'INVALID_STABLE_ID'
    | 'MISSING_SPECIFIC_MEMORY'
    | 'MISSING_MEMORY_PAYOFF'
    | 'IMAGE_ASSET_INVALID'
    | 'PORTRAIT_ASSET_MISSING'
    | 'PREVIEW_ASSET_MISSING'
    | 'SCHEMA_INVALID'
    | 'STORY_TOO_SHORT'
    | 'UNSUPPORTED_PLACEHOLDER'
    | 'UNSAFE_ASSET_PATH'
    | 'UNSAFE_SAFE_ROUTE'
    | 'UNREACHABLE_NODE'
  severity: ValidationSeverity
  message: string
  path?: string
}

export interface ContentCounts {
  decisionNodeCount: number
  choiceCandidateCount: number
  uniqueDecisionCharacterTextCount: number
  uniquePlayerChoiceTextCount: number
  uniqueCharacterTextCount: number
  uniquePublishedTextUnitCount: number
  approvedTextUnitCount: number
  fixtureTextUnitCount: number
  reachableNodeCount: number
}

/**
 * Editorial states that have passed human approval and may participate in a
 * production release. Scheduled and published content retain the same
 * authoring guarantees as approved content; deprecated and fixture content do
 * not belong to the active release.
 */
export function isReleaseApprovedEditorialStatus(
  status: ContentNode['editorial']['status'],
): boolean {
  return (
    status === 'approved' || status === 'scheduled' || status === 'published'
  )
}

export interface CompilationAnalysis {
  nodeTypeCounts: {
    decision: number
    reaction: number
    bridge: number
    checkpoint: number
    ending: number
  }
  editorialStatusCounts: {
    outline: number
    'graph-ready': number
    draft: number
    'voice-review': number
    'continuity-review': number
    'rating-review': number
    'logic-qa': number
    'device-qa': number
    qa: number
    approved: number
    scheduled: number
    published: number
    deprecated: number
    fixture: number
  }
  baselineExactlyFourDecisionCount: number
  counterfactualValidatedDecisionCount: number
  decisionWithCompleteFallbackCount: number
  staticReachabilityBasisPoints: number
  automaticHopTotal: number
  automaticPathCount: number
  maxAutomaticHops: number
  writtenStatePathCount: number
  readStatePathCount: number
  writtenNeverReadPathCount: number
  pathSamplesTruncated: boolean
  writtenStatePaths: string[]
  readStatePaths: string[]
  writtenNeverReadPaths: string[]
  relationshipDeltas: {
    count: number
    negativeCount: number
    zeroCount: number
    positiveCount: number
    minimum: number
    maximum: number
  }
  packageSourceBytes: number
  declaredDownloadBytes: number
  assetCount: number
  warningCount: number
  safeRouteCount: number
}

export interface CompilationReport {
  buildId: string
  blockers: ValidationIssue[]
  warnings: ValidationIssue[]
  counts: ContentCounts
  analysis: CompilationAnalysis
  reportHash: string
}

export const PRODUCTION_TEXT_UNIT_GATE = 300_000

export interface ProductionReleaseGate {
  eligible: boolean
  compilerBlockers: number
  nonApprovedNodes: number
  fixtureAssets: number
  approvedTextUnits: number
  requiredApprovedTextUnits: number
  decisionNodes: number
  requiredDecisionNodes: number
  uniqueDecisionCharacterTexts: number
  requiredUniqueDecisionCharacterTexts: number
  uniquePlayerChoiceTexts: number
  requiredUniquePlayerChoiceTexts: number
  characters: number
  requiredCharacters: number
  completedArcs: number
  requiredCompletedArcs: number
  minimumEndingsPerCharacter: number
  requiredEndingsPerCharacter: number
  adultOnlyStories: number
  allowedAdultOnlyStories: number
  signingKeyId: string | null
}

export function normalizeRussianText(text: string): string {
  return text
    .normalize('NFC')
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .replaceAll('…', '...')
    .replace(/\p{Extended_Pictographic}/gu, ' ')
    .replace(/[\s\p{P}]+/gu, ' ')
    .trim()
}

const stableIdPattern = /^[a-z0-9][a-z0-9._:-]*$/i
const forbiddenPathSegments = new Set(['__proto__', 'constructor', 'prototype'])
const readableStateRoots = new Set([
  'relationships',
  'characterState',
  'arcState',
  'memories',
  'promises',
  'counters',
  'cooldowns',
  'seenNodes',
  'choiceHistory',
])

export const isValidStableId = (id: string): boolean => stableIdPattern.test(id)

export const isValidConditionPath = (path: string): boolean => {
  const segments = path.split('.')
  const root = segments[0]
  if (
    !root ||
    !readableStateRoots.has(root) ||
    segments.some(
      segment =>
        segment.length === 0 ||
        forbiddenPathSegments.has(segment) ||
        !/^[a-z0-9_-]+$/i.test(segment),
    )
  ) {
    return false
  }
  if (['relationships', 'characterState', 'arcState'].includes(root)) {
    return segments.length >= 3
  }
  if (root === 'promises') return segments.length >= 1
  return segments.length >= 2
}

const isFallbackCondition = (condition: Condition): boolean =>
  condition.op === 'always' ||
  (condition.op === 'all' && condition.args.length === 0)

const conditionPaths = (condition: Condition): string[] => {
  if (condition.op === 'all' || condition.op === 'any') {
    return condition.args.flatMap(conditionPaths)
  }
  if (condition.op === 'not') return conditionPaths(condition.arg)
  if (condition.op === 'hasMemory') return [`memories.${condition.key}`]
  if (condition.op === 'seen') return [`seenNodes.${condition.nodeId}`]
  if (condition.op === 'chosen' || condition.op === 'withinLastTurns')
    return [`choiceHistory.${condition.choiceId}`]
  if ('path' in condition) return [condition.path]
  return []
}

const nodeEffects = (node: ContentNode): Effect[] => {
  if (node.type === 'decision') {
    return [
      ...node.onEnterEffects,
      ...node.choiceSlots.flatMap(slot =>
        slot.candidates.flatMap(candidate => candidate.effects),
      ),
    ]
  }
  if (node.type === 'reaction' || node.type === 'bridge') return node.effects
  return []
}

const automaticCycleNodes = (
  nodes: ReadonlyMap<string, ContentNode>,
): string[] => {
  const automatic = new Set(
    [...nodes.values()]
      .filter(
        node =>
          node.type === 'reaction' ||
          node.type === 'bridge' ||
          node.type === 'checkpoint',
      )
      .map(node => node.nodeId),
  )
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const cycles = new Set<string>()

  const visit = (nodeId: string): void => {
    if (visiting.has(nodeId)) {
      cycles.add(nodeId)
      return
    }
    if (visited.has(nodeId) || !automatic.has(nodeId)) return
    visiting.add(nodeId)
    const node = nodes.get(nodeId)
    if (node) {
      for (const destination of nodeDestinations(node)) visit(destination)
    }
    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  for (const nodeId of automatic) visit(nodeId)
  return [...cycles]
}

const downstreamNodes = (
  startNodeId: string,
  nodes: ReadonlyMap<string, ContentNode>,
): ContentNode[] => {
  const found: ContentNode[] = []
  const visited = new Set<string>()
  const queue = [startNodeId]
  while (queue.length > 0) {
    const nodeId = queue.shift()
    if (!nodeId || visited.has(nodeId)) continue
    visited.add(nodeId)
    const node = nodes.get(nodeId)
    if (!node) continue
    found.push(node)
    queue.push(...nodeDestinations(node))
  }
  return found
}

const decisionConditionPaths = (node: ContentNode): string[] =>
  node.type === 'decision'
    ? [
        ...node.messageVariants.flatMap(variant =>
          conditionPaths(variant.when),
        ),
        ...node.choiceSlots.flatMap(slot =>
          slot.candidates.flatMap(candidate => conditionPaths(candidate.when)),
        ),
      ]
    : []

const effectWritePath = (effect: Effect): string | null => {
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

type ConditionAtom =
  | {
      op: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte'
      path: string
      value: string | number | boolean | null
    }
  | { op: 'exists' | 'missing'; path: string }
  | { op: 'impossible' }

const invertComparison = (
  op: Extract<ConditionAtom, { value: unknown }>['op'],
): Extract<ConditionAtom, { value: unknown }>['op'] => {
  switch (op) {
    case 'eq':
      return 'neq'
    case 'neq':
      return 'eq'
    case 'gt':
      return 'lte'
    case 'gte':
      return 'lt'
    case 'lt':
      return 'gte'
    case 'lte':
      return 'gt'
  }
}

const conjunctionAtoms = (condition: Condition): ConditionAtom[] | null => {
  if (condition.op === 'always') return []
  if (condition.op === 'never') return [{ op: 'impossible' }]
  if (condition.op === 'all') {
    const groups = condition.args.map(conjunctionAtoms)
    if (groups.some(group => group === null)) return null
    return groups.flatMap(group => group ?? [])
  }
  if (condition.op === 'any') return null
  if (condition.op === 'not') {
    const inner = condition.arg
    if (inner.op === 'always') return [{ op: 'impossible' }]
    if (inner.op === 'never') return []
    if (inner.op === 'hasMemory') {
      if (inner.value === undefined) {
        return [{ op: 'missing', path: `memories.${inner.key}` }]
      }
      return [
        {
          op: 'neq',
          path: `memories.${inner.key}`,
          value: inner.value,
        },
      ]
    }
    if (inner.op === 'exists') return [{ op: 'missing', path: inner.path }]
    if (
      inner.op === 'eq' ||
      inner.op === 'neq' ||
      inner.op === 'gt' ||
      inner.op === 'gte' ||
      inner.op === 'lt' ||
      inner.op === 'lte'
    ) {
      return [
        {
          op: invertComparison(inner.op),
          path: inner.path,
          value: inner.value,
        },
      ]
    }
    return null
  }
  if (condition.op === 'exists') {
    return [{ op: 'exists', path: condition.path }]
  }
  if (condition.op === 'hasMemory') {
    return condition.value === undefined
      ? [{ op: 'exists', path: `memories.${condition.key}` }]
      : [
          {
            op: 'eq',
            path: `memories.${condition.key}`,
            value: condition.value,
          },
        ]
  }
  if (
    condition.op === 'eq' ||
    condition.op === 'neq' ||
    condition.op === 'gt' ||
    condition.op === 'gte' ||
    condition.op === 'lt' ||
    condition.op === 'lte'
  ) {
    return [
      {
        op: condition.op,
        path: condition.path,
        value: condition.value,
      },
    ]
  }
  return null
}

const valuesEqual = (
  left: string | number | boolean | null,
  right: string | number | boolean | null,
): boolean => Object.is(left, right)

const numericAtomAllows = (
  atom: Extract<ConditionAtom, { value: unknown }>,
  value: number,
): boolean => {
  if (typeof atom.value !== 'number') return false
  switch (atom.op) {
    case 'eq':
      return value === atom.value
    case 'neq':
      return value !== atom.value
    case 'gt':
      return value > atom.value
    case 'gte':
      return value >= atom.value
    case 'lt':
      return value < atom.value
    case 'lte':
      return value <= atom.value
  }
}

const atomsContradict = (atoms: readonly ConditionAtom[]): boolean => {
  if (atoms.some(atom => atom.op === 'impossible')) return true
  const paths = new Set(
    atoms.flatMap(atom => ('path' in atom ? [atom.path] : [])),
  )
  for (const path of paths) {
    const pathAtoms = atoms.filter(
      (atom): atom is Exclude<ConditionAtom, { op: 'impossible' }> =>
        'path' in atom && atom.path === path,
    )
    if (
      pathAtoms.some(atom => atom.op === 'exists') &&
      pathAtoms.some(atom => atom.op === 'missing')
    ) {
      return true
    }
    const comparisons = pathAtoms.filter(
      (atom): atom is Extract<ConditionAtom, { value: unknown }> =>
        'value' in atom,
    )
    const equalities = comparisons.filter(atom => atom.op === 'eq')
    if (
      equalities.some((atom, index) =>
        equalities
          .slice(index + 1)
          .some(other => !valuesEqual(atom.value, other.value)),
      )
    ) {
      return true
    }
    const equality = equalities[0]
    if (equality) {
      if (
        comparisons.some(
          atom => atom.op === 'neq' && valuesEqual(atom.value, equality.value),
        )
      ) {
        return true
      }
      if (
        typeof equality.value === 'number' &&
        comparisons.some(
          atom =>
            atom.op !== 'eq' &&
            atom.op !== 'neq' &&
            !numericAtomAllows(atom, equality.value as number),
        )
      ) {
        return true
      }
      continue
    }
    const numeric = comparisons.filter(
      atom =>
        typeof atom.value === 'number' && atom.op !== 'eq' && atom.op !== 'neq',
    )
    let lower: { value: number; inclusive: boolean } | undefined
    let upper: { value: number; inclusive: boolean } | undefined
    for (const atom of numeric) {
      const value = atom.value as number
      if (atom.op === 'gt' || atom.op === 'gte') {
        const candidate = { value, inclusive: atom.op === 'gte' }
        if (
          !lower ||
          candidate.value > lower.value ||
          (candidate.value === lower.value && !candidate.inclusive)
        ) {
          lower = candidate
        }
      } else {
        const candidate = { value, inclusive: atom.op === 'lte' }
        if (
          !upper ||
          candidate.value < upper.value ||
          (candidate.value === upper.value && !candidate.inclusive)
        ) {
          upper = candidate
        }
      }
    }
    if (
      lower &&
      upper &&
      (lower.value > upper.value ||
        (lower.value === upper.value && (!lower.inclusive || !upper.inclusive)))
    ) {
      return true
    }
  }
  return false
}

export const conditionsMayOverlap = (
  left: Condition,
  right: Condition,
): boolean => {
  const leftAtoms = conjunctionAtoms(left)
  const rightAtoms = conjunctionAtoms(right)
  if (!leftAtoms || !rightAtoms) return true
  return !atomsContradict([...leftAtoms, ...rightAtoms])
}

const validateVariantSet = <T extends { priority: number; when: Condition }>(
  values: readonly T[],
  path: string,
): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const fallbackCount = values.filter(value =>
    isFallbackCondition(value.when),
  ).length
  if (fallbackCount === 0) {
    issues.push({
      code: 'FALLBACK_MISSING',
      severity: 'blocker',
      message: `${path} has no unconditional fallback`,
      path,
    })
  } else if (fallbackCount > 1) {
    issues.push({
      code: 'AMBIGUOUS_PRIORITY',
      severity: 'blocker',
      message: `${path} has more than one unconditional fallback`,
      path,
    })
  }
  for (let leftIndex = 0; leftIndex < values.length; leftIndex += 1) {
    const left = values[leftIndex]
    if (!left) continue
    for (
      let rightIndex = leftIndex + 1;
      rightIndex < values.length;
      rightIndex += 1
    ) {
      const right = values[rightIndex]
      if (
        right &&
        left.priority === right.priority &&
        conditionsMayOverlap(left.when, right.when)
      ) {
        issues.push({
          code: 'AMBIGUOUS_PRIORITY',
          severity: 'blocker',
          message: `${path} has overlapping candidates at priority ${left.priority}`,
          path,
        })
      }
    }
  }
  return issues
}

function nodeDestinations(node: ContentNode): string[] {
  switch (node.type) {
    case 'decision':
      return node.choiceSlots.flatMap(slot =>
        slot.candidates.map(candidate => candidate.nextNodeId),
      )
    case 'reaction':
    case 'bridge':
    case 'checkpoint':
      return [node.nextNodeId]
    case 'ending':
      return []
  }
}

function collectReachable(
  entryNodeIds: readonly string[],
  nodes: ReadonlyMap<string, ContentNode>,
): Set<string> {
  const reachable = new Set<string>()
  const queue = [...entryNodeIds]
  let cursor = 0
  while (cursor < queue.length) {
    const nodeId = queue[cursor]
    cursor += 1
    if (!nodeId || reachable.has(nodeId)) continue
    reachable.add(nodeId)
    const node = nodes.get(nodeId)
    if (!node) continue
    for (const destination of nodeDestinations(node)) queue.push(destination)
  }
  return reachable
}

interface ChoicePointDistance {
  nodeId: string
  choicePoints: number
}

function pushChoicePointDistance(
  queue: ChoicePointDistance[],
  entry: ChoicePointDistance,
): void {
  queue.push(entry)
  let index = queue.length - 1
  while (index > 0) {
    const parentIndex = Math.floor((index - 1) / 2)
    const parent = queue[parentIndex]
    if (!parent || parent.choicePoints <= entry.choicePoints) break
    queue[index] = parent
    index = parentIndex
  }
  queue[index] = entry
}

function popChoicePointDistance(
  queue: ChoicePointDistance[],
): ChoicePointDistance | undefined {
  const first = queue[0]
  const last = queue.pop()
  if (!first || !last || queue.length === 0) return first

  let index = 0
  while (true) {
    const leftIndex = index * 2 + 1
    const rightIndex = leftIndex + 1
    const left = queue[leftIndex]
    const right = queue[rightIndex]
    if (!left) break
    const nextIndex =
      right && right.choicePoints < left.choicePoints ? rightIndex : leftIndex
    const next = queue[nextIndex]
    if (!next || next.choicePoints >= last.choicePoints) break
    queue[index] = next
    index = nextIndex
  }
  queue[index] = last
  return first
}

/**
 * Returns the smallest number of decision nodes on any static route from an
 * episode entry to an ending. Automatic nodes do not add a choice point.
 */
function minimumChoicePointsToEnding(
  entryNodeId: string,
  nodes: ReadonlyMap<string, ContentNode>,
): number | undefined {
  const distances = new Map<string, number>([[entryNodeId, 0]])
  const queue: ChoicePointDistance[] = []
  pushChoicePointDistance(queue, { nodeId: entryNodeId, choicePoints: 0 })

  while (queue.length > 0) {
    const current = popChoicePointDistance(queue)
    if (!current || distances.get(current.nodeId) !== current.choicePoints)
      continue
    const node = nodes.get(current.nodeId)
    if (!node) continue
    if (node.type === 'ending') return current.choicePoints

    const nextChoicePointCount =
      current.choicePoints + (node.type === 'decision' ? 1 : 0)
    for (const destination of nodeDestinations(node)) {
      const previous = distances.get(destination)
      if (previous !== undefined && previous <= nextChoicePointCount) continue
      distances.set(destination, nextChoicePointCount)
      pushChoicePointDistance(queue, {
        nodeId: destination,
        choicePoints: nextChoicePointCount,
      })
    }
  }

  return undefined
}

function immediateReactionSignature(
  choice: ChoiceCandidate,
  nodes: ReadonlyMap<string, ContentNode>,
): string {
  const node = nodes.get(choice.nextNodeId)
  if (node?.type !== 'reaction' && node?.type !== 'bridge')
    return `missing:${choice.nextNodeId}`
  return node.messages
    .map(
      message =>
        `${message.kind}:${message.assetId ?? ''}:${normalizeRussianText(message.text)}`,
    )
    .join('|')
}

interface AutomaticTerminal {
  node: DecisionNode | EndingNode
  state: NarrativeState
}

function followAutomatic(
  nodeId: string,
  nodes: ReadonlyMap<string, ContentNode>,
  state: NarrativeState,
  visited = new Set<string>(),
): AutomaticTerminal | undefined {
  if (visited.has(nodeId)) return undefined
  visited.add(nodeId)
  const node = nodes.get(nodeId)
  if (!node) return undefined
  if (node.type === 'decision') {
    return {
      node,
      state: applyEffects(state, node.onEnterEffects),
    }
  }
  if (node.type === 'ending') return { node, state }
  if (node.type === 'checkpoint') {
    return followAutomatic(node.nextNodeId, nodes, state, visited)
  }
  return followAutomatic(
    node.nextNodeId,
    nodes,
    applyEffects(state, node.effects),
    visited,
  )
}

function nextOutcomeSignature(
  choice: ChoiceCandidate,
  nodes: ReadonlyMap<string, ContentNode>,
): string {
  let terminal: AutomaticTerminal | undefined
  try {
    terminal = followAutomatic(
      choice.nextNodeId,
      nodes,
      applyEffects(initialNarrativeState(), choice.effects),
    )
  } catch {
    return `invalid:${choice.choiceId}`
  }
  if (!terminal) return `missing:${choice.nextNodeId}`
  if (terminal.node.type === 'ending') {
    return `ending:${normalizeRussianText(terminal.node.title)}:${terminal.node.messages
      .map(message => normalizeRussianText(message.text))
      .join('|')}:${terminal.node.epilogueFacts
      .map(normalizeRussianText)
      .join('|')}`
  }
  const resolved = resolveDecision(terminal.node, terminal.state)
  const messages = resolved.messages
    .map(
      message =>
        `${message.kind}:${message.assetId ?? ''}:${normalizeRussianText(message.text)}`,
    )
    .join('|')
  return `decision:${messages}:${resolved.choices
    .map(nextChoice => {
      const effects = nextChoice.effects.map(effect =>
        Object.fromEntries(
          Object.entries(effect).filter(([key]) => key !== 'effectId'),
        ),
      )
      return `${normalizeRussianText(nextChoice.intent)}:${normalizeRussianText(nextChoice.text)}:${canonicalHash(effects)}`
    })
    .join('|')}`
}

function hasSpecificStateWrite(choice: ChoiceCandidate): boolean {
  return choice.effects.some(effect => {
    const path = effectWritePath(effect)
    return (
      path?.startsWith('memories.') === true ||
      path?.startsWith('counters.') === true ||
      path?.startsWith('promises.') === true ||
      path?.startsWith('arcState.') === true ||
      path?.startsWith('cooldowns.') === true
    )
  })
}

const effectValidationState = (effect: Effect): NarrativeState => {
  if (effect.op !== 'resolvePromise') return initialNarrativeState()
  return {
    ...initialNarrativeState(),
    promises: [effect.promiseId],
    promiseStates: { [effect.promiseId]: 'open' },
  }
}

function validateCounterfactual(
  node: DecisionNode,
  nodes: ReadonlyMap<string, ContentNode>,
): ValidationIssue[] {
  let resolved
  try {
    resolved = resolveDecision(node, initialNarrativeState())
  } catch (error) {
    return [
      {
        code: 'DANGLING_REFERENCE',
        severity: 'blocker',
        message:
          error instanceof Error
            ? error.message
            : `Cannot resolve ${node.nodeId}`,
        path: node.nodeId,
      },
    ]
  }

  const issues: ValidationIssue[] = []
  const choiceTexts = resolved.choices.map(choice =>
    normalizeRussianText(choice.text),
  )
  const choiceIntents = resolved.choices.map(choice =>
    normalizeRussianText(choice.intent),
  )
  if (new Set(choiceTexts).size !== 4 || new Set(choiceIntents).size === 1) {
    issues.push({
      code: 'DUPLICATE_CHOICE_SIGNATURE',
      severity: 'blocker',
      message: `${node.nodeId} does not resolve four meaningfully distinct choices`,
      path: node.nodeId,
    })
  }

  const stateSignatures = resolved.choices.map(choice => {
    try {
      return canonicalHash(
        applyEffects(initialNarrativeState(), choice.effects),
      )
    } catch {
      return `invalid:${choice.choiceId}`
    }
  })
  if (new Set(stateSignatures).size !== 4) {
    issues.push({
      code: 'DUPLICATE_STATE_SIGNATURE',
      severity: 'blocker',
      message: `${node.nodeId} has choices with duplicate resulting state`,
      path: node.nodeId,
    })
  }

  const reactions = resolved.choices.map(choice =>
    immediateReactionSignature(choice, nodes),
  )
  if (new Set(reactions).size !== 4) {
    issues.push({
      code: 'DUPLICATE_REACTION_SIGNATURE',
      severity: 'blocker',
      message: `${node.nodeId} has choices with semantically duplicate immediate reactions`,
      path: node.nodeId,
    })
  }

  const outcomes = resolved.choices.map(choice =>
    nextOutcomeSignature(choice, nodes),
  )
  if (new Set(outcomes).size !== 4) {
    issues.push({
      code: 'DUPLICATE_NEXT_OUTCOME_SIGNATURE',
      severity: 'blocker',
      message: `${node.nodeId} has choices with duplicate next choice sets or terminal outcomes`,
      path: node.nodeId,
    })
  }

  for (const choice of resolved.choices) {
    if (!hasSpecificStateWrite(choice)) {
      issues.push({
        code: 'MISSING_SPECIFIC_MEMORY',
        severity: 'blocker',
        message: `${choice.choiceId} has no choice-specific memory or counter write`,
        path: choice.choiceId,
      })
    }
  }
  return issues
}

function countText(
  pack: ContentPackage,
  reachable: Set<string>,
): ContentCounts {
  const playerTexts = new Set<string>()
  const characterTexts = new Set<string>()
  const decisionCharacterTexts = new Set<string>()
  const approvedTexts = new Set<string>()
  const fixtureTexts = new Set<string>()
  let decisionNodeCount = 0
  let choiceCandidateCount = 0

  for (const node of pack.nodes) {
    if (!reachable.has(node.nodeId)) continue
    const status = node.editorial.status
    const addText = (text: string, speaker: 'player' | 'character') => {
      const normalized = normalizeRussianText(text)
      if (speaker === 'player') playerTexts.add(normalized)
      else characterTexts.add(normalized)
      if (isReleaseApprovedEditorialStatus(status))
        approvedTexts.add(normalized)
      if (status === 'fixture') fixtureTexts.add(normalized)
    }

    if (node.type === 'decision') {
      decisionNodeCount += 1
      for (const variant of node.messageVariants) {
        for (const message of variant.messages) {
          addText(message.text, 'character')
          decisionCharacterTexts.add(normalizeRussianText(message.text))
        }
      }
      for (const slot of node.choiceSlots) {
        for (const candidate of slot.candidates) {
          choiceCandidateCount += 1
          addText(candidate.text, 'player')
        }
      }
      continue
    }
    if (
      node.type === 'reaction' ||
      node.type === 'bridge' ||
      node.type === 'ending'
    ) {
      for (const message of node.messages) {
        addText(message.text, 'character')
      }
    }
    if (node.type === 'ending') {
      addText(node.title, 'character')
      for (const fact of node.epilogueFacts) addText(fact, 'character')
    }
    if (node.type === 'checkpoint') {
      addText(node.label, 'character')
      for (const fact of node.recapFacts) addText(fact, 'character')
    }
  }

  return {
    decisionNodeCount,
    choiceCandidateCount,
    uniqueDecisionCharacterTextCount: decisionCharacterTexts.size,
    uniquePlayerChoiceTextCount: playerTexts.size,
    uniqueCharacterTextCount: characterTexts.size,
    uniquePublishedTextUnitCount: new Set([...playerTexts, ...characterTexts])
      .size,
    approvedTextUnitCount: approvedTexts.size,
    fixtureTextUnitCount: fixtureTexts.size,
    reachableNodeCount: reachable.size,
  }
}

function analyzeCompilation(
  pack: ContentPackage,
  nodes: ReadonlyMap<string, ContentNode>,
  reachable: ReadonlySet<string>,
  counterfactualValidatedDecisionCount: number,
): CompilationAnalysis {
  const pathSampleLimit = 500
  const nodeTypeCounts: CompilationAnalysis['nodeTypeCounts'] = {
    decision: 0,
    reaction: 0,
    bridge: 0,
    checkpoint: 0,
    ending: 0,
  }
  const editorialStatusCounts: CompilationAnalysis['editorialStatusCounts'] = {
    outline: 0,
    'graph-ready': 0,
    draft: 0,
    'voice-review': 0,
    'continuity-review': 0,
    'rating-review': 0,
    'logic-qa': 0,
    'device-qa': 0,
    qa: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    deprecated: 0,
    fixture: 0,
  }
  const writtenStatePaths = new Set<string>()
  const readStatePaths = new Set<string>()
  const relationshipDeltas: number[] = []
  let baselineExactlyFourDecisionCount = 0
  let decisionWithCompleteFallbackCount = 0
  let automaticHopTotal = 0
  let automaticPathCount = 0
  let maxAutomaticHops = 0

  for (const node of pack.nodes) {
    nodeTypeCounts[node.type] += 1
    editorialStatusCounts[node.editorial.status] += 1
    for (const effect of nodeEffects(node)) {
      const writePath = effectWritePath(effect)
      if (writePath) writtenStatePaths.add(writePath)
      if (
        effect.op === 'increment' &&
        effect.path.startsWith('relationships.')
      ) {
        relationshipDeltas.push(effect.by)
      }
    }
    if (node.type !== 'decision') continue
    for (const path of decisionConditionPaths(node)) readStatePaths.add(path)
    try {
      if (resolveDecision(node, initialNarrativeState()).choices.length === 4) {
        baselineExactlyFourDecisionCount += 1
      }
    } catch {
      // The corresponding compiler blocker carries the actionable detail.
    }
    if (
      node.messageVariants.filter(variant => isFallbackCondition(variant.when))
        .length === 1 &&
      node.choiceSlots.every(
        slot =>
          slot.candidates.filter(candidate =>
            isFallbackCondition(candidate.when),
          ).length === 1,
      )
    ) {
      decisionWithCompleteFallbackCount += 1
    }

    for (const candidate of node.choiceSlots.flatMap(slot => slot.candidates)) {
      let cursor = candidate.nextNodeId
      let hops = 0
      const visited = new Set<string>()
      while (!visited.has(cursor)) {
        visited.add(cursor)
        const destination = nodes.get(cursor)
        if (!destination) break
        if (destination.type === 'decision' || destination.type === 'ending') {
          automaticHopTotal += hops
          automaticPathCount += 1
          maxAutomaticHops = Math.max(maxAutomaticHops, hops)
          break
        }
        hops += 1
        cursor = destination.nextNodeId
      }
    }
  }

  for (const warning of pack.warnings) {
    for (const effect of warning.safeRoute.effects) {
      const writePath = effectWritePath(effect)
      if (writePath) writtenStatePaths.add(writePath)
      if (
        effect.op === 'increment' &&
        effect.path.startsWith('relationships.')
      ) {
        relationshipDeltas.push(effect.by)
      }
    }
  }

  const allWrites = [...writtenStatePaths]
  const allReads = [...readStatePaths]
  const allWrittenNeverRead = allWrites.filter(
    path => !readStatePaths.has(path),
  )
  const encodedSource = new TextEncoder().encode(JSON.stringify(pack))
  return {
    nodeTypeCounts,
    editorialStatusCounts,
    baselineExactlyFourDecisionCount,
    counterfactualValidatedDecisionCount,
    decisionWithCompleteFallbackCount,
    staticReachabilityBasisPoints:
      pack.nodes.length === 0
        ? 10_000
        : Math.floor((reachable.size * 10_000) / pack.nodes.length),
    automaticHopTotal,
    automaticPathCount,
    maxAutomaticHops,
    writtenStatePathCount: allWrites.length,
    readStatePathCount: allReads.length,
    writtenNeverReadPathCount: allWrittenNeverRead.length,
    pathSamplesTruncated:
      allWrites.length > pathSampleLimit ||
      allReads.length > pathSampleLimit ||
      allWrittenNeverRead.length > pathSampleLimit,
    writtenStatePaths: allWrites.slice(0, pathSampleLimit),
    readStatePaths: allReads.slice(0, pathSampleLimit),
    writtenNeverReadPaths: allWrittenNeverRead.slice(0, pathSampleLimit),
    relationshipDeltas: {
      count: relationshipDeltas.length,
      negativeCount: relationshipDeltas.filter(delta => delta < 0).length,
      zeroCount: relationshipDeltas.filter(delta => delta === 0).length,
      positiveCount: relationshipDeltas.filter(delta => delta > 0).length,
      minimum:
        relationshipDeltas.length > 0 ? Math.min(...relationshipDeltas) : 0,
      maximum:
        relationshipDeltas.length > 0 ? Math.max(...relationshipDeltas) : 0,
    },
    packageSourceBytes: encodedSource.byteLength,
    declaredDownloadBytes: pack.episodes.reduce(
      (total, episode) => total + episode.downloadBytes,
      0,
    ),
    assetCount: pack.assets.length,
    warningCount: pack.warnings.length,
    safeRouteCount: pack.warnings.length,
  }
}

const emptyCompilationAnalysis = (): CompilationAnalysis => ({
  nodeTypeCounts: {
    decision: 0,
    reaction: 0,
    bridge: 0,
    checkpoint: 0,
    ending: 0,
  },
  editorialStatusCounts: {
    outline: 0,
    'graph-ready': 0,
    draft: 0,
    'voice-review': 0,
    'continuity-review': 0,
    'rating-review': 0,
    'logic-qa': 0,
    'device-qa': 0,
    qa: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    deprecated: 0,
    fixture: 0,
  },
  baselineExactlyFourDecisionCount: 0,
  counterfactualValidatedDecisionCount: 0,
  decisionWithCompleteFallbackCount: 0,
  staticReachabilityBasisPoints: 0,
  automaticHopTotal: 0,
  automaticPathCount: 0,
  maxAutomaticHops: 0,
  writtenStatePathCount: 0,
  readStatePathCount: 0,
  writtenNeverReadPathCount: 0,
  pathSamplesTruncated: false,
  writtenStatePaths: [],
  readStatePaths: [],
  writtenNeverReadPaths: [],
  relationshipDeltas: {
    count: 0,
    negativeCount: 0,
    zeroCount: 0,
    positiveCount: 0,
    minimum: 0,
    maximum: 0,
  },
  packageSourceBytes: 0,
  declaredDownloadBytes: 0,
  assetCount: 0,
  warningCount: 0,
  safeRouteCount: 0,
})

export function compileContentPackage(input: unknown): CompilationReport {
  const parsed = contentPackageSchema.safeParse(input)
  if (!parsed.success) {
    const blockers: ValidationIssue[] = parsed.error.issues.map(issue => ({
      code: 'SCHEMA_INVALID',
      severity: 'blocker',
      message: issue.message,
      path: issue.path.join('.'),
    }))
    return {
      buildId: 'invalid',
      blockers,
      warnings: [],
      counts: {
        decisionNodeCount: 0,
        choiceCandidateCount: 0,
        uniqueDecisionCharacterTextCount: 0,
        uniquePlayerChoiceTextCount: 0,
        uniqueCharacterTextCount: 0,
        uniquePublishedTextUnitCount: 0,
        approvedTextUnitCount: 0,
        fixtureTextUnitCount: 0,
        reachableNodeCount: 0,
      },
      analysis: emptyCompilationAnalysis(),
      reportHash: canonicalHash(blockers),
    }
  }

  const pack = parsed.data
  const issues: ValidationIssue[] = []
  for (const placeholder of validateContentPlaceholders(pack)) {
    issues.push({
      code: 'UNSUPPORTED_PLACEHOLDER',
      severity: 'blocker',
      message: placeholder.message,
      path: placeholder.path,
    })
  }
  const seenIds = new Set<string>()
  const duplicateIds = new Set<string>()
  let counterfactualValidatedDecisionCount = 0
  for (const node of pack.nodes) {
    if (seenIds.has(node.nodeId)) duplicateIds.add(node.nodeId)
    else seenIds.add(node.nodeId)
  }
  for (const id of duplicateIds) {
    issues.push({
      code: 'DUPLICATE_ID',
      severity: 'blocker',
      message: `Duplicate node ID ${id}`,
      path: id,
    })
  }

  const assets = new Map<string, ContentPackage['assets'][number]>()
  const assetPaths = new Set<string>()
  for (const asset of pack.assets) {
    if (assets.has(asset.assetId)) {
      issues.push({
        code: 'DUPLICATE_ASSET_ID',
        severity: 'blocker',
        message: `Duplicate asset ID ${asset.assetId}`,
        path: asset.assetId,
      })
    }
    assets.set(asset.assetId, asset)
    if (assetPaths.has(asset.path)) {
      issues.push({
        code: 'DUPLICATE_ASSET_PATH',
        severity: 'blocker',
        message: `Duplicate asset path ${asset.path}`,
        path: asset.assetId,
      })
    }
    assetPaths.add(asset.path)
    if (
      asset.path.startsWith('/') ||
      asset.path.includes('\\') ||
      asset.path.split('/').some(part => part === '..' || part === '') ||
      /^[a-z][a-z0-9+.-]*:/i.test(asset.path)
    ) {
      issues.push({
        code: 'UNSAFE_ASSET_PATH',
        severity: 'blocker',
        message: `${asset.assetId} has an unsafe package-relative path`,
        path: asset.assetId,
      })
    }
    if (
      asset.provenance !== 'generated-fixture' &&
      !/^sha256:[a-f0-9]{64}$/.test(asset.checksum)
    ) {
      issues.push({
        code: 'ASSET_CHECKSUM_INVALID',
        severity: 'blocker',
        message: `${asset.assetId} requires a lowercase SHA-256 digest`,
        path: asset.assetId,
      })
    }
  }
  for (const character of pack.characters) {
    const portrait = assets.get(character.portraitAssetId)
    if (!portrait || portrait.kind !== 'portrait') {
      issues.push({
        code: 'PORTRAIT_ASSET_MISSING',
        severity: 'blocker',
        message: `${character.characterId} references a missing portrait asset`,
        path: character.characterId,
      })
    }
  }

  const stableIds = new Map<string, string>()
  const recordStableId = (id: string, kind: string) => {
    if (!isValidStableId(id)) {
      issues.push({
        code: 'INVALID_STABLE_ID',
        severity: 'blocker',
        message: `${kind} ID ${id} must be an ASCII stable identifier`,
        path: id,
      })
    }
    const existing = stableIds.get(id)
    if (existing) {
      issues.push({
        code: 'DUPLICATE_STABLE_ID',
        severity: 'blocker',
        message: `${id} is reused by ${existing} and ${kind}`,
        path: id,
      })
    } else {
      stableIds.set(id, kind)
    }
  }
  for (const character of pack.characters)
    recordStableId(character.characterId, 'character')
  for (const story of pack.stories) recordStableId(story.storyId, 'story')
  for (const episode of pack.episodes)
    recordStableId(episode.episodeId, 'episode')
  for (const warning of pack.warnings)
    recordStableId(warning.warningId, 'warning')
  for (const asset of pack.assets) recordStableId(asset.assetId, 'asset')
  for (const node of pack.nodes) {
    recordStableId(node.nodeId, 'node')
    if (node.type === 'checkpoint')
      recordStableId(node.checkpointId, 'checkpoint')
    if (node.type === 'ending') recordStableId(node.endingId, 'ending')
    const messages =
      node.type === 'decision'
        ? node.messageVariants.flatMap(variant => variant.messages)
        : node.type === 'reaction' ||
            node.type === 'bridge' ||
            node.type === 'ending'
          ? node.messages
          : []
    for (const message of messages) recordStableId(message.messageId, 'message')
    if (node.type === 'decision') {
      for (const variant of node.messageVariants)
        recordStableId(variant.variantId, 'message variant')
      for (const slot of node.choiceSlots) {
        for (const candidate of slot.candidates)
          recordStableId(candidate.choiceId, 'choice')
      }
    }
    for (const effect of nodeEffects(node))
      recordStableId(effect.effectId, 'effect')
  }
  for (const warning of pack.warnings) {
    for (const effect of warning.safeRoute.effects)
      recordStableId(effect.effectId, 'safe-route effect')
  }

  const sceneIdsToValidate = new Set(pack.nodes.map(node => node.sceneId))
  for (const sceneId of sceneIdsToValidate) {
    if (!isValidStableId(sceneId)) {
      issues.push({
        code: 'INVALID_STABLE_ID',
        severity: 'blocker',
        message: `Scene ID ${sceneId} must be an ASCII stable identifier`,
        path: sceneId,
      })
    }
  }

  const nodes = new Map(pack.nodes.map(node => [node.nodeId, node]))
  const characters = new Map(
    pack.characters.map(character => [character.characterId, character]),
  )
  const stories = new Map(pack.stories.map(story => [story.storyId, story]))
  const episodes = new Map(
    pack.episodes.map(episode => [episode.episodeId, episode]),
  )
  const warningsById = new Map(
    pack.warnings.map(warning => [warning.warningId, warning]),
  )
  const sceneIds = new Set(pack.nodes.map(node => node.sceneId))

  for (const story of pack.stories) {
    const character = characters.get(story.characterId)
    if (!character) {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${story.storyId} references a missing character`,
        path: story.storyId,
      })
    }
    if (story.previewAssetId) {
      const preview = assets.get(story.previewAssetId)
      if (!preview || preview.kind !== 'cover') {
        issues.push({
          code: 'PREVIEW_ASSET_MISSING',
          severity: 'blocker',
          message: `${story.storyId} references a missing story preview asset`,
          path: story.storyId,
        })
      }
    }
    for (const episodeId of story.episodeIds) {
      const episode = episodes.get(episodeId)
      if (!episode || episode.storyId !== story.storyId) {
        issues.push({
          code: 'INVALID_CONTENT_REFERENCE',
          severity: 'blocker',
          message: `${story.storyId} references an invalid episode ${episodeId}`,
          path: story.storyId,
        })
      }
    }
    for (const warningId of story.warningIds) {
      if (!warningsById.has(warningId)) {
        issues.push({
          code: 'INVALID_CONTENT_REFERENCE',
          severity: 'blocker',
          message: `${story.storyId} references a missing warning ${warningId}`,
          path: story.storyId,
        })
      }
    }
    if (
      character &&
      !character.isAdult &&
      story.warningIds.some(
        warningId => warningsById.get(warningId)?.category === 'sexual-themes',
      )
    ) {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${story.storyId} assigns sexual themes to a non-adult character`,
        path: story.storyId,
      })
    }
    if (character && !character.isAdult && story.rating === '18+') {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${story.storyId} is adult-only but its character is not verified as an adult`,
        path: story.storyId,
      })
    }
  }
  for (const episode of pack.episodes) {
    const story = stories.get(episode.storyId)
    if (!story || !story.episodeIds.includes(episode.episodeId)) {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${episode.episodeId} is not owned by its declared story`,
        path: episode.episodeId,
      })
    }
    if (!nodes.has(episode.entryNodeId)) {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${episode.episodeId} has a missing entry node`,
        path: episode.episodeId,
      })
    }
    for (const checkpointId of episode.checkpointIds) {
      const checkpoint = [...nodes.values()].find(
        node =>
          node.type === 'checkpoint' && node.checkpointId === checkpointId,
      )
      if (!checkpoint) {
        issues.push({
          code: 'INVALID_CONTENT_REFERENCE',
          severity: 'blocker',
          message: `${episode.episodeId} references a missing checkpoint ${checkpointId}`,
          path: episode.episodeId,
        })
      }
    }
  }

  for (const story of pack.stories) {
    const choicePointCounts = story.episodeIds
      .map(episodeId => episodes.get(episodeId))
      .filter(
        (episode): episode is ContentPackage['episodes'][number] =>
          episode !== undefined && episode.storyId === story.storyId,
      )
      .map(episode => minimumChoicePointsToEnding(episode.entryNodeId, nodes))
      .filter((count): count is number => count !== undefined)
    const shortestPath = Math.min(...choicePointCounts)
    if (shortestPath < MINIMUM_STORY_CHOICE_POINTS) {
      issues.push({
        code: 'STORY_TOO_SHORT',
        severity: 'blocker',
        message: `${story.storyId} can reach an ending after ${shortestPath} choice points; every story requires at least ${MINIMUM_STORY_CHOICE_POINTS}`,
        path: story.storyId,
      })
    }
  }

  for (const warning of pack.warnings) {
    for (const effect of warning.safeRoute.effects) {
      try {
        applyEffects(effectValidationState(effect), [effect])
      } catch (error) {
        issues.push({
          code: 'INVALID_EFFECT',
          severity: 'blocker',
          message:
            error instanceof Error
              ? `${warning.warningId}: ${error.message}`
              : `${warning.warningId} contains an invalid safe-route effect`,
          path: effect.effectId,
        })
      }
    }
    if (
      !sceneIds.has(warning.sceneId) ||
      !nodes.has(warning.safeRoute.nextNodeId)
    ) {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${warning.warningId} has a missing scene or safe-route node`,
        path: warning.warningId,
      })
    }
    if (
      !pack.stories.some(story => story.warningIds.includes(warning.warningId))
    ) {
      issues.push({
        code: 'INVALID_CONTENT_REFERENCE',
        severity: 'blocker',
        message: `${warning.warningId} is not attached to a story`,
        path: warning.warningId,
      })
    }
    if (
      warning.safeRoute.effects.some(
        effect =>
          effect.op === 'increment' &&
          effect.path.startsWith('relationships.') &&
          effect.by < 0,
      )
    ) {
      issues.push({
        code: 'UNSAFE_SAFE_ROUTE',
        severity: 'blocker',
        message: `${warning.warningId} penalizes a relationship on safe skip`,
        path: warning.warningId,
      })
    }
  }

  for (const cycleNodeId of automaticCycleNodes(nodes)) {
    issues.push({
      code: 'AUTOMATIC_CYCLE',
      severity: 'blocker',
      message: `${cycleNodeId} participates in an unbounded automatic cycle`,
      path: cycleNodeId,
    })
  }

  for (const node of pack.nodes) {
    if (node.editorial.warningProfileId) {
      const warning = warningsById.get(node.editorial.warningProfileId)
      if (!warning || warning.sceneId !== node.sceneId) {
        issues.push({
          code: 'INVALID_CONTENT_REFERENCE',
          severity: 'blocker',
          message: `${node.nodeId} references an invalid warning profile`,
          path: node.nodeId,
        })
      }
    }
    const narrativeMessages =
      node.type === 'decision'
        ? node.messageVariants.flatMap(variant => variant.messages)
        : node.type === 'reaction' ||
            node.type === 'bridge' ||
            node.type === 'ending'
          ? node.messages
          : []
    for (const message of narrativeMessages) {
      if (
        !characters.has(message.speakerId) &&
        !['narrator', 'player', 'system'].includes(message.speakerId)
      ) {
        issues.push({
          code: 'INVALID_CONTENT_REFERENCE',
          severity: 'blocker',
          message: `${message.messageId} references unknown speaker ${message.speakerId}`,
          path: message.messageId,
        })
      }
      if (message.kind === 'image') {
        const asset = message.assetId ? assets.get(message.assetId) : undefined
        if (!asset || !message.altText) {
          issues.push({
            code: 'IMAGE_ASSET_INVALID',
            severity: 'blocker',
            message: `${message.messageId} requires an existing asset and alt text`,
            path: message.messageId,
          })
        }
      }
    }
    for (const effect of nodeEffects(node)) {
      try {
        applyEffects(effectValidationState(effect), [effect])
      } catch (error) {
        issues.push({
          code: 'INVALID_EFFECT',
          severity: 'blocker',
          message:
            error instanceof Error
              ? `${node.nodeId}: ${error.message}`
              : `${node.nodeId} contains an invalid effect`,
          path: effect.effectId,
        })
      }
    }
    for (const destination of nodeDestinations(node)) {
      if (!nodes.has(destination)) {
        issues.push({
          code: 'DANGLING_REFERENCE',
          severity: 'blocker',
          message: `${node.nodeId} references missing node ${destination}`,
          path: node.nodeId,
        })
      }
    }
    if (node.type === 'decision') {
      const invalidConditionPaths = new Set(
        [
          ...node.messageVariants.flatMap(variant =>
            conditionPaths(variant.when),
          ),
          ...node.choiceSlots.flatMap(slot =>
            slot.candidates.flatMap(candidate =>
              conditionPaths(candidate.when),
            ),
          ),
        ].filter(path => !isValidConditionPath(path)),
      )
      for (const path of invalidConditionPaths) {
        issues.push({
          code: 'INVALID_CONTENT_REFERENCE',
          severity: 'blocker',
          message: `${node.nodeId} reads unsupported state path ${path}`,
          path: node.nodeId,
        })
      }
      issues.push(
        ...validateVariantSet(
          node.messageVariants,
          `${node.nodeId}.messageVariants`,
        ),
      )
      for (const slot of node.choiceSlots) {
        issues.push(
          ...validateVariantSet(
            slot.candidates,
            `${node.nodeId}.choiceSlots.${slot.slot}`,
          ),
        )
      }
      const counterfactualIssues = validateCounterfactual(node, nodes)
      if (counterfactualIssues.length === 0) {
        counterfactualValidatedDecisionCount += 1
      }
      issues.push(...counterfactualIssues)
      if (isReleaseApprovedEditorialStatus(node.editorial.status)) {
        for (const slot of node.choiceSlots) {
          for (const candidate of slot.candidates) {
            const reads = new Set(
              downstreamNodes(candidate.nextNodeId, nodes).flatMap(
                decisionConditionPaths,
              ),
            )
            for (const effect of candidate.effects) {
              const writePath = effectWritePath(effect)
              if (writePath && !reads.has(writePath)) {
                issues.push({
                  code: 'MISSING_MEMORY_PAYOFF',
                  severity: 'blocker',
                  message: `${candidate.choiceId} writes ${writePath}, but no reachable downstream decision reads it`,
                  path: candidate.choiceId,
                })
              }
            }
          }
        }
      }
    }
  }

  const reachable = collectReachable(
    [
      ...pack.episodes.map(episode => episode.entryNodeId),
      ...pack.warnings.map(warning => warning.safeRoute.nextNodeId),
    ],
    nodes,
  )
  for (const node of pack.nodes) {
    if (!reachable.has(node.nodeId)) {
      issues.push({
        code: 'UNREACHABLE_NODE',
        severity: 'blocker',
        message: `${node.nodeId} is unreachable from every episode entry`,
        path: node.nodeId,
      })
    }
  }

  for (const asset of pack.assets) {
    if (asset.provenance === 'unknown') {
      issues.push({
        code: 'ASSET_PROVENANCE_MISSING',
        severity: 'blocker',
        message: `${asset.assetId} has unknown provenance`,
        path: asset.assetId,
      })
    }
  }

  const blockers = issues.filter(issue => issue.severity === 'blocker')
  const warnings = issues.filter(issue => issue.severity === 'warning')
  const counts = countText(pack, reachable)
  const analysis = analyzeCompilation(
    pack,
    nodes,
    reachable,
    counterfactualValidatedDecisionCount,
  )
  return {
    buildId: pack.manifest.buildId,
    blockers,
    warnings,
    counts,
    analysis,
    reportHash: canonicalHash({
      buildId: pack.manifest.buildId,
      issues,
      counts,
      analysis,
    }),
  }
}

export function evaluateProductionRelease(content: ContentPackage): {
  report: CompilationReport
  gate: ProductionReleaseGate
} {
  const report = compileContentPackage(content)
  const nodes = new Map(content.nodes.map(node => [node.nodeId, node]))
  // Build the character → episode-entry index once. The previous implementation
  // repeatedly scanned every story and episode for every character, turning the
  // release gate into an O(characters × catalog) operation. At GA scale that
  // made a valid 60k-decision candidate exhaust the process before the gate
  // could report its honest status.
  const characterByStoryId = new Map(
    content.stories.map(story => [story.storyId, story.characterId]),
  )
  const entriesByCharacter = new Map<string, string[]>()
  for (const episode of content.episodes) {
    const characterId = characterByStoryId.get(episode.storyId)
    if (!characterId) continue
    const entries = entriesByCharacter.get(characterId) ?? []
    entries.push(episode.entryNodeId)
    entriesByCharacter.set(characterId, entries)
  }
  const endingsByCharacter = content.characters.map(character => {
    const entries = entriesByCharacter.get(character.characterId) ?? []
    const reachable = collectReachable(entries, nodes)
    const endings = new Set<string>()
    for (const nodeId of reachable) {
      const node = nodes.get(nodeId)
      if (node?.type === 'ending') endings.add(node.endingId)
    }
    return endings.size
  })
  const gate: ProductionReleaseGate = {
    eligible: false,
    compilerBlockers: report.blockers.length,
    nonApprovedNodes: content.nodes.filter(
      node => !isReleaseApprovedEditorialStatus(node.editorial.status),
    ).length,
    fixtureAssets: content.assets.filter(
      asset => asset.provenance === 'generated-fixture',
    ).length,
    approvedTextUnits: report.counts.approvedTextUnitCount,
    requiredApprovedTextUnits: PRODUCTION_TEXT_UNIT_GATE,
    decisionNodes: report.counts.decisionNodeCount,
    requiredDecisionNodes: 60_000,
    uniqueDecisionCharacterTexts:
      report.counts.uniqueDecisionCharacterTextCount,
    requiredUniqueDecisionCharacterTexts: 60_000,
    uniquePlayerChoiceTexts: report.counts.uniquePlayerChoiceTextCount,
    requiredUniquePlayerChoiceTexts: 240_000,
    characters: content.characters.length,
    requiredCharacters: 12,
    completedArcs: content.stories.filter(story => story.status === 'complete')
      .length,
    requiredCompletedArcs: 3,
    minimumEndingsPerCharacter:
      endingsByCharacter.length > 0 ? Math.min(...endingsByCharacter) : 0,
    requiredEndingsPerCharacter: 5,
    adultOnlyStories: content.stories.filter(story => story.rating === '18+')
      .length,
    allowedAdultOnlyStories: 0,
    signingKeyId: content.manifest.signingKeyId ?? null,
  }
  gate.eligible =
    gate.compilerBlockers === 0 &&
    gate.nonApprovedNodes === 0 &&
    gate.fixtureAssets === 0 &&
    gate.approvedTextUnits >= gate.requiredApprovedTextUnits &&
    gate.decisionNodes >= gate.requiredDecisionNodes &&
    gate.uniqueDecisionCharacterTexts >=
      gate.requiredUniqueDecisionCharacterTexts &&
    gate.uniquePlayerChoiceTexts >= gate.requiredUniquePlayerChoiceTexts &&
    gate.characters >= gate.requiredCharacters &&
    gate.completedArcs >= gate.requiredCompletedArcs &&
    gate.minimumEndingsPerCharacter >= gate.requiredEndingsPerCharacter &&
    gate.adultOnlyStories <= gate.allowedAdultOnlyStories &&
    gate.signingKeyId !== null
  return { report, gate }
}

export interface ContentPartitionOptions {
  /** Maximum number of stories in each independently downloadable shard. */
  maxStoriesPerShard?: number
}

/**
 * Splits an immutable catalog into deterministic story-owned packages.
 *
 * A shard is intentionally returned with placeholder checksum/signature
 * values. Callers must run the normal canonical checksum + signing pipeline
 * for every returned manifest before publishing it. This keeps partitioning a
 * safe content operation and prevents a copied signature from being trusted
 * for a different byte range.
 */
export function partitionContentPackage(
  content: ContentPackage,
  options: ContentPartitionOptions = {},
): ContentPackage[] {
  const maxStoriesPerShard = options.maxStoriesPerShard ?? 50
  if (!Number.isInteger(maxStoriesPerShard) || maxStoriesPerShard < 1) {
    throw new Error('maxStoriesPerShard must be a positive integer')
  }

  const stories = [...content.stories].sort((left, right) =>
    left.storyId.localeCompare(right.storyId),
  )
  const nodes = new Map(content.nodes.map(node => [node.nodeId, node]))
  const shards: ContentPackage[] = []

  for (
    let offset = 0, shardIndex = 1;
    offset < stories.length;
    offset += maxStoriesPerShard, shardIndex += 1
  ) {
    const shardStories = stories.slice(offset, offset + maxStoriesPerShard)
    const storyIds = new Set(shardStories.map(story => story.storyId))
    const characterIds = new Set(shardStories.map(story => story.characterId))
    const shardEpisodes = content.episodes.filter(episode =>
      storyIds.has(episode.storyId),
    )
    const entryNodeIds = shardEpisodes.map(episode => episode.entryNodeId)
    const warningIds = new Set(shardStories.flatMap(story => story.warningIds))
    const shardWarnings = content.warnings.filter(warning =>
      warningIds.has(warning.warningId),
    )
    const reachable = collectReachable(
      [
        ...entryNodeIds,
        ...shardWarnings.map(warning => warning.safeRoute.nextNodeId),
      ],
      nodes,
    )
    const shardNodes = content.nodes.filter(node => reachable.has(node.nodeId))
    const assetIds = new Set<string>()
    for (const story of shardStories) {
      if (story.previewAssetId) assetIds.add(story.previewAssetId)
    }
    for (const character of content.characters) {
      if (characterIds.has(character.characterId)) {
        assetIds.add(character.portraitAssetId)
      }
    }
    for (const node of shardNodes) {
      const messages =
        node.type === 'decision'
          ? node.messageVariants.flatMap(variant => variant.messages)
          : node.type === 'reaction' ||
              node.type === 'bridge' ||
              node.type === 'ending'
            ? node.messages
            : []
      for (const message of messages) {
        if (message.assetId) assetIds.add(message.assetId)
      }
    }
    const shardNumber = String(shardIndex).padStart(3, '0')
    shards.push({
      manifest: {
        ...content.manifest,
        packId: `${content.manifest.packId}.shard.${shardNumber}`,
        buildId: `${content.manifest.buildId}.shard.${shardNumber}`,
        checksum: `sha256:pending-shard-${shardNumber}`,
        signature: `ed25519:pending-shard-${shardNumber}`,
      },
      characters: content.characters.filter(character =>
        characterIds.has(character.characterId),
      ),
      stories: shardStories,
      episodes: shardEpisodes,
      nodes: shardNodes,
      warnings: shardWarnings,
      assets: content.assets.filter(asset => assetIds.has(asset.assetId)),
    })
  }

  return shards
}
