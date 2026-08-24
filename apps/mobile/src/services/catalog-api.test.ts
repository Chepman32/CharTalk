import { describe, expect, it, vi } from 'vitest'

import { sampleContentPackage } from '@razvilka/test-fixtures'

import type { CachedCatalog } from '@/catalog'

import { fetchCatalog } from './catalog-api'

const catalogData = {
  packId: sampleContentPackage.manifest.packId,
  locale: sampleContentPackage.manifest.locale,
  buildId: sampleContentPackage.manifest.buildId,
  contentVersion: sampleContentPackage.manifest.contentVersion,
  checksum: sampleContentPackage.manifest.checksum,
  characters: sampleContentPackage.characters,
  stories: sampleContentPackage.stories,
  episodes: sampleContentPackage.episodes,
  warnings: sampleContentPackage.warnings.map(
    ({ warningId, category, severity, summary, detail, sceneId }) => ({
      warningId,
      category,
      severity,
      summary,
      detail,
      sceneId,
    }),
  ),
}

const cached: CachedCatalog = {
  data: catalogData,
  etag: 'W/"sample"',
  fetchedAt: '2026-08-14T08:00:00.000Z',
}

describe('fetchCatalog', () => {
  it('validates and caches a fresh public discovery response', async () => {
    const fetchImpl = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: catalogData }), {
          status: 200,
          headers: { 'content-type': 'application/json', etag: 'W/"next"' },
        }),
    )

    await expect(
      fetchCatalog({
        baseUrl: 'https://api.razvilka.test',
        fetchImpl,
        now: () => '2026-08-14T09:00:00.000Z',
      }),
    ).resolves.toEqual({
      status: 'fresh',
      cache: {
        data: catalogData,
        etag: 'W/"next"',
        fetchedAt: '2026-08-14T09:00:00.000Z',
      },
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.razvilka.test/v1/catalog',
      expect.objectContaining({ headers: { accept: 'application/json' } }),
    )
  })

  it('revalidates an unchanged cache and refreshes its freshness timestamp', async () => {
    const fetchImpl = vi.fn(async () => new Response(null, { status: 304 }))
    await expect(
      fetchCatalog({
        baseUrl: 'https://api.razvilka.test',
        cached,
        fetchImpl,
        now: () => '2026-08-14T09:30:00.000Z',
      }),
    ).resolves.toEqual({
      status: 'not-modified',
      cache: { ...cached, fetchedAt: '2026-08-14T09:30:00.000Z' },
    })
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api.razvilka.test/v1/catalog',
      expect.objectContaining({
        headers: { accept: 'application/json', 'if-none-match': 'W/"sample"' },
      }),
    )
  })

  it('keeps cached metadata on offline, malformed, and unconfigured responses', async () => {
    await expect(
      fetchCatalog({
        baseUrl: 'https://api.razvilka.test',
        cached,
        fetchImpl: vi.fn(async () => {
          throw new Error('offline')
        }),
      }),
    ).resolves.toMatchObject({ status: 'unavailable', cache: cached })

    await expect(
      fetchCatalog({
        baseUrl: 'https://api.razvilka.test',
        cached,
        fetchImpl: vi.fn(
          async () =>
            new Response(JSON.stringify({ data: { buildId: 'bad' } }), {
              status: 200,
              headers: { 'content-type': 'application/json' },
            }),
        ),
      }),
    ).resolves.toMatchObject({ status: 'invalid', cache: cached })

    await expect(
      fetchCatalog({ baseUrl: 'http://public.example.test', cached }),
    ).resolves.toEqual({ status: 'unconfigured', cache: cached })
  })
})
