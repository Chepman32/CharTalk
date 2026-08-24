import type { Story } from '@razvilka/content-schema'

import type { CatalogSort, DurationFilter } from '@/catalog-query'

export interface CatalogFilterOption<T> {
  value: T
  label: string
}

export interface CatalogFilterSelection {
  genre: string | null
  tone: string | null
  duration: DurationFilter
  status: Story['status'] | null
  rating: Story['rating'] | null
  downloadedOnly: boolean
  sort: CatalogSort
}

export const durationFilterOptions: ReadonlyArray<
  CatalogFilterOption<DurationFilter>
> = [
  { value: 'any', label: 'Любая длительность' },
  { value: 'short', label: 'До 15 минут' },
  { value: 'medium', label: '15–30 минут' },
  { value: 'long', label: 'Больше 30 минут' },
]

export const statusFilterOptions: ReadonlyArray<
  CatalogFilterOption<Story['status'] | null>
> = [
  { value: null, label: 'Любой статус' },
  { value: 'complete', label: 'Завершённые' },
  { value: 'ongoing', label: 'Выходят' },
  { value: 'mini', label: 'Мини' },
]

export const ratingFilterOptions: ReadonlyArray<
  CatalogFilterOption<Story['rating'] | null>
> = [
  { value: null, label: 'Любой рейтинг' },
  { value: '12+', label: '12+' },
  { value: '16+', label: '16+' },
  { value: '18+', label: '18+' },
]

export const availabilityFilterOptions: ReadonlyArray<
  CatalogFilterOption<boolean>
> = [
  { value: false, label: 'Все истории' },
  { value: true, label: 'На устройстве' },
]

export const sortFilterOptions: ReadonlyArray<
  CatalogFilterOption<CatalogSort>
> = [
  { value: 'recommended', label: 'Рекомендованные' },
  { value: 'newest', label: 'Новые' },
  { value: 'updated', label: 'Обновлённые' },
  { value: 'short', label: 'Короткие' },
  { value: 'complete', label: 'Завершённые' },
]

export const countActiveCatalogFilters = (
  filters: CatalogFilterSelection,
): number =>
  Number(filters.genre !== null) +
  Number(filters.tone !== null) +
  Number(filters.duration !== 'any') +
  Number(filters.status !== null) +
  Number(filters.rating !== null) +
  Number(filters.downloadedOnly) +
  Number(filters.sort !== 'recommended')
