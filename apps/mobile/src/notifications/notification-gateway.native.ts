import * as Notifications from 'expo-notifications'
import { PermissionStatus } from 'expo'
import { Linking, Platform } from 'react-native'

import type { WeekendReminder } from './reminder-plan'
import type {
  NotificationPermissionState,
  ReminderScheduleGateway,
} from './reminder-scheduler'

const REMINDER_CHANNEL_ID = 'weekend-reading-reminders'
const REMINDER_DATA_KIND = 'weekend-reading-reminder'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

const permissionState = (
  permission: Notifications.NotificationPermissionsStatus,
): NotificationPermissionState => {
  const iosStatus = permission.ios?.status
  const granted =
    permission.granted ||
    iosStatus === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    iosStatus === Notifications.IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === Notifications.IosAuthorizationStatus.EPHEMERAL
  return {
    granted,
    canAskAgain: permission.canAskAgain,
    status: granted
      ? 'granted'
      : permission.status === PermissionStatus.UNDETERMINED
        ? 'undetermined'
        : 'denied',
  }
}

export const ensureNotificationChannel = async (): Promise<void> => {
  if (Platform.OS !== 'android') return
  await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Напоминания о чтении',
    description: 'Ненавязчивые напоминания выбрать историю на выходных.',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 180],
    enableVibrate: true,
    showBadge: false,
  })
}

export const getNotificationPermission =
  async (): Promise<NotificationPermissionState> =>
    permissionState(await Notifications.getPermissionsAsync())

export const requestNotificationPermission =
  async (): Promise<NotificationPermissionState> => {
    await ensureNotificationChannel()
    const current = await getNotificationPermission()
    if (current.granted || !current.canAskAgain) return current
    return permissionState(
      await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      }),
    )
  }

export const openNotificationSettings = async (): Promise<void> => {
  await Linking.openSettings()
}

export const notificationGateway: ReminderScheduleGateway = {
  ensureChannel: ensureNotificationChannel,
  getPermission: getNotificationPermission,
  listReminderIds: async () =>
    (await Notifications.getAllScheduledNotificationsAsync())
      .filter(request => request.content.data?.kind === REMINDER_DATA_KIND)
      .map(request => request.identifier),
  cancelReminder: identifier =>
    Notifications.cancelScheduledNotificationAsync(identifier),
  scheduleReminder: (reminder: WeekendReminder) =>
    Notifications.scheduleNotificationAsync({
      content: {
        title: reminder.title,
        body: reminder.body,
        sound: true,
        data: {
          kind: REMINDER_DATA_KIND,
          reminderType: reminder.kind,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminder.date,
        channelId: REMINDER_CHANNEL_ID,
      },
    }),
}

export const addWeekendReminderResponseListener = (
  onPress: () => void,
): (() => void) => {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    response => {
      if (
        response.notification.request.content.data?.kind === REMINDER_DATA_KIND
      ) {
        onPress()
      }
    },
  )
  return () => subscription.remove()
}
