import type { ThemePreference } from '@chartalk/app-core'
import { themes, type AppTheme, type ThemeName } from '@chartalk/design-system'
import React, { createContext, useContext, useMemo } from 'react'
import { useColorScheme } from 'react-native'

import { useApp } from '@/state/AppProvider'

interface ThemeContextValue {
  theme: AppTheme
  themeName: ThemeName
  preference: ThemePreference
  setPreference(preference: ThemePreference): Promise<void>
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const { snapshot, updateSettings } = useApp()
  const systemScheme = useColorScheme()
  const preference = snapshot?.settings.theme ?? 'system'
  const themeName: ThemeName =
    preference === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : preference
  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: themes[themeName] ?? themes.dark,
      themeName,
      preference,
      setPreference: next => updateSettings({ theme: next }),
    }),
    [preference, themeName, updateSettings],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme must be used inside ThemeProvider')
  return value
}
