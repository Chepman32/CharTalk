import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { contentPackageSchema } from '@chartalk/content-schema'
import { auditRussianQuality } from '@chartalk/content-integrity'

const inputPath = resolve(
  process.cwd(),
  process.argv[2] ?? 'apps/mobile/src/bundled-content.bulk.json',
)
const outputPath = resolve(
  process.cwd(),
  'artifacts/russian-quality-report.json',
)

const source = await readFile(inputPath, 'utf8')
const parsed = contentPackageSchema.parse(JSON.parse(source))
const quality = auditRussianQuality(parsed)
const report = {
  generatedAt: new Date().toISOString(),
  source: inputPath,
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
