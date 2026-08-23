import { readFileSync } from 'node:fs'

import { describe, expect, it } from 'vitest'

const storyCardSource = readFileSync(
  new URL('./StoryCard.tsx', import.meta.url),
  'utf8',
)

describe('story card', () => {
  it('does not present embedded stories as a separate offline state', () => {
    expect({
      hasOfflineBadge: storyCardSource.includes('Офлайн'),
      hasDownloadBadge: storyCardSource.includes('Скачать'),
      hasAvailabilityProp: /\bisDownloaded\b/.test(storyCardSource),
    }).toEqual({
      hasOfflineBadge: false,
      hasDownloadBadge: false,
      hasAvailabilityProp: false,
    })
  })
})
