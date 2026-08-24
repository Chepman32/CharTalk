import type { ThemePreference } from '@razvilka/app-core'
import { spacing, themes } from '@razvilka/design-system'
import { CheckCircle, CircleIcon, DeviceMobile } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { useTheme } from '@/theme/ThemeProvider'
import { Screen, SectionLabel, Text } from '@/ui/primitives'

const options: Array<{
  value: ThemePreference
  label: string
  detail: string
}> = [
  {
    value: 'system',
    label: 'Как на устройстве',
    detail: 'Светлая или тёмная тема меняется вместе с системой',
  },
  { value: 'light', label: 'Светлая', detail: 'Чистый светлый фон' },
  { value: 'dark', label: 'Тёмная', detail: 'Спокойный фон без бликов' },
  { value: 'solar', label: 'Тёплая', detail: 'Кремовые и янтарные тона' },
  { value: 'mono', label: 'Моно', detail: 'Только оттенки серого' },
]

export default function AppearanceScreen() {
  const { theme, themeName, preference, setPreference } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        intro: { gap: spacing[3], paddingTop: spacing[4] },
        list: { gap: spacing[3] },
        option: {
          minHeight: 84,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[4],
          borderRadius: theme.radius.medium,
          borderWidth: 1,
          borderColor: theme.colors.border,
          backgroundColor: theme.colors.card,
        },
        selected: {
          borderColor: theme.colors.focusRing,
          borderWidth: 2,
          backgroundColor: theme.colors.primarySoft,
        },
        copy: { flex: 1, gap: spacing[1] },
        swatches: { flexDirection: 'row' },
        swatch: {
          width: 19,
          height: 32,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: theme.colors.borderStrong,
        },
        pressed: { opacity: theme.opacity.pressed },
      }),
    [theme],
  )

  return (
    <Screen>
      <View style={styles.intro}>
        <SectionLabel>Оформление</SectionLabel>
        <Text variant="title">Тема приложения</Text>
        <Text color={theme.colors.textSecondary}>
          Выбор применяется сразу и сохраняется только на этом устройстве.
        </Text>
      </View>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {options.map(option => {
          const selected = preference === option.value
          const preview =
            option.value === 'system' ? themes[themeName] : themes[option.value]
          return (
            <Pressable
              aria-checked={selected}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option.value}
              onPress={() => void setPreference(option.value)}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              {selected ? (
                <CheckCircle
                  color={theme.colors.primary}
                  size={24}
                  weight="fill"
                />
              ) : option.value === 'system' ? (
                <DeviceMobile color={theme.colors.textMuted} size={24} />
              ) : (
                <CircleIcon color={theme.colors.textMuted} size={24} />
              )}
              <View style={styles.copy}>
                <Text variant="label">{option.label}</Text>
                <Text variant="caption" color={theme.colors.textMuted}>
                  {option.detail}
                </Text>
              </View>
              <View accessibilityElementsHidden style={styles.swatches}>
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: preview.colors.background },
                  ]}
                />
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: preview.colors.surfaceMuted },
                  ]}
                />
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: preview.colors.primary },
                  ]}
                />
              </View>
            </Pressable>
          )
        })}
      </View>
    </Screen>
  )
}
