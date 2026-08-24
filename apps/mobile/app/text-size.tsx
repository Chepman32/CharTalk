import type { TextScale } from '@razvilka/app-core'
import { spacing } from '@razvilka/design-system'
import { CheckCircle, CircleIcon } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { useApp } from '@/state/AppProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { Screen, SectionLabel, Text } from '@/ui/primitives'

const options: Array<{
  value: TextScale
  label: string
  detail: string
}> = [
  {
    value: 'standard',
    label: '100%',
    detail: 'Стандартный размер',
  },
  {
    value: 'large',
    label: '150%',
    detail: 'Крупный текст',
  },
  {
    value: 'extraLarge',
    label: '200%',
    detail: 'Максимальный доступный размер',
  },
]

export default function TextSizeScreen() {
  const { snapshot, updateSettings } = useApp()
  const { theme } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        intro: { gap: spacing[3], paddingTop: spacing[4] },
        list: { gap: spacing[3] },
        option: {
          minHeight: 80,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          padding: spacing[4],
          borderRadius: theme.radius.medium,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
          backgroundColor: theme.colors.card,
        },
        selected: {
          borderWidth: 2,
          borderColor: theme.colors.focusRing,
          backgroundColor: theme.colors.primarySoft,
        },
        copy: { flex: 1, gap: spacing[1] },
        pressed: { opacity: theme.opacity.pressed },
      }),
    [theme],
  )
  const selectedValue = snapshot?.settings.textScale ?? 'standard'

  return (
    <Screen>
      <View style={styles.intro}>
        <SectionLabel>Доступность</SectionLabel>
        <Text variant="title">Размер текста</Text>
        <Text color={theme.colors.textSecondary}>
          Все четыре ответа остаются доступны; при необходимости список можно
          прокрутить вертикально.
        </Text>
      </View>
      <View accessibilityRole="radiogroup" style={styles.list}>
        {options.map(option => {
          const selected = selectedValue === option.value
          return (
            <Pressable
              aria-checked={selected}
              accessibilityLabel={`${option.label} · ${option.detail}`}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              key={option.value}
              onPress={() => void updateSettings({ textScale: option.value })}
              style={({ pressed }) => [
                styles.option,
                selected && styles.selected,
                pressed && styles.pressed,
              ]}
            >
              {selected ? (
                <CheckCircle
                  color={theme.colors.primary}
                  size={28}
                  weight="fill"
                />
              ) : (
                <CircleIcon color={theme.colors.textMuted} size={28} />
              )}
              <View style={styles.copy}>
                <Text variant="heading">{option.label}</Text>
                <Text variant="caption" color={theme.colors.textMuted}>
                  {option.detail}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>
    </Screen>
  )
}
