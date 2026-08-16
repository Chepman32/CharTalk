import type { ReaderSettings } from '@chartalk/app-core'

const scaleByPreference: Record<ReaderSettings['textScale'], number> = {
  standard: 1,
  large: 1.5,
  extraLarge: 2,
}

export const textScaleMultiplier = (
  preference: ReaderSettings['textScale'],
): number => scaleByPreference[preference]
