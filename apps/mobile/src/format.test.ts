import { describe, expect, it } from 'vitest'

import {
  formatChoiceCount,
  formatEndingCount,
  formatEpisodeCount,
  formatMessageAccessibility,
  formatMinuteCount,
  formatRunCount,
  formatStoryCount,
} from './format'

describe('formatChoiceCount', () => {
  it.each([
    [0, '0 выборов'],
    [1, '1 выбор'],
    [2, '2 выбора'],
    [4, '4 выбора'],
    [5, '5 выборов'],
    [11, '11 выборов'],
    [21, '21 выбор'],
    [24, '24 выбора'],
    [25, '25 выборов'],
  ])('formats %i with the correct Russian plural', (count, expected) => {
    expect(formatChoiceCount(count)).toBe(expected)
  })
})

describe('story progress counters', () => {
  it.each([
    [formatRunCount, 1, '1 прохождение'],
    [formatRunCount, 2, '2 прохождения'],
    [formatRunCount, 5, '5 прохождений'],
    [formatEndingCount, 1, '1 финал'],
    [formatEndingCount, 3, '3 финала'],
    [formatEndingCount, 11, '11 финалов'],
    [formatEpisodeCount, 1, '1 эпизод'],
    [formatEpisodeCount, 2, '2 эпизода'],
    [formatEpisodeCount, 5, '5 эпизодов'],
  ])('formats %i with the correct noun', (format, count, expected) => {
    expect(format(count)).toBe(expected)
  })
})

describe('catalog and accessibility copy', () => {
  it.each([
    [1, '1 история'],
    [2, '2 истории'],
    [5, '5 историй'],
    [21, '21 история'],
    [24, '24 истории'],
    [25, '25 историй'],
  ])('formats %i stories naturally', (count, expected) => {
    expect(formatStoryCount(count)).toBe(expected)
  })

  it.each([
    [1, '1 минута'],
    [2, '2 минуты'],
    [5, '5 минут'],
    [24, '24 минуты'],
    [25, '25 минут'],
  ])('formats %i minutes naturally', (count, expected) => {
    expect(formatMinuteCount(count)).toBe(expected)
  })

  it('joins attachment descriptions without duplicate punctuation', () => {
    expect(
      formatMessageAccessibility(
        'На столе лежат старая записка, ключ и билет.',
        'Ты всё-таки здесь.',
      ),
    ).toBe('На столе лежат старая записка, ключ и билет. Ты всё-таки здесь.')
    expect(
      formatMessageAccessibility('На столе лежит ключ', 'Он блестит.'),
    ).toBe('На столе лежит ключ. Он блестит.')
    expect(formatMessageAccessibility(undefined, 'Текст.')).toBe('Текст.')
  })
})
