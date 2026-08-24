import type {
  NotificationFrequency,
  NotificationTime,
  NotificationWeekendDay,
} from '@razvilka/app-core'

import { buildWeekendReminderPlan, type WeekendReminder } from './reminder-plan'

export type NotificationPermissionStatus = 'granted' | 'denied' | 'undetermined'

export interface NotificationPermissionState {
  granted: boolean
  canAskAgain: boolean
  status: NotificationPermissionStatus
}

export interface ReminderScheduleGateway {
  ensureChannel(): Promise<void>
  getPermission(): Promise<NotificationPermissionState>
  listReminderIds(): Promise<string[]>
  cancelReminder(identifier: string): Promise<void>
  scheduleReminder(reminder: WeekendReminder): Promise<string>
}

interface ReminderSettings {
  notifications: boolean
  notificationDiscoveryReminders: boolean
  notificationUnfinishedReminders: boolean
  notificationFrequency: NotificationFrequency
  notificationWeekendDay: NotificationWeekendDay
  notificationTime: NotificationTime
}

interface ReadingActivity {
  status: 'active' | 'completed' | 'archived'
  updatedAt: string
}

export interface ReminderScheduleInput {
  settings: ReminderSettings
  runs: readonly ReadingActivity[]
  onboardingCompletedAt: string | null
  now?: Date
}

const validDate = (value: string | null): Date | null => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

const annualReminderOccurrences: Record<NotificationFrequency, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 13,
}

const latestReadingActivity = (
  runs: readonly ReadingActivity[],
  onboardingCompletedAt: string | null,
  now: Date,
): Date => {
  const timestamps = runs.flatMap(run => {
    const date = validDate(run.updatedAt)
    return date ? [date.getTime()] : []
  })
  const onboardingDate = validDate(onboardingCompletedAt)
  if (onboardingDate) timestamps.push(onboardingDate.getTime())
  return timestamps.length > 0 ? new Date(Math.max(...timestamps)) : now
}

export const reconcileWeekendReminders = async (
  input: ReminderScheduleInput,
  gateway: ReminderScheduleGateway,
): Promise<void> => {
  const existingIds = await gateway.listReminderIds()
  await Promise.all(
    existingIds.map(identifier => gateway.cancelReminder(identifier)),
  )

  if (!input.settings.notifications) return

  await gateway.ensureChannel()
  const permission = await gateway.getPermission()
  if (!permission.granted) return

  const now = input.now ?? new Date()
  const plan = buildWeekendReminderPlan({
    now,
    lastReadingActivityAt: latestReadingActivity(
      input.runs,
      input.onboardingCompletedAt,
      now,
    ),
    frequency: input.settings.notificationFrequency,
    weekendDay: input.settings.notificationWeekendDay,
    time: input.settings.notificationTime,
    discoveryReminders: input.settings.notificationDiscoveryReminders,
    unfinishedReminders: input.settings.notificationUnfinishedReminders,
    hasUnfinishedStory: input.runs.some(run => run.status === 'active'),
    occurrences:
      annualReminderOccurrences[input.settings.notificationFrequency],
  })

  for (const reminder of plan) {
    await gateway.scheduleReminder(reminder)
  }
}
