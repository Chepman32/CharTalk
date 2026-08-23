import { partitionContentPackage } from '@chartalk/content-compiler'
import type { ContentPackage } from '@chartalk/content-schema'

export interface BundledContentArtifact {
  fileName: string
  contents: string
}

export interface BuildBundledContentArtifactsOptions {
  maxStoriesPerShard: number
}

export interface BundledContentArtifacts {
  files: BundledContentArtifact[]
  shardCount: number
  totalShardByteCount: number
}

export const buildBundledContentArtifacts = (
  content: ContentPackage,
  options: BuildBundledContentArtifactsOptions,
): BundledContentArtifacts => {
  const shards = partitionContentPackage(content, options)
  const files: BundledContentArtifact[] = []
  const shardSizes: Record<string, number> = {}

  for (const [index, shard] of shards.entries()) {
    const fileNumber = String(index + 1).padStart(3, '0')
    const shardJson = JSON.stringify(shard)
    const catalog = { ...shard, nodes: [] }

    // Keep the catalog's byte count aligned with contentPackageByteCount,
    // which measures the JSON payload itself (without the file's trailing LF).
    shardSizes[shard.manifest.packId] = Buffer.byteLength(shardJson)
    files.push(
      {
        fileName: `bundled-content.bulk.shard.${fileNumber}.json`,
        contents: `${shardJson}\n`,
      },
      {
        fileName: `bundled-content.bulk.catalog.${fileNumber}.json`,
        contents: `${JSON.stringify(catalog)}\n`,
      },
    )
  }

  files.push({
    fileName: 'bundled-content.bulk.sizes.json',
    contents: `${JSON.stringify(shardSizes, null, 2)}\n`,
  })

  return {
    files,
    shardCount: shards.length,
    totalShardByteCount: Object.values(shardSizes).reduce(
      (total, byteCount) => total + byteCount,
      0,
    ),
  }
}
