import type { CachedCatalog } from '../catalog'

export interface CatalogCacheStore {
  readCatalog(): Promise<CachedCatalog | null>
  writeCatalog(catalog: CachedCatalog): Promise<void>
  clearCatalog(): Promise<void>
}
