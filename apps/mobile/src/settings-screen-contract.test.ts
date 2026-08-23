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

  it('shows permission recovery and notification preferences', () => {
    expect({
      hasNotificationSwitcher: settingsScreenSource.includes(
        'label="Уведомления"',
      ),
      canRequestPermission: settingsScreenSource.includes(
        'requestNotificationPermission',
      ),
      hasDiscoveryPreference: settingsScreenSource.includes(
        'label="Новые истории"',
      ),
      hasUnfinishedPreference: settingsScreenSource.includes(
        'label="Незавершённые истории"',
      ),
      hasFrequencyChoices: settingsScreenSource.includes('label="Частота"'),
      hasWeekendDayChoices: settingsScreenSource.includes('label="День"'),
      hasTimeChoices: settingsScreenSource.includes('label="Время"'),
    }).toEqual({
      hasNotificationSwitcher: true,
      canRequestPermission: true,
      hasDiscoveryPreference: true,
      hasUnfinishedPreference: true,
      hasFrequencyChoices: true,
      hasWeekendDayChoices: true,
      hasTimeChoices: true,
    })
  })
})
