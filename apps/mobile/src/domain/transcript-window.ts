import type { TranscriptEntry } from '@razvilka/app-core'

export const TRANSCRIPT_PAGE_SIZE = 200
export const TRANSCRIPT_WINDOW_LIMIT = 600

export interface TranscriptWindow {
  startIndex: number
  endIndex: number
  anchorEntryId: string | null
  hasOlder: boolean
  hasNewer: boolean
}

const boundedVisibleCount = (
  entries: readonly TranscriptEntry[],
  visibleCount: number,
): number =>
  Math.max(
    0,
    Math.min(
      entries.length,
      Number.isFinite(visibleCount) ? Math.floor(visibleCount) : entries.length,
    ),
  )

export const resolveTranscriptWindow = (
  entries: readonly TranscriptEntry[],
  visibleCount: number,
  anchorEntryId: string | null,
): TranscriptWindow => {
  const visible = boundedVisibleCount(entries, visibleCount)
  if (visible === 0) {
    return {
      startIndex: 0,
      endIndex: 0,
      anchorEntryId: null,
      hasOlder: false,
      hasNewer: false,
    }
  }

  const requestedAnchorIndex = anchorEntryId
    ? entries.findIndex(
        (entry, index) => index < visible && entry.entryId === anchorEntryId,
      )
    : -1
  const anchorIndex =
    requestedAnchorIndex >= 0 ? requestedAnchorIndex : visible - 1
  const size = Math.min(TRANSCRIPT_WINDOW_LIMIT, visible)
  const preferredStart = anchorIndex - TRANSCRIPT_PAGE_SIZE
  const startIndex = Math.max(0, Math.min(preferredStart, visible - size))
  const endIndex = startIndex + size

  return {
    startIndex,
    endIndex,
    anchorEntryId: entries[anchorIndex]?.entryId ?? null,
    hasOlder: startIndex > 0,
    hasNewer: endIndex < visible,
  }
}

export const moveTranscriptWindow = (
  entries: readonly TranscriptEntry[],
  current: TranscriptWindow,
  direction: 'older' | 'newer',
  visibleCount: number,
): TranscriptWindow => {
  const visible = boundedVisibleCount(entries, visibleCount)
  const size = Math.min(TRANSCRIPT_WINDOW_LIMIT, visible)
  if (size === 0) return resolveTranscriptWindow(entries, visible, null)

  const startIndex =
    direction === 'older'
      ? Math.max(0, current.startIndex - TRANSCRIPT_PAGE_SIZE)
      : Math.min(
          Math.max(0, visible - size),
          current.startIndex + TRANSCRIPT_PAGE_SIZE,
        )
  const endIndex = Math.min(visible, startIndex + size)
  const normalizedStart = Math.max(0, endIndex - size)
  const anchorIndex =
    direction === 'older'
      ? Math.min(visible - 1, current.startIndex)
      : endIndex - 1

  return {
    startIndex: normalizedStart,
    endIndex,
    anchorEntryId: entries[anchorIndex]?.entryId ?? null,
    hasOlder: normalizedStart > 0,
    hasNewer: endIndex < visible,
  }
}

export const transcriptWindowEntries = (
  entries: readonly TranscriptEntry[],
  window: TranscriptWindow,
): TranscriptEntry[] => entries.slice(window.startIndex, window.endIndex)
