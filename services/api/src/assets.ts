import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, realpath, stat } from 'node:fs/promises'
import { extname, resolve, sep } from 'node:path'
import { Readable } from 'node:stream'

import type { ContentAsset, ContentPackage } from '@razvilka/content-schema'

import type { LoadedContentAsset } from './app'

const MAX_MEDIA_PACKAGE_BYTES = 250 * 1024 * 1024

const mimeTypes: Readonly<Record<string, string>> = {
  '.avif': 'image/avif',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

const buildDirectory = (root: string, content: ContentPackage): string =>
  resolve(
    root,
    encodeURIComponent(content.manifest.packId),
    encodeURIComponent(content.manifest.buildId),
  )

const checkedAssetPath = async (
  root: string,
  content: ContentPackage,
  asset: ContentAsset,
): Promise<string> => {
  const rootPath = await realpath(resolve(root))
  const packagePath = buildDirectory(rootPath, content)
  const candidate = resolve(packagePath, asset.path)
  if (
    candidate !== packagePath &&
    !candidate.startsWith(`${packagePath}${sep}`)
  ) {
    throw new Error(`${asset.assetId} escapes its content build directory`)
  }
  const linkInfo = await lstat(candidate)
  if (linkInfo.isSymbolicLink()) {
    throw new Error(`${asset.assetId} must not be a symbolic link`)
  }
  const realCandidate = await realpath(candidate)
  const realPackage = await realpath(packagePath)
  if (
    realCandidate !== realPackage &&
    !realCandidate.startsWith(`${realPackage}${sep}`)
  ) {
    throw new Error(`${asset.assetId} resolves outside its content build`)
  }
  const info = await stat(realCandidate)
  if (!info.isFile()) throw new Error(`${asset.assetId} is not a regular file`)
  return realCandidate
}

const sha256 = async (path: string): Promise<string> => {
  const hash = createHash('sha256')
  for await (const chunk of createReadStream(path)) {
    hash.update(chunk as Uint8Array)
  }
  return `sha256:${hash.digest('hex')}`
}

export async function verifyContentAssetFiles(
  root: string,
  content: ContentPackage,
): Promise<void> {
  let totalBytes = 0
  for (const asset of content.assets) {
    const path = await checkedAssetPath(root, content, asset)
    const info = await stat(path)
    totalBytes += info.size
    if (totalBytes > MAX_MEDIA_PACKAGE_BYTES) {
      throw new Error('Content media exceeds the 250 MiB package limit')
    }
    if ((await sha256(path)) !== asset.checksum) {
      throw new Error(`${asset.assetId} does not match its SHA-256 digest`)
    }
    if (!mimeTypes[extname(path).toLowerCase()]) {
      throw new Error(`${asset.assetId} has an unsupported image format`)
    }
  }
}

export async function loadContentAssetFile(
  root: string,
  content: ContentPackage,
  asset: ContentAsset,
): Promise<LoadedContentAsset | null> {
  try {
    const path = await checkedAssetPath(root, content, asset)
    const info = await stat(path)
    const contentType = mimeTypes[extname(path).toLowerCase()]
    if (!contentType) return null
    return {
      body: Readable.toWeb(createReadStream(path)) as unknown as ReadableStream,
      byteCount: info.size,
      contentType,
    }
  } catch {
    return null
  }
}
