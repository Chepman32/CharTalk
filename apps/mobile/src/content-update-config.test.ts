import { describe, expect, it } from 'vitest'

import { contentUpdateConfigured } from './content-update-config'

describe('contentUpdateConfigured', () => {
  it('accepts the rotation-safe public key map without the legacy key', () => {
    expect(
      contentUpdateConfigured(
        'https://api.chartalk.app',
        undefined,
        '{"prod-2026-q3":"key"}',
      ),
    ).toBe(true)
  })

  it('rejects missing endpoint or trusted key material', () => {
    expect(contentUpdateConfigured(undefined, 'legacy', undefined)).toBe(false)
    expect(contentUpdateConfigured('https://api.chartalk.app', ' ', ' ')).toBe(
      false,
    )
    expect(
      contentUpdateConfigured(
        'https://api.chartalk.app',
        undefined,
        '{not-json',
      ),
    ).toBe(false)
    expect(
      contentUpdateConfigured('https://api.chartalk.app', undefined, '{}'),
    ).toBe(false)
  })
})
