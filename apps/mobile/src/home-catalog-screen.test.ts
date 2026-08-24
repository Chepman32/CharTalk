import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const homeCatalogSource = readFileSync(
  new URL('../app/(tabs)/stories.tsx', import.meta.url),
  'utf8',
)

describe('home catalog screen', () => {
  it('virtualizes every story without pagination or update controls', () => {
    expect({
      usesVirtualizedList: homeCatalogSource.includes('<FlatList'),
      passesCompleteResultToList: homeCatalogSource.includes('data={stories}'),
      eagerlyMapsEveryStory: homeCatalogSource.includes(
        '{stories.map(story => (',
      ),
      boundsRenderWindow:
        homeCatalogSource.includes('initialNumToRender=') &&
        homeCatalogSource.includes('maxToRenderPerBatch=') &&
        homeCatalogSource.includes('windowSize='),
      disablesOuterScroll: homeCatalogSource.includes('scroll={false}'),
      hasPaginationState: /\b(PAGE_SIZE|visibleCount|catalogPage)\b/.test(
        homeCatalogSource,
      ),
      hasLoadMoreControl: homeCatalogSource.includes('Показать ещё'),
      hasCatalogRefreshControl: homeCatalogSource.includes('Обновить каталог'),
      hasUpdateManagementControl: homeCatalogSource.includes(
        'Управлять обновлениями',
      ),
      hasHeaderDownloadAction: homeCatalogSource.includes('Открыть обновления'),
      usesExplicitFilterSheet: homeCatalogSource.includes(
        '<CatalogFilterSheet',
      ),
      hasCyclingFilterHelper: /\bnextValue\b/.test(homeCatalogSource),
    }).toEqual({
      usesVirtualizedList: true,
      passesCompleteResultToList: true,
      eagerlyMapsEveryStory: false,
      boundsRenderWindow: true,
      disablesOuterScroll: true,
      hasPaginationState: false,
      hasLoadMoreControl: false,
      hasCatalogRefreshControl: false,
      hasUpdateManagementControl: false,
      hasHeaderDownloadAction: false,
      usesExplicitFilterSheet: true,
      hasCyclingFilterHelper: false,
    })
  })
})
