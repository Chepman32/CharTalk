import { Redirect } from 'expo-router'
import React from 'react'

/** Accounts are intentionally out of v1; keep the contract path local-only. */
export default function AccountRoute() {
  return <Redirect href="/profile" />
}
