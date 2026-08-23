import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const settingsScreenSource = readFileSync(
  new URL('../app/(tabs)/settings.tsx', import.meta.url),
  'utf8',
)

describe('settings screen', () => {
  it('omits the redundant local profile summary card', () => {
    expect({
      keepsSettingsTitle: settingsScreenSource.includes(
        '<Text variant="title">Настройки</Text>',
      ),
      keepsProfileEditor: settingsScreenSource.includes(
        'label="Имя и обращение"',
      ),
      hasProfileSummaryStyle: settingsScreenSource.includes('styles.profile'),
      hasLocalProfileCaption: settingsScreenSource.includes(
        'Локальный профиль · без аккаунта',
      ),
      hasAgePill: settingsScreenSource.includes('<Pill>16+</Pill>'),
    }).toEqual({
      keepsSettingsTitle: true,
      keepsProfileEditor: true,
      hasProfileSummaryStyle: false,
      hasLocalProfileCaption: false,
      hasAgePill: false,
    })
  })
})
