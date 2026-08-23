import type { ContentPackage } from '@chartalk/content-schema'
import { sampleContentPackage } from '@chartalk/test-fixtures'

import bundledBulkCatalog001Json from './bundled-content.bulk.catalog.001.json'
import bundledBulkCatalog002Json from './bundled-content.bulk.catalog.002.json'
import bundledBulkCatalog003Json from './bundled-content.bulk.catalog.003.json'
import bundledBulkCatalog004Json from './bundled-content.bulk.catalog.004.json'
import bundledBulkCatalog005Json from './bundled-content.bulk.catalog.005.json'
import bundledBulkSizesJson from './bundled-content.bulk.sizes.json'
import type { InstalledPackageRecord } from './persistence/content-store'
import { contentPackageByteCount } from './persistence/content-store'
import { readWebBundledContent } from './web-offline-content'

export interface BundledContentDescriptor {
  catalog: ContentPackage
  byteCount: number
  load(): Promise<ContentPackage>
}

type BundledContentJsonModule = { default: unknown }

const asContentPackage = (value: unknown): ContentPackage =>
  value as ContentPackage

const bundledBulkCatalogs = [
  bundledBulkCatalog001Json,
  bundledBulkCatalog002Json,
  bundledBulkCatalog003Json,
  bundledBulkCatalog004Json,
  bundledBulkCatalog005Json,
] as unknown as ContentPackage[]

const bundledBulkSizes = bundledBulkSizesJson as Record<string, number>

const loadBulkShard = async (shard: number): Promise<ContentPackage> => {
  const cached = await readWebBundledContent(shard)
  if (cached) return asContentPackage(cached)
  const module = (await (shard === 1
    ? import('./bundled-content.bulk.shard.001.json')
    : shard === 2
      ? import('./bundled-content.bulk.shard.002.json')
      : shard === 3
        ? import('./bundled-content.bulk.shard.003.json')
        : shard === 4
          ? import('./bundled-content.bulk.shard.004.json')
          : import('./bundled-content.bulk.shard.005.json'))) as BundledContentJsonModule
  return asContentPackage(module.default)
}

const descriptorFor = (
  catalog: ContentPackage,
  shard: number,
): BundledContentDescriptor => ({
  catalog,
  byteCount: bundledBulkSizes[catalog.manifest.packId] ?? 0,
  load: () => loadBulkShard(shard),
})

export const bundledContentDescriptors: readonly BundledContentDescriptor[] =
  bundledBulkCatalogs.map((catalog, index) => descriptorFor(catalog, index + 1))

export const bundledContentCatalogPackages: readonly ContentPackage[] = [
  sampleContentPackage,
  ...bundledContentDescriptors.map(descriptor => descriptor.catalog),
]

/** Full payloads that are safe to parse during runtime initialization. */
export const bundledContentPackages: readonly ContentPackage[] = [
  sampleContentPackage,
]

/** Accurate installed-size records for the catalog, without parsing shards. */
export const bundledContentPackageRecords: readonly InstalledPackageRecord[] = [
  {
    packId: sampleContentPackage.manifest.packId,
    buildId: sampleContentPackage.manifest.buildId,
    contentVersion: sampleContentPackage.manifest.contentVersion,
    status: 'bundled',
    byteCount: contentPackageByteCount(sampleContentPackage),
    installedAt: sampleContentPackage.manifest.createdAt,
    activatedAt: sampleContentPackage.manifest.createdAt,
  },
  ...bundledContentDescriptors.map(descriptor => ({
    packId: descriptor.catalog.manifest.packId,
    buildId: descriptor.catalog.manifest.buildId,
    contentVersion: descriptor.catalog.manifest.contentVersion,
    status: 'bundled' as const,
    byteCount: descriptor.byteCount,
    installedAt: descriptor.catalog.manifest.createdAt,
    activatedAt: descriptor.catalog.manifest.createdAt,
  })),
]

const loadedBulkPackages = new Map<string, Promise<ContentPackage>>()

/**
 * Loads one story-owned package from the application bundle. The import is
 * deliberately dynamic: catalog metadata is available at startup, while the
 * story-shard payload is parsed only when a reader actually opens a story (or
 * resumes a run pinned to that build). No network request is involved.
 */
export const loadBundledContentPackage = async (
  packId: string,
  buildId?: string,
): Promise<ContentPackage | null> => {
  const descriptor = bundledContentDescriptors.find(
    item =>
      item.catalog.manifest.packId === packId &&
      (buildId === undefined || item.catalog.manifest.buildId === buildId),
  )
  if (!descriptor) return null
  const key = descriptor.catalog.manifest.buildId
  const existing = loadedBulkPackages.get(key)
  if (existing) return existing
  const promise = descriptor.load()
  loadedBulkPackages.set(key, promise)
  return promise
}

/** Test/report helper. Production runtime uses the lazy loader above. */
export const loadBundledContentPackages = async (): Promise<
  ContentPackage[]
> => {
  const packages = await Promise.all(
    bundledContentDescriptors.map(descriptor =>
      loadBundledContentPackage(
        descriptor.catalog.manifest.packId,
        descriptor.catalog.manifest.buildId,
      ),
    ),
  )
  return [sampleContentPackage, ...packages.filter(Boolean)] as ContentPackage[]
}
