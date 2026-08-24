import { createPrivateKey } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { contentPackageSchema } from '@razvilka/content-schema'

import { buildContentShards, writeContentShardBundle } from './content-shards'

const [inputArgument, outputArgument] = process.argv.slice(2)
const keyPath = process.env.RAZVILKA_SIGNING_PRIVATE_KEY_FILE
const signingKeyId = process.env.RAZVILKA_SIGNING_KEY_ID
const allowUnsigned = process.env.RAZVILKA_ALLOW_UNSIGNED_SHARDS === 'true'
const maxStoriesPerShard = Number(
  process.env.RAZVILKA_MAX_STORIES_PER_SHARD ?? 50,
)

if (!inputArgument || !outputArgument) {
  throw new Error(
    'Usage: RAZVILKA_SIGNING_PRIVATE_KEY_FILE=/secure/key.pem RAZVILKA_SIGNING_KEY_ID=prod-2026-q3 npm run partition:content -- input.json output-directory',
  )
}
if (!allowUnsigned && (!keyPath || !signingKeyId)) {
  throw new Error(
    'Production shard output requires RAZVILKA_SIGNING_PRIVATE_KEY_FILE and RAZVILKA_SIGNING_KEY_ID',
  )
}
if (!Number.isInteger(maxStoriesPerShard) || maxStoriesPerShard < 1) {
  throw new Error('RAZVILKA_MAX_STORIES_PER_SHARD must be a positive integer')
}

const content = contentPackageSchema.parse(
  JSON.parse(readFileSync(resolve(inputArgument), 'utf8')),
)
const options = {
  maxStoriesPerShard,
  allowUnsigned,
  requireProductionGate: !allowUnsigned,
  ...(keyPath && signingKeyId
    ? {
        privateKey: createPrivateKey(readFileSync(resolve(keyPath), 'utf8')),
        signingKeyId,
      }
    : {}),
}
const bundle = buildContentShards(content, options)
const written = writeContentShardBundle(bundle, resolve(outputArgument))

console.info(
  JSON.stringify(
    {
      status: bundle.manifest.status,
      sourceBuildId: bundle.manifest.sourceBuildId,
      shardCount: bundle.shards.length,
      manifestPath: written.manifestPath,
      shardPaths: written.shardPaths,
    },
    null,
    2,
  ),
)
