import { DurableAppRepository } from '@chartalk/app-core'

import {
  bundledContentCatalogPackages,
  bundledContentPackageRecords,
  bundledContentPackages,
  loadBundledContentPackage,
} from '../bundled-content'
import { WebSnapshotStore } from './web-store'
import { WebContentMediaStore } from './media-store.web'
import type { AppRuntime } from './runtime'
import { primeWebBundledContent } from '../web-offline-content'

export const createAppRuntime = async (): Promise<AppRuntime> => {
  try {
    await primeWebBundledContent()
  } catch {
    // Local Expo development and partially served static exports can omit the
    // optional cache assets. The reader still falls back to the normal loader.
  }
  const contentStore = new WebSnapshotStore(bundledContentPackages)
  const contentPackages = await contentStore.readContentPackages()
  return {
    contentStore,
    catalogStore: contentStore,
    diagnostics: contentStore,
    mediaStore: new WebContentMediaStore(),
    syncState: contentStore,
    contentPackages,
    bundledCatalogPackages: bundledContentCatalogPackages,
    bundledPackageRecords: bundledContentPackageRecords,
    loadBundledContentPackage,
    repository: new DurableAppRepository(contentPackages, contentStore, {
      createId: () => globalThis.crypto.randomUUID(),
    }),
  }
}
