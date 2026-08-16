import type { ContentPackage } from '@chartalk/content-schema'

import type { ContentMediaStore, PreparedContentMedia } from './media-store'

export class WebContentMediaStore implements ContentMediaStore {
  async prepareContentMedia(
    content: ContentPackage,
    baseUrl: string,
  ): Promise<PreparedContentMedia> {
    const assetUris = Object.fromEntries(
      content.assets.map(asset => [
        asset.assetId,
        `${baseUrl.replace(/\/$/, '')}/v1/content/packages/${encodeURIComponent(content.manifest.packId)}/builds/${encodeURIComponent(content.manifest.buildId)}/assets/${encodeURIComponent(asset.assetId)}`,
      ]),
    )
    return {
      byteCount: 0,
      commit: async () => assetUris,
      discard: async () => {},
    }
  }

  async resolveAssetUris(): Promise<Record<string, string>> {
    return {}
  }

  async removeContentMedia(): Promise<void> {}

  async clearDownloadedMedia(): Promise<void> {}
}
