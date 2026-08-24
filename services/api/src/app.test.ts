import { generateKeyPairSync } from 'node:crypto'
import { describe, expect, it, vi } from 'vitest'

import { sampleContentPackage } from '@razvilka/test-fixtures'
import { initialNarrativeState } from '@razvilka/content-schema'
import { applyChoice } from '@razvilka/dialogue-engine'

import { MemoryApiStore, createApi } from './app'
import { MemorySyncStore } from './sync'

const { privateKey } = generateKeyPairSync('ed25519')

const setup = () => {
  const store = new MemoryApiStore(sampleContentPackage)
  const app = createApi({
    store,
    adminToken: 'test-admin-token-with-entropy',
    signingPrivateKey: privateKey,
    signingKeyId: 'test-key-2026',
    syncEnabled: false,
    allowedOrigins: ['https://studio.razvilka.app'],
  })
  return { app, store }
}

const syncBatch = (choiceIndex = 0) => {
  const story = sampleContentPackage.stories.find(
    item => item.storyId === 'story.ira.after-deadline',
  )!
  const episode = sampleContentPackage.episodes.find(
    item => item.episodeId === story.episodeIds[0],
  )!
  const nodes = new Map(
    sampleContentPackage.nodes.map(node => [node.nodeId, node]),
  )
  const entry = nodes.get(episode.entryNodeId)
  if (!entry || entry.type !== 'decision')
    throw new Error('fixture decision missing')
  const choices = entry.choiceSlots.flatMap(slot => slot.candidates)
  const choice = choices[choiceIndex]
  if (!choice) throw new Error('fixture choice missing')
  const result = applyChoice({
    operationId: `sync.operation.${choiceIndex}`,
    runId: 'sync.run.1',
    expectedSequence: 0,
    expectedNodeId: entry.nodeId,
    contentBuildId: sampleContentPackage.manifest.buildId,
    choiceId: choice.choiceId,
    state: initialNarrativeState(),
    node: entry,
    nodes,
    committedAt: '2026-08-14T00:00:00.000Z',
  })
  const activeNode = nodes.get(result.nextNodeId)
  return {
    deviceId: 'device.1',
    run: {
      runId: 'sync.run.1',
      storyId: story.storyId,
      episodeId: episode.episodeId,
      characterId: story.characterId,
      packId: sampleContentPackage.manifest.packId,
      contentBuildId: sampleContentPackage.manifest.buildId,
      sequence: result.newSequence,
      activeNodeId: result.nextNodeId,
      stateHash: result.resultingStateHash,
      status:
        activeNode?.type === 'ending'
          ? ('completed' as const)
          : ('active' as const),
    },
    events: [result.event],
  }
}

describe('Развилка API', () => {
  it('serves a versioned health envelope with security headers', async () => {
    const { app } = setup()
    const response = await app.request('/v1/health')

    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      data: { status: 'ok', version: '1.0.0' },
    })
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('content-security-policy')).toContain(
      "default-src 'none'",
    )
    expect(response.headers.get('x-request-id')).toBeTruthy()
  })

  it('separates liveness from content and storage readiness', async () => {
    const { app, store } = setup()
    const ready = await app.request('/ready')

    expect(ready.status).toBe(200)
    expect(await ready.json()).toMatchObject({
      data: {
        status: 'ready',
        contentBuildId: sampleContentPackage.manifest.buildId,
      },
    })

    vi.spyOn(store, 'getCurrentPackage').mockRejectedValueOnce(
      new Error('storage unavailable'),
    )
    const unavailable = await app.request('/readyz')
    expect(unavailable.status).toBe(503)
    expect(await unavailable.json()).toMatchObject({
      type: 'https://razvilka.app/problems/not-ready',
      status: 503,
    })
    expect((await app.request('/healthz')).status).toBe(200)
  })

  it('rate-limits abusive clients with a retryable Problem Details response', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      signingPrivateKey: privateKey,
      syncEnabled: false,
      allowedOrigins: [],
      rateLimits: { publicMax: 1, adminMax: 1, windowMs: 60_000 },
      epochNow: () => 1_000,
    })

    expect((await app.request('/v1/health')).status).toBe(200)
    const blocked = await app.request('/v1/health')

    expect(blocked.status).toBe(429)
    expect(blocked.headers.get('retry-after')).toBe('60')
    expect(await blocked.json()).toMatchObject({
      type: 'https://razvilka.app/problems/rate-limit-exceeded',
      status: 429,
    })
  })

  it('returns a cacheable catalog without narrative node payloads', async () => {
    const { app } = setup()
    const response = await app.request('/v1/catalog?locale=ru-RU')
    const body = (await response.json()) as {
      data: { stories: unknown[]; nodes?: unknown[] }
    }

    expect(response.status).toBe(200)
    expect(response.headers.get('etag')).toBeTruthy()
    expect(body.data).toMatchObject({
      packId: sampleContentPackage.manifest.packId,
      buildId: sampleContentPackage.manifest.buildId,
      contentVersion: sampleContentPackage.manifest.contentVersion,
      checksum: sampleContentPackage.manifest.checksum,
    })
    expect(body.data.stories).toHaveLength(3)
    expect(body.data).not.toHaveProperty('nodes')
    expect(JSON.stringify(body.data)).not.toContain('safeRoute')

    const cached = await app.request('/v1/catalog', {
      headers: { 'if-none-match': response.headers.get('etag') ?? '' },
    })
    expect(cached.status).toBe(304)

    const unsupported = await app.request('/v1/catalog?locale=en-US')
    expect(unsupported.status).toBe(404)
  })

  it('serves character and manifest resources and types missing IDs', async () => {
    const { app } = setup()
    const character = await app.request('/v1/characters/char.ira')
    const missingCharacter = await app.request('/v1/characters/missing')
    const manifest = await app.request(
      `/v1/content/${sampleContentPackage.manifest.packId}/manifest`,
    )
    const missingManifest = await app.request('/v1/content/missing/manifest')
    const contractCharacter = await app.request(
      '/v1/catalog/characters/char.ira',
    )
    const contractManifest = await app.request(
      `/v1/content/manifests/${sampleContentPackage.manifest.packId}`,
    )
    const artifact = await app.request(
      `/v1/content/packages/${sampleContentPackage.manifest.packId}`,
    )
    const exactArtifact = await app.request(
      `/v1/content/packages/${sampleContentPackage.manifest.packId}/builds/${sampleContentPackage.manifest.buildId}`,
    )

    expect(character.status).toBe(200)
    expect((await character.json()) as object).toMatchObject({
      data: { character: { characterId: 'char.ira' } },
    })
    expect(missingCharacter.status).toBe(404)
    expect(manifest.status).toBe(200)
    expect(missingManifest.status).toBe(404)
    expect(contractCharacter.status).toBe(200)
    expect(contractManifest.status).toBe(200)
    expect(artifact.status).toBe(200)
    expect(exactArtifact.status).toBe(200)
    expect(artifact.headers.get('cache-control')).toContain('immutable')
    expect((await artifact.json()) as object).toMatchObject({
      manifest: { packId: sampleContentPackage.manifest.packId },
    })
  })

  it('keeps the pack/build tuple stable in the in-memory package registry', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const otherPack = structuredClone(sampleContentPackage)
    otherPack.manifest.packId = 'pack.other'

    await store.publish(otherPack)

    await expect(
      store.getPackage(
        sampleContentPackage.manifest.packId,
        sampleContentPackage.manifest.buildId,
      ),
    ).resolves.toMatchObject({
      manifest: { packId: sampleContentPackage.manifest.packId },
    })
    await expect(
      store.getPackage('pack.other', sampleContentPackage.manifest.buildId),
    ).resolves.toMatchObject({ manifest: { packId: 'pack.other' } })
  })

  it('streams only assets declared by an exact immutable build', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      syncEnabled: false,
      allowedOrigins: [],
      loadContentAsset: async () => ({
        body: new Uint8Array([1, 2, 3]).buffer,
        byteCount: 3,
        contentType: 'image/png',
      }),
    })
    const base = `/v1/content/packages/${sampleContentPackage.manifest.packId}/builds/${sampleContentPackage.manifest.buildId}/assets`
    const response = await app.request(`${base}/portrait.ira`)
    const missing = await app.request(`${base}/missing`)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('image/png')
    expect(response.headers.get('cache-control')).toContain('immutable')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([1, 2, 3]),
    )
    expect(missing.status).toBe(404)
  })

  it('answers allowed CORS preflight and preserves a valid request ID', async () => {
    const { app } = setup()
    const response = await app.request('/v1/reports', {
      method: 'OPTIONS',
      headers: {
        origin: 'https://studio.razvilka.app',
        'x-request-id': 'request-123',
      },
    })

    expect(response.status).toBe(204)
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://studio.razvilka.app',
    )
    expect(response.headers.get('vary')).toBe('Origin')
  })

  it('rejects malformed and oversized JSON before application work', async () => {
    const { app } = setup()
    const malformed = await app.request('/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: '{',
    })
    const oversized = await app.request('/v1/reports', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'content-length': String(2 * 1024 * 1024 + 1),
      },
      body: '{}',
    })
    const chunkedOversized = await app.request('/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ note: 'я'.repeat(1_100_000) }),
    })

    expect(malformed.status).toBe(400)
    expect(oversized.status).toBe(413)
    expect(chunkedOversized.status).toBe(413)
  })

  it('queues a minimized report and rejects unknown transcript data', async () => {
    const { app, store } = setup()
    const invalid = await app.request('/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        category: 'typo',
        nodeId: 'node.1',
        transcript: ['private'],
      }),
    })
    expect(invalid.status).toBe(422)

    const valid = await app.request('/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        reportId: 'report-1',
        runId: 'run-1',
        nodeId: 'node.1',
        choiceId: 'choice.1',
        contentBuildId: 'build-1',
        appVersion: '1.0.0',
        platform: 'ios',
        diagnosticCode: null,
        category: 'typo',
        note: 'Лишняя запятая.',
        consentGrantedAt: '2026-08-13T08:00:00.000Z',
      }),
    })
    expect(valid.status).toBe(202)
    expect(store.reports).toHaveLength(1)
    expect(JSON.stringify(store.reports[0])).not.toContain('transcript')

    const retry = await app.request('/v1/reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        reportId: 'report-1',
        runId: 'run-1',
        nodeId: 'node.1',
        choiceId: 'choice.1',
        contentBuildId: 'build-1',
        appVersion: '1.0.0',
        platform: 'ios',
        diagnosticCode: null,
        category: 'typo',
        note: 'Лишняя запятая.',
        consentGrantedAt: '2026-08-13T08:00:00.000Z',
      }),
    })
    expect(retry.status).toBe(202)
    expect(store.reports).toHaveLength(1)

    const contractAlias = await app.request('/v1/content-reports', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        reportId: 'report-alias',
        runId: null,
        nodeId: null,
        choiceId: null,
        contentBuildId: 'build-1',
        appVersion: '1.0.0',
        platform: 'android',
        diagnosticCode: null,
        category: 'technical',
        note: null,
        consentGrantedAt: '2026-08-13T08:00:00.000Z',
      }),
    })
    expect(contractAlias.status).toBe(202)
  })

  it('accepts only allowlisted diagnostic fields', async () => {
    const { app, store } = setup()
    const response = await app.request('/v1/diagnostics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventName: 'choice_committed',
        contentBuildId: 'build-1',
        occurredAt: '2026-08-13T08:00:00.000Z',
        transcriptText: 'must never be accepted',
      }),
    })

    expect(response.status).toBe(422)
    expect(store.diagnostics).toHaveLength(0)

    const accepted = await app.request('/v1/diagnostics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventId: 'event-12345678',
        eventName: 'choice_committed',
        contentBuildId: 'build-1',
        occurredAt: '2026-08-13T08:00:00.000Z',
        nodeType: 'decision',
        durationBucket: 'under_1s',
        latencyBucket: 'under_50ms',
        optionPosition: 2,
        networkClass: 'wifi',
        errorCode: 'COMMIT_RETRY',
      }),
    })
    expect(accepted.status).toBe(202)
    expect(store.diagnostics).toHaveLength(1)

    const retry = await app.request('/v1/diagnostics/events', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        eventId: 'event-12345678',
        eventName: 'choice_committed',
        contentBuildId: 'build-1',
        occurredAt: '2026-08-13T08:00:00.000Z',
        nodeType: 'decision',
        durationBucket: 'under_1s',
        latencyBucket: 'under_50ms',
        optionPosition: 2,
        networkClass: 'wifi',
        errorCode: 'COMMIT_RETRY',
      }),
    })
    expect(retry.status).toBe(202)
    expect(store.diagnostics).toHaveLength(1)
  })

  it('keeps optional sync dark when the capability is disabled', async () => {
    const { app } = setup()
    const response = await app.request('/v1/sync/push', { method: 'POST' })
    expect(response.status).toBe(404)
    expect(response.headers.get('content-type')).toContain(
      'application/problem+json',
    )
  })

  it('returns a safe unavailable response when sync is enabled without storage', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      signingPrivateKey: privateKey,
      syncEnabled: true,
      allowedOrigins: [],
    })

    expect(
      (await app.request('/v1/sync/push', { method: 'POST' })).status,
    ).toBe(500)
  })

  it('pushes, retries, pulls, and preserves divergent sync branches', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const syncStore = new MemorySyncStore()
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      syncEnabled: true,
      syncStore,
      resolveSyncPrincipal: () => ({
        accountId: 'account.1',
        deviceId: 'device.1',
      }),
      allowedOrigins: [],
    })
    const firstBatch = syncBatch(0)
    const first = await app.request('/v1/runs/sync.run.1/events:push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(firstBatch),
    })
    expect(first.status).toBe(200)
    expect(await first.json()).toMatchObject({
      data: {
        acceptedEventIds: [firstBatch.events[0]!.eventId],
        duplicateEventIds: [],
        conflict: null,
      },
    })

    const retry = await app.request('/v1/runs/sync.run.1/events:push', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(firstBatch),
    })
    expect(retry.status).toBe(200)
    expect(await retry.json()).toMatchObject({
      data: {
        acceptedEventIds: [],
        duplicateEventIds: [firstBatch.events[0]!.eventId],
      },
    })

    const pulled = await app.request('/v1/runs/sync.run.1/events?after=0')
    expect(pulled.status).toBe(200)
    expect(await pulled.json()).toMatchObject({
      data: { events: [firstBatch.events[0]], hasMore: false },
    })

    const divergent = syncBatch(1)
    const conflictResponse = await app.request(
      '/v1/runs/sync.run.1/events:push',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(divergent),
      },
    )
    expect(conflictResponse.status).toBe(409)
    const conflictBody = (await conflictResponse.json()) as {
      data: { conflict: { code: string; forkRunId: string | null } }
    }
    expect(conflictBody.data.conflict).toMatchObject({
      code: 'RUN_SEQUENCE_CONFLICT',
    })
    expect(conflictBody.data.conflict.forkRunId).toMatch(/^fork:/)
  })

  it('fails closed for an unauthenticated or wrong-device sync batch', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const syncStore = new MemorySyncStore()
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      syncEnabled: true,
      syncStore,
      resolveSyncPrincipal: c =>
        c.req.header('authorization') === 'Bearer session'
          ? { accountId: 'account.1', deviceId: 'device.1' }
          : null,
      allowedOrigins: [],
    })
    const payload = syncBatch()
    const missingSession = await app.request(
      '/v1/runs/sync.run.1/events:push',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      },
    )
    expect(missingSession.status).toBe(401)

    const wrongDevice = await app.request('/v1/runs/sync.run.1/events:push', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer session',
      },
      body: JSON.stringify({ ...payload, deviceId: 'device.2' }),
    })
    expect(wrongDevice.status).toBe(403)
  })

  it('protects validation and publishing with an admin bearer token', async () => {
    const { app } = setup()
    const unauthorized = await app.request('/v1/admin/content/validate', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(sampleContentPackage),
    })
    expect(unauthorized.status).toBe(401)

    const authorized = await app.request('/v1/admin/content/validate', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sampleContentPackage),
    })
    expect(authorized.status).toBe(200)
    const body = (await authorized.json()) as {
      data: { counts: { choiceCandidateCount: number } }
    }
    expect(body.data.counts.choiceCandidateCount).toBe(2_364)
  })

  it('enforces CMS role tokens for validation versus publishing', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const app = createApi({
      store,
      adminToken: 'legacy-admin-token-with-entropy',
      roleTokens: {
        writer: 'writer-token-with-entropy-123456',
        publisher: 'publisher-token-with-entropy-123456',
      },
      signingPrivateKey: privateKey,
      signingKeyId: 'test-key-2026',
      syncEnabled: false,
      allowedOrigins: [],
    })
    const writerValidation = await app.request('/v1/admin/content/validate', {
      method: 'POST',
      headers: {
        authorization: 'Bearer writer-token-with-entropy-123456',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sampleContentPackage),
    })
    const writerPublish = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer writer-token-with-entropy-123456',
        'content-type': 'application/json',
        'x-razvilka-confirm-build-id': sampleContentPackage.manifest.buildId,
      },
      body: JSON.stringify(sampleContentPackage),
    })

    expect(writerValidation.status).toBe(200)
    expect(writerPublish.status).toBe(403)
  })

  it('fails closed when an empty admin or role token is configured', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const app = createApi({
      store,
      adminToken: '',
      roleTokens: { writer: '' },
      syncEnabled: false,
      allowedOrigins: [],
    })
    const response = await app.request('/v1/admin/content/validate', {
      method: 'POST',
      headers: {
        authorization: 'Bearer ',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sampleContentPackage),
    })

    expect(response.status).toBe(401)
  })

  it('blocks fixture content from the production publish endpoint', async () => {
    const { app, store } = setup()
    const response = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
        'x-razvilka-confirm-build-id': sampleContentPackage.manifest.buildId,
      },
      body: JSON.stringify(sampleContentPackage),
    })
    expect(response.status).toBe(422)
    expect(store.published).toHaveLength(0)
  })

  it('requires an exact typed build confirmation before publishing', async () => {
    const { app, store } = setup()
    const missing = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
      },
      body: JSON.stringify(sampleContentPackage),
    })
    const mismatch = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
        'x-razvilka-confirm-build-id': 'latest',
      },
      body: JSON.stringify(sampleContentPackage),
    })

    expect(missing.status).toBe(409)
    expect(mismatch.status).toBe(409)
    expect(store.published).toHaveLength(0)
  })

  it('rejects a candidate bound to a different signing key', async () => {
    const { app, store } = setup()
    const candidate = {
      ...sampleContentPackage,
      manifest: {
        ...sampleContentPackage.manifest,
        signingKeyId: 'different-production-key',
      },
    }
    const response = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
        'x-razvilka-confirm-build-id': candidate.manifest.buildId,
      },
      body: JSON.stringify(candidate),
    })

    expect(response.status).toBe(409)
    expect(store.published).toHaveLength(0)
  })

  it('keeps content signing unavailable when the runtime has no publish key', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      syncEnabled: false,
      allowedOrigins: [],
    })
    const response = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
        'x-razvilka-confirm-build-id': 'malformed-build',
      },
      body: JSON.stringify(sampleContentPackage),
    })

    expect(response.status).toBe(404)
    expect(store.published).toHaveLength(0)
  })

  it('rejects malformed publish payloads and unknown routes', async () => {
    const { app } = setup()
    const malformed = await app.request('/v1/admin/content/publish', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-admin-token-with-entropy',
        'content-type': 'application/json',
      },
      body: JSON.stringify({ manifest: {} }),
    })

    expect(malformed.status).toBe(422)
    expect((await app.request('/v1/not-a-route')).status).toBe(404)
  })

  it('converts store failures into a redacted internal error', async () => {
    const store = new MemoryApiStore(sampleContentPackage)
    store.getCurrentPackage = () =>
      Promise.reject(new Error('private database detail'))
    const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {})
    const app = createApi({
      store,
      adminToken: 'test-admin-token-with-entropy',
      signingPrivateKey: privateKey,
      syncEnabled: false,
      allowedOrigins: [],
    })

    const response = await app.request('/v1/catalog')
    const body = (await response.json()) as { detail: string }

    expect(response.status).toBe(500)
    expect(body.detail).not.toContain('database')
    expect(errorLog).toHaveBeenCalledOnce()
  })
})
