import type { AppSnapshot } from '@razvilka/app-core'

export interface LocalDataExport {
  format: 'razvilka.local-data'
  version: 1
  exportedAt: string
  snapshot: AppSnapshot
}

const cloneJson = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

/** Creates a portable copy of reader-owned data without including content packages or assets. */
export const createLocalDataExport = (
  snapshot: AppSnapshot,
  exportedAt = new Date().toISOString(),
): LocalDataExport => ({
  format: 'razvilka.local-data',
  version: 1,
  exportedAt,
  snapshot: cloneJson(snapshot),
})

export const serializeLocalDataExport = (
  snapshot: AppSnapshot,
  exportedAt?: string,
): string =>
  JSON.stringify(createLocalDataExport(snapshot, exportedAt), null, 2)
