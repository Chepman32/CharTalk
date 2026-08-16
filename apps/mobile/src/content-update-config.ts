const hasTrustedKeyMap = (encoded: string | undefined): boolean => {
  if (!encoded?.trim()) return false
  try {
    const parsed = JSON.parse(encoded) as unknown
    return (
      Boolean(parsed) &&
      typeof parsed === 'object' &&
      !Array.isArray(parsed) &&
      Object.values(parsed as Record<string, unknown>).some(
        value => typeof value === 'string' && value.trim().length > 0,
      )
    )
  } catch {
    return false
  }
}

/** Public update configuration supports both legacy single-key and rotation-safe key-map releases. */
export const contentUpdateConfigured = (
  baseUrl: string | undefined,
  legacyPublicKey: string | undefined,
  publicKeyMap: string | undefined,
): boolean =>
  Boolean(
    baseUrl?.trim() &&
    (legacyPublicKey?.trim() || hasTrustedKeyMap(publicKeyMap)),
  )
