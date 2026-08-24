import { describe, expect, it } from 'vitest'

import {
  STORY_PREVIEW_SEMANTIC_REPLACEMENTS,
  storyPreviewDefinitions,
} from './story-previews.generated'

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

    expect(categoryCounts.woman).toBe(191)
    expect(categoryCounts.landscape).toBe(3)
    expect(categoryCounts).toMatchObject({
      man: 8,
      building: 14,
      vehicle: 3,
      object: 12,
      scene: 8,
      interior: 4,
    })
    expect(categoryCounts.woman).toBeGreaterThan(
      storyPreviewDefinitions.length / 2,
    )
  })

  it('keeps the reviewed semantic replacements on the corrected asset build', () => {
    expect(STORY_PREVIEW_SEMANTIC_REPLACEMENTS).toHaveLength(100)
    expect(new Set(STORY_PREVIEW_SEMANTIC_REPLACEMENTS).size).toBe(
      STORY_PREVIEW_SEMANTIC_REPLACEMENTS.length,
    )

    const definitionByStoryId = new Map(
      storyPreviewDefinitions.map(definition => [
        definition.storyId,
        definition,
      ]),
    )
    for (const storyId of STORY_PREVIEW_SEMANTIC_REPLACEMENTS) {
      const definition = definitionByStoryId.get(storyId)
      expect(definition?.asset.assetId).toBe(`cover.${storyId}.2026-08-24`)
      expect(definition?.asset.path).toBe(
        `story-previews/${storyId}.2026-08-24.jpg`,
      )
      expect(definition?.asset.altText).not.toBe(
        'Фотографический портрет женщины.',
      )
    }
  })
})
