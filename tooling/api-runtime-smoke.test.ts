import { describe, expect, it } from 'vitest'

import {
  assertRuntimeResponse,
  catalogIdentity,
  type RuntimeResponseLike,
} from './api-runtime-smoke'

function response(
  status: number,
  headers: Record<string, string> = {},
): RuntimeResponseLike {
  return {
    status,
    headers: new Headers(headers),
  }
}

describe('API runtime smoke helpers', () => {
  it('accepts the expected status and security headers', () => {
    expect(() =>
      assertRuntimeResponse(
        response(200, { 'x-content-type-options': 'nosniff' }),
        {
          status: 200,
          requiredHeaders: { 'x-content-type-options': 'nosniff' },
        },
      ),
    ).not.toThrow()
  })

  it('reports status and header mismatches with actionable context', () => {
    expect(() =>
      assertRuntimeResponse(
        response(503, { 'x-content-type-options': 'nosniff' }),
        {
          status: 200,
          requiredHeaders: { 'strict-transport-security': 'max-age=31536000' },
        },
      ),
    ).toThrow(/expected status 200, received 503/)

    expect(() =>
      assertRuntimeResponse(response(200), {
        status: 200,
        requiredHeaders: { 'x-content-type-options': 'nosniff' },
      }),
    ).toThrow(/missing header x-content-type-options/)
  })

  it('extracts the immutable catalog identity', () => {
    expect(
      catalogIdentity({
        data: {
          packId: 'pack.demo',
          buildId: 'build.2026-08-14',
          checksum: `sha256:${'a'.repeat(64)}`,
        },
      }),
    ).toEqual({
      packId: 'pack.demo',
      buildId: 'build.2026-08-14',
      checksum: `sha256:${'a'.repeat(64)}`,
    })
  })

  it('rejects malformed catalog payloads instead of constructing unsafe URLs', () => {
    expect(() => catalogIdentity({ data: { packId: '../escape' } })).toThrow(
      /catalog identity is invalid/,
    )
    expect(() => catalogIdentity(null)).toThrow(/catalog identity is invalid/)
  })
})
