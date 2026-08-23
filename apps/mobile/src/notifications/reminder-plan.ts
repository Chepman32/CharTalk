import type {
  NotificationFrequency,
  NotificationTime,
  NotificationWeekendDay,
} from '@chartalk/app-core'

const DAY_MS = 24 * 60 * 60 * 1000

const frequencyWeeks: Record<NotificationFrequency, number> = {
  weekly: 1,
  fortnightly: 2,
  monthly: 4,
}

const weekendDayNumber: Record<NotificationWeekendDay, number> = {
  saturday: 6,
  sunday: 0,
}

const reminderHour: Record<NotificationTime, number> = {
  morning: 10,
  afternoon: 14,
  evening: 18,
}

export type WeekendReminderKind = 'discovery' | 'unfinished'

export interface WeekendReminder {
  kind: WeekendReminderKind
  date: Date
  title: string
  body: string
}

export interface WeekendReminderPlanInput {
  now: Date
  lastReadingActivityAt: Date
  frequency: NotificationFrequency
  weekendDay: NotificationWeekendDay
  time: NotificationTime
  discoveryReminders: boolean
  unfinishedReminders: boolean
  hasUnfinishedStory: boolean
  occurrences?: number
}

const copyForKind = (
  kind: WeekendReminderKind,
): Pick<WeekendReminder, 'title' | 'body'> =>
  kind === 'unfinished'
    ? {
        title: 'История не закончена',
        body: 'У вас осталось незавершённое прохождение. Продолжим на выходных?',
      }
    : {
        title: 'Истории ждут',
        body: 'Вы давно не открывали новых историй. Давайте выберем одну на выходные?',
      }

const nextWeekendAtOrAfter = (
  earliest: Date,
  weekendDay: NotificationWeekendDay,
  time: NotificationTime,
): Date => {
  const candidate = new Date(earliest)
  candidate.setHours(reminderHour[time], 0, 0, 0)
  const dayOffset = (weekendDayNumber[weekendDay] - candidate.getDay() + 7) % 7
  candidate.setDate(candidate.getDate() + dayOffset)
  if (candidate.getTime() < earliest.getTime()) {
    candidate.setDate(candidate.getDate() + 7)
  }
  return candidate
}

export const buildWeekendReminderPlan = ({
  now,
  lastReadingActivityAt,
  frequency,
  weekendDay,
  time,
  discoveryReminders,
  unfinishedReminders,
  hasUnfinishedStory,
  occurrences = 12,
}: WeekendReminderPlanInput): WeekendReminder[] => {
  const kinds: WeekendReminderKind[] = []
  if (discoveryReminders) kinds.push('discovery')
  if (unfinishedReminders && hasUnfinishedStory) kinds.push('unfinished')
  if (kinds.length === 0) return []

  const cadenceWeeks = frequencyWeeks[frequency]
  const inactiveAt = new Date(
    lastReadingActivityAt.getTime() + cadenceWeeks * 7 * DAY_MS,
  )
  const earliest = new Date(Math.max(now.getTime(), inactiveAt.getTime()))
  const firstDate = nextWeekendAtOrAfter(earliest, weekendDay, time)

  return Array.from(
    { length: Math.max(0, Math.floor(occurrences)) },
    (_, index) => {
      const kind = kinds[index % kinds.length]!
      const date = new Date(firstDate)
      date.setDate(date.getDate() + index * cadenceWeeks * 7)
      return { kind, date, ...copyForKind(kind) }
    },
  )
}
