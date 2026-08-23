import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

import { generateBulkFixtureContentPackage } from '@chartalk/test-fixtures'
import { buildBundledContentArtifacts } from './generate-bundled-content-artifacts'

const bundledDirectory = resolve(process.cwd(), 'apps/mobile/src')
const shardPrefix = 'bundled-content.bulk.shard.'
const catalogPrefix = 'bundled-content.bulk.catalog.'
const shardSuffix = '.json'
const maxStoriesPerShard = 50
const content = generateBulkFixtureContentPackage()
const artifacts = buildBundledContentArtifacts(content, {
  maxStoriesPerShard,
})

await mkdir(bundledDirectory, { recursive: true })
const existingFiles = await readdir(bundledDirectory)
await Promise.all(
  existingFiles
    .filter(
      fileName =>
        (fileName.startsWith(shardPrefix) ||
          fileName.startsWith(catalogPrefix)) &&
        fileName.endsWith(shardSuffix),
    )
    .map(fileName => unlink(resolve(bundledDirectory, fileName))),
)
await Promise.all(
  artifacts.files.map(file =>
    writeFile(resolve(bundledDirectory, file.fileName), file.contents, 'utf8'),
  ),
)

console.log(
  `Bundled content generated: ${content.stories.length} stories, ${content.nodes.length} nodes, ${artifacts.totalShardByteCount} bytes; ${artifacts.shardCount} local shards (≤${maxStoriesPerShard} stories each) → ${bundledDirectory}`,
)
