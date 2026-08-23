import { describe, expect, it, vi } from 'vitest'

import type { WeekendReminder } from './reminder-plan'
import { reconcileWeekendReminders } from './reminder-scheduler'

const settings = {
  notifications: true,
  notificationDiscoveryReminders: true,
  notificationUnfinishedReminders: true,
  notificationFrequency: 'weekly' as const,
  notificationWeekendDay: 'saturday' as const,
  notificationTime: 'morning' as const,
}

const createGateway = (granted: boolean) => ({
  ensureChannel: vi.fn(async () => {}),
  getPermission: vi.fn(async () => ({
    granted,
    canAskAgain: true,
    status: granted ? ('granted' as const) : ('denied' as const),
  })),
  listReminderIds: vi.fn(async () => ['old-reminder']),
  cancelReminder: vi.fn(async (identifier: string) => {
    void identifier
  }),
  scheduleReminder: vi.fn(async (reminder: WeekendReminder) => {
    void reminder
    return 'new-reminder'
  }),
})

describe('weekend reminder scheduling', () => {
  it('clears stale reminders without scheduling when permission is denied', async () => {
    const gateway = createGateway(false)

    await reconcileWeekendReminders(
      {
        settings,
        runs: [],
        onboardingCompletedAt: '2026-08-01T09:00:00.000Z',
        now: new Date(2026, 7, 17, 9),
      },
      gateway,
    )

    expect(gateway.cancelReminder).toHaveBeenCalledWith('old-reminder')
    expect(gateway.scheduleReminder).not.toHaveBeenCalled()
  })

  it('replaces stale reminders using the latest reading activity', async () => {
    const gateway = createGateway(true)

    await reconcileWeekendReminders(
      {
        settings,
        runs: [
          {
            status: 'active',
            updatedAt: new Date(2026, 7, 15, 12).toISOString(),
          },
          {
            status: 'completed',
            updatedAt: new Date(2026, 7, 10, 9).toISOString(),
          },
        ],
        onboardingCompletedAt: '2026-08-01T09:00:00.000Z',
        now: new Date(2026, 7, 17, 9),
      },
      gateway,
    )

    expect(gateway.ensureChannel).toHaveBeenCalledOnce()
    expect(gateway.scheduleReminder).toHaveBeenCalledTimes(52)
    expect(gateway.scheduleReminder.mock.calls[0]?.[0]).toMatchObject({
      kind: 'discovery',
      date: new Date(2026, 7, 29, 10),
    })
    expect(gateway.scheduleReminder.mock.calls[1]?.[0]).toMatchObject({
      kind: 'unfinished',
      date: new Date(2026, 8, 5, 10),
    })
  })
})
