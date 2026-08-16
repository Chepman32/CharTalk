import { catalogDataSchema } from '@chartalk/content-schema'

import type { CachedCatalog } from '@/catalog'

import { secureServiceBaseUrl } from './secure-endpoint'

export type CatalogFetchStatus =
  | 'fresh'
  | 'not-modified'
  | 'cached'
  | 'unconfigured'
  | 'unavailable'
  | 'error'
  | 'invalid'

export interface CatalogFetchResult {
  status: CatalogFetchStatus
  cache: CachedCatalog | null
}

interface FetchCatalogOptions {
  baseUrl?: string
  cached?: CachedCatalog | null
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>
  now?: () => string
}

/**
 * Fetches only the public discovery envelope. ETag revalidation preserves a
 * stale cache when the network is unavailable, and schema validation prevents
 * malformed server metadata from entering navigation state.
 */
export async function fetchCatalog(
  options: FetchCatalogOptions = {},
): Promise<CatalogFetchResult> {
  const baseUrl = secureServiceBaseUrl(
    options.baseUrl ?? process.env.EXPO_PUBLIC_CHARTALK_API_URL,
  )
  if (!baseUrl) {
    return { status: 'unconfigured', cache: options.cached ?? null }
  }

  let response: Response
  try {
    response = await (options.fetchImpl ?? fetch)(`${baseUrl}/v1/catalog`, {
      headers: {
        accept: 'application/json',
        ...(options.cached?.etag
          ? { 'if-none-match': options.cached.etag }
          : {}),
      },
    })
  } catch {
    return { status: 'unavailable', cache: options.cached ?? null }
  }

  if (response.status === 304 && options.cached) {
    return {
      status: 'not-modified',
      cache: {
        ...options.cached,
        fetchedAt: (options.now ?? (() => new Date().toISOString()))(),
      },
    }
  }
  if (!response.ok) {
    return { status: 'unavailable', cache: options.cached ?? null }
  }

  let value: unknown
  try {
    value = (await response.json()) as unknown
  } catch {
    return { status: 'invalid', cache: options.cached ?? null }
  }
  const data =
    typeof value === 'object' && value !== null && 'data' in value
      ? value.data
      : null
  const parsed = catalogDataSchema.safeParse(data)
  if (!parsed.success) {
    return { status: 'invalid', cache: options.cached ?? null }
  }
  return {
    status: 'fresh',
    cache: {
      data: parsed.data,
      etag: response.headers.get('etag'),
      fetchedAt: (options.now ?? (() => new Date().toISOString()))(),
    },
  }
}
