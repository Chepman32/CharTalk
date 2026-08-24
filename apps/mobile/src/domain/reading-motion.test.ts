import { describe, expect, it } from 'vitest'

import { defaultSettings } from '@razvilka/app-core'

import { messageRevealDelayMs } from './reading-motion'

describe('messageRevealDelayMs', () => {
  it('removes authored reveal delay for every reduced-motion speed', () => {
    for (const messageSpeed of ['instant', 'normal', 'slow'] as const) {
      expect(
        messageRevealDelayMs({
          ...defaultSettings,
          messageSpeed,
          reduceMotion: true,
        }),
      ).toBe(0)
    }
  })

  it('honors both explicit instant-reveal controls', () => {
    expect(
      messageRevealDelayMs({
        ...defaultSettings,
        revealImmediately: true,
      }),
    ).toBe(0)
    expect(
      messageRevealDelayMs({
        ...defaultSettings,
        messageSpeed: 'instant',
      }),
    ).toBe(0)
  })

  it('keeps deterministic normal and slow authored pacing', () => {
    expect(messageRevealDelayMs(defaultSettings)).toBe(280)
    expect(
      messageRevealDelayMs({ ...defaultSettings, messageSpeed: 'slow' }),
    ).toBe(650)
  })
})
