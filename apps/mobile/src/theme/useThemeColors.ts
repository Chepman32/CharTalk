import { useMemo } from 'react'

import { useTheme } from './ThemeProvider'

export function useThemeColors() {
  const { theme } = useTheme()
  return useMemo(
    () => ({
      canvas: theme.colors.background,
      raised: theme.colors.surface,
      panel: theme.colors.surfaceElevated,
      interactive: theme.colors.surfaceMuted,
      border: theme.colors.border,
      textPrimary: theme.colors.text,
      textSecondary: theme.colors.textSecondary,
      textMuted: theme.colors.textMuted,
      ember: theme.accents.ember,
      emberSoft: theme.colors.primary,
      ochre: theme.accents.ochre,
      plum: theme.accents.plum,
      moss: theme.colors.success,
      danger: theme.colors.danger,
      info: theme.colors.info,
      inverse: theme.colors.buttonPrimaryText,
      focus: theme.colors.focusRing,
      input: theme.colors.inputBackground,
      inputBorder: theme.colors.inputBorder,
      placeholder: theme.colors.placeholder,
      divider: theme.colors.divider,
      mediaScrim: theme.colors.mediaScrim,
      mediaText: theme.colors.mediaText,
      mediaTextMuted: theme.colors.mediaTextMuted,
    }),
    [theme],
  )
}

export type ThemeColorAliases = ReturnType<typeof useThemeColors>
