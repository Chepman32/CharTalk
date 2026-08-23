import { useRouter } from 'expo-router'
import { useCallback, useEffect, useRef } from 'react'
import { AppState } from 'react-native'

import { useApp } from '@/state/AppProvider'

import {
  addWeekendReminderResponseListener,
  notificationGateway,
} from './notification-gateway'
import { reconcileWeekendReminders } from './reminder-scheduler'

export function NotificationCoordinator() {
  const router = useRouter()
  const { snapshot } = useApp()
  const reconcileQueue = useRef<Promise<void>>(Promise.resolve())

  const synchronize = useCallback(() => {
    if (!snapshot) return Promise.resolve()
    const input = {
      settings: snapshot.settings,
      runs: snapshot.runs,
      onboardingCompletedAt: snapshot.profile?.createdAt ?? null,
    }
    reconcileQueue.current = reconcileQueue.current
      .then(() => reconcileWeekendReminders(input, notificationGateway))
      .catch(() => {
        // Reminders are best-effort and must never interrupt reading or saves.
      })
    return reconcileQueue.current
  }, [snapshot])

  useEffect(() => {
    void synchronize()
  }, [synchronize])

  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') void synchronize()
    })
    return () => subscription.remove()
  }, [synchronize])

  useEffect(
    () =>
      addWeekendReminderResponseListener(() =>
        router.navigate('/(tabs)/stories'),
      ),
    [router],
  )

  return null
}
