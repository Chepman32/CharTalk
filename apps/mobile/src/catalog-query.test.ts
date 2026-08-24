import { describe, expect, it } from 'vitest'

import type { ContentPackage } from '@razvilka/content-schema'
import { sampleContentPackage } from '@razvilka/test-fixtures'

import {
  catalogPage,
  type CatalogQuery,
  queryCatalogStories,
} from './catalog-query'

const defaults: CatalogQuery = {
  search: '',
  genre: null,
  tone: null,
  duration: 'any',
  status: null,
  rating: null,
  downloadedOnly: false,
  sort: 'recommended',
  hiddenCategories: [],
}

describe('catalog query', () => {
  it('finds Russian names and titles without treating е/ё as different', () => {
    const content = structuredClone(sampleContentPackage)
    content.characters[0]!.name = 'Алёна'
    const result = queryCatalogStories(content, {
      ...defaults,
      search: 'алена',
    })
    expect(result.some(story => story.characterId === 'char.ira')).toBe(true)
  })

  it('combines boundaries with metadata filters and cursor-sized rendering', () => {
    const warning = sampleContentPackage.warnings[0]
    const result = queryCatalogStories(sampleContentPackage, {
      ...defaults,
      hiddenCategories: warning ? [warning.category] : [],
      duration: 'short',
    })
    expect(
      result.every(
        story =>
          story.durationMinutes <= 15 &&
          (!warning || !story.warningIds.includes(warning.warningId)),
      ),
    ).toBe(true)
    expect(catalogPage([1, 2, 3], 2)).toEqual({
      items: [1, 2],
      hasMore: true,
    })
  })

  it('queries 10,000 metadata records without rendering the whole result', () => {
    const baseCharacter = sampleContentPackage.characters[0]!
    const baseStory = sampleContentPackage.stories[0]!
    const content = {
      ...sampleContentPackage,
      characters: Array.from({ length: 10_000 }, (_, index) => ({
        ...baseCharacter,
        characterId: `character.${index}`,
        name: `Персонаж ${index}`,
      })),
      stories: Array.from({ length: 10_000 }, (_, index) => ({
        ...baseStory,
        storyId: `story.${index}`,
        characterId: `character.${index}`,
        title: `История ${index}`,
      })),
    } satisfies ContentPackage
    const started = performance.now()
    const result = queryCatalogStories(content, {
      ...defaults,
      search: 'персонаж 9999',
    })
    const page = catalogPage(result, 24)

    expect(page.items).toHaveLength(1)
    expect(page.items[0]?.storyId).toBe('story.9999')
    expect(performance.now() - started).toBeLessThan(250)
  })
})
