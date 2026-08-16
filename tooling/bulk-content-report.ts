import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { evaluateProductionRelease } from '@chartalk/content-compiler'
import {
  BULK_FIXTURE_DEFAULTS,
  generateBulkFixtureContentPackage,
} from '@chartalk/test-fixtures'

const outputPath = resolve(
  process.env.CHARTALK_BULK_CONTENT_REPORT ??
    'artifacts/bulk-content-report.json',
)
const content = generateBulkFixtureContentPackage()
const { report, gate } = evaluateProductionRelease(content)

const counts = {
  stories: content.stories.length,
  characters: content.characters.length,
  episodes: content.episodes.length,
  nodes: content.nodes.length,
  decisions: report.counts.decisionNodeCount,
  choices: report.counts.choiceCandidateCount,
  reactions: content.nodes.filter(node => node.type === 'reaction').length,
  endings: content.nodes.filter(node => node.type === 'ending').length,
  reachableNodes: report.counts.reachableNodeCount,
  fixtureTextUnits: report.counts.fixtureTextUnitCount,
  approvedTextUnits: report.counts.approvedTextUnitCount,
}

const evidence = {
  generatedAt: new Date().toISOString(),
  source: 'generated-bulk-fixture',
  defaults: BULK_FIXTURE_DEFAULTS,
  manifest: content.manifest,
  counts,
  compiler: {
    blockers: report.blockers,
    warnings: report.warnings,
    reportHash: report.reportHash,
    analysis: {
      counterfactualValidatedDecisionCount:
        report.analysis.counterfactualValidatedDecisionCount,
      readStatePathCount: report.analysis.readStatePathCount,
      writtenStatePathCount: report.analysis.writtenStatePathCount,
      writtenNeverReadPathCount: report.analysis.writtenNeverReadPathCount,
      staticReachabilityBasisPoints:
        report.analysis.staticReachabilityBasisPoints,
    },
  },
  productionGate: gate,
  editorialStatus: 'fixture',
  editorialApprovalRequired: true,
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
})
console.info(JSON.stringify(evidence, null, 2))

if (report.blockers.length > 0) process.exitCode = 1
