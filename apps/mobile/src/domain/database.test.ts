/// <reference types="node" />

import { DatabaseSync } from 'node:sqlite'

import { describe, expect, it } from 'vitest'

import {
  DATABASE_VERSION,
  databaseMigrations,
  databasePragmaSql,
  migrationSql,
  pendingDatabaseMigrations,
  runDatabaseMigrations,
} from './database'

const sqliteMigrationAdapter = (database: DatabaseSync) => ({
  withExclusiveTransactionAsync: async (
    operation: (transaction: {
      execAsync(sql: string): Promise<void>
      getFirstAsync<T>(sql: string): Promise<T | null>
    }) => Promise<void>,
  ) => {
    database.exec('BEGIN IMMEDIATE')
    try {
      await operation({
        execAsync: async sql => {
          database.exec(sql)
        },
        getFirstAsync: async <T>(sql: string) =>
          (database.prepare(sql).get() as T | undefined) ?? null,
      })
      database.exec('COMMIT')
    } catch (error) {
      database.exec('ROLLBACK')
      throw error
    }
  },
})

describe('mobile database contract', () => {
  it('enables crash-safe SQLite settings', () => {
    expect(databasePragmaSql).toContain('PRAGMA journal_mode = WAL')
    expect(databasePragmaSql).toContain('PRAGMA foreign_keys = ON')
    expect(databasePragmaSql).toContain('PRAGMA secure_delete = ON')
  })

  it.each([
    'app_snapshot',
    'local_profile',
    'reader_settings',
    'story_runs',
    'choice_events',
    'transcript_entries',
    'provisional_choices',
    'content_packages',
    'content_package_builds',
    'content_asset_index',
    'sync_state',
    'content_reports',
    'diagnostic_outbox',
    'catalog_cache',
  ])('creates the %s table', table => {
    expect(migrationSql).toContain(`CREATE TABLE IF NOT EXISTS ${table}`)
  })

  it('has a monotonically versioned migration', () => {
    expect(DATABASE_VERSION).toBe(8)
    expect(migrationSql).toContain(`PRAGMA user_version = ${DATABASE_VERSION}`)
    expect(migrationSql).toContain('ADD COLUMN parent_run_id TEXT')
    expect(migrationSql).toContain('ADD COLUMN branch_from_sequence INTEGER')
    expect(databaseMigrations.map(item => item.version)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(0).map(item => item.version)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(1).map(item => item.version)).toEqual([
      2, 3, 4, 5, 6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(2).map(item => item.version)).toEqual([
      3, 4, 5, 6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(3).map(item => item.version)).toEqual([
      4, 5, 6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(4).map(item => item.version)).toEqual([
      5, 6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(5).map(item => item.version)).toEqual([
      6, 7, 8,
    ])
    expect(pendingDatabaseMigrations(6)).toEqual([
      databaseMigrations[6],
      databaseMigrations[7],
    ])
    expect(pendingDatabaseMigrations(7)).toEqual([databaseMigrations[7]])
    expect(pendingDatabaseMigrations(8)).toEqual([])
    expect(() => pendingDatabaseMigrations(9)).toThrow(/newer than supported/)
    expect(databaseMigrations[1]?.sql).toContain('consent_granted_at')
    expect(databaseMigrations[2]?.sql).toContain('content_json')
    expect(databaseMigrations[3]?.sql).toContain('grammar_profile')
    expect(databaseMigrations[4]?.sql).toContain('parent_run_id')
    expect(databaseMigrations[5]?.sql).toContain('transcript_anchors')
  })

  it.each([0, 1, 2, 3, 4, 5, 6, 7, 8])(
    'replays every supported database version %s to the latest schema',
    async currentVersion => {
      const database = new DatabaseSync(':memory:')
      try {
        for (const migration of databaseMigrations.filter(
          item => item.version <= currentVersion,
        )) {
          database.exec(migration.sql)
        }

        await runDatabaseMigrations(
          sqliteMigrationAdapter(database),
          currentVersion,
        )

        const version = database.prepare('PRAGMA user_version').get() as {
          user_version: number
        }
        const integrity = database.prepare('PRAGMA integrity_check').get() as {
          integrity_check: string
        }
        const anchorTable = database
          .prepare(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'transcript_anchors'",
          )
          .get()
        expect(version.user_version).toBe(DATABASE_VERSION)
        expect(integrity.integrity_check).toBe('ok')
        expect(anchorTable).toBeTruthy()
      } finally {
        database.close()
      }
    },
  )

  it('rolls back the complete migration batch when a later migration fails', async () => {
    const database = new DatabaseSync(':memory:')
    try {
      database.exec(databaseMigrations[0]!.sql)
      database.exec(
        `INSERT INTO app_snapshot(singleton_id, schema_version, snapshot_json, updated_at)
         VALUES (1, 1, '{"sentinel":true}', '2026-08-13T08:00:00.000Z')`,
      )

      await expect(
        runDatabaseMigrations(sqliteMigrationAdapter(database), 1, [
          {
            version: 2,
            sql: 'ALTER TABLE app_snapshot ADD COLUMN migration_marker TEXT;',
          },
          {
            version: 3,
            sql: "UPDATE app_snapshot SET migration_marker = 'changed'; INVALID SQL;",
          },
        ]),
      ).rejects.toThrow()

      const version = database.prepare('PRAGMA user_version').get() as {
        user_version: number
      }
      const columns = database.prepare('PRAGMA table_info(app_snapshot)').all()
      const snapshot = database
        .prepare(
          'SELECT snapshot_json FROM app_snapshot WHERE singleton_id = 1',
        )
        .get() as { snapshot_json: string }
      expect(version.user_version).toBe(1)
      expect(columns).not.toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'migration_marker' }),
        ]),
      )
      expect(snapshot.snapshot_json).toBe('{"sentinel":true}')
    } finally {
      database.close()
    }
  })

  it('skips a current schema and rejects unordered custom migrations', async () => {
    const database = new DatabaseSync(':memory:')
    try {
      const adapter = sqliteMigrationAdapter(database)
      await expect(runDatabaseMigrations(adapter, 7)).resolves.toBe(true)
      await expect(
        runDatabaseMigrations(adapter, 2, [{ version: 2, sql: 'SELECT 1;' }]),
      ).rejects.toThrow(/strictly ordered/)
      await expect(
        runDatabaseMigrations(adapter, 2, [
          { version: Number.NaN, sql: 'SELECT 1;' },
        ]),
      ).rejects.toThrow(/strictly ordered/)
    } finally {
      database.close()
    }
  })

  it('rejects a migration batch whose integrity result is not ok', async () => {
    await expect(
      runDatabaseMigrations(
        {
          withExclusiveTransactionAsync: async operation =>
            operation({
              execAsync: async () => {},
              getFirstAsync: async <T>() =>
                ({ integrity_check: 'corrupt' }) as T,
            }),
        },
        1,
        [{ version: 2, sql: 'SELECT 1;' }],
      ),
    ).rejects.toThrow(/integrity check failed/)
  })
})
