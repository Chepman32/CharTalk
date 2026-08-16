import { typography } from '@chartalk/design-system'
import { Books, GearSix, Tray } from 'phosphor-react-native'
import { Tabs } from 'expo-router'
import React from 'react'

import { useTheme } from '@/theme/ThemeProvider'

export default function TabsLayout() {
  const { theme } = useTheme()
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.tabActive,
        tabBarInactiveTintColor: theme.colors.tabInactive,
        tabBarStyle: {
          backgroundColor: theme.colors.navBackground,
          borderTopColor: theme.colors.border,
          height: 74,
          paddingTop: 7,
        },
        tabBarLabelStyle: { fontFamily: typography.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="stories"
        options={{
          title: 'Истории',
          tabBarIcon: ({ color, size }) => (
            <Books color={color as string} size={size} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          title: 'Архив',
          tabBarIcon: ({ color, size }) => (
            <Tray color={color as string} size={size} weight="fill" />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Настройки',
          tabBarIcon: ({ color, size }) => (
            <GearSix color={color as string} size={size} weight="fill" />
          ),
        }}
      />
    </Tabs>
  )
}
