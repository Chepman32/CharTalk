import { createPrivateKey } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { evaluateProductionRelease } from '@chartalk/content-compiler'
import { signContentPackage } from '@chartalk/content-compiler/signing'
import { contentPackageSchema } from '@chartalk/content-schema'

const [inputArgument, outputArgument] = process.argv.slice(2)
const keyPath = process.env.CHARTALK_SIGNING_PRIVATE_KEY_FILE
const signingKeyId = process.env.CHARTALK_SIGNING_KEY_ID
if (!inputArgument || !outputArgument || !keyPath || !signingKeyId) {
  throw new Error(
    'Usage: CHARTALK_SIGNING_PRIVATE_KEY_FILE=/secure/key.pem CHARTALK_SIGNING_KEY_ID=prod-2026-q3 npm run sign:content -- input.json output.json',
  )
}

const inputPath = resolve(inputArgument)
const outputPath = resolve(outputArgument)
const parsedContent = contentPackageSchema.parse(
  JSON.parse(readFileSync(inputPath, 'utf8')),
)
const content = contentPackageSchema.parse({
  ...parsedContent,
  manifest: { ...parsedContent.manifest, signingKeyId },
})
const { gate } = evaluateProductionRelease(content)
if (!gate.eligible) {
  throw new Error(`Content is not production-eligible: ${JSON.stringify(gate)}`)
}

const signed = signContentPackage(
  content,
  createPrivateKey(readFileSync(resolve(keyPath), 'utf8')),
)
mkdirSync(dirname(outputPath), { recursive: true })
writeFileSync(outputPath, `${JSON.stringify(signed, null, 2)}\n`, {
  mode: 0o600,
})
console.info(`Signed ${signed.manifest.buildId} -> ${outputPath}`)
