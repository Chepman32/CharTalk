import { DurableAppRepository } from '@razvilka/app-core'
import * as Crypto from 'expo-crypto'

import {
  bundledContentCatalogPackages,
  bundledContentPackageRecords,
  bundledContentPackages,
  loadBundledContentPackage,
} from '../bundled-content'
import { SqliteSnapshotStore } from './sqlite-store'
import { NativeContentMediaStore } from './media-store.native'
import type { AppRuntime } from './runtime'

export const createAppRuntime = async (): Promise<AppRuntime> => {
  const contentStore = new SqliteSnapshotStore(bundledContentPackages)
  const contentPackages = await contentStore.readContentPackages()
  return {
    contentStore,
    catalogStore: contentStore,
    diagnostics: contentStore,
    mediaStore: new NativeContentMediaStore(),
    syncState: contentStore,
    contentPackages,
    bundledCatalogPackages: bundledContentCatalogPackages,
    bundledPackageRecords: bundledContentPackageRecords,
    loadBundledContentPackage,
    repository: new DurableAppRepository(contentPackages, contentStore, {
      createId: () => Crypto.randomUUID(),
    }),
  }
}
