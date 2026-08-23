import { describe, expect, it } from 'vitest'

import { pillTextColor } from './pill-style'

const colors = {
  buttonPrimaryText: '#111118',
  mediaText: '#FFFFFF',
  textSecondary: '#514C48',
}

describe('pillTextColor', () => {
  it('uses high-contrast media text for badges over imagery', () => {
    expect(pillTextColor('media', colors)).toBe(colors.mediaText)
  })

  it('preserves the existing semantic colors for regular and accent badges', () => {
    expect(pillTextColor('neutral', colors)).toBe(colors.textSecondary)
    expect(pillTextColor('accent', colors)).toBe(colors.buttonPrimaryText)
  })
})
