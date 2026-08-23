import { existsSync, readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const filterSheetPath = new URL('./CatalogFilterSheet.tsx', import.meta.url)
const filterSheetSource = existsSync(filterSheetPath)
  ? readFileSync(filterSheetPath, 'utf8')
  : ''

describe('catalog filter sheet', () => {
  it('shows every filter group as an explicit radio choice', () => {
    expect({
      usesModal: filterSheetSource.includes('<Modal'),
      usesRadioChoices: filterSheetSource.includes('accessibilityRole="radio"'),
      hasEveryGroup: [
        'Жанр',
        'Тон',
        'Длительность',
        'Статус',
        'Возрастной рейтинг',
        'Доступность',
        'Сначала',
      ].every(label => filterSheetSource.includes(`label="${label}"`)),
      hasResetAction: filterSheetSource.includes('label="Сбросить"'),
      hasDoneAction: filterSheetSource.includes('label="Готово"'),
    }).toEqual({
      usesModal: true,
      usesRadioChoices: true,
      hasEveryGroup: true,
      hasResetAction: true,
      hasDoneAction: true,
    })
  })
})
