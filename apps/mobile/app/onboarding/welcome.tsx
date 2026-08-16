import { Redirect } from 'expo-router'
import React from 'react'

/** Keep the PDS onboarding entry point stable while the flow is one screen. */
export default function OnboardingWelcomeRoute() {
  return <Redirect href="/onboarding" />
}
