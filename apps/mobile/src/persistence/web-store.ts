import type { AppSnapshot, SnapshotStore } from '@chartalk/app-core'
import type { DiagnosticEvent } from '@chartalk/analytics-schema'
import type { ContentPackage } from '@chartalk/content-schema'

import { parseCachedCatalog, type CachedCatalog } from '../catalog'

import { contentPackageByteCount } from './content-store'
import type {
  ContentPackageStore,
  InstalledPackageRecord,
} from './content-store'
import type { CatalogCacheStore } from './catalog-store'
import type { DiagnosticOutbox } from './diagnostics-outbox'
import { MAX_DIAGNOSTIC_OUTBOX_EVENTS } from './diagnostics-outbox'
import {
  emptySyncState,
  type SyncState,
  type SyncStateStore,
} from './sync-state'

const STORAGE_KEY = 'chartalk.app.snapshot.v1'
const CONTENT_STORAGE_KEY = 'chartalk.content.packages.v1'
const TRANSCRIPT_ANCHOR_STORAGE_KEY = 'chartalk.transcript.anchors.v1'
const DIAGNOSTIC_OUTBOX_STORAGE_KEY = 'chartalk.diagnostics.outbox.v1'
const CATALOG_STORAGE_KEY = 'chartalk.catalog.cache.v1'
const SYNC_STATE_STORAGE_KEY = 'chartalk.sync.state.v1'

interface StoredPackage extends InstalledPackageRecord {
  content: ContentPackage
}

const browserStorage = (): Storage | null =>
  typeof window === 'undefined' ? null : window.localStorage

const parseSyncState = (
  stored: string | null,
  fallback: SyncState,
): SyncState => {
  if (!stored) return { ...fallback }
  try {
    const value = JSON.parse(stored) as Partial<SyncState>
    return {
      enabled: value.enabled === true,
      cursor: typeof value.cursor === 'string' ? value.cursor : null,
      lastSuccessAt:
        typeof value.lastSuccessAt === 'string' ? value.lastSuccessAt : null,
      lastErrorCode:
        typeof value.lastErrorCode === 'string' ? value.lastErrorCode : null,
    }
  } catch {
    browserStorage()?.removeItem(SYNC_STATE_STORAGE_KEY)
    return { ...fallback }
  }
}

export class WebSnapshotStore
  implements
    SnapshotStore,
    ContentPackageStore,
    DiagnosticOutbox,
    CatalogCacheStore,
    SyncStateStore
{
  private queue: Promise<unknown> = Promise.resolve()
  private fallback: AppSnapshot | null = null
  private contentFallback: StoredPackage[] | null = null
  private transcriptAnchorFallback: Record<string, string> = {}
  private diagnosticFallback: Array<DiagnosticEvent & { eventId: string }> = []
  private catalogFallback: CachedCatalog | null = null
  private syncStateFallback: SyncState = emptySyncState()

  private readonly bundledContent: readonly ContentPackage[]

  constructor(bundledContent: ContentPackage | readonly ContentPackage[]) {
    this.bundledContent = Array.isArray(bundledContent)
      ? bundledContent
      : [bundledContent]
  }

  async read(): Promise<AppSnapshot | null> {
    const stored = browserStorage()?.getItem(STORAGE_KEY)
    return stored ? (JSON.parse(stored) as AppSnapshot) : this.fallback
  }

  async transact<T>(
    mutation: (
      current: AppSnapshot | null,
    ) => Promise<{ snapshot: AppSnapshot; value: T }>,
  ): Promise<T> {
    const execute = async (): Promise<T> => {
      const result = await mutation(await this.read())
      this.fallback = result.snapshot
      browserStorage()?.setItem(STORAGE_KEY, JSON.stringify(result.snapshot))
      return result.value
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    return operation
  }

  async clear(): Promise<void> {
    await this.queue
    this.fallback = null
    this.transcriptAnchorFallback = {}
    browserStorage()?.removeItem(STORAGE_KEY)
    browserStorage()?.removeItem(TRANSCRIPT_ANCHOR_STORAGE_KEY)
    browserStorage()?.removeItem(DIAGNOSTIC_OUTBOX_STORAGE_KEY)
    browserStorage()?.removeItem(SYNC_STATE_STORAGE_KEY)
    this.diagnosticFallback = []
    this.syncStateFallback = emptySyncState()
  }

  private diagnosticRecords(): Array<DiagnosticEvent & { eventId: string }> {
    const stored = browserStorage()?.getItem(DIAGNOSTIC_OUTBOX_STORAGE_KEY)
    if (stored) {
      try {
        const parsed: unknown = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed as Array<DiagnosticEvent & { eventId: string }>
        }
      } catch {
        browserStorage()?.removeItem(DIAGNOSTIC_OUTBOX_STORAGE_KEY)
      }
    }
    return this.diagnosticFallback
  }

  private writeDiagnosticRecords(
    records: Array<DiagnosticEvent & { eventId: string }>,
  ): void {
    this.diagnosticFallback = records
    browserStorage()?.setItem(
      DIAGNOSTIC_OUTBOX_STORAGE_KEY,
      JSON.stringify(records),
    )
  }

  async enqueue(event: DiagnosticEvent & { eventId: string }): Promise<void> {
    const execute = () => {
      const records = this.diagnosticRecords()
      if (records.some(item => item.eventId === event.eventId)) return
      this.writeDiagnosticRecords(
        [...records, event].slice(-MAX_DIAGNOSTIC_OUTBOX_EVENTS),
      )
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    await operation
  }

  async list(
    limit = 100,
  ): Promise<Array<DiagnosticEvent & { eventId: string }>> {
    await this.queue
    const boundedLimit = Math.max(1, Math.min(100, Math.floor(limit)))
    return this.diagnosticRecords().slice(0, boundedLimit)
  }

  async remove(eventId: string): Promise<void> {
    const execute = () => {
      this.writeDiagnosticRecords(
        this.diagnosticRecords().filter(item => item.eventId !== eventId),
      )
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    await operation
  }

  async clearOutbox(): Promise<void> {
    const execute = () => {
      this.diagnosticFallback = []
      browserStorage()?.removeItem(DIAGNOSTIC_OUTBOX_STORAGE_KEY)
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    await operation
  }

  async readCatalog(): Promise<CachedCatalog | null> {
    await this.queue
    const stored = browserStorage()?.getItem(CATALOG_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = parseCachedCatalog(JSON.parse(stored))
        if (parsed) return parsed
        browserStorage()?.removeItem(CATALOG_STORAGE_KEY)
      } catch {
        browserStorage()?.removeItem(CATALOG_STORAGE_KEY)
      }
    }
    return this.catalogFallback
  }

  async writeCatalog(catalog: CachedCatalog): Promise<void> {
    const execute = () => {
      this.catalogFallback = catalog
      browserStorage()?.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalog))
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    await operation
  }

  async clearCatalog(): Promise<void> {
    const execute = () => {
      this.catalogFallback = null
      browserStorage()?.removeItem(CATALOG_STORAGE_KEY)
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    await operation
  }

  async readSyncState(): Promise<SyncState> {
    await this.queue
    return parseSyncState(
      browserStorage()?.getItem(SYNC_STATE_STORAGE_KEY) ?? null,
      this.syncStateFallback,
    )
  }

  async writeSyncState(patch: Partial<SyncState>): Promise<SyncState> {
    const execute = async () => {
      const current = parseSyncState(
        browserStorage()?.getItem(SYNC_STATE_STORAGE_KEY) ?? null,
        this.syncStateFallback,
      )
      const next: SyncState = {
        enabled: patch.enabled ?? current.enabled,
        cursor: patch.cursor === undefined ? current.cursor : patch.cursor,
        lastSuccessAt:
          patch.lastSuccessAt === undefined
            ? current.lastSuccessAt
            : patch.lastSuccessAt,
        lastErrorCode:
          patch.lastErrorCode === undefined
            ? current.lastErrorCode
            : patch.lastErrorCode,
      }
      this.syncStateFallback = next
      browserStorage()?.setItem(SYNC_STATE_STORAGE_KEY, JSON.stringify(next))
      return { ...next }
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    return operation
  }

  async clearSyncState(): Promise<void> {
    await this.writeSyncState(emptySyncState())
  }

  private transcriptAnchors(): Record<string, string> {
    const stored = browserStorage()?.getItem(TRANSCRIPT_ANCHOR_STORAGE_KEY)
    return stored
      ? (JSON.parse(stored) as Record<string, string>)
      : this.transcriptAnchorFallback
  }

  async readTranscriptAnchor(runId: string): Promise<string | null> {
    await this.queue
    return this.transcriptAnchors()[runId] ?? null
  }

  async writeTranscriptAnchor(
    runId: string,
    entryId: string | null,
  ): Promise<void> {
    const execute = () => {
      const anchors = { ...this.transcriptAnchors() }
      if (entryId) anchors[runId] = entryId
      else delete anchors[runId]
      this.transcriptAnchorFallback = anchors
      browserStorage()?.setItem(
        TRANSCRIPT_ANCHOR_STORAGE_KEY,
        JSON.stringify(anchors),
      )
    }
    const operation = this.queue.then(execute, execute)
    this.queue = operation.then(
      () => undefined,
      () => undefined,
    )
    await operation
  }

  private contentRecords(): StoredPackage[] {
    const stored = browserStorage()?.getItem(CONTENT_STORAGE_KEY)
    if (stored) return JSON.parse(stored) as StoredPackage[]
    if (this.contentFallback) return this.contentFallback
    return this.bundledContent.map(content => {
      const now = content.manifest.createdAt
      return {
        packId: content.manifest.packId,
        buildId: content.manifest.buildId,
        contentVersion: content.manifest.contentVersion,
        status: 'bundled' as const,
        byteCount: contentPackageByteCount(content),
        installedAt: now,
        activatedAt: now,
        content,
      }
    })
  }

  private writeContentRecords(records: StoredPackage[]): void {
    this.contentFallback = records
    browserStorage()?.setItem(CONTENT_STORAGE_KEY, JSON.stringify(records))
  }

  async readContentPackages(): Promise<ContentPackage[]> {
    return [...this.contentRecords()]
      .sort((left, right) => left.activatedAt.localeCompare(right.activatedAt))
      .map(record => record.content)
  }

  async listContentPackages(): Promise<InstalledPackageRecord[]> {
    return [...this.contentRecords()]
      .sort((left, right) => right.activatedAt.localeCompare(left.activatedAt))
      .map(record => ({
        packId: record.packId,
        buildId: record.buildId,
        contentVersion: record.contentVersion,
        status: record.status,
        byteCount: record.byteCount,
        installedAt: record.installedAt,
        activatedAt: record.activatedAt,
      }))
  }

  async activateContentPackage(
    content: ContentPackage,
    byteCount: number,
  ): Promise<void> {
    const now = new Date().toISOString()
    const sourceRecords = this.contentRecords()
    const existingSource = sourceRecords.find(
      record =>
        record.packId === content.manifest.packId &&
        record.buildId === content.manifest.buildId,
    )
    if (
      existingSource &&
      JSON.stringify(existingSource.content) !== JSON.stringify(content)
    ) {
      throw new Error(
        `Сборка ${content.manifest.buildId} неизменяема и не может быть заменена.`,
      )
    }
    if (existingSource?.status === 'bundled') return
    const records = sourceRecords.map(record =>
      record.packId === content.manifest.packId && record.status === 'active'
        ? { ...record, status: 'rollback' as const }
        : record,
    )
    const existing = records.findIndex(
      record =>
        record.packId === content.manifest.packId &&
        record.buildId === content.manifest.buildId,
    )
    const next: StoredPackage = {
      packId: content.manifest.packId,
      buildId: content.manifest.buildId,
      contentVersion: content.manifest.contentVersion,
      status: 'active',
      byteCount,
      installedAt: existing >= 0 ? records[existing]!.installedAt : now,
      activatedAt: now,
      content,
    }
    if (existing >= 0) records.splice(existing, 1)
    records.push(next)
    this.writeContentRecords(records)
  }

  async removeContentPackage(
    packId: string,
    buildId: string,
    protectedBuildIds: readonly string[],
  ): Promise<void> {
    if (protectedBuildIds.includes(buildId)) {
      throw new Error('Эта версия нужна для активного прохождения.')
    }
    this.writeContentRecords(
      this.contentRecords().filter(
        record =>
          record.packId !== packId ||
          record.buildId !== buildId ||
          record.status !== 'rollback',
      ),
    )
  }

  async resetDownloadedContent(): Promise<void> {
    this.writeContentRecords(
      this.contentRecords().filter(record => record.status === 'bundled'),
    )
  }

  async availableDiskBytes(): Promise<number | null> {
    const estimate = await globalThis.navigator?.storage?.estimate()
    return estimate?.quota && estimate.usage !== undefined
      ? estimate.quota - estimate.usage
      : null
  }
}
