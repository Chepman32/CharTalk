import type { ContentAsset, ContentPackage } from '@razvilka/content-schema'
import * as Crypto from 'expo-crypto'
import { AppState, type AppStateStatus } from 'react-native'
import { Directory, DownloadTask, File, Paths } from 'expo-file-system'

import { hasBundledAsset } from '@/content'

import {
  parseDownloadCheckpoint,
  serializeDownloadCheckpoint,
  type DownloadCheckpoint,
} from './download-resume'
import {
  createDownloadPauseState,
  pauseDownloadTask,
  releaseDownloadTaskAfterPause,
} from './download-resume-lifecycle'
import type { ContentMediaStore, PreparedContentMedia } from './media-store'

const MAX_MEDIA_PACKAGE_BYTES = 250 * 1024 * 1024
const MAX_ASSET_BYTES = 64 * 1024 * 1024
const ROLLBACK_RESERVE_BYTES = 50 * 1024 * 1024

const mediaRoot = () => new Directory(Paths.document, 'content-media')
const packageDirectory = (packId: string, buildId: string) =>
  new Directory(
    mediaRoot(),
    encodeURIComponent(packId),
    encodeURIComponent(buildId),
  )

const stagingDirectory = (packId: string, buildId: string) =>
  new Directory(
    mediaRoot(),
    '.staging',
    encodeURIComponent(packId),
    encodeURIComponent(buildId),
  )

const downloadStateFile = (directory: Directory) =>
  new File(directory, '.download-state.json')

const assetUrl = (
  baseUrl: string,
  content: ContentPackage,
  asset: ContentAsset,
) =>
  `${baseUrl.replace(/\/$/, '')}/v1/content/packages/${encodeURIComponent(content.manifest.packId)}/builds/${encodeURIComponent(content.manifest.buildId)}/assets/${encodeURIComponent(asset.assetId)}`

const assetFile = (
  directory: Directory,
  path: string,
  createParents = true,
): File => {
  const parts = path.split('/')
  const filename = parts.pop()
  if (!filename || parts.some(part => !part || part === '..')) {
    throw new Error('Пакет содержит небезопасный путь медиафайла.')
  }
  let parent = directory
  for (const part of parts) {
    parent = new Directory(parent, part)
    if (createParents) {
      parent.create({ idempotent: true, intermediates: true })
    }
  }
  return new File(parent, filename)
}

const hex = (value: ArrayBuffer): string =>
  [...new Uint8Array(value)]
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('')

const verifyFile = async (file: File, asset: ContentAsset): Promise<void> => {
  if (!file.exists || file.size <= 0 || file.size > MAX_ASSET_BYTES) {
    throw new Error(`${asset.assetId}: недопустимый размер медиафайла.`)
  }
  const digest = await Crypto.digest(
    Crypto.CryptoDigestAlgorithm.SHA256,
    await file.bytes(),
  )
  if (`sha256:${hex(digest)}` !== asset.checksum) {
    throw new Error(`${asset.assetId}: контрольная сумма не совпала.`)
  }
}

const dynamicAssets = (content: ContentPackage) =>
  content.assets.filter(asset => !hasBundledAsset(asset.assetId))

class DownloadPausedError extends Error {
  constructor() {
    super('Загрузка приостановлена. Повторите попытку, чтобы продолжить её.')
    this.name = 'DownloadPausedError'
  }
}

const resolvedUris = (
  content: ContentPackage,
  directory: Directory,
): Record<string, string> =>
  Object.fromEntries(
    dynamicAssets(content)
      .map(
        asset =>
          [asset.assetId, assetFile(directory, asset.path, false)] as const,
      )
      .filter(([, file]) => file.exists)
      .map(([assetId, file]) => [assetId, file.uri]),
  )

export class NativeContentMediaStore implements ContentMediaStore {
  private activeDownload: {
    task: DownloadTask
    stateFile: File
    checkpoint: Omit<DownloadCheckpoint, 'task'>
    pauseState: ReturnType<typeof createDownloadPauseState>
  } | null = null

  private readonly appStateSubscription = AppState.addEventListener(
    'change',
    (state: AppStateStatus) => {
      if (state === 'background') void this.pauseActiveDownload()
    },
  )

  private async pauseActiveDownload(): Promise<void> {
    const active = this.activeDownload
    if (!active) return
    await pauseDownloadTask(active.pauseState, active.task, task =>
      active.stateFile.write(
        serializeDownloadCheckpoint({ ...active.checkpoint, task }),
      ),
    )
  }

  private async readCheckpoint(
    stateFile: File,
    expected: Omit<DownloadCheckpoint, 'task'> & { fileUri: string },
  ): Promise<DownloadCheckpoint | null> {
    if (!stateFile.exists) return null
    try {
      const checkpoint = parseDownloadCheckpoint(await stateFile.text(), {
        assetId: expected.assetId,
        url: expected.url,
        expectedBytes: expected.expectedBytes,
        fileUri: expected.fileUri,
      })
      if (!checkpoint) stateFile.delete()
      return checkpoint
    } catch {
      stateFile.delete()
      return null
    }
  }

  private async downloadAsset(
    asset: ContentAsset,
    url: string,
    expectedBytes: number,
    target: File,
    stateFile: File,
  ): Promise<File> {
    if (!target.exists && stateFile.exists) stateFile.delete()
    const checkpoint = await this.readCheckpoint(stateFile, {
      assetId: asset.assetId,
      url,
      expectedBytes,
      fileUri: target.uri,
    })
    const headers = { accept: 'image/*' }
    const task = checkpoint
      ? DownloadTask.fromSavable(checkpoint.task, {
          headers,
          sessionType: 'background',
        })
      : File.createDownloadTask(url, target, {
          headers,
          sessionType: 'background',
        })
    const active = {
      task,
      stateFile,
      checkpoint: {
        assetId: asset.assetId,
        url,
        expectedBytes,
      },
      pauseState: createDownloadPauseState(),
    }
    this.activeDownload = active
    try {
      const downloaded = checkpoint
        ? await task.resumeAsync()
        : await task.downloadAsync()
      if (!downloaded) {
        if (active.pauseState.pauseRequested) throw new DownloadPausedError()
        throw new Error(`${asset.assetId}: загрузка была приостановлена.`)
      }
      return downloaded
    } finally {
      try {
        await releaseDownloadTaskAfterPause(active.pauseState, () =>
          task.release(),
        )
      } finally {
        if (this.activeDownload === active) this.activeDownload = null
      }
    }
  }

  async prepareContentMedia(
    content: ContentPackage,
    baseUrl: string,
  ): Promise<PreparedContentMedia> {
    const assets = dynamicAssets(content)
    if (assets.length === 0) {
      return {
        byteCount: 0,
        commit: async () => ({}),
        discard: async () => {},
      }
    }

    const finalDirectory = packageDirectory(
      content.manifest.packId,
      content.manifest.buildId,
    )
    if (finalDirectory.exists) {
      try {
        let byteCount = 0
        for (const asset of assets) {
          const file = assetFile(finalDirectory, asset.path, false)
          await verifyFile(file, asset)
          byteCount += file.size
        }
        return {
          byteCount,
          commit: async () => resolvedUris(content, finalDirectory),
          discard: async () => {},
        }
      } catch {
        finalDirectory.delete()
      }
    }

    const sizes: number[] = []
    for (const asset of assets) {
      const response = await fetch(assetUrl(baseUrl, content, asset), {
        method: 'HEAD',
        headers: { accept: 'image/*' },
      })
      const size = Number(response.headers.get('content-length'))
      if (
        !response.ok ||
        !response.headers.get('content-type')?.startsWith('image/') ||
        !Number.isSafeInteger(size) ||
        size <= 0 ||
        size > MAX_ASSET_BYTES
      ) {
        throw new Error(`${asset.assetId}: сервер вернул неверное медиа.`)
      }
      sizes.push(size)
    }
    const byteCount = sizes.reduce((total, size) => total + size, 0)
    if (byteCount > MAX_MEDIA_PACKAGE_BYTES) {
      throw new Error('Медиа пакета превышает допустимые 250 МБ.')
    }
    if (Paths.availableDiskSpace < byteCount * 2 + ROLLBACK_RESERVE_BYTES) {
      throw new Error('Недостаточно места для медиа и безопасного отката.')
    }

    const staging = stagingDirectory(
      content.manifest.packId,
      content.manifest.buildId,
    )
    staging.create({ idempotent: true, intermediates: true })
    const stateFile = downloadStateFile(staging)
    try {
      for (const [index, asset] of assets.entries()) {
        const target = assetFile(staging, asset.path)
        const url = assetUrl(baseUrl, content, asset)
        if (target.exists && target.size === sizes[index]) {
          try {
            await verifyFile(target, asset)
            if (stateFile.exists) stateFile.delete()
            continue
          } catch {
            target.delete()
            if (stateFile.exists) stateFile.delete()
          }
        }
        const downloaded = await this.downloadAsset(
          asset,
          url,
          sizes[index]!,
          target,
          stateFile,
        )
        if (downloaded.size !== sizes[index]) {
          throw new Error(`${asset.assetId}: загрузка была неполной.`)
        }
        await verifyFile(downloaded, asset)
        if (stateFile.exists) stateFile.delete()
      }
    } catch (error) {
      if (!(error instanceof DownloadPausedError) && staging.exists) {
        staging.delete()
      }
      throw error
    }

    return {
      byteCount,
      commit: async () => {
        const parent = finalDirectory.parentDirectory
        parent.create({ idempotent: true, intermediates: true })
        if (finalDirectory.exists) finalDirectory.delete()
        await staging.move(finalDirectory)
        return resolvedUris(content, finalDirectory)
      },
      discard: async () => {
        if (staging.exists) staging.delete()
        else if (finalDirectory.exists) finalDirectory.delete()
      },
    }
  }

  async resolveAssetUris(
    contentPackages: readonly ContentPackage[],
  ): Promise<Record<string, string>> {
    return Object.assign(
      {},
      ...contentPackages.map(content =>
        resolvedUris(
          content,
          packageDirectory(content.manifest.packId, content.manifest.buildId),
        ),
      ),
    ) as Record<string, string>
  }

  async removeContentMedia(packId: string, buildId: string): Promise<void> {
    const directory = packageDirectory(packId, buildId)
    if (directory.exists) directory.delete()
  }

  async clearDownloadedMedia(): Promise<void> {
    const root = mediaRoot()
    if (root.exists) root.delete()
  }
}
