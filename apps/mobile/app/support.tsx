import { spacing } from '@razvilka/design-system'
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
        «Развилка» работает локально. Для чтения не нужны регистрация, номер
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
          detail="support@razvilka.app"
          onPress={() =>
            void Linking.openURL(
              'mailto:support@razvilka.app?subject=%D0%A0%D0%B0%D0%B7%D0%B2%D0%B8%D0%BB%D0%BA%D0%B0%20%E2%80%94%20%D0%BF%D0%BE%D0%B4%D0%B4%D0%B5%D1%80%D0%B6%D0%BA%D0%B0',
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
