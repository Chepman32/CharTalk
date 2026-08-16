import { Redirect, useLocalSearchParams } from 'expo-router'
import React from 'react'

import { useApp } from '@/state/AppProvider'

/** Resolve the public story-scoped run URL to the canonical run surface. */
export default function StoryRunRouteAlias() {
  const { runId, storyId } = useLocalSearchParams<{
    runId: string
    storyId: string
  }>()
  const { loading, snapshot } = useApp()

  if (loading) return null

  const run = snapshot?.runs.find(item => item.runId === runId)
  if (!run || !storyId || run.storyId !== storyId) {
    return <Redirect href="/(tabs)/stories" />
  }

  return <Redirect href={`/run/${encodeURIComponent(runId)}`} />
}
