import {
  type AppTheme,
  radius,
  spacing,
  touchTarget,
  typography,
} from '@chartalk/design-system'
import type { IconProps } from 'phosphor-react-native'
import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  type StyleProp,
  StyleSheet,
  Text as NativeText,
  type TextProps,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useApp } from '@/state/AppProvider'
import { useTheme } from '@/theme/ThemeProvider'
import { pillTextColor, type PillTone } from '@/ui/pill-style'
import { textScaleMultiplier } from '@/ui/text-scale'

type TextVariant =
  'display' | 'title' | 'heading' | 'body' | 'caption' | 'label' | 'mono'

const useStyles = () => {
  const { theme } = useTheme()
  return { theme, styles: useMemo(() => createStyles(theme), [theme]) }
}

export function Text({
  variant = 'body',
  color,
  style,
  scaleWithPreference = true,
  maxFontSizeMultiplier = 2,
  ...props
}: TextProps & {
  variant?: TextVariant
  color?: string
  scaleWithPreference?: boolean
}) {
  const { snapshot } = useApp()
  const { theme, styles } = useStyles()
  const flattened = StyleSheet.flatten([
    styles[`text_${variant}`],
    { color: color ?? theme.colors.text },
    style,
  ])
  const multiplier = scaleWithPreference
    ? textScaleMultiplier(snapshot?.settings.textScale ?? 'standard')
    : 1
  const scaledStyle: TextStyle = {
    ...(typeof flattened.fontSize === 'number'
      ? { fontSize: Math.round(flattened.fontSize * multiplier * 10) / 10 }
      : {}),
    ...(typeof flattened.lineHeight === 'number'
      ? {
          lineHeight: Math.round(flattened.lineHeight * multiplier * 10) / 10,
        }
      : {}),
  }

  return (
    <NativeText
      {...props}
      accessibilityRole={
        props.accessibilityRole ??
        (variant === 'display' || variant === 'title' || variant === 'heading'
          ? 'header'
          : undefined)
      }
      allowFontScaling
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[flattened, scaledStyle]}
    />
  )
}

export function Screen({
  children,
  scroll = true,
  contentStyle,
  testID,
}: React.PropsWithChildren<{
  scroll?: boolean
  contentStyle?: StyleProp<ViewStyle>
  testID?: string
}>) {
  const { styles } = useStyles()
  const content = (
    <View style={[styles.screenContent, contentStyle]}>{children}</View>
  )
  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={styles.safe}
      testID={testID}
    >
      {scroll ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {content}
        </ScrollView>
      ) : (
        content
      )}
    </SafeAreaView>
  )
}

type IconComponent = React.ComponentType<IconProps>

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  disabled = false,
  loading = false,
  accessibilityHint,
  testID,
}: {
  label: string
  onPress(): void
  variant?: 'primary' | 'secondary' | 'quiet' | 'danger'
  icon?: IconComponent
  disabled?: boolean
  loading?: boolean
  accessibilityHint?: string
  testID?: string
}) {
  const { theme, styles } = useStyles()
  const foreground =
    variant === 'primary'
      ? theme.colors.buttonPrimaryText
      : variant === 'danger'
        ? theme.colors.danger
        : theme.colors.buttonSecondaryText
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        styles[`button_${variant}`],
        pressed && styles.buttonPressed,
        (disabled || loading) && styles.buttonDisabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foreground} />
      ) : (
        <>
          {Icon ? <Icon size={19} weight="bold" color={foreground} /> : null}
          <Text variant="label" color={foreground}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  )
}

export function SectionLabel({ children }: React.PropsWithChildren) {
  const { theme, styles } = useStyles()
  return (
    <Text
      variant="mono"
      color={theme.colors.accent}
      style={styles.sectionLabel}
    >
      {children}
    </Text>
  )
}

export function Pill({
  children,
  tone = 'neutral',
}: React.PropsWithChildren<{ tone?: PillTone }>) {
  const { theme, styles } = useStyles()
  return (
    <View style={[styles.pill, tone === 'accent' && styles.pillAccent]}>
      <Text variant="caption" color={pillTextColor(tone, theme.colors)}>
        {children}
      </Text>
    </View>
  )
}

export function Divider() {
  const { styles } = useStyles()
  return <View style={styles.divider} />
}

export function InlineError({
  message,
  onDismiss,
}: {
  message: string
  onDismiss?: () => void
}) {
  const { theme, styles } = useStyles()
  return (
    <Pressable
      accessibilityRole={onDismiss ? 'button' : undefined}
      accessibilityLabel={onDismiss ? 'Закрыть сообщение об ошибке' : undefined}
      onPress={onDismiss}
      style={styles.error}
    >
      <Text variant="caption" color={theme.colors.text}>
        Ошибка: {message}
      </Text>
    </Pressable>
  )
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const { theme, styles } = useStyles()
  return (
    <View style={styles.empty}>
      <Text variant="heading">{title}</Text>
      <Text color={theme.colors.textSecondary} style={styles.emptyBody}>
        {body}
      </Text>
    </View>
  )
}

const createStyles = (theme: AppTheme) => {
  const baseText: TextStyle = {
    fontFamily: typography.body,
    color: theme.colors.text,
  }
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: theme.colors.background },
    scrollContent: { flexGrow: 1 },
    screenContent: {
      flexGrow: 1,
      width: '100%',
      maxWidth: 760,
      alignSelf: 'center',
      paddingHorizontal: spacing[5],
      paddingTop: spacing[4],
      paddingBottom: spacing[12],
      gap: spacing[5],
    },
    text_display: {
      ...baseText,
      fontFamily: typography.display,
      fontSize: 43,
      lineHeight: 48,
      letterSpacing: -1.4,
    },
    text_title: {
      ...baseText,
      fontFamily: typography.display,
      fontSize: 32,
      lineHeight: 38,
      letterSpacing: -0.8,
    },
    text_heading: {
      ...baseText,
      fontFamily: typography.display,
      fontSize: 23,
      lineHeight: 29,
      letterSpacing: -0.35,
    },
    text_body: { ...baseText, fontSize: 16, lineHeight: 25 },
    text_caption: { ...baseText, fontSize: 13, lineHeight: 19 },
    text_label: {
      ...baseText,
      fontFamily: typography.bodyMedium,
      fontSize: 15,
      lineHeight: 20,
    },
    text_mono: {
      ...baseText,
      fontFamily: typography.mono,
      fontSize: 11,
      lineHeight: 16,
      letterSpacing: 1.1,
      textTransform: 'uppercase',
    },
    button: {
      minHeight: touchTarget.comfortable,
      paddingHorizontal: spacing[5],
      paddingVertical: spacing[3],
      borderRadius: radius.medium,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[2],
      borderWidth: 1,
    },
    button_primary: {
      backgroundColor: theme.colors.buttonPrimaryBg,
      borderColor: theme.colors.buttonPrimaryBg,
    },
    button_secondary: {
      backgroundColor: theme.colors.buttonSecondaryBg,
      borderColor: theme.colors.border,
    },
    button_quiet: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.border,
    },
    button_danger: {
      backgroundColor: 'transparent',
      borderColor: theme.colors.danger,
    },
    buttonPressed: {
      opacity: theme.opacity.pressed,
      transform: [{ scale: 0.985 }],
    },
    buttonDisabled: { opacity: theme.opacity.disabled },
    sectionLabel: { marginBottom: -spacing[2] },
    pill: {
      alignSelf: 'flex-start',
      borderRadius: radius.pill,
      borderColor: theme.colors.border,
      borderWidth: 1,
      paddingHorizontal: spacing[3],
      paddingVertical: spacing[1],
    },
    pillAccent: {
      backgroundColor: theme.colors.buttonPrimaryBg,
      borderColor: theme.colors.buttonPrimaryBg,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: theme.colors.divider,
    },
    error: {
      borderLeftWidth: 3,
      borderLeftColor: theme.colors.danger,
      paddingHorizontal: spacing[4],
      paddingVertical: spacing[3],
      backgroundColor: theme.colors.surfaceElevated,
    },
    empty: {
      flex: 1,
      minHeight: 280,
      justifyContent: 'center',
      alignItems: 'flex-start',
      gap: spacing[2],
    },
    emptyBody: { maxWidth: 420 },
  })
}
