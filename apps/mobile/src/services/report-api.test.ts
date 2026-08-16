import { describe, expect, it, vi } from 'vitest'

import type { ContentReport } from '@chartalk/app-core'

import { reportUploadPayload, uploadContentReport } from './report-api'

const report: ContentReport = {
  reportId: 'report-1',
  runId: 'run-1',
  nodeId: 'node-1',
  choiceId: 'choice-1',
  contentBuildId: 'build-1',
  appVersion: '1.0.0',
  platform: 'test',
  diagnosticCode: null,
  category: 'continuity',
  note: 'Нарушена последовательность.',
  status: 'queued',
  consentGrantedAt: '2026-08-13T08:00:00.000Z',
  createdAt: '2026-08-13T08:00:00.000Z',
}

describe('content report transport', () => {
  it('serializes only the explicit support allowlist', () => {
    const payload = reportUploadPayload(report)

    expect(payload).toMatchObject({
      reportId: 'report-1',
      category: 'continuity',
    })
    expect(Object.keys(payload).sort()).toEqual([
      'appVersion',
      'category',
      'choiceId',
      'consentGrantedAt',
      'contentBuildId',
      'diagnosticCode',
      'nodeId',
      'note',
      'platform',
      'reportId',
      'runId',
    ])
    expect(JSON.stringify(payload)).not.toMatch(/transcript|displayName|state/i)
  })

  it('never sends a report without an API URL or explicit consent', async () => {
    const fetchImpl =
      vi.fn<(input: string, init?: RequestInit) => Promise<Response>>()

    expect(
      await uploadContentReport(report, { fetchImpl, baseUrl: undefined }),
    ).toBe(false)
    expect(
      await uploadContentReport(
        { ...report, consentGrantedAt: '' },
        {
          fetchImpl,
          baseUrl: 'https://api.chartalk.app',
        },
      ),
    ).toBe(false)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('treats an accepted idempotent request as sent and network failure as queued', async () => {
    const accepted = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockResolvedValue(new Response(null, { status: 202 }))
    const offline = vi
      .fn<(input: string, init?: RequestInit) => Promise<Response>>()
      .mockRejectedValue(new TypeError('offline'))

    expect(
      await uploadContentReport(report, {
        fetchImpl: accepted,
        baseUrl: 'https://api.chartalk.app/',
      }),
    ).toBe(true)
    expect(accepted).toHaveBeenCalledWith(
      'https://api.chartalk.app/v1/reports',
      expect.objectContaining({ method: 'POST' }),
    )
    expect(
      await uploadContentReport(report, {
        fetchImpl: offline,
        baseUrl: 'https://api.chartalk.app',
      }),
    ).toBe(false)
  })
})
