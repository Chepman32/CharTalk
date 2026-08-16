import { describe, expect, it } from 'vitest'

import {
  diagnosticContentErrorEvent,
  diagnosticLatencyBucketForMs,
  diagnosticEventNames,
  diagnosticLatencyBuckets,
  diagnosticNetworkClasses,
} from './index'

describe('diagnostic event contract', () => {
  it('covers the product event vocabulary', () => {
    expect(diagnosticEventNames).toContain('timeline_switched')
    expect(diagnosticEventNames).toContain('chapter_download_failed')
    expect(diagnosticEventNames).toContain('recovery_performed')
  })

  it('uses bounded latency and network dimensions', () => {
    expect(diagnosticLatencyBuckets).toEqual([
      'under_50ms',
      '50_to_100ms',
      'over_100ms',
    ])
    expect(diagnosticNetworkClasses).toEqual([
      'offline',
      'cellular',
      'wifi',
      'unknown',
    ])
  })

  it('maps finite commit timings into the shared latency buckets', () => {
    expect(diagnosticLatencyBucketForMs(0)).toBe('under_50ms')
    expect(diagnosticLatencyBucketForMs(49.99)).toBe('under_50ms')
    expect(diagnosticLatencyBucketForMs(50)).toBe('50_to_100ms')
    expect(diagnosticLatencyBucketForMs(100)).toBe('over_100ms')
    expect(diagnosticLatencyBucketForMs(Number.NaN)).toBe('over_100ms')
  })

  it('creates privacy-safe content errors with bounded failure context', () => {
    expect(
      diagnosticContentErrorEvent({
        contentBuildId: 'build-1',
        occurredAt: '2026-08-14T16:00:00.000Z',
        nodeType: 'decision',
        latencyBucket: 'over_100ms',
        errorCode: 'CHOICE_COMMIT_FAILED',
      }),
    ).toEqual({
      eventName: 'content_error',
      contentBuildId: 'build-1',
      occurredAt: '2026-08-14T16:00:00.000Z',
      nodeType: 'decision',
      latencyBucket: 'over_100ms',
      errorCode: 'CHOICE_COMMIT_FAILED',
    })
  })
})
