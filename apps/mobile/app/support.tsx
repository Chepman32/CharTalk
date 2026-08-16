import { spacing } from '@chartalk/design-system'
import { Envelope, FileText, Heart, ShieldCheck } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { Linking, StyleSheet, View } from 'react-native'
import { useRouter } from 'expo-router'

import { SettingsRow } from '@/ui/SettingsRow'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'
import { Screen, SectionLabel, Text } from '@/ui/primitives'

export default function SupportScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const router = useRouter()
  return (
    <Screen>
      <SectionLabel>Помощь без аккаунта</SectionLabel>
      <Text variant="title">Поддержка и документы</Text>
      <Text color={nativeColors.textSecondary}>
        CharTalk работает локально. Для чтения не нужны регистрация, номер
        телефона или доступ к контактам.
      </Text>
      <View style={styles.promise}>
        <ShieldCheck color={nativeColors.moss} size={30} weight="fill" />
        <View style={styles.promiseCopy}>
          <Text variant="heading">Ваши ответы остаются на устройстве.</Text>
          <Text color={nativeColors.textSecondary}>
            Аналитика по умолчанию выключена, а синхронизация и уведомления не
            входят в этот релиз. Текст диалогов никогда не включается в
            диагностические события.
          </Text>
        </View>
      </View>
      <View>
        <SettingsRow
          icon={Envelope}
          label="Написать в поддержку"
          detail="support@chartalk.app"
          onPress={() =>
            void Linking.openURL(
              'mailto:support@chartalk.app?subject=CharTalk%20support',
            )
          }
        />
        <SettingsRow
          icon={FileText}
          label="Политика приватности"
          detail="Версия от 13 августа 2026"
          onPress={() => router.push('/legal/privacy')}
        />
        <SettingsRow
          icon={FileText}
          label="Условия использования"
          detail="Версия от 13 августа 2026"
          onPress={() => router.push('/legal/terms')}
        />
        <SettingsRow
          icon={Heart}
          label="Возрастной рейтинг"
          detail="16+ · без контента 18+ в стартовом пакете"
        />
      </View>
      <Text variant="caption" color={nativeColors.textMuted}>
        Если интернет недоступен, отчёты о контенте остаются в очереди на
        устройстве. Отправка возможна только после вашего явного действия.
      </Text>
    </Screen>
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    promise: {
      flexDirection: 'row',
      gap: spacing[4],
      padding: spacing[5],
      backgroundColor: nativeColors.panel,
      borderLeftWidth: 3,
      borderLeftColor: nativeColors.moss,
    },
    promiseCopy: { flex: 1, gap: spacing[2] },
  })
