export type PillTone = 'neutral' | 'accent' | 'media'

type PillTextColors = {
  buttonPrimaryText: string
  mediaText: string
  textSecondary: string
}

export const pillTextColor = (tone: PillTone, colors: PillTextColors) => {
  switch (tone) {
    case 'accent':
      return colors.buttonPrimaryText
    case 'media':
      return colors.mediaText
    case 'neutral':
      return colors.textSecondary
  }
}
