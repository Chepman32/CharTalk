import {
  JetBrainsMono_500Medium,
  useFonts as useJetBrainsMono,
} from '@expo-google-fonts/jetbrains-mono'
import { Lora_600SemiBold, useFonts as useLora } from '@expo-google-fonts/lora'
import {
  Manrope_400Regular,
  Manrope_600SemiBold,
  useFonts as useManrope,
} from '@expo-google-fonts/manrope'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import React, { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { NotificationCoordinator } from '@/notifications/NotificationCoordinator'
import { AppProvider } from '@/state/AppProvider'
import { ThemeProvider, useTheme } from '@/theme/ThemeProvider'

void SplashScreen.preventAutoHideAsync()

function ThemedNavigator() {
  const { theme } = useTheme()
  return (
    <>
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.colors.headerBackground },
          headerShadowVisible: false,
          headerTintColor: theme.colors.text,
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: theme.colors.background },
          animation: 'fade_from_bottom',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="character/[characterId]" options={{ title: '' }} />
        <Stack.Screen name="story/[storyId]" options={{ title: '' }} />
        <Stack.Screen
          name="run/[runId]"
          options={{ headerShown: false, gestureEnabled: false }}
        />
        <Stack.Screen name="recap/[runId]" options={{ title: 'Итог' }} />
        <Stack.Screen
          name="branches/[storyId]"
          options={{ title: 'Развилки' }}
        />
        <Stack.Screen name="content-controls" options={{ title: 'Контент' }} />
        <Stack.Screen name="downloads" options={{ title: 'Обновления' }} />
        <Stack.Screen name="appearance" options={{ title: 'Оформление' }} />
        <Stack.Screen name="text-size" options={{ title: 'Размер текста' }} />
        <Stack.Screen name="profile" options={{ title: 'Профиль' }} />
        <Stack.Screen name="support" options={{ title: 'Поддержка' }} />
        <Stack.Screen
          name="report"
          options={{ title: 'Сообщить о проблеме' }}
        />
        <Stack.Screen name="legal/privacy" options={{ title: 'Приватность' }} />
        <Stack.Screen name="legal/terms" options={{ title: 'Условия' }} />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  const [loraLoaded] = useLora({ Lora_600SemiBold })
  const [manropeLoaded] = useManrope({
    Manrope_400Regular,
    Manrope_600SemiBold,
  })
  const [monoLoaded] = useJetBrainsMono({ JetBrainsMono_500Medium })
  const fontsLoaded = loraLoaded && manropeLoaded && monoLoaded

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  if (!fontsLoaded) return null

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <NotificationCoordinator />
          <ThemeProvider>
            <ThemedNavigator />
          </ThemeProvider>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
