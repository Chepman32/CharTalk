import {
  chmodSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs'
import { generateKeyPairSync } from 'node:crypto'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { verifyContentPackage } from '@chartalk/content-compiler/signing'
import { generateBulkFixtureContentPackage } from '@chartalk/test-fixtures'
import { mergeContentPackages } from '../apps/mobile/src/content-library'
import { describe, expect, it } from 'vitest'

import { buildContentShards, writeContentShardBundle } from './content-shards'

describe('content shard publication pipeline', () => {
  it('partitions a fixture package deterministically without pretending it is signed', () => {
    const source = generateBulkFixtureContentPackage({
      storyCount: 5,
      stageCount: 50,
    })
    const first = buildContentShards(source, {
      maxStoriesPerShard: 2,
      allowUnsigned: true,
    })
    const second = buildContentShards(source, {
      maxStoriesPerShard: 2,
      allowUnsigned: true,
    })

    expect(JSON.stringify(first)).toBe(JSON.stringify(second))
    expect(first.manifest.status).toBe('unsigned-fixture')
    expect(first.shards).toHaveLength(3)
    expect(
      first.shards.every(shard =>
        shard.manifest.signature.startsWith('ed25519:pending-shard-'),
      ),
    ).toBe(true)
    expect(first.manifest.shards.map(shard => shard.storyCount)).toEqual([
      2, 2, 1,
    ])
    expect(
      first.manifest.shards.every(shard => shard.compilerBlockers === 0),
    ).toBe(true)
  })

  it('signs every shard and verifies its exact payload with the release key', () => {
    const source = generateBulkFixtureContentPackage({
      storyCount: 4,
      stageCount: 50,
    })
    const { privateKey, publicKey } = generateKeyPairSync('ed25519')
    const result = buildContentShards(source, {
      maxStoriesPerShard: 2,
      privateKey,
      signingKeyId: 'test-shard-key-2026',
    })

    expect(result.manifest.status).toBe('signed')
    expect(result.shards).toHaveLength(2)
    for (const shard of result.shards) {
      expect(shard.manifest.signingKeyId).toBe('test-shard-key-2026')
      expect(shard.manifest.checksum).toMatch(/^sha256:[0-9a-f]{64}$/)
      expect(shard.manifest.signature).toMatch(/^ed25519:[A-Za-z0-9_-]+$/)
      expect(verifyContentPackage(shard, publicKey)).toBe(true)
    }

    expect(() =>
      buildContentShards(source, {
        maxStoriesPerShard: 2,
        privateKey,
        signingKeyId: 'test-shard-key-2026',
        requireProductionGate: true,
      }),
    ).toThrow(/"signingKeyId":"test-shard-key-2026"/)
  })

  it('writes mode-restricted shard JSON and a deterministic manifest', () => {
    const source = generateBulkFixtureContentPackage({
      storyCount: 3,
      stageCount: 50,
    })
    const result = buildContentShards(source, {
      maxStoriesPerShard: 2,
      allowUnsigned: true,
    })
    const outputDirectory = mkdtempSync(join(tmpdir(), 'chartalk-shards-'))
    const written = writeContentShardBundle(result, outputDirectory)

    expect(written.shardPaths).toHaveLength(2)
    expect(readFileSync(written.manifestPath, 'utf8')).toContain(
      '"status": "unsigned-fixture"',
    )
    expect(statSync(outputDirectory).mode & 0o777).toBe(0o700)
    expect(statSync(written.manifestPath).mode & 0o777).toBe(0o600)
    expect(statSync(written.shardPaths[0]!).mode & 0o777).toBe(0o600)

    // Reusing a pre-existing directory must tighten permissions again and
    // leave no partial file that could be mistaken for a published shard.
    chmodSync(outputDirectory, 0o755)
    chmodSync(written.manifestPath, 0o644)
    chmodSync(written.shardPaths[0]!, 0o644)
    writeContentShardBundle(result, outputDirectory)
    expect(statSync(outputDirectory).mode & 0o777).toBe(0o700)
    expect(statSync(written.manifestPath).mode & 0o777).toBe(0o600)
    expect(statSync(written.shardPaths[0]!).mode & 0o777).toBe(0o600)
    expect(
      readdirSync(outputDirectory).some(name => name.endsWith('.partial')),
    ).toBe(false)
  })

  it('can be reassembled by the mobile content library without losing graph records', () => {
    const source = generateBulkFixtureContentPackage({
      storyCount: 7,
      stageCount: 50,
    })
    const result = buildContentShards(source, {
      maxStoriesPerShard: 2,
      allowUnsigned: true,
    })
    const merged = mergeContentPackages(result.shards)

    expect(merged.stories.map(story => story.storyId).sort()).toEqual(
      source.stories.map(story => story.storyId).sort(),
    )
    expect(merged.episodes).toHaveLength(source.episodes.length)
    expect(merged.nodes).toHaveLength(source.nodes.length)
    expect(merged.assets).toHaveLength(source.assets.length)
  })
})
