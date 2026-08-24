import { generateBulkFixtureContentPackage } from '@razvilka/test-fixtures'
import { describe, expect, it } from 'vitest'

import { buildBundledContentArtifacts } from './generate-bundled-content-artifacts'

const githubFileSizeLimit = 100 * 1024 * 1024

describe('bundled content generation', () => {
  it('emits independently pushable shards without a monolithic duplicate', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 5,
      stageCount: 50,
    })

    const result = buildBundledContentArtifacts(content, {
      maxStoriesPerShard: 2,
    })

    expect(result.files.map(file => file.fileName)).toEqual([
      'bundled-content.bulk.shard.001.json',
      'bundled-content.bulk.catalog.001.json',
      'bundled-content.bulk.shard.002.json',
      'bundled-content.bulk.catalog.002.json',
      'bundled-content.bulk.shard.003.json',
      'bundled-content.bulk.catalog.003.json',
      'bundled-content.bulk.sizes.json',
    ])
    expect(
      result.files.every(
        file => Buffer.byteLength(file.contents) < githubFileSizeLimit,
      ),
    ).toBe(true)
    expect(
      result.files
        .filter(file => file.fileName.includes('.catalog.'))
        .every(file => {
          const parsed = JSON.parse(file.contents) as { nodes: unknown[] }
          return parsed.nodes.length === 0
        }),
    ).toBe(true)
  })

  it('records each shard JSON payload size without its trailing newline', () => {
    const content = generateBulkFixtureContentPackage({
      storyCount: 3,
      stageCount: 50,
    })

    const result = buildBundledContentArtifacts(content, {
      maxStoriesPerShard: 2,
    })
    const sizesFile = result.files.find(
      file => file.fileName === 'bundled-content.bulk.sizes.json',
    )
    const sizes = JSON.parse(sizesFile!.contents) as Record<string, number>

    for (const file of result.files.filter(file =>
      file.fileName.includes('.shard.'),
    )) {
      const shard = JSON.parse(file.contents) as {
        manifest: { packId: string }
      }
      expect(sizes[shard.manifest.packId]).toBe(
        Buffer.byteLength(file.contents.trimEnd()),
      )
    }
  })
})
