import { chmodSync, mkdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { KeyLike } from 'node:crypto'

import {
  compileContentPackage,
  evaluateProductionRelease,
  partitionContentPackage,
} from '@chartalk/content-compiler'
import { signContentPackage } from '@chartalk/content-compiler/signing'
import {
  contentPackageSchema,
  type ContentPackage,
} from '@chartalk/content-schema'

export interface ContentShardBuildOptions {
  maxStoriesPerShard?: number
  privateKey?: KeyLike
  signingKeyId?: string
  allowUnsigned?: boolean
  requireProductionGate?: boolean
}

export interface ContentShardSummary {
  fileName: string
  packId: string
  buildId: string
  storyCount: number
  nodeCount: number
  decisionNodeCount: number
  choiceCandidateCount: number
  byteCount: number
  checksum: string
  signature: string
  compilerBlockers: number
  compilerWarnings: number
}

export interface ContentShardManifest {
  schemaVersion: 1
  sourcePackId: string
  sourceBuildId: string
  maxStoriesPerShard: number
  status: 'signed' | 'unsigned-fixture'
  shards: ContentShardSummary[]
}

export interface ContentShardBundle {
  shards: ContentPackage[]
  manifest: ContentShardManifest
}

export interface WrittenContentShardBundle {
  manifestPath: string
  shardPaths: string[]
}

function shardFileName(index: number): string {
  return `shard-${String(index + 1).padStart(3, '0')}.json`
}

function serializedSize(content: ContentPackage): number {
  return Buffer.byteLength(`${JSON.stringify(content, null, 2)}\n`, 'utf8')
}

export function buildContentShards(
  content: ContentPackage,
  options: ContentShardBuildOptions = {},
): ContentShardBundle {
  const maxStoriesPerShard = options.maxStoriesPerShard ?? 50
  if (!Number.isInteger(maxStoriesPerShard) || maxStoriesPerShard < 1) {
    throw new Error('maxStoriesPerShard must be a positive integer')
  }
  if (options.privateKey && !options.signingKeyId) {
    throw new Error('signingKeyId is required when privateKey is provided')
  }
  if (options.signingKeyId && !options.privateKey) {
    throw new Error('privateKey is required when signingKeyId is provided')
  }
  if (!options.privateKey && !options.allowUnsigned) {
    throw new Error(
      'A signing key is required; set allowUnsigned only for local fixture output',
    )
  }

  const parsed = contentPackageSchema.parse(content)
  if (options.requireProductionGate) {
    // The signing key id is a release-manifest field. Apply the requested
    // production identity before evaluating the gate, matching the standalone
    // sign:content command; otherwise a valid source package would be rejected
    // solely because the shard step has not materialised its final manifest yet.
    const gateContent = options.signingKeyId
      ? contentPackageSchema.parse({
          ...parsed,
          manifest: {
            ...parsed.manifest,
            signingKeyId: options.signingKeyId,
          },
        })
      : parsed
    const { gate } = evaluateProductionRelease(gateContent)
    if (!gate.eligible) {
      throw new Error(
        `Content is not production-eligible: ${JSON.stringify(gate)}`,
      )
    }
  }

  const rawShards = partitionContentPackage(parsed, { maxStoriesPerShard })
  const shards = rawShards.map((rawShard, index) => {
    const candidate = contentPackageSchema.parse({
      ...rawShard,
      ...(options.signingKeyId
        ? {
            manifest: {
              ...rawShard.manifest,
              signingKeyId: options.signingKeyId,
            },
          }
        : {}),
    })
    const report = compileContentPackage(candidate)
    if (report.blockers.length > 0) {
      throw new Error(
        `Shard ${index + 1} has compiler blockers: ${JSON.stringify(report.blockers)}`,
      )
    }
    return options.privateKey
      ? signContentPackage(candidate, options.privateKey)
      : candidate
  })

  const status = options.privateKey ? 'signed' : 'unsigned-fixture'
  const summaries = shards.map((shard, index) => {
    const report = compileContentPackage(shard)
    return {
      fileName: shardFileName(index),
      packId: shard.manifest.packId,
      buildId: shard.manifest.buildId,
      storyCount: shard.stories.length,
      nodeCount: shard.nodes.length,
      decisionNodeCount: report.counts.decisionNodeCount,
      choiceCandidateCount: report.counts.choiceCandidateCount,
      byteCount: serializedSize(shard),
      checksum: shard.manifest.checksum,
      signature: shard.manifest.signature,
      compilerBlockers: report.blockers.length,
      compilerWarnings: report.warnings.length,
    }
  })

  return {
    shards,
    manifest: {
      schemaVersion: 1,
      sourcePackId: parsed.manifest.packId,
      sourceBuildId: parsed.manifest.buildId,
      maxStoriesPerShard,
      status,
      shards: summaries,
    },
  }
}

export function writeContentShardBundle(
  bundle: ContentShardBundle,
  outputDirectory: string,
): WrittenContentShardBundle {
  mkdirSync(outputDirectory, { recursive: true, mode: 0o700 })
  // `mode` is only applied on creation by Node. Re-assert it on every run so
  // a reused release workspace cannot inherit broader permissions.
  chmodSync(outputDirectory, 0o700)
  const shardPaths = bundle.shards.map((shard, index) => {
    const path = join(outputDirectory, shardFileName(index))
    const temporaryPath = `${path}.partial`
    writeFileSync(temporaryPath, `${JSON.stringify(shard, null, 2)}\n`, {
      mode: 0o600,
    })
    chmodSync(temporaryPath, 0o600)
    renameSync(temporaryPath, path)
    chmodSync(path, 0o600)
    return path
  })
  const manifestPath = join(outputDirectory, 'manifest.json')
  const temporaryManifestPath = `${manifestPath}.partial`
  writeFileSync(
    temporaryManifestPath,
    `${JSON.stringify(bundle.manifest, null, 2)}\n`,
    {
      mode: 0o600,
    },
  )
  chmodSync(temporaryManifestPath, 0o600)
  // Publish the manifest last; readers treat it as the commit marker for the
  // complete shard set and never observe a partially written manifest.
  renameSync(temporaryManifestPath, manifestPath)
  chmodSync(manifestPath, 0o600)
  return { manifestPath, shardPaths }
}
