import { Redirect } from 'expo-router'
import React, { useMemo } from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'

import { useApp } from '@/state/AppProvider'
import { type ThemeColorAliases, useThemeColors } from '@/theme/useThemeColors'

export default function IndexScreen() {
  const nativeColors = useThemeColors()
  const styles = useMemo(() => createStyles(nativeColors), [nativeColors])
  const { loading, snapshot } = useApp()
  if (loading || !snapshot) {
    return (
      <View style={styles.loading} accessibilityLabel="Загрузка приложения">
        <ActivityIndicator color={nativeColors.emberSoft} size="large" />
      </View>
    )
  }
  return (
    <Redirect
      href={snapshot.onboardingComplete ? '/(tabs)/stories' : '/onboarding'}
    />
  )
}

const createStyles = (nativeColors: ThemeColorAliases) =>
  StyleSheet.create({
    loading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: nativeColors.canvas,
    },
  })
