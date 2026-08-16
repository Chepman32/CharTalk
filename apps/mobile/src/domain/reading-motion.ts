import type { ReaderSettings } from '@chartalk/app-core'

export const messageRevealDelayMs = (
  settings: Pick<
    ReaderSettings,
    'messageSpeed' | 'reduceMotion' | 'revealImmediately'
  >,
): number => {
  if (
    settings.reduceMotion ||
    settings.revealImmediately ||
    settings.messageSpeed === 'instant'
  ) {
    return 0
  }
  return settings.messageSpeed === 'slow' ? 650 : 280
}
