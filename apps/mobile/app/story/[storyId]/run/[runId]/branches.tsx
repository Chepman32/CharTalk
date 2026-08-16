import { Redirect, useLocalSearchParams } from 'expo-router'
import React from 'react'

import { useApp } from '@/state/AppProvider'

/** Resolve the public story-scoped branch URL to the canonical branch surface. */
export default function StoryBranchesRouteAlias() {
  const { storyId, runId } = useLocalSearchParams<{
    storyId: string
    runId: string
  }>()
  const { contentCatalog, loading, snapshot } = useApp()

  if (loading) return null

  const storyExists = contentCatalog.stories.some(
    item => item.storyId === storyId,
  )
  const run = snapshot?.runs.find(item => item.runId === runId)
  if (!storyId || !storyExists || !run || run.storyId !== storyId) {
    return <Redirect href="/(tabs)/stories" />
  }

  return <Redirect href={`/branches/${encodeURIComponent(storyId)}`} />
}
