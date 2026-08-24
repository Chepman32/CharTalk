import { describe, expect, it } from 'vitest'

import type { TranscriptEntry } from '@razvilka/app-core'

import {
  TRANSCRIPT_PAGE_SIZE,
  TRANSCRIPT_WINDOW_LIMIT,
  moveTranscriptWindow,
  resolveTranscriptWindow,
  transcriptWindowEntries,
} from './transcript-window'

const transcript = Array.from({ length: 10_000 }, (_, index) => ({
  entryId: `entry-${index}`,
  speakerId: index % 2 === 0 ? 'character' : 'player',
  text: `Сообщение ${index}`,
  kind: index % 2 === 0 ? 'message' : 'choice',
})) satisfies TranscriptEntry[]

describe('transcript window', () => {
  it('keeps a 10,000-entry run bounded around a stable entry-ID anchor', () => {
    const window = resolveTranscriptWindow(
      transcript,
      transcript.length,
      'entry-4_999'.replace('_', ''),
    )
    const entries = transcriptWindowEntries(transcript, window)

    expect(entries).toHaveLength(TRANSCRIPT_WINDOW_LIMIT)
    expect(entries.some(item => item.entryId === 'entry-4999')).toBe(true)
    expect(window.startIndex).toBeLessThanOrEqual(4_999)
    expect(window.endIndex).toBeGreaterThan(4_999)
    expect(JSON.stringify(entries).length).toBeLessThan(100_000)
  })

  it('defaults to the latest page when an anchor is missing', () => {
    const window = resolveTranscriptWindow(
      transcript,
      transcript.length,
      'removed-entry',
    )

    expect(window.endIndex).toBe(transcript.length)
    expect(window.startIndex).toBe(transcript.length - TRANSCRIPT_WINDOW_LIMIT)
    expect(window.anchorEntryId).toBe('entry-9999')
  })

  it('pages in both directions without exceeding the in-memory window', () => {
    const latest = resolveTranscriptWindow(transcript, transcript.length, null)
    const older = moveTranscriptWindow(
      transcript,
      latest,
      'older',
      transcript.length,
    )
    const newer = moveTranscriptWindow(
      transcript,
      older,
      'newer',
      transcript.length,
    )

    expect(latest.startIndex - older.startIndex).toBe(TRANSCRIPT_PAGE_SIZE)
    expect(older.endIndex - older.startIndex).toBe(TRANSCRIPT_WINDOW_LIMIT)
    expect(older.anchorEntryId).toBe(transcript[latest.startIndex]?.entryId)
    expect(newer).toEqual(latest)
  })

  it('never exposes entries beyond authored reveal progress', () => {
    const window = resolveTranscriptWindow(transcript, 125, null)
    const entries = transcriptWindowEntries(transcript, window)

    expect(entries.at(-1)?.entryId).toBe('entry-124')
    expect(window.hasNewer).toBe(false)
    expect(window.hasOlder).toBe(false)
  })

  it('handles empty, negative, and non-finite reveal progress safely', () => {
    expect(resolveTranscriptWindow([], 0, 'missing')).toEqual({
      startIndex: 0,
      endIndex: 0,
      anchorEntryId: null,
      hasOlder: false,
      hasNewer: false,
    })
    expect(
      transcriptWindowEntries(
        transcript,
        resolveTranscriptWindow(transcript, -1, null),
      ),
    ).toEqual([])
    expect(
      resolveTranscriptWindow(transcript, Number.POSITIVE_INFINITY, null)
        .endIndex,
    ).toBe(transcript.length)
    expect(
      moveTranscriptWindow(
        [],
        resolveTranscriptWindow([], 0, null),
        'older',
        0,
      ),
    ).toEqual(resolveTranscriptWindow([], 0, null))
  })
})
