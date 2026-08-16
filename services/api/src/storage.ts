import { DatabaseSync } from 'node:sqlite'

import type { ContentPackage } from '@chartalk/content-schema'
import type {
  SyncPrincipal,
  SyncStore,
  SyncStoreDependencies,
  SyncAccountSnapshot,
} from './sync'
import { MemorySyncStore } from './sync'
import type {
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
} from '@chartalk/sync-protocol'

import type { ApiReport, ApiStore, DiagnosticEvent } from './app'

interface PackageRow {
  payload_json: string
  checksum: string
  signature: string
}

interface CountRow {
  count: number
}

interface TableInfoRow {
  name: string
  pk?: number
}

interface SyncAccountRow {
  account_id: string
  payload_json: string
}

export class SqliteApiStore implements ApiStore, SyncStore {
  private readonly database: DatabaseSync
  private readonly syncStore = new MemorySyncStore()

  constructor(databasePath: string, bundledContent: ContentPackage) {
    this.database = new DatabaseSync(databasePath)
    this.database.exec(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
      PRAGMA secure_delete = ON;
      CREATE TABLE IF NOT EXISTS content_packages (
        pack_id TEXT NOT NULL,
        build_id TEXT NOT NULL,
        content_version TEXT NOT NULL,
        checksum TEXT NOT NULL,
        signature TEXT NOT NULL,
        payload_json TEXT NOT NULL,
        published_at TEXT NOT NULL,
        is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
        PRIMARY KEY (pack_id, build_id)
      ) STRICT;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_one_current_package
        ON content_packages(is_current) WHERE is_current = 1;
      CREATE TABLE IF NOT EXISTS reports (
        report_id TEXT PRIMARY KEY,
        run_id TEXT,
        node_id TEXT,
        choice_id TEXT,
        content_build_id TEXT NOT NULL DEFAULT '',
        app_version TEXT NOT NULL DEFAULT '',
        platform TEXT NOT NULL DEFAULT 'unknown',
        diagnostic_code TEXT,
        category TEXT NOT NULL,
        note TEXT,
        consent_granted_at TEXT NOT NULL DEFAULT '',
        received_at TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'queued'
      ) STRICT;
      CREATE TABLE IF NOT EXISTS diagnostics (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_event_id TEXT,
        event_name TEXT NOT NULL,
        content_build_id TEXT NOT NULL,
        occurred_at TEXT NOT NULL,
        node_type TEXT,
        duration_bucket TEXT,
        latency_bucket TEXT,
        option_position INTEGER,
        network_class TEXT,
        error_code TEXT
      ) STRICT;
      CREATE TABLE IF NOT EXISTS sync_accounts (
        account_id TEXT PRIMARY KEY,
        payload_json TEXT NOT NULL
      ) STRICT;
    `)
    this.migrateReportColumns()
    this.migrateDiagnosticColumns()
    this.migrateContentPackageIdentity()
    this.loadSyncAccounts()
    const current = this.database
      .prepare(
        'SELECT pack_id, build_id FROM content_packages WHERE is_current = 1',
      )
      .get()
    if (!current) this.writePackage(bundledContent, true)
  }

  private loadSyncAccounts(): void {
    const rows = this.database
      .prepare('SELECT account_id, payload_json FROM sync_accounts')
      .all() as unknown as SyncAccountRow[]
    for (const row of rows) {
      try {
        this.syncStore.importAccountSnapshot(
          row.account_id,
          JSON.parse(row.payload_json) as SyncAccountSnapshot,
        )
      } catch {
        // A corrupt sync account is intentionally ignored; the account can
        // re-authenticate and start a fresh branch without affecting content.
      }
    }
  }

  private persistSyncAccount(accountId: string): void {
    this.database
      .prepare(
        `INSERT INTO sync_accounts(account_id, payload_json) VALUES (?, ?)
         ON CONFLICT(account_id) DO UPDATE SET payload_json = excluded.payload_json`,
      )
      .run(
        accountId,
        JSON.stringify(this.syncStore.exportAccountSnapshot(accountId)),
      )
  }

  private migrateReportColumns(): void {
    const columns = new Set(
      (
        this.database
          .prepare('PRAGMA table_info(reports)')
          .all() as unknown as TableInfoRow[]
      ).map(item => item.name),
    )
    const additions = [
      ['choice_id', 'TEXT'],
      ['content_build_id', "TEXT NOT NULL DEFAULT ''"],
      ['app_version', "TEXT NOT NULL DEFAULT ''"],
      ['platform', "TEXT NOT NULL DEFAULT 'unknown'"],
      ['diagnostic_code', 'TEXT'],
      ['consent_granted_at', "TEXT NOT NULL DEFAULT ''"],
    ] as const
    for (const [name, definition] of additions) {
      if (!columns.has(name)) {
        this.database.exec(
          `ALTER TABLE reports ADD COLUMN ${name} ${definition}`,
        )
      }
    }
    this.database.exec('PRAGMA user_version = 1')
  }

  private migrateDiagnosticColumns(): void {
    const columns = new Set(
      (
        this.database
          .prepare('PRAGMA table_info(diagnostics)')
          .all() as unknown as TableInfoRow[]
      ).map(item => item.name),
    )
    const additions = [
      ['client_event_id', 'TEXT'],
      ['latency_bucket', 'TEXT'],
      ['option_position', 'INTEGER'],
      ['network_class', 'TEXT'],
      ['error_code', 'TEXT'],
    ] as const
    for (const [name, definition] of additions) {
      if (!columns.has(name)) {
        this.database.exec(
          `ALTER TABLE diagnostics ADD COLUMN ${name} ${definition}`,
        )
      }
    }
    this.database.exec(
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_diagnostics_client_event_id
       ON diagnostics(client_event_id) WHERE client_event_id IS NOT NULL`,
    )
    this.database.exec('PRAGMA user_version = 2')
  }

  private migrateContentPackageIdentity(): void {
    const columns = this.database
      .prepare('PRAGMA table_info(content_packages)')
      .all() as unknown as TableInfoRow[]
    const hasCompositePrimaryKey = columns.some(
      column => column.name === 'pack_id' && (column.pk ?? 0) > 0,
    )
    if (hasCompositePrimaryKey) {
      this.database.exec('PRAGMA user_version = 3')
      return
    }

    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.database.exec(`
        DROP INDEX IF EXISTS idx_one_current_package;
        CREATE TABLE content_packages_migrated (
          pack_id TEXT NOT NULL,
          build_id TEXT NOT NULL,
          content_version TEXT NOT NULL,
          checksum TEXT NOT NULL,
          signature TEXT NOT NULL,
          payload_json TEXT NOT NULL,
          published_at TEXT NOT NULL,
          is_current INTEGER NOT NULL DEFAULT 0 CHECK (is_current IN (0, 1)),
          PRIMARY KEY (pack_id, build_id)
        ) STRICT;
        INSERT INTO content_packages_migrated(
          pack_id, build_id, content_version, checksum, signature,
          payload_json, published_at, is_current
        )
        SELECT pack_id, build_id, content_version, checksum, signature,
               payload_json, published_at, is_current
        FROM content_packages;
        DROP TABLE content_packages;
        ALTER TABLE content_packages_migrated RENAME TO content_packages;
        CREATE UNIQUE INDEX idx_one_current_package
          ON content_packages(is_current) WHERE is_current = 1;
        PRAGMA user_version = 3;
      `)
      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  private writePackage(content: ContentPackage, current: boolean): void {
    const payload = JSON.stringify(content)
    const existing = this.database
      .prepare(
        `SELECT payload_json, checksum, signature
         FROM content_packages WHERE pack_id = ? AND build_id = ?`,
      )
      .get(content.manifest.packId, content.manifest.buildId) as
      PackageRow | undefined
    if (existing) {
      if (
        existing.payload_json !== payload ||
        existing.checksum !== content.manifest.checksum ||
        existing.signature !== content.manifest.signature
      ) {
        throw new Error(
          `Content build ${content.manifest.buildId} is immutable`,
        )
      }
      if (current) {
        this.database
          .prepare('UPDATE content_packages SET is_current = 0')
          .run()
        this.database
          .prepare(
            `UPDATE content_packages SET is_current = 1
             WHERE pack_id = ? AND build_id = ?`,
          )
          .run(content.manifest.packId, content.manifest.buildId)
      }
      return
    }
    if (current) {
      this.database.prepare('UPDATE content_packages SET is_current = 0').run()
    }
    this.database
      .prepare(
        `INSERT INTO content_packages(
          build_id, pack_id, content_version, checksum, signature,
          payload_json, published_at, is_current
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        content.manifest.buildId,
        content.manifest.packId,
        content.manifest.contentVersion,
        content.manifest.checksum,
        content.manifest.signature,
        payload,
        new Date().toISOString(),
        current ? 1 : 0,
      )
  }

  async getCurrentPackage(): Promise<ContentPackage> {
    const row = this.database
      .prepare(
        `SELECT payload_json, checksum, signature
         FROM content_packages WHERE is_current = 1`,
      )
      .get() as PackageRow | undefined
    if (!row) throw new Error('No current content package is installed')
    return JSON.parse(row.payload_json) as ContentPackage
  }

  async getPackage(
    packId: string,
    buildId: string,
  ): Promise<ContentPackage | null> {
    const row = this.database
      .prepare(
        `SELECT payload_json, checksum, signature FROM content_packages
         WHERE pack_id = ? AND build_id = ?`,
      )
      .get(packId, buildId) as PackageRow | undefined
    return row ? (JSON.parse(row.payload_json) as ContentPackage) : null
  }

  async saveReport(report: ApiReport): Promise<void> {
    this.database
      .prepare(
        `INSERT OR IGNORE INTO reports(
          report_id, run_id, node_id, choice_id, content_build_id, app_version,
          platform, diagnostic_code, category, note, consent_granted_at, received_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
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
        report.consentGrantedAt,
        report.receivedAt,
      )
  }

  async saveDiagnostic(event: DiagnosticEvent): Promise<void> {
    const clientEventId = event.eventId ?? globalThis.crypto.randomUUID()
    this.database
      .prepare(
        `INSERT OR IGNORE INTO diagnostics(
          client_event_id, event_name, content_build_id, occurred_at, node_type,
          duration_bucket, latency_bucket, option_position, network_class, error_code
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        clientEventId,
        event.eventName,
        event.contentBuildId,
        event.occurredAt,
        event.nodeType ?? null,
        event.durationBucket ?? null,
        event.latencyBucket ?? null,
        event.optionPosition ?? null,
        event.networkClass ?? null,
        event.errorCode ?? null,
      )
  }

  async publish(content: ContentPackage): Promise<void> {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      this.writePackage(content, true)
      this.database.exec('COMMIT')
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  async push(
    principal: SyncPrincipal,
    request: SyncPushRequest,
    dependencies: SyncStoreDependencies,
  ): Promise<SyncPushResponse> {
    this.database.exec('BEGIN IMMEDIATE')
    try {
      const response = await this.syncStore.push(
        principal,
        request,
        dependencies,
      )
      this.persistSyncAccount(principal.accountId)
      this.database.exec('COMMIT')
      return response
    } catch (error) {
      this.database.exec('ROLLBACK')
      throw error
    }
  }

  async pull(
    principal: SyncPrincipal,
    runId: string,
    afterCursor: string | null,
  ): Promise<SyncPullResponse> {
    return this.syncStore.pull(principal, runId, afterCursor)
  }

  getOperationalCounts(): { reports: number; diagnostics: number } {
    const reports = this.database
      .prepare('SELECT COUNT(*) AS count FROM reports')
      .get() as unknown as CountRow
    const diagnostics = this.database
      .prepare('SELECT COUNT(*) AS count FROM diagnostics')
      .get() as unknown as CountRow
    return { reports: reports.count, diagnostics: diagnostics.count }
  }

  close(): void {
    this.database.close()
  }
}
