import type {
  NotificationPermissionState,
  ReminderScheduleGateway,
} from './reminder-scheduler'

const unavailablePermission: NotificationPermissionState = {
  granted: false,
  canAskAgain: false,
  status: 'denied',
}

export const ensureNotificationChannel = async (): Promise<void> => {}

export const getNotificationPermission = async () => unavailablePermission

export const requestNotificationPermission = async () => unavailablePermission

export const openNotificationSettings = async (): Promise<void> => {}

export const notificationGateway: ReminderScheduleGateway = {
  ensureChannel: ensureNotificationChannel,
  getPermission: getNotificationPermission,
  listReminderIds: async () => [],
  cancelReminder: async () => {},
  scheduleReminder: async () => '',
}

export const addWeekendReminderResponseListener: (
  onPress: () => void,
) => () => void = () => () => {}
