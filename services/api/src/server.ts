import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  timingSafeEqual,
} from 'node:crypto'
import { mkdirSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { serve } from '@hono/node-server'
import { sampleContentPackage } from '@chartalk/test-fixtures'
import type { Context } from 'hono'

import { createApi, type CmsRole } from './app'
import { loadContentAssetFile, verifyContentAssetFiles } from './assets'
import { parseBootstrapContent } from './bootstrap'
import { SqliteApiStore } from './storage'

const production = process.env.NODE_ENV === 'production'
const adminToken = process.env.CHARTALK_ADMIN_TOKEN
if (production && (!adminToken || adminToken.length < 24)) {
  throw new Error(
    'CHARTALK_ADMIN_TOKEN must contain at least 24 characters in production',
  )
}

const cmsRoleTokens = (['writer', 'editor', 'qa', 'publisher'] as const).reduce(
  (tokens, role) => {
    const value = process.env[`CHARTALK_CMS_${role.toUpperCase()}_TOKEN`]
    if (value) tokens[role] = value
    return tokens
  },
  {} as Partial<Record<CmsRole, string>>,
)
for (const [role, token] of Object.entries(cmsRoleTokens)) {
  if (production && token.length < 24) {
    throw new Error(
      `CHARTALK_CMS_${role.toUpperCase()}_TOKEN must contain at least 24 characters in production`,
    )
  }
  if (token === adminToken) {
    throw new Error(
      `CHARTALK_CMS_${role.toUpperCase()}_TOKEN must not duplicate CHARTALK_ADMIN_TOKEN`,
    )
  }
}

const publishEnabled = process.env.CHARTALK_PUBLISH_ENABLED === 'true'
const privateKeyPath = process.env.CHARTALK_SIGNING_PRIVATE_KEY_FILE
const signingKeyId = process.env.CHARTALK_SIGNING_KEY_ID
if (production && publishEnabled && !signingKeyId) {
  throw new Error(
    'CHARTALK_SIGNING_KEY_ID is required when production publishing is enabled',
  )
}
const privateKey = publishEnabled
  ? privateKeyPath
    ? createPrivateKey(readFileSync(resolve(privateKeyPath), 'utf8'))
    : production
      ? (() => {
          throw new Error(
            'CHARTALK_SIGNING_PRIVATE_KEY_FILE is required when production publishing is enabled',
          )
        })()
      : generateKeyPairSync('ed25519').privateKey
  : undefined

const contentPath = process.env.CHARTALK_CONTENT_PACKAGE_PATH
const publicKeyPath = process.env.CHARTALK_SIGNING_PUBLIC_KEY_FILE
const bundledContent = contentPath
  ? (() => {
      if (!publicKeyPath) {
        throw new Error(
          'CHARTALK_SIGNING_PUBLIC_KEY_FILE is required with a content package',
        )
      }
      return parseBootstrapContent(
        readFileSync(resolve(contentPath), 'utf8'),
        createPublicKey(readFileSync(resolve(publicKeyPath), 'utf8')),
        { requireProductionGate: production },
      )
    })()
  : production
    ? (() => {
        throw new Error(
          'CHARTALK_CONTENT_PACKAGE_PATH is required in production',
        )
      })()
    : sampleContentPackage

const contentAssetRootValue = process.env.CHARTALK_CONTENT_ASSET_ROOT
if (production && !contentAssetRootValue) {
  throw new Error('CHARTALK_CONTENT_ASSET_ROOT is required in production')
}
const contentAssetRoot = contentAssetRootValue
  ? resolve(contentAssetRootValue)
  : undefined
if (contentAssetRoot) {
  await verifyContentAssetFiles(contentAssetRoot, bundledContent)
}

const databasePath = resolve(
  process.env.CHARTALK_API_DB_PATH ?? './var/chartalk-api.db',
)
mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 })
const store = new SqliteApiStore(databasePath, bundledContent)
const syncEnabled = process.env.CHARTALK_SYNC_ENABLED === 'true'
const syncToken = process.env.CHARTALK_SYNC_TOKEN
const syncAccountId = process.env.CHARTALK_SYNC_ACCOUNT_ID ?? 'account.default'
if (syncEnabled && !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/.test(syncAccountId)) {
  throw new Error(
    'CHARTALK_SYNC_ACCOUNT_ID must be a stable account identifier',
  )
}
if (production && syncEnabled && (!syncToken || syncToken.length < 24)) {
  throw new Error(
    'CHARTALK_SYNC_TOKEN must contain at least 24 characters when sync is enabled in production',
  )
}
const syncPrincipal = syncToken
  ? (c: Context) => {
      const supplied =
        c.req.header('authorization')?.replace(/^Bearer\s+/i, '') ?? ''
      const suppliedBytes = Buffer.from(supplied)
      const expectedBytes = Buffer.from(syncToken)
      const authenticated =
        suppliedBytes.byteLength === expectedBytes.byteLength &&
        timingSafeEqual(suppliedBytes, expectedBytes)
      if (!authenticated) return null
      const deviceId = c.req.header('x-device-id')
      if (!deviceId || !/^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,199}$/.test(deviceId)) {
        return null
      }
      return { accountId: syncAccountId, deviceId }
    }
  : undefined
const allowedOrigins = (
  process.env.CHARTALK_ALLOWED_ORIGINS ?? 'http://localhost:5173'
)
  .split(',')
  .map(value => value.trim())
  .filter(Boolean)

const app = createApi({
  store,
  adminToken: adminToken ?? 'development-admin-token-change-me',
  ...(Object.keys(cmsRoleTokens).length ? { roleTokens: cmsRoleTokens } : {}),
  ...(privateKey ? { signingPrivateKey: privateKey } : {}),
  ...(privateKey
    ? { signingKeyId: signingKeyId ?? 'development-ephemeral' }
    : {}),
  syncEnabled,
  ...(syncEnabled ? { syncStore: store } : {}),
  ...(syncPrincipal ? { resolveSyncPrincipal: syncPrincipal } : {}),
  allowedOrigins,
  ...(contentAssetRoot
    ? {
        loadContentAsset: (
          content: Parameters<typeof loadContentAssetFile>[1],
          asset: Parameters<typeof loadContentAssetFile>[2],
        ) => loadContentAssetFile(contentAssetRoot, content, asset),
        validateContentAssets: (content: typeof bundledContent) =>
          verifyContentAssetFiles(contentAssetRoot, content),
      }
    : {}),
})

const port = Number(process.env.PORT ?? 8787)
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error('PORT must be an integer from 1 to 65535')
}
const hostname = process.env.CHARTALK_API_HOST ?? '127.0.0.1'
const server = serve({ fetch: app.fetch, hostname, port })

console.info(
  JSON.stringify({
    level: 'info',
    message: 'CharTalk API listening',
    hostname,
    port,
  }),
)

const shutdown = () => {
  server.close(() => {
    store.close()
    process.exit(0)
  })
}
process.once('SIGINT', shutdown)
process.once('SIGTERM', shutdown)
