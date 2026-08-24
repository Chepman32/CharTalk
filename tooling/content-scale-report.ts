import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { evaluateProductionRelease } from '@razvilka/content-compiler'
import {
  BULK_FIXTURE_SCALE_DEFAULTS,
  generateBulkFixtureContentPackage,
} from '@razvilka/test-fixtures'

import { buildContentShards } from './content-shards'

const startedAt = Date.now()
const content = generateBulkFixtureContentPackage(BULK_FIXTURE_SCALE_DEFAULTS)
const { report, gate } = evaluateProductionRelease(content)
const shardBundle = buildContentShards(content, {
  maxStoriesPerShard: 50,
  allowUnsigned: true,
})
const output = {
  generatedAt: new Date().toISOString(),
  source: 'generated-bulk-fixture-scale-candidate',
  defaults: BULK_FIXTURE_SCALE_DEFAULTS,
  elapsedMs: Date.now() - startedAt,
  counts: {
    stories: content.stories.length,
    characters: content.characters.length,
    episodes: content.episodes.length,
    nodes: content.nodes.length,
    decisions: report.counts.decisionNodeCount,
    choices: report.counts.choiceCandidateCount,
    reactions: content.nodes.filter(node => node.type === 'reaction').length,
    endings: content.nodes.filter(node => node.type === 'ending').length,
    reachableNodes: report.counts.reachableNodeCount,
    uniqueDecisionCharacterTexts:
      report.counts.uniqueDecisionCharacterTextCount,
    uniquePlayerChoiceTexts: report.counts.uniquePlayerChoiceTextCount,
    fixtureTextUnits: report.counts.fixtureTextUnitCount,
    approvedTextUnits: report.counts.approvedTextUnitCount,
  },
  shards: {
    maxStoriesPerShard: shardBundle.manifest.maxStoriesPerShard,
    shardCount: shardBundle.manifest.shards.length,
    totalShardNodes: shardBundle.manifest.shards.reduce(
      (total, shard) => total + shard.nodeCount,
      0,
    ),
    totalShardBytes: shardBundle.manifest.shards.reduce(
      (total, shard) => total + shard.byteCount,
      0,
    ),
    compilerBlockers: shardBundle.manifest.shards.reduce(
      (total, shard) => total + shard.compilerBlockers,
      0,
    ),
    summaries: shardBundle.manifest.shards,
  },
  compiler: {
    blockers: report.blockers,
    warnings: report.warnings,
    reportHash: report.reportHash,
  },
  productionGate: gate,
  editorialStatus: 'fixture',
  editorialApprovalRequired: true,
  note: 'Structural scale evidence only. Generated fixture text and fixture assets are barred from public GA approval.',
}

const outputPath = resolve('artifacts/content-scale-report.json')
writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, {
  mode: 0o600,
})
console.log(JSON.stringify(output, null, 2))
