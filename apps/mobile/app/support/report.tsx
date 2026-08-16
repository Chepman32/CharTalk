import { Redirect } from 'expo-router'
import React from 'react'

/** PDS-compatible support deep link; the report surface remains canonical. */
export default function SupportReportRoute() {
  return <Redirect href="/report" />
}
