import type { ContentPackage } from '@razvilka/content-schema'

const packageByteCountCache = new WeakMap<object, number>()

/**
 * Returns the UTF-8 size of the exact package payload kept by the reader.
 * Bundled packages are not duplicated in SQLite, but their size still needs
 * to be represented accurately in the Downloads screen and diagnostics.
 */
export const contentPackageByteCount = (content: ContentPackage): number => {
  const cached = packageByteCountCache.get(content)
  if (cached !== undefined) return cached
  const byteCount = new TextEncoder().encode(JSON.stringify(content)).byteLength
  packageByteCountCache.set(content, byteCount)
  return byteCount
}

export type InstalledPackageStatus = 'bundled' | 'active' | 'rollback'

export interface InstalledPackageRecord {
  packId: string
  buildId: string
  contentVersion: string
  status: InstalledPackageStatus
  byteCount: number
  installedAt: string
  activatedAt: string
}

export interface ContentPackageStore {
  readContentPackages(): Promise<ContentPackage[]>
  listContentPackages(): Promise<InstalledPackageRecord[]>
  activateContentPackage(
    content: ContentPackage,
    byteCount: number,
  ): Promise<void>
  removeContentPackage(
    packId: string,
    buildId: string,
    protectedBuildIds: readonly string[],
  ): Promise<void>
  resetDownloadedContent(): Promise<void>
  availableDiskBytes(): Promise<number | null>
}
