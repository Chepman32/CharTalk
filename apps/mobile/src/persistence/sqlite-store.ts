import type { AppSnapshot, SnapshotStore } from '@chartalk/app-core'
import type { DiagnosticEvent } from '@chartalk/analytics-schema'
import type { ContentPackage } from '@chartalk/content-schema'
import * as SQLite from 'expo-sqlite'
import { Paths } from 'expo-file-system'

import { parseCachedCatalog, type CachedCatalog } from '../catalog'
import { databasePragmaSql, runDatabaseMigrations } from '@/domain/database'
import type { CatalogCacheStore } from '@/persistence/catalog-store'
import { contentPackageByteCount } from '@/persistence/content-store'
import type {
  ContentPackageStore,
  InstalledPackageRecord,
} from '@/persistence/content-store'
import type { DiagnosticOutbox } from '@/persistence/diagnostics-outbox'
import { MAX_DIAGNOSTIC_OUTBOX_EVENTS } from '@/persistence/diagnostics-outbox'
import {
  emptySyncState,
  type SyncState,
  type SyncStateStore,
} from '@/persistence/sync-state'

interface SnapshotRow {
  snapshot_json: string
}

interface UserVersionRow {
  user_version: number
}

interface TranscriptAnchorRow {
  entry_id: string
}

interface ContentPackageRow {
  content_json: string
}

interface ExistingContentPackageRow extends ContentPackageRow {
  checksum: string
  signature: string
  status: InstalledPackageRecord['status']
}

interface InstalledPackageRow {
  pack_id: string
  build_id: string
  content_version: string
  status: InstalledPackageRecord['status']
  byte_count: number
  installed_at: string
  activated_at: string
}

/**
 * Bundled narrative is part of the application binary, not a downloaded
 * SQLite payload. Keep its catalog record lightweight; persisting the full
 * package here would duplicate tens of megabytes of JSON on every cold start.
 */
const bundledPackageRecord = (
  content: ContentPackage,
): InstalledPackageRecord => ({
  packId: content.manifest.packId,
  buildId: content.manifest.buildId,
  contentVersion: content.manifest.contentVersion,
  status: 'bundled',
  byteCount: contentPackageByteCount(content),
  installedAt: content.manifest.createdAt,
  activatedAt: content.manifest.createdAt,
})

interface DiagnosticOutboxRow {
  event_id: string
  event_json: string
}

interface CatalogCacheRow {
  catalog_json: string
  etag: string | null
  fetched_at: string
}

interface SyncStateRow {
  enabled: number
  cursor: string | null
  last_success_at: string | null
  last_error_code: string | null
}

type DatabaseLike = SQLite.SQLiteDatabase

const readSnapshot = async (
  database: DatabaseLike,
): Promise<AppSnapshot | null> => {
  const row = await database.getFirstAsync<SnapshotRow>(
    'SELECT snapshot_json FROM app_snapshot WHERE singleton_id = 1',
  )
  return row ? (JSON.parse(row.snapshot_json) as AppSnapshot) : null
}

const clearReaderProjection = async (database: DatabaseLike): Promise<void> => {
  await database.execAsync(`
    DELETE FROM choice_events;
    DELETE FROM transcript_entries;
    DELETE FROM provisional_choices;
    DELETE FROM content_reports;
    DELETE FROM story_runs;
    DELETE FROM local_profile;
    DELETE FROM reader_settings;
    DELETE FROM app_snapshot;
  `)
}

const writeSnapshot = async (
  database: DatabaseLike,
  snapshot: AppSnapshot,
): Promise<void> => {
  await clearReaderProjection(database)
  const timestamp = new Date().toISOString()
  await database.runAsync(
    `INSERT INTO app_snapshot(singleton_id, schema_version, snapshot_json, updated_at)
     VALUES (1, ?, ?, ?)`,
    snapshot.schemaVersion,
    JSON.stringify(snapshot),
    timestamp,
  )
  await database.runAsync(
    `INSERT INTO reader_settings(singleton_id, settings_json) VALUES (1, ?)`,
    JSON.stringify(snapshot.settings),
  )
  if (snapshot.profile) {
    await database.runAsync(
      `INSERT INTO local_profile(
         singleton_id, display_name, selected_character_id, grammar_profile, created_at
       ) VALUES (1, ?, ?, ?, ?)`,
      snapshot.profile.displayName,
      snapshot.profile.selectedCharacterId,
      snapshot.profile.grammarProfile,
      snapshot.profile.createdAt,
    )
  }

  for (const run of snapshot.runs) {
    await database.runAsync(
      `INSERT INTO story_runs(
        run_id, story_id, episode_id, character_id, content_build_id, active_node_id,
        sequence, state_json, status, started_at, updated_at, completed_at, ending_id,
        parent_run_id, branch_from_sequence, run_label, safe_route_warning_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      run.runId,
      run.storyId,
      run.episodeId,
      run.characterId,
      run.contentBuildId,
      run.activeNodeId,
      run.sequence,
      JSON.stringify(run.state),
      run.status,
      run.startedAt,
      run.updatedAt,
      run.completedAt ?? null,
      run.endingId ?? null,
      run.parentRunId ?? null,
      run.branchFromSequence ?? null,
      run.label ?? null,
      run.safeRouteWarningId ?? null,
    )
    for (const event of run.events) {
      await database.runAsync(
        `INSERT INTO choice_events(
          event_id, operation_id, run_id, sequence, node_id, choice_id,
          content_build_id, event_json, committed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        event.eventId,
        event.operationId,
        event.runId,
        event.sequence,
        event.nodeId,
        event.choiceId,
        event.contentBuildId,
        JSON.stringify(event),
        event.committedAt,
      )
    }
    for (const [ordinal, entry] of run.transcript.entries()) {
      await database.runAsync(
        `INSERT INTO transcript_entries(
          entry_id, run_id, ordinal, speaker_id, text_value, entry_json
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        entry.entryId,
        run.runId,
        ordinal,
        entry.speakerId,
        entry.text,
        JSON.stringify(entry),
      )
    }
  }
  if (snapshot.provisional) {
    const provisional = snapshot.provisional
    await database.runAsync(
      `INSERT INTO provisional_choices(run_id, node_id, choice_id, created_at, expires_at)
       VALUES (?, ?, ?, ?, ?)`,
      provisional.runId,
      provisional.nodeId,
      provisional.choiceId,
      provisional.createdAt,
      provisional.expiresAt,
    )
  }
  for (const report of snapshot.reports) {
    await database.runAsync(
      `INSERT INTO content_reports(
        report_id, run_id, node_id, choice_id, content_build_id, app_version,
        platform, diagnostic_code, category, note, status, consent_granted_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      report.reportId,
      report.runId,
      report.nodeId,
      report.choiceId,
      report.contentBuildId,
      report.appVersion,
      report.platform,
      report.diagnosticCode,
      report.category,
      report.note,
      report.status,
      report.consentGrantedAt,
      report.createdAt,
    )
  }
}

export class SqliteSnapshotStore
  implements
    SnapshotStore,
    ContentPackageStore,
    DiagnosticOutbox,
    CatalogCacheStore,
    SyncStateStore
{
  private databasePromise: Promise<SQLite.SQLiteDatabase> | null = null

  private readonly bundledContent: readonly ContentPackage[]

  constructor(content: ContentPackage | readonly ContentPackage[]) {
    this.bundledContent = Array.isArray(content) ? content : [content]
  }

  private async database(): Promise<SQLite.SQLiteDatabase> {
    if (!this.databasePromise) {
      const opening = (async () => {
        const database = await SQLite.openDatabaseAsync('chartalk.db')
        await database.execAsync(databasePragmaSql)
        const row = await database.getFirstAsync<UserVersionRow>(
          'PRAGMA user_version',
        )
        const currentVersion = row?.user_version ?? 0
        await runDatabaseMigrations(database, currentVersion)
        await this.seedBundledContent(database)
        return database
      })()
      this.databasePromise = opening.catch(error => {
        this.databasePromise = null
        throw error
      })
    }
    return this.databasePromise
  }

  private async seedBundledContent(
    database: SQLite.SQLiteDatabase,
  ): Promise<void> {
    const installedAt = new Date().toISOString()

    // Older builds stored the complete bundled package in this table. Remove
    // those legacy payloads once so the native app no longer keeps a second
    // copy of the bundled narrative in SQLite.
    await database.runAsync(
      `DELETE FROM content_package_builds WHERE status = 'bundled'`,
    )

    for (const content of this.bundledContent) {
      await database.runAsync(
        `INSERT INTO content_packages(
          pack_id, build_id, content_version, checksum, signature,
          status, manifest_json, installed_at
        ) VALUES (?, ?, ?, ?, ?, 'bundled', ?, ?)
        ON CONFLICT(pack_id) DO UPDATE SET
          build_id = excluded.build_id,
          content_version = excluded.content_version,
          checksum = excluded.checksum,
          signature = excluded.signature,
          manifest_json = excluded.manifest_json`,
        content.manifest.packId,
        content.manifest.buildId,
        content.manifest.contentVersion,
        content.manifest.checksum,
        content.manifest.signature,
        JSON.stringify(content.manifest),
        installedAt,
      )
      for (const asset of content.assets) {
        await database.runAsync(
          `INSERT INTO content_asset_index(asset_id, pack_id, path, checksum, bytes)
           VALUES (?, ?, ?, ?, NULL)
           ON CONFLICT(asset_id) DO UPDATE SET
             pack_id = excluded.pack_id,
             path = excluded.path,
             checksum = excluded.checksum`,
          asset.assetId,
          content.manifest.packId,
          asset.path,
          asset.checksum,
        )
      }
    }
  }

  async read(): Promise<AppSnapshot | null> {
    return readSnapshot(await this.database())
  }

  async transact<T>(
    mutation: (
      current: AppSnapshot | null,
    ) => Promise<{ snapshot: AppSnapshot; value: T }>,
  ): Promise<T> {
    const database = await this.database()
    let output: T | undefined
    await database.withExclusiveTransactionAsync(async transaction => {
      const result = await mutation(await readSnapshot(transaction))
      await writeSnapshot(transaction, result.snapshot)
      output = result.value
    })
    return output as T
  }

  async clear(): Promise<void> {
    const database = await this.database()
    await database.withExclusiveTransactionAsync(async transaction => {
      await clearReaderProjection(transaction)
      await transaction.execAsync(
        'DELETE FROM transcript_anchors; DELETE FROM diagnostic_outbox; DELETE FROM sync_state;',
      )
    })
  }

  async readSyncState(): Promise<SyncState> {
    const row = await (
      await this.database()
    ).getFirstAsync<SyncStateRow>(
      'SELECT enabled, cursor, last_success_at, last_error_code FROM sync_state WHERE singleton_id = 1',
    )
    if (!row) return emptySyncState()
    return {
      enabled: row.enabled === 1,
      cursor: row.cursor,
      lastSuccessAt: row.last_success_at,
      lastErrorCode: row.last_error_code,
    }
  }

  async writeSyncState(patch: Partial<SyncState>): Promise<SyncState> {
    const current = await this.readSyncState()
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
    await (
      await this.database()
    ).runAsync(
      `INSERT INTO sync_state(
         singleton_id, enabled, cursor, last_success_at, last_error_code
       ) VALUES (1, ?, ?, ?, ?)
       ON CONFLICT(singleton_id) DO UPDATE SET
         enabled = excluded.enabled,
         cursor = excluded.cursor,
         last_success_at = excluded.last_success_at,
         last_error_code = excluded.last_error_code`,
      next.enabled ? 1 : 0,
      next.cursor,
      next.lastSuccessAt,
      next.lastErrorCode,
    )
    return next
  }

  async clearSyncState(): Promise<void> {
    await (await this.database()).runAsync('DELETE FROM sync_state')
  }

  async enqueue(event: DiagnosticEvent & { eventId: string }): Promise<void> {
    const database = await this.database()
    await database.runAsync(
      `INSERT OR IGNORE INTO diagnostic_outbox(event_id, event_json, queued_at)
       VALUES (?, ?, ?)`,
      event.eventId,
      JSON.stringify(event),
      new Date().toISOString(),
    )
    await database.runAsync(
      `DELETE FROM diagnostic_outbox
       WHERE event_id IN (
         SELECT event_id FROM diagnostic_outbox
         ORDER BY queued_at ASC, event_id ASC
         LIMIT -1 OFFSET ?
       )`,
      MAX_DIAGNOSTIC_OUTBOX_EVENTS,
    )
  }

  async list(
    limit = 100,
  ): Promise<Array<DiagnosticEvent & { eventId: string }>> {
    const boundedLimit = Math.max(1, Math.min(100, Math.floor(limit)))
    const rows = await (
      await this.database()
    ).getAllAsync<DiagnosticOutboxRow>(
      `SELECT event_id, event_json
       FROM diagnostic_outbox
       ORDER BY queued_at ASC
       LIMIT ?`,
      boundedLimit,
    )
    const events: Array<DiagnosticEvent & { eventId: string }> = []
    for (const row of rows) {
      try {
        const event = JSON.parse(row.event_json) as DiagnosticEvent & {
          eventId: string
        }
        if (event.eventId === row.event_id) events.push(event)
        else await this.remove(row.event_id)
      } catch {
        await this.remove(row.event_id)
      }
    }
    return events
  }

  async remove(eventId: string): Promise<void> {
    await (
      await this.database()
    ).runAsync('DELETE FROM diagnostic_outbox WHERE event_id = ?', eventId)
  }

  async clearOutbox(): Promise<void> {
    await (await this.database()).runAsync('DELETE FROM diagnostic_outbox')
  }

  async readCatalog(): Promise<CachedCatalog | null> {
    const row = await (
      await this.database()
    ).getFirstAsync<CatalogCacheRow>(
      'SELECT catalog_json, etag, fetched_at FROM catalog_cache WHERE singleton_id = 1',
    )
    if (!row) return null
    try {
      return parseCachedCatalog({
        data: JSON.parse(row.catalog_json) as unknown,
        etag: row.etag,
        fetchedAt: row.fetched_at,
      })
    } catch {
      await this.clearCatalog()
      return null
    }
  }

  async writeCatalog(catalog: CachedCatalog): Promise<void> {
    await (
      await this.database()
    ).runAsync(
      `INSERT INTO catalog_cache(singleton_id, catalog_json, etag, fetched_at)
       VALUES (1, ?, ?, ?)
       ON CONFLICT(singleton_id) DO UPDATE SET
         catalog_json = excluded.catalog_json,
         etag = excluded.etag,
         fetched_at = excluded.fetched_at`,
      JSON.stringify(catalog.data),
      catalog.etag,
      catalog.fetchedAt,
    )
  }

  async clearCatalog(): Promise<void> {
    await (
      await this.database()
    ).runAsync('DELETE FROM catalog_cache WHERE singleton_id = 1')
  }

  async readTranscriptAnchor(runId: string): Promise<string | null> {
    const row = await (
      await this.database()
    ).getFirstAsync<TranscriptAnchorRow>(
      'SELECT entry_id FROM transcript_anchors WHERE run_id = ?',
      runId,
    )
    return row?.entry_id ?? null
  }

  async writeTranscriptAnchor(
    runId: string,
    entryId: string | null,
  ): Promise<void> {
    const database = await this.database()
    if (!entryId) {
      await database.runAsync(
        'DELETE FROM transcript_anchors WHERE run_id = ?',
        runId,
      )
      return
    }
    await database.runAsync(
      `INSERT INTO transcript_anchors(run_id, entry_id, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(run_id) DO UPDATE SET
         entry_id = excluded.entry_id,
         updated_at = excluded.updated_at`,
      runId,
      entryId,
      new Date().toISOString(),
    )
  }

  async readContentPackages(): Promise<ContentPackage[]> {
    const rows = await (
      await this.database()
    ).getAllAsync<ContentPackageRow>(
      `SELECT content_json FROM content_package_builds
       WHERE status IN ('active', 'rollback')
       ORDER BY activated_at ASC`,
    )
    const bundledKeys = new Set(
      this.bundledContent.map(
        content => `${content.manifest.packId}:${content.manifest.buildId}`,
      ),
    )
    const downloaded = rows
      .map(row => JSON.parse(row.content_json) as ContentPackage)
      .filter(
        content =>
          !bundledKeys.has(
            `${content.manifest.packId}:${content.manifest.buildId}`,
          ),
      )

    // The bundled array is already in release order (core package first,
    // then the offline bulk library). Downloaded builds are appended in
    // activation order so the newest active build remains authoritative for
    // stories that share an ID.
    return [...this.bundledContent, ...downloaded]
  }

  async listContentPackages(): Promise<InstalledPackageRecord[]> {
    const rows = await (
      await this.database()
    ).getAllAsync<InstalledPackageRow>(
      `SELECT pack_id, build_id, content_version, status, byte_count,
              installed_at, activated_at
       FROM content_package_builds
       WHERE status IN ('active', 'rollback')
       ORDER BY activated_at DESC`,
    )
    const bundledKeys = new Set(
      this.bundledContent.map(
        content => `${content.manifest.packId}:${content.manifest.buildId}`,
      ),
    )
    const downloaded = rows
      .filter(row => !bundledKeys.has(`${row.pack_id}:${row.build_id}`))
      .map(row => ({
        packId: row.pack_id,
        buildId: row.build_id,
        contentVersion: row.content_version,
        status: row.status,
        byteCount: row.byte_count,
        installedAt: row.installed_at,
        activatedAt: row.activated_at,
      }))

    return [...downloaded, ...this.bundledContent.map(bundledPackageRecord)]
  }

  async activateContentPackage(
    content: ContentPackage,
    byteCount: number,
  ): Promise<void> {
    const bundled = this.bundledContent.find(
      candidate =>
        candidate.manifest.packId === content.manifest.packId &&
        candidate.manifest.buildId === content.manifest.buildId,
    )
    if (bundled) {
      if (
        JSON.stringify(bundled.manifest) !== JSON.stringify(content.manifest)
      ) {
        throw new Error(
          `Сборка ${content.manifest.buildId} неизменяема и не может быть заменена.`,
        )
      }
      return
    }

    const database = await this.database()
    const timestamp = new Date().toISOString()
    await database.withExclusiveTransactionAsync(async transaction => {
      const payload = JSON.stringify(content)
      const existing =
        await transaction.getFirstAsync<ExistingContentPackageRow>(
          `SELECT content_json, checksum, signature, status
         FROM content_package_builds WHERE pack_id = ? AND build_id = ?`,
          content.manifest.packId,
          content.manifest.buildId,
        )
      if (
        existing &&
        (existing.content_json !== payload ||
          existing.checksum !== content.manifest.checksum ||
          existing.signature !== content.manifest.signature)
      ) {
        throw new Error(
          `Сборка ${content.manifest.buildId} неизменяема и не может быть заменена.`,
        )
      }
      if (existing?.status === 'bundled') return
      await transaction.runAsync(
        `UPDATE content_package_builds SET status = 'rollback'
         WHERE pack_id = ? AND status = 'active'`,
        content.manifest.packId,
      )
      if (existing) {
        await transaction.runAsync(
          `UPDATE content_package_builds SET status = 'active', activated_at = ?
           WHERE pack_id = ? AND build_id = ?`,
          timestamp,
          content.manifest.packId,
          content.manifest.buildId,
        )
      } else {
        await transaction.runAsync(
          `INSERT INTO content_package_builds(
            pack_id, build_id, content_version, checksum, signature, status,
            content_json, byte_count, installed_at, activated_at
          ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?)`,
          content.manifest.packId,
          content.manifest.buildId,
          content.manifest.contentVersion,
          content.manifest.checksum,
          content.manifest.signature,
          payload,
          byteCount,
          timestamp,
          timestamp,
        )
      }
    })
  }

  async removeContentPackage(
    packId: string,
    buildId: string,
    protectedBuildIds: readonly string[],
  ): Promise<void> {
    if (protectedBuildIds.includes(buildId)) {
      throw new Error('Эта версия нужна для активного прохождения.')
    }
    const database = await this.database()
    await database.runAsync(
      `DELETE FROM content_package_builds
       WHERE pack_id = ? AND build_id = ? AND status = 'rollback'`,
      packId,
      buildId,
    )
  }

  async resetDownloadedContent(): Promise<void> {
    const database = await this.database()
    await database.runAsync(
      `DELETE FROM content_package_builds WHERE status != 'bundled'`,
    )
  }

  async availableDiskBytes(): Promise<number | null> {
    return Paths.availableDiskSpace
  }
}
