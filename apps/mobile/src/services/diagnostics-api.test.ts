import { describe, expect, it, vi } from 'vitest'

import { diagnosticPayload, sendDiagnostic } from './diagnostics-api'

const event = {
  eventName: 'choice_committed' as const,
  contentBuildId: 'build-1',
  occurredAt: '2026-08-13T08:00:00.000Z',
  nodeType: 'decision' as const,
}

describe('diagnostics transport', () => {
  it('uses a closed payload without identity or narrative text', () => {
    const payload = diagnosticPayload(event)

    expect(Object.keys(payload).sort()).toEqual([
      'contentBuildId',
      'eventId',
      'eventName',
      'nodeType',
      'occurredAt',
    ])
    expect(payload.eventId).toMatch(/^([0-9a-f-]{36}|evt-)/i)
    expect(JSON.stringify(payload)).not.toMatch(
      /displayName|messageText|choiceId|runId|transcript/i,
    )
  })

  it('keeps optional diagnostics bounded to the shared allowlist', () => {
    const payload = diagnosticPayload({
      ...event,
      eventId: 'event-12345678',
      latencyBucket: 'under_50ms',
      optionPosition: 3,
      networkClass: 'offline',
      errorCode: 'DOWNLOAD_FAILED',
    })

    expect(payload).toMatchObject({
      eventId: 'event-12345678',
      latencyBucket: 'under_50ms',
      optionPosition: 3,
      networkClass: 'offline',
      errorCode: 'DOWNLOAD_FAILED',
    })
    expect(Object.keys(payload).sort()).toEqual([
      'contentBuildId',
      'errorCode',
      'eventId',
      'eventName',
      'latencyBucket',
      'networkClass',
      'nodeType',
      'occurredAt',
      'optionPosition',
    ])
  })

  it('does nothing unless consent and an endpoint are both present', async () => {
    const fetchImpl =
      vi.fn<(input: string, init?: RequestInit) => Promise<Response>>()

    expect(
      await sendDiagnostic(event, false, {
        baseUrl: 'https://api.razvilka.app',
        fetchImpl,
      }),
    ).toBe(false)
    expect(
      await sendDiagnostic(event, true, { baseUrl: undefined, fetchImpl }),
    ).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('sends the allowlisted event and safely absorbs rejection responses', async () => {
    const accepted = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(new Response(null, { status: 202 }))
    const rejected = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(new Response(null, { status: 422 }))
    const offline = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValue(new TypeError('offline'))

    expect(
      await sendDiagnostic({ ...event, durationBucket: 'under_1s' }, true, {
        baseUrl: 'https://api.razvilka.app/',
        fetchImpl: accepted,
      }),
    ).toBe(true)
    expect(accepted).toHaveBeenCalledWith(
      'https://api.razvilka.app/v1/diagnostics/events',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(
      await sendDiagnostic(event, true, {
        baseUrl: 'https://api.razvilka.app',
        fetchImpl: rejected,
      }),
    ).toBe(false)
    expect(
      await sendDiagnostic(event, true, {
        baseUrl: 'https://api.razvilka.app',
        fetchImpl: offline,
      }),
    ).toBe(false)
  })
})
