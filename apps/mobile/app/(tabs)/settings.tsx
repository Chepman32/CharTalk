import { spacing } from '@chartalk/design-system'
import type {
  NotificationFrequency,
  NotificationTime,
  NotificationWeekendDay,
} from '@chartalk/app-core'
import { useRouter } from 'expo-router'
import {
  Bell,
  BookOpen,
  ChartBar,
  Check,
  Compass,
  DownloadSimple,
  Info,
  PencilSimple,
  PaintBrush,
  FastForwardIcon,
  SpeakerHigh,
  TextAa,
  TimerIcon,
  Trash,
  Vibrate,
  WarningCircle,
  Wind,
} from 'phosphor-react-native'
import React, { useCallback, useEffect, useState } from 'react'
import {
  Alert,
  AppState,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  View,
} from 'react-native'

import {
  getNotificationPermission,
  openNotificationSettings,
  requestNotificationPermission,
} from '@/notifications/notification-gateway'
import type { NotificationPermissionState } from '@/notifications/reminder-scheduler'
import { serializeLocalDataExport } from '@/privacy-export'
import { useApp } from '@/state/AppProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { SettingsRow } from '@/ui/SettingsRow'
import { Screen, SectionLabel, Text } from '@/ui/primitives'

interface NotificationChoice<T extends string> {
  value: T
  label: string
}

const notificationFrequencyOptions: NotificationChoice<NotificationFrequency>[] =
  [
    { value: 'weekly', label: 'Раз в неделю' },
    { value: 'fortnightly', label: 'Раз в 2 недели' },
    { value: 'monthly', label: 'Раз в 4 недели' },
  ]

const notificationWeekendDayOptions: NotificationChoice<NotificationWeekendDay>[] =
  [
    { value: 'saturday', label: 'Суббота' },
    { value: 'sunday', label: 'Воскресенье' },
  ]

const notificationTimeOptions: NotificationChoice<NotificationTime>[] = [
  { value: 'morning', label: 'Утро · 10:00' },
  { value: 'afternoon', label: 'День · 14:00' },
  { value: 'evening', label: 'Вечер · 18:00' },
]

function NotificationChoiceGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: readonly NotificationChoice<T>[]
  value: T
  onChange(value: T): void
}) {
  const { theme } = useTheme()
  return (
    <View style={styles.notificationChoiceGroup}>
      <Text variant="label">{label}</Text>
      <View style={styles.notificationChoices} accessibilityRole="radiogroup">
        {options.map(option => {
          const selected = option.value === value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.notificationChoice,
                {
                  borderColor: selected
                    ? theme.colors.focusRing
                    : theme.colors.border,
                  backgroundColor: selected
                    ? theme.colors.surfaceElevated
                    : theme.colors.surfaceMuted,
                },
                pressed && styles.pressed,
              ]}
            >
              <Text variant="caption">{option.label}</Text>
              {selected ? (
                <Check color={theme.colors.primary} size={17} weight="bold" />
              ) : null}
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const notificationPermissionDetail = (
  permission: NotificationPermissionState | null,
  enabled: boolean,
  requesting: boolean,
): string => {
  if (requesting) return 'Запрашиваем разрешение…'
  if (!permission) return 'Проверяем доступ…'
  if (permission.granted) {
    return enabled
      ? 'Разрешены · напоминания включены'
      : 'Разрешены · напоминания выключены'
  }
  return permission.canAskAgain
    ? 'Разрешить уведомления'
    : 'Разрешить в настройках устройства'
}

export default function SettingsScreen() {
  const router = useRouter()
  const { snapshot, installedPackages, updateSettings, deleteAllLocalData } =
    useApp()
  const { theme } = useTheme()
  const settings = snapshot?.settings
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermissionState | null>(null)
  const [requestingNotifications, setRequestingNotifications] = useState(false)

  const refreshNotificationPermission = useCallback(async () => {
    try {
      setNotificationPermission(await getNotificationPermission())
    } catch {
      setNotificationPermission({
        granted: false,
        canAskAgain: true,
        status: 'undetermined',
      })
    }
  }, [])

  useEffect(() => {
    void refreshNotificationPermission()
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void refreshNotificationPermission()
    })
    return () => subscription.remove()
  }, [refreshNotificationPermission])

  const changeNotifications = useCallback(
    async (enabled: boolean) => {
      if (!settings || requestingNotifications) return
      if (!enabled) {
        await updateSettings({ notifications: false })
        return
      }

      setRequestingNotifications(true)
      try {
        const current = await getNotificationPermission()
        if (!current.granted && !current.canAskAgain) {
          setNotificationPermission(current)
          await openNotificationSettings()
          return
        }
        const permission = current.granted
          ? current
          : await requestNotificationPermission()
        setNotificationPermission(permission)
        await updateSettings({ notifications: permission.granted })
      } finally {
        setRequestingNotifications(false)
      }
    },
    [requestingNotifications, settings, updateSettings],
  )

  if (!settings) return null

  const exportLocalData = async () => {
    if (!snapshot || exporting) return
    setExporting(true)
    setExportMessage(null)
    try {
      const payload = serializeLocalDataExport(snapshot)
      if (Platform.OS === 'web') {
        const webNavigator = globalThis.navigator as Navigator & {
          share?: (data: { title?: string; text?: string }) => Promise<void>
        }
        if (typeof webNavigator.share === 'function') {
          await webNavigator.share({
            title: 'CharTalk — мои данные',
            text: payload,
          })
        } else {
          const blob = new Blob([payload], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'chartalk-local-data.json'
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.setTimeout(() => URL.revokeObjectURL(url), 0)
        }
        setExportMessage('Экспорт подготовлен в формате JSON.')
      } else {
        const result = await Share.share({
          message: payload,
          title: 'CharTalk — мои данные',
        })
        setExportMessage(
          result.action === Share.dismissedAction
            ? 'Экспорт отменён.'
            : 'Экспорт подготовлен. Выберите приложение, куда его сохранить.',
        )
      }
    } catch {
      setExportMessage(
        'Не удалось подготовить экспорт. Попробуйте ещё раз или обратитесь в поддержку.',
      )
    } finally {
      setExporting(false)
    }
  }

  const confirmDelete = () => {
    Alert.alert(
      'Удалить локальные данные?',
      'Профиль, настройки, все прохождения и загруженные обновления историй исчезнут с этого устройства. Встроенный пример останется доступен. Это действие нельзя отменить.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить всё',
          style: 'destructive',
          onPress: () => {
            setDeleting(true)
            void deleteAllLocalData()
              .then(() => router.replace('/onboarding'))
              .finally(() => setDeleting(false))
          },
        },
      ],
    )
  }

  return (
    <Screen>
      <View style={styles.header}>
        <SectionLabel>Устройство</SectionLabel>
        <Text variant="title">Настройки</Text>
      </View>

      <View>
        <SectionLabel>Текстовая идентичность</SectionLabel>
        <SettingsRow
          icon={PencilSimple}
          label="Имя и обращение"
          detail={
            snapshot.profile?.grammarProfile === 'masculine'
              ? 'Мужская форма'
              : snapshot.profile?.grammarProfile === 'feminine'
                ? 'Женская форма'
                : 'Нейтральные формулировки'
          }
          onPress={() => router.push('/profile')}
        />
      </View>

      <View>
        <SectionLabel>Чтение</SectionLabel>
        <SettingsRow
          icon={PaintBrush}
          label="Оформление"
          detail={
            settings.theme === 'system'
              ? 'Как на устройстве'
              : settings.theme === 'light'
                ? 'Светлая тема'
                : settings.theme === 'dark'
                  ? 'Тёмная тема'
                  : settings.theme === 'solar'
                    ? 'Тёплая тема'
                    : 'Моно'
          }
          onPress={() => router.push('/appearance')}
        />
        <SettingsRow
          icon={SpeakerHigh}
          label="Звук"
          detail="Тихие интерфейсные сигналы"
          value={settings.sound}
          onValueChange={value => void updateSettings({ sound: value })}
        />
        <SettingsRow
          icon={Vibrate}
          label="Тактильный отклик"
          detail="Подтверждение выбора"
          value={settings.haptics}
          onValueChange={value => void updateSettings({ haptics: value })}
        />
        <SettingsRow
          icon={Wind}
          label="Меньше движения"
          detail="Убирает плавные переходы и набор текста"
          value={settings.reduceMotion}
          onValueChange={value => void updateSettings({ reduceMotion: value })}
        />
        <SettingsRow
          icon={TextAa}
          label="Размер текста"
          detail={
            settings.textScale === 'standard'
              ? '100%'
              : settings.textScale === 'large'
                ? '150%'
                : '200%'
          }
          onPress={() => router.push('/text-size')}
        />
        <SettingsRow
          icon={TimerIcon}
          label="Скорость сообщений"
          detail={
            settings.messageSpeed === 'instant'
              ? 'Мгновенно'
              : settings.messageSpeed === 'slow'
                ? 'Медленно'
                : 'Обычно'
          }
          onPress={() =>
            void updateSettings({
              messageSpeed:
                settings.messageSpeed === 'normal'
                  ? 'slow'
                  : settings.messageSpeed === 'slow'
                    ? 'instant'
                    : 'normal',
            })
          }
        />
        <SettingsRow
          icon={FastForwardIcon}
          label="Показывать серию сразу"
          detail="Без пауз между новыми сообщениями"
          value={settings.revealImmediately}
          onValueChange={value =>
            void updateSettings({ revealImmediately: value })
          }
        />
      </View>

      <View style={styles.notificationSection}>
        <SectionLabel>Уведомления</SectionLabel>
        <SettingsRow
          icon={Bell}
          label="Уведомления"
          detail={notificationPermissionDetail(
            notificationPermission,
            settings.notifications,
            requestingNotifications,
          )}
          value={
            Boolean(notificationPermission?.granted) && settings.notifications
          }
          onValueChange={value => void changeNotifications(value)}
        />

        {notificationPermission?.granted && settings.notifications ? (
          <View style={styles.notificationPreferences}>
            <View style={styles.notificationIntro}>
              <Text variant="heading">Напоминания о чтении</Text>
              <Text variant="caption" color={theme.colors.textSecondary}>
                Планируются только на устройстве после периода без чтения.
                Никаких push-токенов и передачи истории активности.
              </Text>
            </View>
            <Text variant="label">Типы напоминаний</Text>
            <SettingsRow
              icon={Compass}
              label="Новые истории"
              detail="Предложить выбрать новую историю на выходных"
              value={settings.notificationDiscoveryReminders}
              onValueChange={value =>
                void updateSettings({
                  notificationDiscoveryReminders: value,
                })
              }
            />
            <SettingsRow
              icon={BookOpen}
              label="Незавершённые истории"
              detail="Напомнить о текущем прохождении"
              value={settings.notificationUnfinishedReminders}
              onValueChange={value =>
                void updateSettings({
                  notificationUnfinishedReminders: value,
                })
              }
            />
            <NotificationChoiceGroup
              label="Частота"
              options={notificationFrequencyOptions}
              value={settings.notificationFrequency}
              onChange={value =>
                void updateSettings({ notificationFrequency: value })
              }
            />
            <NotificationChoiceGroup
              label="День"
              options={notificationWeekendDayOptions}
              value={settings.notificationWeekendDay}
              onChange={value =>
                void updateSettings({ notificationWeekendDay: value })
              }
            />
            <NotificationChoiceGroup
              label="Время"
              options={notificationTimeOptions}
              value={settings.notificationTime}
              onChange={value =>
                void updateSettings({ notificationTime: value })
              }
            />
          </View>
        ) : null}
      </View>

      <View>
        <SectionLabel>Контроль и приватность</SectionLabel>
        <SettingsRow
          icon={WarningCircle}
          label="Предупреждения о контенте"
          detail="Показывать до чувствительных сцен"
          value={settings.showContentWarnings}
          onValueChange={value =>
            void updateSettings({ showContentWarnings: value })
          }
        />
        <SettingsRow
          icon={ChartBar}
          label="Анонимная диагностика"
          detail="Выключена по умолчанию; текст сообщений не отправляется"
          value={settings.analytics}
          onValueChange={value => void updateSettings({ analytics: value })}
        />
        <SettingsRow
          icon={Info}
          label="Контент и безопасные маршруты"
          onPress={() => router.push('/content-controls')}
        />
      </View>

      <View>
        <SectionLabel>Хранилище и помощь</SectionLabel>
        <SettingsRow
          icon={DownloadSimple}
          label="Обновления"
          detail={`Установлено сборок: ${installedPackages.length} · управлять версиями`}
          onPress={() => router.push('/downloads')}
        />
        <SettingsRow
          icon={DownloadSimple}
          label={exporting ? 'Подготовка экспорта…' : 'Экспортировать данные'}
          detail="JSON: профиль, настройки, прохождения и отчёты"
          onPress={() => void exportLocalData()}
        />
        {exportMessage ? (
          <Text variant="caption" color={theme.colors.textSecondary}>
            {exportMessage}
          </Text>
        ) : null}
        <SettingsRow
          icon={Info}
          label="Поддержка и документы"
          onPress={() => router.push('/support')}
        />
        <SettingsRow
          icon={Trash}
          label={deleting ? 'Удаление…' : 'Удалить локальные данные'}
          danger
          onPress={confirmDelete}
        />
      </View>
      <Text
        variant="mono"
        color={theme.colors.textMuted}
        style={styles.version}
      >
        CharTalk 1.0.0 · build 1
      </Text>
    </Screen>
  )
}

const styles = StyleSheet.create({
  header: { gap: spacing[3], paddingTop: spacing[4] },
  notificationSection: { gap: spacing[1] },
  notificationPreferences: {
    gap: spacing[4],
    paddingTop: spacing[4],
  },
  notificationIntro: { gap: spacing[1] },
  notificationChoiceGroup: { gap: spacing[2] },
  notificationChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  notificationChoice: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    borderWidth: 1,
    borderRadius: 12,
  },
  pressed: { opacity: 0.72 },
  version: { textAlign: 'center', marginTop: spacing[4] },
})
