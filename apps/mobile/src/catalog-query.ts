import type { ContentWarning, Story } from '@razvilka/content-schema'

import type { CatalogContent } from './catalog'

export type CatalogSort =
  'recommended' | 'newest' | 'updated' | 'short' | 'complete'
export type DurationFilter = 'any' | 'short' | 'medium' | 'long'

export interface CatalogQuery {
  search: string
  genre: string | null
  tone: string | null
  duration: DurationFilter
  status: Story['status'] | null
  rating: Story['rating'] | null
  downloadedOnly: boolean
  sort: CatalogSort
  hiddenCategories: readonly ContentWarning['category'][]
}

export const normalizeCatalogSearch = (value: string): string =>
  value
    .normalize('NFC')
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .replace(/[\s\p{P}]+/gu, ' ')
    .trim()

export function queryCatalogStories(
  content: CatalogContent,
  query: CatalogQuery,
  recommendedStoryId?: string,
  downloadedStoryIds?: ReadonlySet<string>,
): Story[] {
  const characters = new Map(
    content.characters.map(character => [character.characterId, character]),
  )
  const warnings = new Map(
    content.warnings.map(warning => [warning.warningId, warning]),
  )
  const search = normalizeCatalogSearch(query.search)
  const indexed = content.stories.map((story, index) => ({ story, index }))
  const filtered = indexed.filter(({ story }) => {
    const character = characters.get(story.characterId)
    if (!character) return false
    if (
      story.warningIds.some(warningId => {
        const warning = warnings.get(warningId)
        return warning && query.hiddenCategories.includes(warning.category)
      })
    ) {
      return false
    }
    if (
      search &&
      !normalizeCatalogSearch(
        `${story.title} ${story.premise} ${character.name}`,
      ).includes(search)
    ) {
      return false
    }
    if (query.genre && !character.genres.includes(query.genre)) return false
    if (query.tone && !character.dynamics.includes(query.tone)) return false
    if (query.status && story.status !== query.status) return false
    if (query.rating && story.rating !== query.rating) return false
    if (
      query.downloadedOnly &&
      downloadedStoryIds &&
      !downloadedStoryIds.has(story.storyId)
    ) {
      return false
    }
    if (query.duration === 'short' && story.durationMinutes > 15) return false
    if (
      query.duration === 'medium' &&
      (story.durationMinutes <= 15 || story.durationMinutes > 30)
    ) {
      return false
    }
    if (query.duration === 'long' && story.durationMinutes <= 30) return false
    return true
  })

  filtered.sort((left, right) => {
    switch (query.sort) {
      case 'recommended': {
        const leftRecommended = left.story.storyId === recommendedStoryId
        const rightRecommended = right.story.storyId === recommendedStoryId
        if (leftRecommended !== rightRecommended)
          return leftRecommended ? -1 : 1
        return left.index - right.index
      }
      case 'newest':
        return right.index - left.index
      case 'updated':
        return left.index - right.index
      case 'short':
        return (
          left.story.durationMinutes - right.story.durationMinutes ||
          left.index - right.index
        )
      case 'complete': {
        const leftComplete = left.story.status === 'complete'
        const rightComplete = right.story.status === 'complete'
        if (leftComplete !== rightComplete) return leftComplete ? -1 : 1
        return left.index - right.index
      }
    }
  })
  return filtered.map(item => item.story)
}

export function catalogPage<T>(
  items: readonly T[],
  visibleCount: number,
): { items: T[]; hasMore: boolean } {
  const safeCount = Math.max(1, Math.floor(visibleCount))
  return {
    items: items.slice(0, safeCount),
    hasMore: items.length > safeCount,
  }
}
