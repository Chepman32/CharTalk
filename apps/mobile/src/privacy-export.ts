import type { AppSnapshot } from '@chartalk/app-core'

export interface LocalDataExport {
  format: 'chartalk.local-data'
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
  format: 'chartalk.local-data',
  version: 1,
  exportedAt,
  snapshot: cloneJson(snapshot),
})

export const serializeLocalDataExport = (
  snapshot: AppSnapshot,
  exportedAt?: string,
): string =>
  JSON.stringify(createLocalDataExport(snapshot, exportedAt), null, 2)
