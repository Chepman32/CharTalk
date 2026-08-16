import {
  initialNarrativeState,
  type DecisionNode,
  type NarrativeState,
} from '@chartalk/content-schema'

export interface CapacityTranscriptEntry {
  entryId: string
  speakerId: 'character' | 'player'
  text: string
  kind: 'message' | 'choice'
}

export interface CapacityRunSnapshot {
  runId: string
  contentBuildId: string
  activeNodeId: string
  sequence: number
  state: NarrativeState
  transcript: CapacityTranscriptEntry[]
}

const assertPositiveInteger = (value: number, name: string): void => {
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new RangeError(`${name} must be a positive safe integer`)
  }
}

/**
 * Builds the same addressable node index that a local content shard keeps at
 * runtime. Nested authored arrays remain shared because the compiled package
 * is immutable; only the node identity and scene partition vary per entry.
 */
export function buildInstalledDecisionShard(
  template: DecisionNode,
  count: number,
): Map<string, DecisionNode> {
  assertPositiveInteger(count, 'count')
  const shard = new Map<string, DecisionNode>()
  for (let index = 0; index < count; index += 1) {
    const nodeId = `capacity-shard-decision-${index}`
    shard.set(nodeId, {
      ...template,
      nodeId,
      sceneId: `${template.sceneId}.capacity.${index}`,
    })
  }
  return shard
}

/**
 * Creates bounded local-run snapshots with independent mutable containers.
 * This models simultaneous foreground/background runs without requiring a
 * network account or pretending that cloud sync is part of v1.
 */
export function buildActiveRunSnapshots(
  count: number,
  contentBuildId: string,
  activeNodeId: string,
  initialState: () => NarrativeState = initialNarrativeState,
): CapacityRunSnapshot[] {
  assertPositiveInteger(count, 'count')
  if (!contentBuildId.trim() || !activeNodeId.trim()) {
    throw new Error('contentBuildId and activeNodeId are required')
  }

  return Array.from({ length: count }, (_, index) => ({
    runId: `capacity-run-${index}`,
    contentBuildId,
    activeNodeId,
    sequence: index,
    state: initialState(),
    transcript: [
      {
        entryId: `capacity-run-${index}-entry-0`,
        speakerId: 'character' as const,
        text: `capacity transcript ${index}`,
        kind: 'message' as const,
      },
    ],
  }))
}

export interface TextInventorySearchResult {
  inventorySize: number
  hitCount: number
}

/** Searches every indexed text unit, including an empty-query inventory scan. */
export function searchTextInventory(
  inventory: readonly string[],
  query: string,
): TextInventorySearchResult {
  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU')
  const hitCount = inventory.reduce((count, value) => {
    const normalizedValue = value.toLocaleLowerCase('ru-RU')
    return normalizedQuery === '' || normalizedValue.includes(normalizedQuery)
      ? count + 1
      : count
  }, 0)
  return { inventorySize: inventory.length, hitCount }
}
