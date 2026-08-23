import { describe, expect, it } from 'vitest'

import { storyPreviewDefinitions } from './story-previews.generated'

describe('story preview inventory', () => {
  it('keeps every bundled preview source and normalized cover unique', () => {
    expect(storyPreviewDefinitions).toHaveLength(243)
    expect(
      new Set(storyPreviewDefinitions.map(definition => definition.storyId))
        .size,
    ).toBe(storyPreviewDefinitions.length)
    expect(
      new Set(
        storyPreviewDefinitions.map(definition => definition.asset.assetId),
      ).size,
    ).toBe(storyPreviewDefinitions.length)
    expect(
      new Set(
        storyPreviewDefinitions.map(definition => definition.asset.checksum),
      ).size,
    ).toBe(storyPreviewDefinitions.length)
    expect(
      new Set(
        storyPreviewDefinitions.map(
          definition =>
            `${definition.source.provider}:${definition.source.sourceId}`,
        ),
      ).size,
    ).toBe(storyPreviewDefinitions.length)
  })

  it('keeps women portraits as the majority while retaining a varied catalog', () => {
    const categoryCounts = storyPreviewDefinitions.reduce<
      Partial<
        Record<(typeof storyPreviewDefinitions)[number]['category'], number>
      >
    >((counts, definition) => {
      counts[definition.category] = (counts[definition.category] ?? 0) + 1
      return counts
    }, {})

    expect(categoryCounts.woman).toBe(124)
    expect(categoryCounts.landscape).toBe(17)
    expect(categoryCounts).toMatchObject({
      man: 12,
      building: 22,
      vehicle: 12,
      object: 24,
      scene: 16,
      interior: 5,
      nature: 11,
    })
    expect(categoryCounts.woman).toBeGreaterThan(
      storyPreviewDefinitions.length / 2,
    )
  })
})
