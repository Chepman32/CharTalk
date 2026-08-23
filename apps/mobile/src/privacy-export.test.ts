import { describe, expect, it } from 'vitest'

import type { AppSnapshot } from '@chartalk/app-core'

import {
  createLocalDataExport,
  serializeLocalDataExport,
} from './privacy-export'

const snapshot: AppSnapshot = {
  schemaVersion: 5,
  onboardingComplete: true,
  profile: {
    displayName: 'Саша',
    grammarProfile: 'neutralPhrasing',
    selectedCharacterId: 'character.ira',
    createdAt: '2026-08-13T00:00:00.000Z',
  },
  settings: {
    theme: 'dark',
    textScale: 'standard',
    sound: true,
    haptics: true,
    reduceMotion: false,
    messageSpeed: 'normal',
    revealImmediately: false,
    showContentWarnings: true,
    analytics: false,
    notifications: false,
    notificationDiscoveryReminders: true,
    notificationUnfinishedReminders: true,
    notificationFrequency: 'weekly',
    notificationWeekendDay: 'saturday',
    notificationTime: 'morning',
    hiddenContentCategories: [],
  },
  runs: [],
  provisional: null,
  downloadedPackIds: ['pack.sample'],
  reports: [],
}

describe('local privacy export', () => {
  it('returns a portable deep copy and never aliases the live snapshot', () => {
    const result = createLocalDataExport(snapshot, '2026-08-13T00:00:00.000Z')

    expect(result.format).toBe('chartalk.local-data')
    expect(result.version).toBe(1)
    expect(result.exportedAt).toBe('2026-08-13T00:00:00.000Z')
    expect(result.snapshot).toEqual(snapshot)
    expect(result.snapshot).not.toBe(snapshot)
    result.snapshot.downloadedPackIds.push('pack.other')
    expect(snapshot.downloadedPackIds).toEqual(['pack.sample'])
  })

  it('serializes valid JSON with the export contract', () => {
    const parsed = JSON.parse(
      serializeLocalDataExport(snapshot, '2026-08-13T00:00:00.000Z'),
    ) as ReturnType<typeof createLocalDataExport>

    expect(parsed).toMatchObject({
      format: 'chartalk.local-data',
      version: 1,
      exportedAt: '2026-08-13T00:00:00.000Z',
      snapshot,
    })
  })
})
