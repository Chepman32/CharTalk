import { Redirect } from 'expo-router'
import React from 'react'

/** Keep the PDS onboarding entry point stable while the flow is one screen. */
export default function OnboardingAddressingRoute() {
  return <Redirect href="/onboarding" />
}
