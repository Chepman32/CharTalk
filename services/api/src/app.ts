import { timingSafeEqual, type KeyLike } from 'node:crypto'

import {
  compileContentPackage,
  evaluateProductionRelease,
} from '@razvilka/content-compiler'
import {
  diagnosticDurationBuckets,
  diagnosticEventNames,
  diagnosticLatencyBuckets,
  diagnosticNetworkClasses,
  diagnosticNodeTypes,
} from '@razvilka/analytics-schema'
import type { DiagnosticEvent as DiagnosticEventContract } from '@razvilka/analytics-schema'
import { signContentPackage } from '@razvilka/content-compiler/signing'
import {
  contentPackageSchema,
  type ContentAsset,
  type ContentPackage,
} from '@razvilka/content-schema'
import {
  syncPullResponseSchema,
  syncPushRequestSchema,
  syncPushResponseSchema,
} from '@razvilka/sync-protocol'
import { Hono, type Context } from 'hono'
import { z } from 'zod'

import { type SyncPrincipal, type SyncStore } from './sync'

const API_VERSION = '1.0.0'
const MAX_PUBLIC_BODY_BYTES = 64 * 1024
const MAX_CONTENT_PACKAGE_BYTES = 64 * 1024 * 1024
const MAX_SYNC_BODY_BYTES = 512 * 1024
const MAX_RATE_BUCKETS = 50_000

export interface ApiReport {
  reportId: string
  runId: string | null
  nodeId: string | null
  choiceId: string | null
  contentBuildId: string
  appVersion: string
  platform: string
  diagnosticCode: string | null
  category:
    | 'typo'
    | 'continuity'
    | 'intent'
    | 'warning'
    | 'safety'
    | 'technical'
    | 'other'
  note: string | null
  consentGrantedAt: string
  receivedAt: string
}

export type DiagnosticEvent = DiagnosticEventContract

export interface ApiStore {
  getCurrentPackage(): Promise<ContentPackage>
  getPackage(packId: string, buildId: string): Promise<ContentPackage | null>
  saveReport(report: ApiReport): Promise<void>
  saveDiagnostic(event: DiagnosticEvent): Promise<void>
  publish(content: ContentPackage): Promise<void>
}

export class MemoryApiStore implements ApiStore {
  readonly reports: ApiReport[] = []
  readonly diagnostics: DiagnosticEvent[] = []
  readonly published: ContentPackage[] = []
  private readonly packages = new Map<string, ContentPackage>()

  private packageKey(packId: string, buildId: string): string {
    return JSON.stringify([packId, buildId])
  }

  constructor(private current: ContentPackage) {
    this.packages.set(
      this.packageKey(current.manifest.packId, current.manifest.buildId),
      structuredClone(current),
    )
  }

  async getCurrentPackage(): Promise<ContentPackage> {
    return structuredClone(this.current)
  }

  async getPackage(
    packId: string,
    buildId: string,
  ): Promise<ContentPackage | null> {
    const content = this.packages.get(this.packageKey(packId, buildId))
    return content ? structuredClone(content) : null
  }

  async saveReport(report: ApiReport): Promise<void> {
    if (this.reports.some(item => item.reportId === report.reportId)) return
    this.reports.push(structuredClone(report))
  }

  async saveDiagnostic(event: DiagnosticEvent): Promise<void> {
    if (
      event.eventId &&
      this.diagnostics.some(item => item.eventId === event.eventId)
    ) {
      return
    }
    this.diagnostics.push(structuredClone(event))
  }

  async publish(content: ContentPackage): Promise<void> {
    const existing = this.packages.get(
      this.packageKey(content.manifest.packId, content.manifest.buildId),
    )
    if (existing && JSON.stringify(existing) !== JSON.stringify(content)) {
      throw new Error(`Content build ${content.manifest.buildId} is immutable`)
    }
    this.current = structuredClone(content)
    this.packages.set(
      this.packageKey(content.manifest.packId, content.manifest.buildId),
      structuredClone(content),
    )
    this.published.push(structuredClone(content))
  }
}

export interface LoadedContentAsset {
  body: ReadableStream | ArrayBuffer
  byteCount: number
  contentType: string
}

export type CmsRole = 'writer' | 'editor' | 'qa' | 'publisher'

export interface ApiOptions {
  store: ApiStore
  adminToken: string
  roleTokens?: Partial<Record<CmsRole, string>>
  signingPrivateKey?: KeyLike
  signingKeyId?: string
  syncEnabled: boolean
  syncStore?: SyncStore
  resolveSyncPrincipal?: (
    c: Context<{ Variables: Variables }, string>,
  ) => Promise<SyncPrincipal | null> | SyncPrincipal | null
  allowedOrigins: string[]
  now?: () => string
  createId?: () => string
  epochNow?: () => number
  rateLimits?: {
    publicMax: number
    adminMax: number
    windowMs: number
  }
  loadContentAsset?: (
    content: ContentPackage,
    asset: ContentAsset,
  ) => Promise<LoadedContentAsset | null>
  validateContentAssets?: (content: ContentPackage) => Promise<void>
}

interface Variables {
  requestId: string
  cmsRole?: CmsRole
}

const reportSchema = z
  .object({
    reportId: z.string().min(8).max(100),
    runId: z.string().min(1).max(100).nullable().optional(),
    nodeId: z.string().min(1).max(200).nullable().optional(),
    choiceId: z.string().min(1).max(200).nullable().optional(),
    contentBuildId: z.string().min(1).max(100),
    appVersion: z.string().min(1).max(40),
    platform: z.enum(['ios', 'android', 'web', 'test', 'unknown']),
    diagnosticCode: z.string().min(1).max(100).nullable().optional(),
    category: z.enum([
      'typo',
      'continuity',
      'intent',
      'warning',
      'safety',
      'technical',
      'other',
    ]),
    note: z.string().trim().max(500).nullable().optional(),
    consentGrantedAt: z.iso.datetime(),
  })
  .strict()

const diagnosticSchema = z
  .object({
    eventId: z.string().min(8).max(100).optional(),
    eventName: z.enum(diagnosticEventNames),
    contentBuildId: z.string().min(1).max(100),
    occurredAt: z.iso.datetime(),
    nodeType: z.enum(diagnosticNodeTypes).optional(),
    durationBucket: z.enum(diagnosticDurationBuckets).optional(),
    latencyBucket: z.enum(diagnosticLatencyBuckets).optional(),
    optionPosition: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
    networkClass: z.enum(diagnosticNetworkClasses).optional(),
    errorCode: z
      .string()
      .regex(/^[A-Z0-9_.-]+$/)
      .max(64)
      .optional(),
  })
  .strict()

const safeTokenEqual = (supplied: string, expected: string): boolean => {
  const suppliedBytes = Buffer.from(supplied)
  const expectedBytes = Buffer.from(expected)
  return (
    suppliedBytes.byteLength === expectedBytes.byteLength &&
    timingSafeEqual(suppliedBytes, expectedBytes)
  )
}

export function createApi(options: ApiOptions) {
  const app = new Hono<{ Variables: Variables }>()
  const now = options.now ?? (() => new Date().toISOString())
  const createId = options.createId ?? (() => globalThis.crypto.randomUUID())
  const epochNow = options.epochNow ?? Date.now
  const rateLimits = options.rateLimits ?? {
    publicMax: 120,
    adminMax: 30,
    windowMs: 60_000,
  }
  const rateBuckets = new Map<
    string,
    { windowStartedAt: number; count: number }
  >()

  const problem = <Path extends string>(
    c: Context<{ Variables: Variables }, Path>,
    status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500 | 503,
    type: string,
    title: string,
    detail: string,
    errors?: unknown,
  ) =>
    c.json(
      {
        type: `https://razvilka.app/problems/${type}`,
        title,
        status,
        detail,
        instance: c.req.path,
        requestId: c.get('requestId'),
        ...(errors ? { errors } : {}),
      },
      status,
      { 'content-type': 'application/problem+json; charset=utf-8' },
    )

  const parseJson = async (
    c: Parameters<Parameters<typeof app.onError>[0]>[1],
    maximumBytes = MAX_PUBLIC_BODY_BYTES,
  ) => {
    const declaredLength = Number(c.req.header('content-length') ?? 0)
    if (declaredLength > maximumBytes) {
      return {
        error: problem(
          c,
          413,
          'payload-too-large',
          'Payload too large',
          `Request body exceeds ${maximumBytes} bytes.`,
        ),
      }
    }
    try {
      const body = c.req.raw.body
      if (!body) throw new Error('missing body')
      const reader = body.getReader()
      const decoder = new TextDecoder()
      let byteCount = 0
      let source = ''
      while (true) {
        const chunk = await reader.read()
        if (chunk.done) break
        byteCount += chunk.value.byteLength
        if (byteCount > maximumBytes) {
          await reader.cancel()
          return {
            error: problem(
              c,
              413,
              'payload-too-large',
              'Payload too large',
              `Request body exceeds ${maximumBytes} bytes.`,
            ),
          }
        }
        source += decoder.decode(chunk.value, { stream: true })
      }
      source += decoder.decode()
      return { value: JSON.parse(source) as unknown }
    } catch {
      return {
        error: problem(
          c,
          400,
          'invalid-json',
          'Invalid JSON',
          'Request body must be valid JSON.',
        ),
      }
    }
  }

  app.use('*', async (c, next) => {
    const suppliedId = c.req.header('x-request-id')
    const requestId = suppliedId?.match(/^[a-zA-Z0-9._-]{8,100}$/)
      ? suppliedId
      : createId()
    c.set('requestId', requestId)

    const origin = c.req.header('origin')
    if (origin && options.allowedOrigins.includes(origin)) {
      c.header('access-control-allow-origin', origin)
      c.header(
        'access-control-allow-headers',
        'authorization, content-type, x-request-id, x-device-id',
      )
      c.header('access-control-allow-methods', 'GET, POST, OPTIONS')
      c.header('vary', 'Origin')
    }
    if (c.req.method === 'OPTIONS') {
      return c.body(null, 204)
    }

    await next()
    c.header('x-request-id', requestId)
    c.header('x-content-type-options', 'nosniff')
    c.header('x-frame-options', 'DENY')
    c.header('referrer-policy', 'no-referrer')
    c.header('permissions-policy', 'camera=(), microphone=(), geolocation=()')
    c.header(
      'content-security-policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    )
    c.header('strict-transport-security', 'max-age=31536000; includeSubDomains')
  })

  app.use('/v1/*', async (c, next) => {
    if (c.req.method === 'OPTIONS') return next()
    const nowMs = epochNow()
    const admin = c.req.path.startsWith('/v1/admin/')
    const maximum = admin ? rateLimits.adminMax : rateLimits.publicMax
    // The production proxy must replace, rather than append to, this header.
    const client = c.req.header('x-real-ip') ?? 'direct-client'
    const requestedKey = `${admin ? 'admin' : 'public'}:${client}`
    if (rateBuckets.size >= MAX_RATE_BUCKETS) {
      for (const [bucketKey, candidate] of rateBuckets) {
        if (nowMs - candidate.windowStartedAt >= rateLimits.windowMs) {
          rateBuckets.delete(bucketKey)
        }
      }
    }
    const key =
      rateBuckets.size >= MAX_RATE_BUCKETS && !rateBuckets.has(requestedKey)
        ? `${admin ? 'admin' : 'public'}:overflow`
        : requestedKey
    const previous = rateBuckets.get(key)
    const bucket =
      !previous || nowMs - previous.windowStartedAt >= rateLimits.windowMs
        ? { windowStartedAt: nowMs, count: 0 }
        : previous
    const resetAt = bucket.windowStartedAt + rateLimits.windowMs

    c.header('ratelimit-limit', String(maximum))
    c.header('ratelimit-reset', String(Math.ceil(resetAt / 1_000)))
    if (bucket.count >= maximum) {
      c.header('ratelimit-remaining', '0')
      c.header(
        'retry-after',
        String(Math.max(1, Math.ceil((resetAt - nowMs) / 1_000))),
      )
      return c.json(
        {
          type: 'https://razvilka.app/problems/rate-limit-exceeded',
          title: 'Too many requests',
          status: 429,
          detail: 'Retry after the indicated delay.',
          instance: c.req.path,
          requestId: c.get('requestId'),
        },
        429,
        { 'content-type': 'application/problem+json; charset=utf-8' },
      )
    }

    bucket.count += 1
    rateBuckets.set(key, bucket)
    c.header('ratelimit-remaining', String(Math.max(0, maximum - bucket.count)))
    await next()
  })

  const requireAdmin = async (
    c: Parameters<Parameters<typeof app.onError>[0]>[1],
    next: () => Promise<void>,
  ) => {
    const token =
      c.req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
    const configuredRole = Object.entries(options.roleTokens ?? {}).find(
      ([, roleToken]) =>
        typeof roleToken === 'string' &&
        roleToken.length > 0 &&
        safeTokenEqual(token, roleToken),
    )?.[0] as CmsRole | undefined
    const role =
      configuredRole ??
      (options.adminToken.length > 0 &&
      safeTokenEqual(token, options.adminToken)
        ? 'publisher'
        : undefined)
    if (!role) {
      return problem(
        c,
        401,
        'unauthorized',
        'Unauthorized',
        'A valid admin bearer token is required.',
      )
    }
    c.set('cmsRole', role)
    await next()
  }
  app.use('/v1/admin/*', requireAdmin)

  const requireRole =
    (roles: readonly CmsRole[]) =>
    async (
      c: Parameters<Parameters<typeof app.onError>[0]>[1],
      next: () => Promise<void>,
    ) => {
      const role = c.get('cmsRole')
      if (!role || !roles.includes(role)) {
        return problem(
          c,
          403,
          'forbidden',
          'Forbidden',
          'Your CMS role cannot perform this action.',
        )
      }
      await next()
    }
  app.use(
    '/v1/admin/content/validate',
    requireRole(['writer', 'editor', 'qa', 'publisher']),
  )
  app.use('/v1/admin/content/publish', requireRole(['publisher']))

  const healthHandler = (c: Context<{ Variables: Variables }, string>) =>
    c.json({
      data: { status: 'ok', version: API_VERSION },
      meta: { requestId: c.get('requestId') },
    })
  const readinessHandler = async (
    c: Context<{ Variables: Variables }, string>,
  ) => {
    try {
      const content = await options.store.getCurrentPackage()
      return c.json({
        data: {
          status: 'ready',
          version: API_VERSION,
          contentBuildId: content.manifest.buildId,
        },
        meta: { requestId: c.get('requestId') },
      })
    } catch {
      return problem(
        c,
        503,
        'not-ready',
        'Service unavailable',
        'Required storage or content is not ready.',
      )
    }
  }

  app.get('/healthz', healthHandler)
  app.get('/ready', readinessHandler)
  app.get('/readyz', readinessHandler)
  app.get('/v1/health', healthHandler)
  app.get('/v1/ready', readinessHandler)

  app.get('/v1/catalog', async c => {
    if (c.req.query('locale') && c.req.query('locale') !== 'ru-RU') {
      return problem(
        c,
        404,
        'locale-not-found',
        'Locale not found',
        'Only ru-RU is currently available.',
      )
    }
    const content = await options.store.getCurrentPackage()
    const etag = `W/"${content.manifest.checksum}"`
    c.header('etag', etag)
    c.header(
      'cache-control',
      'public, max-age=300, stale-while-revalidate=3600',
    )
    if (c.req.header('if-none-match') === etag) return c.body(null, 304)
    return c.json({
      data: {
        packId: content.manifest.packId,
        locale: content.manifest.locale,
        buildId: content.manifest.buildId,
        contentVersion: content.manifest.contentVersion,
        checksum: content.manifest.checksum,
        characters: content.characters,
        stories: content.stories,
        episodes: content.episodes,
        warnings: content.warnings.map(warning => ({
          warningId: warning.warningId,
          category: warning.category,
          severity: warning.severity,
          summary: warning.summary,
          detail: warning.detail,
          sceneId: warning.sceneId,
        })),
      },
      meta: { requestId: c.get('requestId') },
    })
  })

  const characterHandler = async (
    c: Context<{ Variables: Variables }, string>,
  ) => {
    const content = await options.store.getCurrentPackage()
    const character = content.characters.find(
      item => item.characterId === c.req.param('characterId'),
    )
    if (!character)
      return problem(
        c,
        404,
        'character-not-found',
        'Character not found',
        'No character has that ID.',
      )
    const stories = content.stories.filter(
      item => item.characterId === character.characterId,
    )
    return c.json({
      data: { character, stories },
      meta: { requestId: c.get('requestId') },
    })
  }
  app.get('/v1/characters/:characterId', characterHandler)
  app.get('/v1/catalog/characters/:characterId', characterHandler)

  const manifestHandler = async (
    c: Context<{ Variables: Variables }, string>,
  ) => {
    const content = await options.store.getCurrentPackage()
    if (content.manifest.packId !== c.req.param('packId')) {
      return problem(
        c,
        404,
        'pack-not-found',
        'Content pack not found',
        'No content pack has that ID.',
      )
    }
    return c.json({
      data: content.manifest,
      meta: { requestId: c.get('requestId') },
    })
  }
  app.get('/v1/content/:packId/manifest', manifestHandler)
  app.get('/v1/content/manifests/:packId', manifestHandler)

  app.get('/v1/content/packages/:packId', async c => {
    const content = await options.store.getCurrentPackage()
    if (content.manifest.packId !== c.req.param('packId')) {
      return problem(
        c,
        404,
        'pack-not-found',
        'Content pack not found',
        'No content pack has that ID.',
      )
    }
    c.header('etag', `"${content.manifest.checksum}"`)
    c.header('cache-control', 'public, max-age=31536000, immutable')
    return c.json(content)
  })

  app.get('/v1/content/packages/:packId/builds/:buildId', async c => {
    const content = await options.store.getPackage(
      c.req.param('packId'),
      c.req.param('buildId'),
    )
    if (!content) {
      return problem(
        c,
        404,
        'content-build-not-found',
        'Content build not found',
        'No immutable content build has those IDs.',
      )
    }
    c.header('etag', `"${content.manifest.checksum}"`)
    c.header('cache-control', 'public, max-age=31536000, immutable')
    return c.json(content)
  })

  app.get(
    '/v1/content/packages/:packId/builds/:buildId/assets/:assetId',
    async c => {
      const content = await options.store.getPackage(
        c.req.param('packId'),
        c.req.param('buildId'),
      )
      const asset = content?.assets.find(
        item => item.assetId === c.req.param('assetId'),
      )
      if (!content || !asset || !options.loadContentAsset) {
        return problem(
          c,
          404,
          'content-asset-not-found',
          'Content asset not found',
          'No asset in that immutable content build has this ID.',
        )
      }
      const loaded = await options.loadContentAsset(content, asset)
      if (!loaded) {
        return problem(
          c,
          404,
          'content-asset-not-found',
          'Content asset not found',
          'The signed asset file is unavailable.',
        )
      }
      c.header('content-type', loaded.contentType)
      c.header('content-length', String(loaded.byteCount))
      c.header('etag', `"${asset.checksum}"`)
      c.header('cache-control', 'public, max-age=31536000, immutable')
      return c.body(loaded.body)
    },
  )

  const reportHandler = async (
    c: Context<{ Variables: Variables }, string>,
  ) => {
    const body = await parseJson(c)
    if (body.error) return body.error
    const parsed = reportSchema.safeParse(body.value)
    if (!parsed.success) {
      return problem(
        c,
        422,
        'validation-failed',
        'Validation failed',
        'Report fields are invalid.',
        parsed.error.flatten(),
      )
    }
    const report: ApiReport = {
      reportId: parsed.data.reportId,
      runId: parsed.data.runId ?? null,
      nodeId: parsed.data.nodeId ?? null,
      choiceId: parsed.data.choiceId ?? null,
      contentBuildId: parsed.data.contentBuildId,
      appVersion: parsed.data.appVersion,
      platform: parsed.data.platform,
      diagnosticCode: parsed.data.diagnosticCode ?? null,
      category: parsed.data.category,
      note: parsed.data.note || null,
      consentGrantedAt: parsed.data.consentGrantedAt,
      receivedAt: now(),
    }
    await options.store.saveReport(report)
    return c.json(
      {
        data: { reportId: report.reportId, status: 'queued' },
        meta: { requestId: c.get('requestId') },
      },
      202,
    )
  }
  app.post('/v1/reports', reportHandler)
  app.post('/v1/content-reports', reportHandler)

  app.post('/v1/diagnostics/events', async c => {
    const body = await parseJson(c)
    if (body.error) return body.error
    const parsed = diagnosticSchema.safeParse(body.value)
    if (!parsed.success) {
      return problem(
        c,
        422,
        'validation-failed',
        'Validation failed',
        'Diagnostic fields are invalid.',
        parsed.error.flatten(),
      )
    }
    const event: DiagnosticEvent = {
      eventId: parsed.data.eventId ?? createId(),
      eventName: parsed.data.eventName,
      contentBuildId: parsed.data.contentBuildId,
      occurredAt: parsed.data.occurredAt,
      ...(parsed.data.nodeType ? { nodeType: parsed.data.nodeType } : {}),
      ...(parsed.data.durationBucket
        ? { durationBucket: parsed.data.durationBucket }
        : {}),
      ...(parsed.data.latencyBucket
        ? { latencyBucket: parsed.data.latencyBucket }
        : {}),
      ...(parsed.data.optionPosition
        ? { optionPosition: parsed.data.optionPosition }
        : {}),
      ...(parsed.data.networkClass
        ? { networkClass: parsed.data.networkClass }
        : {}),
      ...(parsed.data.errorCode ? { errorCode: parsed.data.errorCode } : {}),
    }
    await options.store.saveDiagnostic(event)
    return c.json(
      { data: { accepted: true }, meta: { requestId: c.get('requestId') } },
      202,
    )
  })

  const syncDisabled = (c: Context<{ Variables: Variables }, string>) =>
    problem(
      c,
      404,
      'capability-disabled',
      'Capability disabled',
      'Cloud sync is not enabled for this release.',
    )

  const syncPrincipal = async (
    c: Context<{ Variables: Variables }, string>,
  ): Promise<SyncPrincipal | Response> => {
    if (!options.resolveSyncPrincipal) {
      return problem(
        c,
        503,
        'sync-auth-not-configured',
        'Sync unavailable',
        'Sync authentication is not configured for this runtime.',
      )
    }
    const principal = await options.resolveSyncPrincipal(c)
    if (!principal) {
      return problem(
        c,
        401,
        'unauthorized',
        'Unauthorized',
        'A valid account session is required for sync.',
      )
    }
    return principal
  }

  const pushSyncEvents = async (
    c: Context<{ Variables: Variables }, string>,
    legacy = false,
  ) => {
    if (!options.syncEnabled) return syncDisabled(c)
    if (!options.syncStore) {
      return problem(
        c,
        legacy ? 500 : 503,
        'sync-unavailable',
        'Sync unavailable',
        'Sync storage is not configured.',
      )
    }
    const body = await parseJson(c, MAX_SYNC_BODY_BYTES)
    if (body.error) return body.error
    const parsed = syncPushRequestSchema.safeParse(body.value)
    if (!parsed.success) {
      return problem(
        c,
        422,
        'validation-failed',
        'Validation failed',
        'Sync event fields are invalid.',
        parsed.error.flatten(),
      )
    }
    const runId = c.req.param('runId')
    if (runId && runId !== parsed.data.run.runId) {
      return problem(
        c,
        409,
        'run-id-mismatch',
        'Run ID mismatch',
        'The URL run ID must match the payload run ID.',
      )
    }
    const principal = await syncPrincipal(c)
    if (principal instanceof Response) return principal
    if (principal.deviceId !== parsed.data.deviceId) {
      return problem(
        c,
        403,
        'device-mismatch',
        'Forbidden',
        'The sync batch belongs to another device session.',
      )
    }
    const result = await options.syncStore.push(principal, parsed.data, {
      getPackage: (packId, buildId) =>
        options.store.getPackage(packId, buildId),
      now,
    })
    const response = syncPushResponseSchema.parse(result)
    return c.json(
      { data: response, meta: { requestId: c.get('requestId') } },
      response.conflict ? 409 : 200,
    )
  }

  app.post('/v1/runs/:runId/events:push', c => pushSyncEvents(c))
  app.post('/v1/sync/push', c => pushSyncEvents(c, true))

  app.get('/v1/runs/:runId/events', async c => {
    if (!options.syncEnabled) return syncDisabled(c)
    if (!options.syncStore) {
      return problem(
        c,
        503,
        'sync-unavailable',
        'Sync unavailable',
        'Sync storage is not configured.',
      )
    }
    const runId = c.req.param('runId')
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:-]*$/.test(runId)) {
      return problem(
        c,
        422,
        'validation-failed',
        'Validation failed',
        'Run ID is invalid.',
      )
    }
    const after = c.req.query('after') ?? null
    if (after !== null && (!/^\d+$/.test(after) || after.length > 20)) {
      return problem(
        c,
        422,
        'validation-failed',
        'Validation failed',
        'Sync cursor is invalid.',
      )
    }
    const principal = await syncPrincipal(c)
    if (principal instanceof Response) return principal
    const response = syncPullResponseSchema.parse(
      await options.syncStore.pull(principal, runId, after),
    )
    return c.json({ data: response, meta: { requestId: c.get('requestId') } })
  })

  app.post('/v1/admin/content/validate', async c => {
    const body = await parseJson(c, MAX_CONTENT_PACKAGE_BYTES)
    if (body.error) return body.error
    const report = compileContentPackage(body.value)
    return c.json({ data: report, meta: { requestId: c.get('requestId') } })
  })

  app.post('/v1/admin/content/publish', async c => {
    if (!options.signingPrivateKey || !options.signingKeyId) {
      return problem(
        c,
        404,
        'capability-disabled',
        'Capability disabled',
        'This runtime is not authorized to sign production content.',
      )
    }
    const body = await parseJson(c, MAX_CONTENT_PACKAGE_BYTES)
    if (body.error) return body.error
    const parsed = contentPackageSchema.safeParse(body.value)
    if (!parsed.success) {
      return problem(
        c,
        422,
        'validation-failed',
        'Validation failed',
        'Content package schema is invalid.',
        parsed.error.flatten(),
      )
    }
    if (
      parsed.data.manifest.signingKeyId &&
      parsed.data.manifest.signingKeyId !== options.signingKeyId
    ) {
      return problem(
        c,
        409,
        'signing-key-mismatch',
        'Signing key mismatch',
        'The candidate manifest names a different signing key than this publisher.',
      )
    }
    const candidate = contentPackageSchema.parse({
      ...parsed.data,
      manifest: {
        ...parsed.data.manifest,
        signingKeyId: options.signingKeyId,
      },
    })
    const confirmedBuildId = c.req.header('x-razvilka-confirm-build-id')
    if (confirmedBuildId !== candidate.manifest.buildId) {
      return problem(
        c,
        409,
        'build-confirmation-required',
        'Exact build confirmation required',
        'Type and submit the immutable build ID; aliases such as latest are not accepted.',
      )
    }
    const { report, gate: releaseGate } = evaluateProductionRelease(candidate)
    if (!releaseGate.eligible) {
      return problem(
        c,
        422,
        'release-gate-failed',
        'Release gate failed',
        'The package is not eligible for production publishing.',
        releaseGate,
      )
    }
    if (options.validateContentAssets) {
      try {
        await options.validateContentAssets(candidate)
      } catch (error) {
        return problem(
          c,
          422,
          'asset-validation-failed',
          'Asset validation failed',
          error instanceof Error
            ? error.message
            : 'A signed package asset could not be verified.',
        )
      }
    }
    const signed = signContentPackage(candidate, options.signingPrivateKey)
    await options.store.publish(signed)
    return c.json(
      {
        data: { manifest: signed.manifest, report },
        meta: { requestId: c.get('requestId') },
      },
      201,
    )
  })

  app.notFound(c =>
    problem(
      c,
      404,
      'not-found',
      'Not found',
      'The requested endpoint does not exist.',
    ),
  )
  app.onError((error, c) => {
    console.error(
      JSON.stringify({
        level: 'error',
        requestId: c.get('requestId'),
        message: error.message,
      }),
    )
    return problem(
      c,
      500,
      'internal-error',
      'Internal server error',
      'The request could not be completed.',
    )
  })
  return app
}
