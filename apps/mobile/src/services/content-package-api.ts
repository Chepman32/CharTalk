import {
  base64UrlDecode,
  validateContentPlaceholders,
  verifySignedContentPackage,
} from '@chartalk/content-integrity'
import {
  contentPackageSchema,
  type ContentPackage,
} from '@chartalk/content-schema'

import type { ContentPackageStore } from '@/persistence/content-store'
import type { ContentMediaStore } from '@/persistence/media-store'

import { secureServiceBaseUrl } from './secure-endpoint'

const MAX_PACKAGE_BYTES = 50 * 1024 * 1024
const ROLLBACK_RESERVE_BYTES = 8 * 1024 * 1024
const ENGINE_VERSION = '1.0.0'

export type ContentInstallErrorCode =
  | 'NOT_CONFIGURED'
  | 'DOWNLOAD_FAILED'
  | 'PACKAGE_TOO_LARGE'
  | 'INSUFFICIENT_STORAGE'
  | 'INVALID_PACKAGE'
  | 'INTEGRITY_FAILED'
  | 'INCOMPATIBLE_ENGINE'
  | 'MEDIA_FAILED'

export class ContentInstallError extends Error {
  constructor(
    public readonly code: ContentInstallErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'ContentInstallError'
  }
}

interface InstallContentPackageOptions {
  packId: string
  /** When resuming a pinned run, request that exact immutable build. */
  buildId?: string
  baseUrl: string | undefined
  publicKey: string | undefined
  publicKeys?: string | undefined
  contentStore: ContentPackageStore
  mediaStore?: ContentMediaStore
  registerContent(content: ContentPackage): Promise<void>
  registerAssetSources?(sources: Readonly<Record<string, string>>): void
  fetchImpl?: typeof fetch
  engineVersion?: string
}

const engineCompatible = (
  content: ContentPackage,
  engineVersion: string,
): boolean => {
  const [engineMajor = 0, engineMinor = 0, enginePatch = 0] = engineVersion
    .split('.')
    .map(Number)
  const [minMajor = 0, minMinor = 0, minPatch = 0] =
    content.manifest.minEngineVersion.split('.').map(Number)
  const maxMajor = Number(content.manifest.maxEngineVersion.split('.')[0])
  const current = engineMajor * 1_000_000 + engineMinor * 1_000 + enginePatch
  const minimum = minMajor * 1_000_000 + minMinor * 1_000 + minPatch
  return current >= minimum && engineMajor <= maxMajor
}

export function selectTrustedContentKey(
  signingKeyId: string | undefined,
  legacyPublicKey: string | undefined,
  encodedKeyMap: string | undefined,
): string | null {
  if (!signingKeyId) return legacyPublicKey?.trim() || null
  if (!encodedKeyMap) return null
  try {
    const value = JSON.parse(encodedKeyMap) as unknown
    if (!value || typeof value !== 'object' || Array.isArray(value)) return null
    const key = (value as Record<string, unknown>)[signingKeyId]
    return typeof key === 'string' && key.trim() ? key.trim() : null
  } catch {
    return null
  }
}

export async function installContentPackage({
  packId,
  buildId,
  baseUrl,
  publicKey,
  publicKeys,
  contentStore,
  mediaStore,
  registerContent,
  registerAssetSources,
  fetchImpl = fetch,
  engineVersion = ENGINE_VERSION,
}: InstallContentPackageOptions): Promise<ContentPackage> {
  const trustedBaseUrl = secureServiceBaseUrl(baseUrl)
  if (!trustedBaseUrl || (!publicKey && !publicKeys)) {
    throw new ContentInstallError(
      'NOT_CONFIGURED',
      'Источник подписанных обновлений не настроен для этой сборки.',
    )
  }
  const endpoint = buildId
    ? `${trustedBaseUrl}/v1/content/packages/${encodeURIComponent(packId)}/builds/${encodeURIComponent(buildId)}`
    : `${trustedBaseUrl}/v1/content/packages/${encodeURIComponent(packId)}`
  let response: Response
  try {
    response = await fetchImpl(endpoint, {
      headers: { accept: 'application/json' },
    })
  } catch {
    throw new ContentInstallError(
      'DOWNLOAD_FAILED',
      'Не удалось скачать обновление. Установленная версия доступна офлайн.',
    )
  }
  if (!response.ok) {
    throw new ContentInstallError(
      'DOWNLOAD_FAILED',
      'Сервер обновлений временно недоступен.',
    )
  }
  if (!response.headers.get('content-type')?.includes('application/json')) {
    throw new ContentInstallError(
      'INVALID_PACKAGE',
      'Сервер вернул файл неизвестного формата.',
    )
  }
  const declaredBytes = Number(response.headers.get('content-length') ?? 0)
  if (declaredBytes > MAX_PACKAGE_BYTES) {
    throw new ContentInstallError(
      'PACKAGE_TOO_LARGE',
      'Пакет превышает допустимый размер без медиа.',
    )
  }
  const text = await response.text()
  const byteCount = new TextEncoder().encode(text).byteLength
  if (byteCount > MAX_PACKAGE_BYTES) {
    throw new ContentInstallError(
      'PACKAGE_TOO_LARGE',
      'Пакет превышает допустимый размер без медиа.',
    )
  }
  const available = await contentStore.availableDiskBytes()
  if (
    available !== null &&
    available < byteCount * 2 + ROLLBACK_RESERVE_BYTES
  ) {
    throw new ContentInstallError(
      'INSUFFICIENT_STORAGE',
      'Недостаточно места для проверки и безопасного отката обновления.',
    )
  }
  let value: unknown
  try {
    value = JSON.parse(text) as unknown
  } catch {
    throw new ContentInstallError(
      'INVALID_PACKAGE',
      'Файл обновления повреждён.',
    )
  }
  const parsed = contentPackageSchema.safeParse(value)
  if (!parsed.success || parsed.data.manifest.packId !== packId) {
    throw new ContentInstallError(
      'INVALID_PACKAGE',
      'Структура или идентификатор пакета не прошли проверку.',
    )
  }
  if (validateContentPlaceholders(parsed.data).length > 0) {
    throw new ContentInstallError(
      'INVALID_PACKAGE',
      'В обновлении найдена неподдерживаемая текстовая подстановка.',
    )
  }
  if (!engineCompatible(parsed.data, engineVersion)) {
    throw new ContentInstallError(
      'INCOMPATIBLE_ENGINE',
      'Для этого обновления нужна другая версия приложения.',
    )
  }
  const selectedKey = selectTrustedContentKey(
    parsed.data.manifest.signingKeyId,
    publicKey,
    publicKeys,
  )
  if (!selectedKey) {
    throw new ContentInstallError(
      'INTEGRITY_FAILED',
      'Ключ подписи этого выпуска не входит в доверенный набор приложения.',
    )
  }
  let decodedKey: Uint8Array
  try {
    decodedKey = base64UrlDecode(selectedKey)
  } catch {
    throw new ContentInstallError(
      'NOT_CONFIGURED',
      'Ключ проверки обновлений настроен неверно.',
    )
  }
  if (!verifySignedContentPackage(parsed.data, decodedKey)) {
    throw new ContentInstallError(
      'INTEGRITY_FAILED',
      'Подпись обновления не совпала. Установленная версия не изменена.',
    )
  }

  let preparedMedia
  try {
    preparedMedia = mediaStore
      ? await mediaStore.prepareContentMedia(parsed.data, trustedBaseUrl)
      : {
          byteCount: 0,
          commit: async () => ({}) as Record<string, string>,
          discard: async () => {},
        }
  } catch (error) {
    throw new ContentInstallError(
      'MEDIA_FAILED',
      error instanceof Error
        ? error.message
        : 'Не удалось проверить медиа обновления.',
    )
  }

  let activated = false
  try {
    const assetSources = await preparedMedia.commit()
    await contentStore.activateContentPackage(
      parsed.data,
      byteCount + preparedMedia.byteCount,
    )
    activated = true
    registerAssetSources?.(assetSources)
    await registerContent(parsed.data)
  } catch (error) {
    if (!activated) await preparedMedia.discard()
    throw error
  }
  return parsed.data
}
