import { mkdir, readdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

import { partitionContentPackage } from '@chartalk/content-compiler'
import { generateBulkFixtureContentPackage } from '@chartalk/test-fixtures'

const outputPath = resolve(
  process.cwd(),
  'apps/mobile/src/bundled-content.bulk.json',
)
const shardPrefix = 'bundled-content.bulk.shard.'
const catalogPrefix = 'bundled-content.bulk.catalog.'
const shardSuffix = '.json'
const sizesPath = resolve(
  process.cwd(),
  'apps/mobile/src/bundled-content.bulk.sizes.json',
)
const maxStoriesPerShard = 50
const content = generateBulkFixtureContentPackage()
const serialized = `${JSON.stringify(content)}\n`
const shards = partitionContentPackage(content, {
  maxStoriesPerShard,
})

await mkdir(dirname(outputPath), { recursive: true })
await writeFile(outputPath, serialized, 'utf8')

const bundledDirectory = dirname(outputPath)
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
const shardSizes: Record<string, number> = {}
await Promise.all(
  shards.map((shard, index) => {
    const fileName = `${shardPrefix}${String(index + 1).padStart(3, '0')}${shardSuffix}`
    const catalogFileName = `${catalogPrefix}${String(index + 1).padStart(3, '0')}${shardSuffix}`
    const shardJson = JSON.stringify(shard)
    const shardSerialized = `${shardJson}\n`
    // Keep the catalog's byte count aligned with contentPackageByteCount,
    // which measures the JSON payload itself (without the file's trailing LF).
    shardSizes[shard.manifest.packId] = Buffer.byteLength(shardJson)
    const catalog = { ...shard, nodes: [] }
    return writeFile(
      resolve(bundledDirectory, fileName),
      shardSerialized,
      'utf8',
    ).then(() =>
      writeFile(
        resolve(bundledDirectory, catalogFileName),
        `${JSON.stringify(catalog)}\n`,
        'utf8',
      ),
    )
  }),
)
await writeFile(sizesPath, `${JSON.stringify(shardSizes, null, 2)}\n`, 'utf8')

console.log(
  `Bundled content generated: ${content.stories.length} stories, ${content.nodes.length} nodes, ${Buffer.byteLength(serialized)} bytes; ${shards.length} local shards (≤${maxStoriesPerShard} stories each) → ${outputPath}`,
)
