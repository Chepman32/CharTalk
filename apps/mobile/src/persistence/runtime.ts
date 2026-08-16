import type { AppRepository } from '@chartalk/app-core'
import type { ContentPackage } from '@chartalk/content-schema'

import type {
  ContentPackageStore,
  InstalledPackageRecord,
} from './content-store'
import type { DiagnosticOutbox } from './diagnostics-outbox'
import type { CatalogCacheStore } from './catalog-store'
import type { ContentMediaStore } from './media-store'
import type { SyncStateStore } from './sync-state'

export interface AppRuntime {
  repository: AppRepository
  contentStore: ContentPackageStore
  catalogStore: CatalogCacheStore
  diagnostics: DiagnosticOutbox
  mediaStore: ContentMediaStore
  syncState: SyncStateStore
  contentPackages: ContentPackage[]
  bundledCatalogPackages: readonly ContentPackage[]
  bundledPackageRecords: readonly InstalledPackageRecord[]
  loadBundledContentPackage(
    packId: string,
    buildId?: string,
  ): Promise<ContentPackage | null>
}
