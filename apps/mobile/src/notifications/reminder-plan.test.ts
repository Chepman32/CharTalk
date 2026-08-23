import { describe, expect, it } from 'vitest'

import { buildWeekendReminderPlan } from './reminder-plan'

const mondayMorning = new Date(2026, 7, 17, 9)
const previousMonday = new Date(2026, 7, 10, 9)

describe('weekend reminder plan', () => {
  it('schedules weekly reminders on Saturday after a week without reading', () => {
    const reminders = buildWeekendReminderPlan({
      now: mondayMorning,
      lastReadingActivityAt: previousMonday,
      frequency: 'weekly',
      weekendDay: 'saturday',
      time: 'morning',
      discoveryReminders: true,
      unfinishedReminders: false,
      hasUnfinishedStory: false,
      occurrences: 3,
    })

    expect(
      reminders.map(reminder => ({
        kind: reminder.kind,
        year: reminder.date.getFullYear(),
        month: reminder.date.getMonth(),
        day: reminder.date.getDate(),
        weekday: reminder.date.getDay(),
        hour: reminder.date.getHours(),
      })),
    ).toEqual([
      {
        kind: 'discovery',
        year: 2026,
        month: 7,
        day: 22,
        weekday: 6,
        hour: 10,
      },
      {
        kind: 'discovery',
        year: 2026,
        month: 7,
        day: 29,
        weekday: 6,
        hour: 10,
      },
      { kind: 'discovery', year: 2026, month: 8, day: 5, weekday: 6, hour: 10 },
    ])
  })

  it('moves the first reminder to a later weekend after recent activity', () => {
    const reminders = buildWeekendReminderPlan({
      now: mondayMorning,
      lastReadingActivityAt: new Date(2026, 7, 15, 12),
      frequency: 'weekly',
      weekendDay: 'saturday',
      time: 'morning',
      discoveryReminders: true,
      unfinishedReminders: false,
      hasUnfinishedStory: false,
      occurrences: 1,
    })

    expect(reminders[0]?.date).toEqual(new Date(2026, 7, 29, 10))
  })

  it('supports less frequent Sunday reminders and rotates enabled types', () => {
    const reminders = buildWeekendReminderPlan({
      now: mondayMorning,
      lastReadingActivityAt: new Date(2026, 7, 1, 9),
      frequency: 'fortnightly',
      weekendDay: 'sunday',
      time: 'evening',
      discoveryReminders: true,
      unfinishedReminders: true,
      hasUnfinishedStory: true,
      occurrences: 3,
    })

    expect(reminders.map(reminder => reminder.kind)).toEqual([
      'discovery',
      'unfinished',
      'discovery',
    ])
    expect(reminders.map(reminder => reminder.date.getDate())).toEqual([
      23, 6, 20,
    ])
    expect(reminders.every(reminder => reminder.date.getHours() === 18)).toBe(
      true,
    )
  })

  it('does not schedule when every reminder type is disabled', () => {
    expect(
      buildWeekendReminderPlan({
        now: mondayMorning,
        lastReadingActivityAt: previousMonday,
        frequency: 'weekly',
        weekendDay: 'saturday',
        time: 'morning',
        discoveryReminders: false,
        unfinishedReminders: false,
        hasUnfinishedStory: true,
      }),
    ).toEqual([])
  })
})
