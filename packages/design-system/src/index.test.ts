import { describe, expect, it } from 'vitest'

import { motion, nativeColors, spacing, themes, touchTarget } from './index'

const values = <T extends object>(record: T): Array<T[keyof T]> =>
  Object.keys(record).map(key => record[key as keyof T])

const relativeLuminance = (hex: string): number => {
  const channels = [1, 3, 5].map(index =>
    Number.parseInt(hex.slice(index, index + 2), 16),
  )
  const [red, green, blue] = channels.map(channel => {
    const value = channel / 255
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4)
  }) as [number, number, number]
  return red * 0.2126 + green * 0.7152 + blue * 0.0722
}

const contrastRatio = (foreground: string, background: string): number => {
  const values = [relativeLuminance(foreground), relativeLuminance(background)]
  const lighter = Math.max(...values)
  const darker = Math.min(...values)
  return (lighter + 0.05) / (darker + 0.05)
}

describe('design tokens', () => {
  it('defines four complete themes with distinct character accents', () => {
    expect(Object.keys(themes)).toEqual(['light', 'dark', 'solar', 'mono'])
    for (const theme of Object.values(themes)) {
      expect(new Set(Object.values(theme.accents)).size).toBe(5)
      expect(Object.values(theme.colors).every(Boolean)).toBe(true)
    }
  })

  it('keeps the mono palette and accents grayscale', () => {
    const hexValues = [
      ...values(themes.mono.colors),
      ...values(themes.mono.accents),
    ].filter(value => /^#[0-9a-f]{6}$/i.test(value))
    expect(
      hexValues.every(value => {
        const red = value.slice(1, 3)
        return value.slice(3, 5) === red && value.slice(5, 7) === red
      }),
    ).toBe(true)
  })

  it('meets the minimum mobile touch target', () => {
    expect(touchTarget.minimum).toBeGreaterThanOrEqual(48)
  })

  it('uses a restrained spacing and motion scale', () => {
    expect(spacing[4]).toBe(16)
    expect(motion.deliberate).toBeLessThanOrEqual(420)
    expect(nativeColors.textPrimary).not.toBe(nativeColors.canvas)
  })

  it('keeps text, controls, and focus indicators at WCAG AA contrast', () => {
    for (const theme of Object.values(themes)) {
      const textPairs = [
        [theme.colors.text, theme.colors.background],
        [theme.colors.textSecondary, theme.colors.background],
        [theme.colors.textMuted, theme.colors.background],
        [theme.colors.inputText, theme.colors.inputBackground],
        [theme.colors.placeholder, theme.colors.inputBackground],
        [theme.colors.buttonPrimaryText, theme.colors.buttonPrimaryBg],
        [theme.colors.buttonSecondaryText, theme.colors.buttonSecondaryBg],
        [theme.colors.buttonGhostText, theme.colors.background],
        [theme.colors.tabInactive, theme.colors.navBackground],
        [theme.colors.mediaText, '#111118'],
        [theme.colors.mediaTextMuted, '#111118'],
      ]
      for (const [foreground, background] of textPairs) {
        expect(
          contrastRatio(foreground!, background!),
          `${theme.name}: ${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(4.5)
      }

      const controlPairs = [
        [theme.colors.inputBorder, theme.colors.inputBackground],
        [theme.colors.inputBorder, theme.colors.background],
        [theme.colors.focusRing, theme.colors.background],
        [theme.colors.focusRing, theme.colors.inputBackground],
      ]
      for (const [foreground, background] of controlPairs) {
        expect(
          contrastRatio(foreground!, background!),
          `${theme.name}: control ${foreground} on ${background}`,
        ).toBeGreaterThanOrEqual(3)
      }
    }
  })
})
