const russianCount = (
  count: number,
  forms: readonly [one: string, few: string, many: string],
): string => {
  const absolute = Math.abs(count)
  const lastTwo = absolute % 100
  const last = absolute % 10
  const noun =
    last === 1 && lastTwo !== 11
      ? forms[0]
      : last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)
        ? forms[1]
        : forms[2]

  return `${count} ${noun}`
}

export const formatChoiceCount = (count: number): string =>
  russianCount(count, ['выбор', 'выбора', 'выборов'])

export const formatRunCount = (count: number): string =>
  russianCount(count, ['прохождение', 'прохождения', 'прохождений'])

export const formatEndingCount = (count: number): string =>
  russianCount(count, ['финал', 'финала', 'финалов'])

export const formatEpisodeCount = (count: number): string =>
  russianCount(count, ['эпизод', 'эпизода', 'эпизодов'])

export const formatStoryCount = (count: number): string =>
  russianCount(count, ['история', 'истории', 'историй'])

export const formatMinuteCount = (count: number): string =>
  russianCount(count, ['минута', 'минуты', 'минут'])

/** Joins an optional attachment description with a message for screen readers. */
export const formatMessageAccessibility = (
  description: string | undefined,
  text: string,
): string => {
  const message = text.trim()
  const attachment = description?.trim().replace(/[.!?…]+$/u, '')
  if (!attachment) return message
  if (!message) return `${attachment}.`
  return `${attachment}. ${message}`
}

/** Formats storage values using the same compact Russian units across the app. */
export const formatBytes = (bytes: number): string => {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`
}
