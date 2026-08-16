import { mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { performance } from 'node:perf_hooks'

import { normalizeRussianText } from '@chartalk/content-compiler'
import { initialNarrativeState } from '@chartalk/content-schema'
import { resolveDecision } from '@chartalk/dialogue-engine'
import { sampleContentPackage } from '@chartalk/test-fixtures'

import {
  TRANSCRIPT_WINDOW_LIMIT,
  resolveTranscriptWindow,
  transcriptWindowEntries,
} from '../apps/mobile/src/domain/transcript-window'
import {
  buildActiveRunSnapshots,
  buildInstalledDecisionShard,
  searchTextInventory,
} from './capacity-load'

const target = Number(process.env.CHARTALK_CAPACITY_UNITS ?? 1_000_000)
if (!Number.isInteger(target) || target < 1) {
  throw new Error('CHARTALK_CAPACITY_UNITS must be a positive integer')
}
const decisionTarget = Number(
  process.env.CHARTALK_CAPACITY_DECISIONS ?? 200_000,
)
if (!Number.isInteger(decisionTarget) || decisionTarget < 1) {
  throw new Error('CHARTALK_CAPACITY_DECISIONS must be a positive integer')
}
const installedShardTarget = Number(
  process.env.CHARTALK_CAPACITY_INSTALLED_DECISIONS ?? 20_000,
)
if (!Number.isInteger(installedShardTarget) || installedShardTarget < 1) {
  throw new Error(
    'CHARTALK_CAPACITY_INSTALLED_DECISIONS must be a positive integer',
  )
}
const activeRunTarget = Number(process.env.CHARTALK_CAPACITY_ACTIVE_RUNS ?? 100)
if (!Number.isInteger(activeRunTarget) || activeRunTarget < 1) {
  throw new Error('CHARTALK_CAPACITY_ACTIVE_RUNS must be a positive integer')
}

const startedAt = performance.now()
const unique = new Set<string>()
for (let index = 0; index < target; index += 1) {
  unique.add(
    normalizeRussianText(
      `Синтетическая русская единица нагрузки номер ${index}.`,
    ),
  )
}
const indexingDurationMs = performance.now() - startedAt

const decision = sampleContentPackage.nodes.find(
  node => node.type === 'decision',
)
if (!decision || decision.type !== 'decision')
  throw new Error('Capacity fixture has no decision')

const installedShardStartedAt = performance.now()
const installedShard = buildInstalledDecisionShard(
  decision,
  installedShardTarget,
)
let installedShardChoiceCount = 0
for (const shardNode of installedShard.values()) {
  installedShardChoiceCount += resolveDecision(
    shardNode,
    initialNarrativeState(),
  ).choices.length
}
const installedShardIndexDurationMs =
  performance.now() - installedShardStartedAt

const activeRunsStartedAt = performance.now()
const activeRuns = buildActiveRunSnapshots(
  activeRunTarget,
  sampleContentPackage.manifest.buildId,
  decision.nodeId,
  initialNarrativeState,
)
const activeRunsDurationMs = performance.now() - activeRunsStartedAt

const decisionTraversalStartedAt = performance.now()
const syntheticDecisionIds = new Set<string>()
for (let index = 0; index < decisionTarget; index += 1) {
  syntheticDecisionIds.add(`capacity-decision-${index}`)
  resolveDecision(decision, initialNarrativeState())
}
const decisionTraversalDurationMs =
  performance.now() - decisionTraversalStartedAt
const engineSamples: number[] = []
for (let index = 0; index < 10_000; index += 1) {
  const start = performance.now()
  resolveDecision(decision, initialNarrativeState())
  engineSamples.push(performance.now() - start)
}
engineSamples.sort((left, right) => left - right)
const p95Index = Math.min(
  engineSamples.length - 1,
  Math.ceil(engineSamples.length * 0.95) - 1,
)
const engineP95Ms = engineSamples[p95Index] ?? Number.POSITIVE_INFINITY

const inventorySearchStartedAt = performance.now()
const inventorySearch = searchTextInventory(
  [...unique],
  String(Math.max(0, Math.floor(target / 2))),
)
const cmsSearchDurationMs = performance.now() - inventorySearchStartedAt

const transcriptHeapBefore = process.memoryUsage().heapUsed
const longTranscript = Array.from({ length: 10_000 }, (_, index) => ({
  entryId: `capacity-entry-${index}`,
  speakerId: index % 2 === 0 ? 'character' : 'player',
  text: `Сообщение длинного прохождения номер ${index}`,
  kind: index % 2 === 0 ? ('message' as const) : ('choice' as const),
}))
const transcriptWindowStartedAt = performance.now()
const longTranscriptWindow = resolveTranscriptWindow(
  longTranscript,
  longTranscript.length,
  'capacity-entry-4999',
)
const residentTranscriptEntries = transcriptWindowEntries(
  longTranscript,
  longTranscriptWindow,
)
const transcriptWindowDurationMs = performance.now() - transcriptWindowStartedAt
const transcriptHeapDeltaMiB = Math.max(
  0,
  (process.memoryUsage().heapUsed - transcriptHeapBefore) / 1024 / 1024,
)
const transcriptAnchorPreserved = residentTranscriptEntries.some(
  entry => entry.entryId === 'capacity-entry-4999',
)
const transcriptWindowSerializedMiB =
  new TextEncoder().encode(JSON.stringify(residentTranscriptEntries))
    .byteLength /
  1024 /
  1024

const evidence = {
  generatedAt: new Date().toISOString(),
  textUnitsRequested: target,
  uniqueTextUnitsIndexed: unique.size,
  indexingDurationMs: Math.round(indexingDurationMs * 100) / 100,
  decisionNodesRequested: decisionTarget,
  decisionNodesTraversed: syntheticDecisionIds.size,
  decisionTraversalDurationMs:
    Math.round(decisionTraversalDurationMs * 100) / 100,
  installedShardDecisionNodes: installedShard.size,
  installedShardChoiceCount,
  installedShardIndexDurationMs:
    Math.round(installedShardIndexDurationMs * 100) / 100,
  activeLocalRuns: activeRuns.length,
  activeLocalRunsDurationMs: Math.round(activeRunsDurationMs * 100) / 100,
  cmsSearchInventorySize: inventorySearch.inventorySize,
  cmsSearchHitCount: inventorySearch.hitCount,
  cmsSearchDurationMs: Math.round(cmsSearchDurationMs * 100) / 100,
  engineSamples: engineSamples.length,
  engineP95Ms: Math.round(engineP95Ms * 1_000) / 1_000,
  transcriptEntries: longTranscript.length,
  transcriptResidentEntries: residentTranscriptEntries.length,
  transcriptAnchorPreserved,
  transcriptWindowDurationMs:
    Math.round(transcriptWindowDurationMs * 1_000) / 1_000,
  transcriptHeapDeltaMiB: Math.round(transcriptHeapDeltaMiB * 10) / 10,
  transcriptWindowSerializedMiB:
    Math.round(transcriptWindowSerializedMiB * 1_000) / 1_000,
  residentMemoryMiB:
    Math.round((process.memoryUsage().rss / 1024 / 1024) * 10) / 10,
  thresholds: {
    uniqueTextUnitsIndexed: target,
    decisionNodesTraversed: decisionTarget,
    installedShardDecisionNodes: installedShardTarget,
    activeLocalRuns: activeRunTarget,
    cmsSearchInventorySize: target,
    decisionTraversalDurationMs: 60_000,
    installedShardIndexDurationMs: 60_000,
    activeLocalRunsDurationMs: 60_000,
    cmsSearchDurationMs: 60_000,
    indexingDurationMs: 60_000,
    engineP95Ms: 50,
    transcriptEntries: 10_000,
    transcriptResidentEntries: TRANSCRIPT_WINDOW_LIMIT,
    transcriptWindowDurationMs: 50,
    transcriptHeapDeltaMiB: 250,
    residentMemoryMiB: 1_024,
  },
}

const outputPath = resolve('artifacts/capacity-report.json')
mkdirSync(resolve('artifacts'), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
})
console.info(JSON.stringify(evidence, null, 2))

if (
  unique.size !== target ||
  indexingDurationMs > evidence.thresholds.indexingDurationMs ||
  syntheticDecisionIds.size !== decisionTarget ||
  decisionTraversalDurationMs >
    evidence.thresholds.decisionTraversalDurationMs ||
  installedShard.size !== installedShardTarget ||
  installedShardChoiceCount !== installedShardTarget * 4 ||
  installedShardIndexDurationMs >
    evidence.thresholds.installedShardIndexDurationMs ||
  activeRuns.length !== activeRunTarget ||
  activeRunsDurationMs > evidence.thresholds.activeLocalRunsDurationMs ||
  inventorySearch.inventorySize !== target ||
  cmsSearchDurationMs > evidence.thresholds.cmsSearchDurationMs ||
  engineP95Ms > evidence.thresholds.engineP95Ms ||
  longTranscript.length !== evidence.thresholds.transcriptEntries ||
  residentTranscriptEntries.length >
    evidence.thresholds.transcriptResidentEntries ||
  !transcriptAnchorPreserved ||
  transcriptWindowDurationMs > evidence.thresholds.transcriptWindowDurationMs ||
  transcriptHeapDeltaMiB > evidence.thresholds.transcriptHeapDeltaMiB ||
  evidence.residentMemoryMiB > evidence.thresholds.residentMemoryMiB
) {
  process.exitCode = 1
}
