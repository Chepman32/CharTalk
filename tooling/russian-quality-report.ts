import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { contentPackageSchema } from '@razvilka/content-schema'
import { auditRussianQuality } from '@razvilka/content-integrity'
import { generateBulkFixtureContentPackage } from '@razvilka/test-fixtures'

const inputArgument = process.argv[2]
const inputPath = inputArgument
  ? resolve(process.cwd(), inputArgument)
  : undefined
const outputPath = resolve(
  process.cwd(),
  'artifacts/russian-quality-report.json',
)

const parsed = inputPath
  ? contentPackageSchema.parse(JSON.parse(await readFile(inputPath, 'utf8')))
  : contentPackageSchema.parse(generateBulkFixtureContentPackage())
const quality = auditRussianQuality(parsed)
const report = {
  generatedAt: new Date().toISOString(),
  source:
    inputPath ?? '@razvilka/test-fixtures:generateBulkFixtureContentPackage',
  mode: 'automated-screen',
  humanReviewRequired: true,
  buildId: parsed.manifest.buildId,
  ...quality,
}

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8')

console.log(
  `Russian quality screen: ${quality.textUnitCount} text units, ${quality.warningIssueCount} warnings, ${quality.blockingIssueCount} blockers → ${outputPath}`,
)

if (quality.blockingIssueCount > 0) process.exitCode = 1
