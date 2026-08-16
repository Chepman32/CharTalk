import { describe, expect, it } from 'vitest'

import { textScaleMultiplier } from './text-scale'

describe('textScaleMultiplier', () => {
  it('keeps standard text unchanged', () => {
    expect(textScaleMultiplier('standard')).toBe(1)
  })

  it('offers the PDS 150% and 200% accessibility sizes', () => {
    expect(textScaleMultiplier('large')).toBe(1.5)
    expect(textScaleMultiplier('extraLarge')).toBe(2)
  })
})
