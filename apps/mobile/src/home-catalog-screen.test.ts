import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const homeCatalogSource = readFileSync(
  new URL('../app/(tabs)/stories.tsx', import.meta.url),
  'utf8',
)

describe('home catalog screen', () => {
  it('renders every story without pagination or update controls', () => {
    expect({
      rendersCompleteResult: homeCatalogSource.includes(
        '{stories.map(story => (',
      ),
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
      rendersCompleteResult: true,
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
