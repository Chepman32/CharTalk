import type { ContentPackage } from '@razvilka/content-schema'

export interface PreparedContentMedia {
  byteCount: number
  commit(): Promise<Record<string, string>>
  discard(): Promise<void>
}

export interface ContentMediaStore {
  prepareContentMedia(
    content: ContentPackage,
    baseUrl: string,
  ): Promise<PreparedContentMedia>
  resolveAssetUris(
    contentPackages: readonly ContentPackage[],
  ): Promise<Record<string, string>>
  removeContentMedia(packId: string, buildId: string): Promise<void>
  clearDownloadedMedia(): Promise<void>
}
