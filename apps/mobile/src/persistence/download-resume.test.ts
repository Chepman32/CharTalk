import { describe, expect, it } from 'vitest'

import {
  parseDownloadCheckpoint,
  serializeDownloadCheckpoint,
} from './download-resume'

const checkpoint = {
  assetId: 'attachment.one',
  url: 'https://content.example/attachment.one',
  expectedBytes: 1024,
  task: {
    url: 'https://content.example/attachment.one',
    fileUri: 'file:///staging/attachment.one.webp',
    isDirectory: false,
    resumeData: 'opaque-resume-data',
  },
} as const

describe('download checkpoints', () => {
  it('serializes and restores a checkpoint for the same asset and destination', () => {
    const encoded = serializeDownloadCheckpoint(checkpoint)

    expect(
      parseDownloadCheckpoint(encoded, {
        assetId: checkpoint.assetId,
        url: checkpoint.url,
        expectedBytes: checkpoint.expectedBytes,
        fileUri: checkpoint.task.fileUri,
      }),
    ).toEqual(checkpoint)
  })

  it('rejects malformed, stale, mismatched, and unsafe checkpoint data', () => {
    const expected = {
      assetId: checkpoint.assetId,
      url: checkpoint.url,
      expectedBytes: checkpoint.expectedBytes,
      fileUri: checkpoint.task.fileUri,
    }

    expect(parseDownloadCheckpoint('{', expected)).toBeNull()
    expect(
      parseDownloadCheckpoint(
        serializeDownloadCheckpoint({ ...checkpoint, assetId: 'other' }),
        expected,
      ),
    ).toBeNull()
    expect(
      parseDownloadCheckpoint(
        serializeDownloadCheckpoint({ ...checkpoint, expectedBytes: 0 }),
        expected,
      ),
    ).toBeNull()
    expect(
      parseDownloadCheckpoint(
        serializeDownloadCheckpoint({
          ...checkpoint,
          task: { ...checkpoint.task, fileUri: 'file:///other' },
        }),
        expected,
      ),
    ).toBeNull()
    expect(
      parseDownloadCheckpoint(
        JSON.stringify({
          ...checkpoint,
          task: { ...checkpoint.task, url: 'https://other.example/file' },
        }),
        expected,
      ),
    ).toBeNull()
  })
})
