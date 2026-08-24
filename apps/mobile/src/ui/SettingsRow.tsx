import { spacing } from '@razvilka/design-system'
import type { IconProps } from 'phosphor-react-native'
import { CaretRight } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'

import { Text } from './primitives'
import { useTheme } from '@/theme/ThemeProvider'

type IconComponent = React.ComponentType<IconProps>

export function SettingsRow({
  icon: Icon,
  label,
  detail,
  onPress,
  value,
  onValueChange,
  danger = false,
}: {
  icon: IconComponent
  label: string
  detail?: string
  onPress?: () => void
  value?: boolean
  onValueChange?: (value: boolean) => void
  danger?: boolean
}) {
  const { theme } = useTheme()
  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          minHeight: 62,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing[3],
          paddingVertical: spacing[3],
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: theme.colors.divider,
        },
        copy: { flex: 1, gap: spacing[1] },
        toggleTrack: {
          width: 46,
          height: 28,
          justifyContent: 'center',
          padding: 3,
          borderRadius: 14,
          backgroundColor: theme.colors.surfaceMuted,
        },
        toggleTrackOn: { backgroundColor: theme.colors.primary },
        toggleThumb: {
          width: 22,
          height: 22,
          alignSelf: 'flex-start',
          borderRadius: 11,
          backgroundColor: theme.colors.surfaceElevated,
        },
        toggleThumbOn: { alignSelf: 'flex-end' },
        pressed: { opacity: theme.opacity.pressed },
      }),
    [theme],
  )
  const toggle = typeof value === 'boolean' && onValueChange
  return (
    <Pressable
      aria-checked={toggle ? value : undefined}
      accessibilityRole={toggle ? 'switch' : onPress ? 'button' : undefined}
      accessibilityState={toggle ? { checked: value } : undefined}
      disabled={!onPress && !toggle}
      onPress={toggle ? () => onValueChange(!value) : onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Icon
        color={danger ? theme.colors.danger : theme.colors.textSecondary}
        size={21}
      />
      <View style={styles.copy}>
        <Text
          variant="label"
          color={danger ? theme.colors.danger : theme.colors.text}
        >
          {label}
        </Text>
        {detail ? (
          <Text variant="caption" color={theme.colors.textMuted}>
            {detail}
          </Text>
        ) : null}
      </View>
      {toggle ? (
        <View
          accessibilityElementsHidden
          pointerEvents="none"
          style={[styles.toggleTrack, value && styles.toggleTrackOn]}
        >
          <View style={[styles.toggleThumb, value && styles.toggleThumbOn]} />
        </View>
      ) : onPress ? (
        <CaretRight color={theme.colors.textMuted} size={20} />
      ) : null}
    </Pressable>
  )
}
