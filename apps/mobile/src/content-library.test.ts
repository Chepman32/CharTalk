import { describe, expect, it } from 'vitest'

import {
  generateBulkFixtureContentPackage,
  sampleContentPackage,
} from '@chartalk/test-fixtures'

import { mergeContentPackages } from './content-library'

describe('mobile content catalog', () => {
  it('keeps distinct packs and lets a newer build replace stable IDs', () => {
    const update = {
      ...sampleContentPackage,
      manifest: {
        ...sampleContentPackage.manifest,
        buildId: 'updated-build',
        contentVersion: '1.1.0',
      },
      stories: sampleContentPackage.stories.map(story =>
        story.storyId === 'story.ira.after-deadline'
          ? { ...story, title: 'После дедлайна — редакция' }
          : story,
      ),
    }
    const merged = mergeContentPackages([sampleContentPackage, update])

    expect(merged.manifest.buildId).toBe('updated-build')
    expect(
      merged.stories.find(story => story.storyId === 'story.ira.after-deadline')
        ?.title,
    ).toBe('После дедлайна — редакция')
    expect(merged.stories).toHaveLength(sampleContentPackage.stories.length)
  })

  it('requires at least one installed package', () => {
    expect(() => mergeContentPackages([])).toThrow(/at least one/i)
  })

  it('surfaces the bulk fixture in the merged discovery catalog', () => {
    const bulkFixture = generateBulkFixtureContentPackage({
      storyCount: 3,
      stageCount: 50,
    })

    const merged = mergeContentPackages([sampleContentPackage, bulkFixture])

    expect(merged.stories).toHaveLength(
      sampleContentPackage.stories.length + bulkFixture.stories.length,
    )
    expect(merged.nodes).toHaveLength(
      sampleContentPackage.nodes.length + bulkFixture.nodes.length,
    )
    expect(merged.manifest.packId).toBe(bulkFixture.manifest.packId)
  })
})
