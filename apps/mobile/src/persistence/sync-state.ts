export interface SyncState {
  enabled: boolean
  cursor: string | null
  lastSuccessAt: string | null
  lastErrorCode: string | null
}

export const emptySyncState = (): SyncState => ({
  enabled: false,
  cursor: null,
  lastSuccessAt: null,
  lastErrorCode: null,
})

export interface SyncStateStore {
  readSyncState(): Promise<SyncState>
  writeSyncState(patch: Partial<SyncState>): Promise<SyncState>
  clearSyncState(): Promise<void>
}
