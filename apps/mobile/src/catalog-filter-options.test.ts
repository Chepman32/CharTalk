import { describe, expect, it } from 'vitest'

import {
  availabilityFilterOptions,
  countActiveCatalogFilters,
  durationFilterOptions,
  ratingFilterOptions,
  sortFilterOptions,
  statusFilterOptions,
} from './catalog-filter-options'

describe('catalog filter options', () => {
  it('exposes every static filter value with a visible label', () => {
    expect({
      duration: durationFilterOptions,
      status: statusFilterOptions,
      rating: ratingFilterOptions,
      availability: availabilityFilterOptions,
      sort: sortFilterOptions,
    }).toEqual({
      duration: [
        { value: 'any', label: 'Любая длительность' },
        { value: 'short', label: 'До 15 минут' },
        { value: 'medium', label: '15–30 минут' },
        { value: 'long', label: 'Больше 30 минут' },
      ],
      status: [
        { value: null, label: 'Любой статус' },
        { value: 'complete', label: 'Завершённые' },
        { value: 'ongoing', label: 'Выходят' },
        { value: 'mini', label: 'Мини' },
      ],
      rating: [
        { value: null, label: 'Любой рейтинг' },
        { value: '12+', label: '12+' },
        { value: '16+', label: '16+' },
        { value: '18+', label: '18+' },
      ],
      availability: [
        { value: false, label: 'Все истории' },
        { value: true, label: 'На устройстве' },
      ],
      sort: [
        { value: 'recommended', label: 'Рекомендованные' },
        { value: 'newest', label: 'Новые' },
        { value: 'updated', label: 'Обновлённые' },
        { value: 'short', label: 'Короткие' },
        { value: 'complete', label: 'Завершённые' },
      ],
    })
  })

  it('counts only filters that narrow or reorder the default catalog', () => {
    expect(
      countActiveCatalogFilters({
        genre: 'драма',
        tone: null,
        duration: 'short',
        status: null,
        rating: '16+',
        downloadedOnly: true,
        sort: 'newest',
      }),
    ).toBe(5)
  })
})
