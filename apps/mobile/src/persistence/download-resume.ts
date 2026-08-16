export interface DownloadPauseStateRecord {
  url: string
  fileUri: string
  isDirectory: boolean
  headers?: Record<string, string>
  resumeData?: string
}

export interface DownloadCheckpoint {
  assetId: string
  url: string
  expectedBytes: number
  task: DownloadPauseStateRecord
}

export interface DownloadCheckpointExpectation {
  assetId: string
  url: string
  expectedBytes: number
  fileUri: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every(item => typeof item === 'string')

const isPauseState = (value: unknown): value is DownloadPauseStateRecord => {
  if (!isRecord(value)) return false
  if (
    typeof value.url !== 'string' ||
    typeof value.fileUri !== 'string' ||
    value.isDirectory !== false
  ) {
    return false
  }
  if (value.headers !== undefined && !isStringRecord(value.headers)) {
    return false
  }
  return typeof value.resumeData === 'string' && value.resumeData.length > 0
}

export function serializeDownloadCheckpoint(
  checkpoint: DownloadCheckpoint,
): string {
  return JSON.stringify(checkpoint)
}

export function parseDownloadCheckpoint(
  serialized: string,
  expected: DownloadCheckpointExpectation,
): DownloadCheckpoint | null {
  if (
    !Number.isSafeInteger(expected.expectedBytes) ||
    expected.expectedBytes <= 0 ||
    !expected.assetId.trim() ||
    !expected.url.trim() ||
    !expected.fileUri.trim()
  ) {
    return null
  }

  let value: unknown
  try {
    value = JSON.parse(serialized) as unknown
  } catch {
    return null
  }
  if (!isRecord(value) || !isPauseState(value.task)) return null
  const assetId = value.assetId
  const url = value.url
  const expectedBytes = value.expectedBytes
  if (
    typeof assetId !== 'string' ||
    typeof url !== 'string' ||
    typeof expectedBytes !== 'number' ||
    !Number.isSafeInteger(expectedBytes) ||
    expectedBytes <= 0
  ) {
    return null
  }
  if (
    assetId !== expected.assetId ||
    url !== expected.url ||
    expectedBytes !== expected.expectedBytes ||
    value.task.url !== expected.url ||
    value.task.fileUri !== expected.fileUri
  ) {
    return null
  }
  return {
    assetId,
    url,
    expectedBytes,
    task: value.task,
  }
}
