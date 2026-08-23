import { spacing } from '@chartalk/design-system'
import { useRouter } from 'expo-router'
import {
  Bell,
  ChartBar,
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
import React, { useState } from 'react'
import { Alert, Platform, Share, StyleSheet, View } from 'react-native'

import { serializeLocalDataExport } from '@/privacy-export'
import { useApp } from '@/state/AppProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { SettingsRow } from '@/ui/SettingsRow'
import { Screen, SectionLabel, Text } from '@/ui/primitives'

export default function SettingsScreen() {
  const router = useRouter()
  const { snapshot, installedPackages, updateSettings, deleteAllLocalData } =
    useApp()
  const { theme } = useTheme()
  const settings = snapshot?.settings
  const [deleting, setDeleting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState<string | null>(null)
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
          icon={Bell}
          label="Напоминания"
          detail="Не включены в этом релизе; доступ к уведомлениям не запрашивается"
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
  version: { textAlign: 'center', marginTop: spacing[4] },
})
