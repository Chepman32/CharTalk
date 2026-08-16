const loopbackHosts = new Set(['localhost', '127.0.0.1', '[::1]', '::1'])

export const secureServiceBaseUrl = (
  value: string | undefined,
): string | undefined => {
  if (!value?.trim()) return undefined

  try {
    const endpoint = new URL(value.trim())
    const secure = endpoint.protocol === 'https:'
    const loopback =
      endpoint.protocol === 'http:' && loopbackHosts.has(endpoint.hostname)
    if (
      (!secure && !loopback) ||
      endpoint.username ||
      endpoint.password ||
      endpoint.search ||
      endpoint.hash
    ) {
      return undefined
    }
    return endpoint.toString().replace(/\/$/, '')
  } catch {
    return undefined
  }
}
