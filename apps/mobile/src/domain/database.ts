export const databasePragmaSql = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA secure_delete = ON;
`

const initialSchemaSql = `
CREATE TABLE IF NOT EXISTS app_snapshot (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  schema_version INTEGER NOT NULL,
  snapshot_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS local_profile (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  display_name TEXT NOT NULL,
  selected_character_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reader_settings (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  settings_json TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS story_runs (
  run_id TEXT PRIMARY KEY,
  story_id TEXT NOT NULL,
  episode_id TEXT NOT NULL,
  character_id TEXT NOT NULL,
  content_build_id TEXT NOT NULL,
  active_node_id TEXT NOT NULL,
  sequence INTEGER NOT NULL CHECK (sequence >= 0),
  state_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  started_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  completed_at TEXT,
  ending_id TEXT
);

CREATE TABLE IF NOT EXISTS choice_events (
  event_id TEXT PRIMARY KEY,
  operation_id TEXT NOT NULL,
  run_id TEXT NOT NULL REFERENCES story_runs(run_id) ON DELETE CASCADE,
  sequence INTEGER NOT NULL,
  node_id TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  content_build_id TEXT NOT NULL,
  event_json TEXT NOT NULL,
  committed_at TEXT NOT NULL,
  UNIQUE (run_id, operation_id),
  UNIQUE (run_id, sequence)
);

CREATE TABLE IF NOT EXISTS transcript_entries (
  entry_id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES story_runs(run_id) ON DELETE CASCADE,
  ordinal INTEGER NOT NULL,
  speaker_id TEXT NOT NULL,
  text_value TEXT NOT NULL,
  entry_json TEXT NOT NULL,
  UNIQUE (run_id, ordinal)
);

CREATE TABLE IF NOT EXISTS provisional_choices (
  run_id TEXT PRIMARY KEY REFERENCES story_runs(run_id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  choice_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_packages (
  pack_id TEXT PRIMARY KEY,
  build_id TEXT NOT NULL,
  content_version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  installed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS content_asset_index (
  asset_id TEXT PRIMARY KEY,
  pack_id TEXT NOT NULL REFERENCES content_packages(pack_id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  checksum TEXT NOT NULL,
  bytes INTEGER,
  UNIQUE (pack_id, path)
);

CREATE TABLE IF NOT EXISTS sync_state (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  enabled INTEGER NOT NULL DEFAULT 0 CHECK (enabled IN (0, 1)),
  cursor TEXT,
  last_success_at TEXT,
  last_error_code TEXT
);

CREATE TABLE IF NOT EXISTS content_reports (
  report_id TEXT PRIMARY KEY,
  run_id TEXT REFERENCES story_runs(run_id) ON DELETE SET NULL,
  node_id TEXT,
  category TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_choice_events_run_sequence
  ON choice_events(run_id, sequence);
CREATE INDEX IF NOT EXISTS idx_transcript_run_ordinal
  ON transcript_entries(run_id, ordinal);
CREATE INDEX IF NOT EXISTS idx_story_runs_status_updated
  ON story_runs(status, updated_at DESC);
`

export interface DatabaseMigration {
  version: number
  sql: string
}

export interface DatabaseMigrationTransaction {
  execAsync(sql: string): Promise<void>
  getFirstAsync<T>(sql: string): Promise<T | null>
}

export interface DatabaseMigrationRunner {
  withExclusiveTransactionAsync(
    operation: (transaction: DatabaseMigrationTransaction) => Promise<void>,
  ): Promise<void>
}

export const databaseMigrations: readonly DatabaseMigration[] = [
  {
    version: 1,
    sql: `${initialSchemaSql}\nPRAGMA user_version = 1;`,
  },
  {
    version: 2,
    sql: `
ALTER TABLE content_reports ADD COLUMN choice_id TEXT;
ALTER TABLE content_reports ADD COLUMN content_build_id TEXT NOT NULL DEFAULT '';
ALTER TABLE content_reports ADD COLUMN app_version TEXT NOT NULL DEFAULT '';
ALTER TABLE content_reports ADD COLUMN platform TEXT NOT NULL DEFAULT '';
ALTER TABLE content_reports ADD COLUMN diagnostic_code TEXT;
ALTER TABLE content_reports ADD COLUMN consent_granted_at TEXT NOT NULL DEFAULT '';
PRAGMA user_version = 2;
`,
  },
  {
    version: 3,
    sql: `
CREATE TABLE IF NOT EXISTS content_package_builds (
  pack_id TEXT NOT NULL,
  build_id TEXT NOT NULL,
  content_version TEXT NOT NULL,
  checksum TEXT NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('bundled', 'active', 'rollback')),
  content_json TEXT NOT NULL,
  byte_count INTEGER NOT NULL CHECK (byte_count >= 0),
  installed_at TEXT NOT NULL,
  activated_at TEXT NOT NULL,
  last_used_at TEXT,
  PRIMARY KEY (pack_id, build_id)
);
CREATE INDEX IF NOT EXISTS idx_content_package_builds_status
  ON content_package_builds(pack_id, status, activated_at DESC);
PRAGMA user_version = 3;
`,
  },
  {
    version: 4,
    sql: `
ALTER TABLE local_profile ADD COLUMN grammar_profile TEXT NOT NULL DEFAULT 'neutralPhrasing';
PRAGMA user_version = 4;
`,
  },
  {
    version: 5,
    sql: `
ALTER TABLE story_runs ADD COLUMN parent_run_id TEXT;
ALTER TABLE story_runs ADD COLUMN branch_from_sequence INTEGER;
ALTER TABLE story_runs ADD COLUMN run_label TEXT;
ALTER TABLE story_runs ADD COLUMN safe_route_warning_id TEXT;
CREATE INDEX IF NOT EXISTS idx_story_runs_parent_run
  ON story_runs(parent_run_id, started_at);
PRAGMA user_version = 5;
`,
  },
  {
    version: 6,
    sql: `
CREATE TABLE IF NOT EXISTS transcript_anchors (
  run_id TEXT PRIMARY KEY,
  entry_id TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
PRAGMA user_version = 6;
`,
  },
  {
    version: 7,
    sql: `
CREATE TABLE IF NOT EXISTS diagnostic_outbox (
  event_id TEXT PRIMARY KEY,
  event_json TEXT NOT NULL,
  queued_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_diagnostic_outbox_queued_at
  ON diagnostic_outbox(queued_at ASC);
PRAGMA user_version = 7;
`,
  },
  {
    version: 8,
    sql: `
CREATE TABLE IF NOT EXISTS catalog_cache (
  singleton_id INTEGER PRIMARY KEY CHECK (singleton_id = 1),
  catalog_json TEXT NOT NULL,
  etag TEXT,
  fetched_at TEXT NOT NULL
);
PRAGMA user_version = 8;
`,
  },
]

export const DATABASE_VERSION = 8

export const pendingDatabaseMigrations = (
  currentVersion: number,
): readonly DatabaseMigration[] => {
  if (!Number.isInteger(currentVersion) || currentVersion < 0) {
    throw new Error(`Invalid database version: ${currentVersion}`)
  }
  if (currentVersion > DATABASE_VERSION) {
    throw new Error(
      `Database version ${currentVersion} is newer than supported version ${DATABASE_VERSION}`,
    )
  }
  return databaseMigrations.filter(
    migration => migration.version > currentVersion,
  )
}

/**
 * Applies the complete pending schema history as one transaction. A failure in
 * any later migration therefore leaves both user_version and reader data at
 * the exact pre-migration state.
 */
export const runDatabaseMigrations = async (
  database: DatabaseMigrationRunner,
  currentVersion: number,
  migrations: readonly DatabaseMigration[] = pendingDatabaseMigrations(
    currentVersion,
  ),
): Promise<boolean> => {
  if (migrations.length === 0) return false

  let previousVersion = currentVersion
  for (const migration of migrations) {
    if (
      !Number.isInteger(migration.version) ||
      migration.version <= previousVersion
    ) {
      throw new Error(
        `Database migrations must be strictly ordered after version ${previousVersion}`,
      )
    }
    previousVersion = migration.version
  }

  await database.withExclusiveTransactionAsync(async transaction => {
    for (const migration of migrations) {
      await transaction.execAsync(migration.sql)
    }
    const integrity = await transaction.getFirstAsync<{
      integrity_check?: string
    }>('PRAGMA integrity_check')
    if (integrity?.integrity_check?.toLowerCase() !== 'ok') {
      throw new Error('Database integrity check failed after migration')
    }
  })
  return true
}

/** Full schema history, useful for diagnostics and static security assertions. */
export const migrationSql = `${databasePragmaSql}\n${databaseMigrations
  .map(migration => migration.sql)
  .join('\n')}`
