import { sampleContentPackage } from '@chartalk/test-fixtures'

import { storyPreviewSources } from './story-preview-sources.generated'

export { sampleContentPackage }

export const portraitSources: Record<string, number> = {
  'portrait.ira': require('../assets/portraits/ira.png') as number,
  'portrait.asya': require('../assets/portraits/asya.png') as number,
  'portrait.dina': require('../assets/portraits/dina.png') as number,
  'portrait.vera': require('../assets/portraits/vera.png') as number,
}

export const attachmentSources: Record<string, number> = {
  'attachment.archive-note':
    require('../assets/attachments/archive-note.png') as number,
}

const fallbackPortrait = require('../assets/icon.png') as number
const downloadedAssetSources = new Map<string, { uri: string }>()

export const hasBundledAsset = (assetId: string): boolean =>
  assetId in portraitSources ||
  assetId in attachmentSources ||
  assetId in storyPreviewSources

export const setDownloadedAssetSources = (
  sources: Readonly<Record<string, string>>,
): void => {
  downloadedAssetSources.clear()
  for (const [assetId, uri] of Object.entries(sources)) {
    downloadedAssetSources.set(assetId, { uri })
  }
}

export const assetSource = (assetId: string): number | { uri: string } =>
  downloadedAssetSources.get(assetId) ??
  portraitSources[assetId] ??
  attachmentSources[assetId] ??
  storyPreviewSources[assetId] ??
  fallbackPortrait

export const portraitSource = assetSource
