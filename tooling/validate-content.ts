import { createPublicKey } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import {
  compileContentPackage,
  evaluateProductionRelease,
} from '@razvilka/content-compiler'
import { verifyContentPackage } from '@razvilka/content-compiler/signing'
import { contentPackageSchema } from '@razvilka/content-schema'
import { sampleContentPackage } from '@razvilka/test-fixtures'

const argumentsList = process.argv.slice(2)
const valueAfter = (flag: string): string | undefined => {
  const index = argumentsList.indexOf(flag)
  return index >= 0 ? argumentsList[index + 1] : undefined
}

const inputPath = valueAfter('--input') ?? process.env.RAZVILKA_RELEASE_PACKAGE
const publicKeyPath =
  valueAfter('--public-key') ?? process.env.RAZVILKA_SIGNING_PUBLIC_KEY_FILE
const outputPath = resolve(
  valueAfter('--output') ?? 'artifacts/content-validation.json',
)
const release = argumentsList.includes('--release')

const raw = inputPath
  ? (JSON.parse(readFileSync(resolve(inputPath), 'utf8')) as unknown)
  : sampleContentPackage
const parsed = contentPackageSchema.safeParse(raw)
const compilation = compileContentPackage(raw)
const production = parsed.success
  ? evaluateProductionRelease(parsed.data).gate
  : {
      eligible: false,
      compilerBlockers: compilation.blockers.length,
      nonApprovedNodes: 0,
      fixtureAssets: 0,
      approvedTextUnits: 0,
      requiredApprovedTextUnits: 300_000,
    }

let signatureVerified: boolean | null = null
if (parsed.success && publicKeyPath) {
  signatureVerified = verifyContentPackage(
    parsed.data,
    createPublicKey(readFileSync(resolve(publicKeyPath), 'utf8')),
  )
}

const evidence = {
  generatedAt: new Date().toISOString(),
  source: inputPath ? resolve(inputPath) : 'bundled-development-fixture',
  mode: release ? 'production-release' : 'development-validation',
  compilation,
  production,
  signatureVerified,
}

mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(evidence, null, 2)}\n`, {
  mode: 0o600,
})
console.info(JSON.stringify(evidence, null, 2))

const signatureRequiredButMissing = release && signatureVerified !== true
if (
  compilation.blockers.length > 0 ||
  (release && !production.eligible) ||
  signatureRequiredButMissing
) {
  process.exitCode = 1
}
