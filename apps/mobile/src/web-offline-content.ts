import type { ContentPackage } from '@chartalk/content-schema'

const cacheName = 'chartalk-bundled-content-v1'
const shardPaths = [1, 2, 3, 4, 5].map(
  index =>
    `/content/bundled-content.bulk.shard.${String(index).padStart(3, '0')}.json`,
)

const canUseWebCache = (): boolean =>
  typeof globalThis !== 'undefined' &&
  typeof globalThis.location !== 'undefined' &&
  'caches' in globalThis &&
  typeof globalThis.fetch === 'function'

const absoluteUrl = (path: string): string => {
  if (typeof globalThis.location === 'undefined') return path
  return new URL(path, globalThis.location.href).toString()
}

/**
 * Warms a disk-backed browser cache from the app's own exported assets. This
 * is intentionally best-effort: native builds and local Expo dev do not have
 * web cache APIs, while an exported web build does. Parsing is deferred until
 * a reader opens a story.
 */
export const primeWebBundledContent = async (): Promise<void> => {
  if (!canUseWebCache() || globalThis.navigator?.onLine === false) return
  const cache = await globalThis.caches.open(cacheName)
  await Promise.all(
    shardPaths.map(async path => {
      const url = absoluteUrl(path)
      if (await cache.match(url)) return
      const response = await globalThis.fetch(url, { cache: 'no-store' })
      if (!response.ok) throw new Error(`Bundled shard unavailable: ${path}`)
      await cache.put(url, response.clone())
    }),
  )
}

/** Reads one web shard from Cache Storage, falling back to the local export. */
export const readWebBundledContent = async (
  shard: number,
): Promise<ContentPackage | null> => {
  if (!canUseWebCache()) return null
  const path = shardPaths[shard - 1]
  if (!path) return null
  const url = absoluteUrl(path)
  const cache = await globalThis.caches.open(cacheName)
  let response = await cache.match(url)
  if (!response && globalThis.navigator?.onLine !== false) {
    response = await globalThis.fetch(url, { cache: 'no-store' })
    if (response.ok) await cache.put(url, response.clone())
  }
  if (!response?.ok) return null
  return (await response.json()) as ContentPackage
}
