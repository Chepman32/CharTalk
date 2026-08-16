import { once } from 'node:events'
import { access, mkdtemp, rm } from 'node:fs/promises'
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import { tmpdir } from 'node:os'
import { setTimeout as delay } from 'node:timers/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface RuntimeResponseLike {
  status: number
  headers: Headers
}

export interface RuntimeResponseExpectation {
  status: number
  requiredHeaders?: Record<string, string>
}

interface CatalogIdentity {
  packId: string
  buildId: string
  checksum: string
}

const moduleDirectory = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(moduleDirectory, '..')
const safeIdentity = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const checksumToken = /^sha256:[A-Za-z0-9._-]{1,128}$/

export function assertRuntimeResponse(
  response: RuntimeResponseLike,
  expectation: RuntimeResponseExpectation,
): void {
  if (response.status !== expectation.status) {
    throw new Error(
      `expected status ${expectation.status}, received ${response.status}`,
    )
  }
  for (const [name, expected] of Object.entries(
    expectation.requiredHeaders ?? {},
  )) {
    const actual = response.headers.get(name)
    if (actual === null) {
      throw new Error(`missing header ${name}`)
    }
    if (actual !== expected) {
      throw new Error(
        `expected header ${name} to equal ${expected}, received ${actual}`,
      )
    }
  }
}

export function catalogIdentity(payload: unknown): CatalogIdentity {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    Array.isArray(payload) ||
    typeof (payload as { data?: unknown }).data !== 'object' ||
    (payload as { data?: unknown }).data === null
  ) {
    throw new Error('catalog identity is invalid')
  }
  const data = (payload as { data: Record<string, unknown> }).data
  const packId = data.packId
  const buildId = data.buildId
  const checksum = data.checksum
  if (
    typeof packId !== 'string' ||
    !safeIdentity.test(packId) ||
    typeof buildId !== 'string' ||
    !safeIdentity.test(buildId) ||
    typeof checksum !== 'string' ||
    !checksumToken.test(checksum)
  ) {
    throw new Error('catalog identity is invalid')
  }
  return { packId, buildId, checksum }
}

async function fetchWithTimeout(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(5_000) })
}

async function waitForReady(baseUrl: string): Promise<void> {
  let lastError = 'server did not respond'
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}/ready`)
      if (response.status === 200) return
      lastError = `readiness returned ${response.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await delay(100)
  }
  throw new Error(`API runtime did not become ready: ${lastError}`)
}

function captureOutput(process: ChildProcessWithoutNullStreams): {
  stdout: () => string
  stderr: () => string
} {
  let stdout = ''
  let stderr = ''
  process.stdout.on('data', chunk => {
    stdout += String(chunk)
  })
  process.stderr.on('data', chunk => {
    stderr += String(chunk)
  })
  return { stdout: () => stdout, stderr: () => stderr }
}

async function stopServer(
  server: ChildProcessWithoutNullStreams,
): Promise<void> {
  if (server.exitCode !== null) return
  server.kill('SIGTERM')
  await Promise.race([once(server, 'exit'), delay(2_000)])
  if (server.exitCode === null) server.kill('SIGKILL')
}

export async function runApiRuntimeSmoke(
  port = Number(process.env.CHARTALK_API_SMOKE_PORT ?? 4397),
): Promise<void> {
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      'CHARTALK_API_SMOKE_PORT must be an integer from 1 to 65535',
    )
  }
  const serverPath = resolve(projectRoot, 'services/api/dist/server.js')
  await access(serverPath)
  const tempDirectory = await mkdtemp(join(tmpdir(), 'chartalk-api-smoke-'))
  const server = spawn(process.execPath, [serverPath], {
    cwd: projectRoot,
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      CHARTALK_API_HOST: '127.0.0.1',
      CHARTALK_API_DB_PATH: join(tempDirectory, 'api.db'),
      CHARTALK_ALLOWED_ORIGINS: 'http://localhost:5173',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const output = captureOutput(server)
  const baseUrl = `http://127.0.0.1:${port}`

  try {
    await waitForReady(baseUrl)
    const securityHeaders = {
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
      'referrer-policy': 'no-referrer',
    }

    const health = await fetchWithTimeout(`${baseUrl}/healthz`)
    assertRuntimeResponse(health, {
      status: 200,
      requiredHeaders: securityHeaders,
    })

    const ready = await fetchWithTimeout(`${baseUrl}/ready`)
    assertRuntimeResponse(ready, {
      status: 200,
      requiredHeaders: securityHeaders,
    })
    const readyPayload = (await ready.json()) as { data?: { status?: unknown } }
    if (readyPayload.data?.status !== 'ready') {
      throw new Error('readiness payload did not report ready')
    }

    const catalog = await fetchWithTimeout(`${baseUrl}/v1/catalog?locale=ru-RU`)
    assertRuntimeResponse(catalog, {
      status: 200,
      requiredHeaders: {
        ...securityHeaders,
        'cache-control': 'public, max-age=300, stale-while-revalidate=3600',
      },
    })
    const etag = catalog.headers.get('etag')
    if (!etag) throw new Error('catalog response did not include an ETag')
    const identity = catalogIdentity(await catalog.json())

    const cachedCatalog = await fetchWithTimeout(
      `${baseUrl}/v1/catalog?locale=ru-RU`,
      { headers: { 'if-none-match': etag } },
    )
    assertRuntimeResponse(cachedCatalog, {
      status: 304,
      requiredHeaders: securityHeaders,
    })

    const manifest = await fetchWithTimeout(
      `${baseUrl}/v1/content/${encodeURIComponent(identity.packId)}/manifest`,
    )
    assertRuntimeResponse(manifest, {
      status: 200,
      requiredHeaders: securityHeaders,
    })
    const manifestPayload = (await manifest.json()) as {
      data?: { packId?: unknown; buildId?: unknown; checksum?: unknown }
    }
    const manifestIdentity = catalogIdentity(manifestPayload)
    if (
      manifestIdentity.packId !== identity.packId ||
      manifestIdentity.buildId !== identity.buildId ||
      manifestIdentity.checksum !== identity.checksum
    ) {
      throw new Error('manifest identity does not match catalog identity')
    }

    const exactBuild = await fetchWithTimeout(
      `${baseUrl}/v1/content/packages/${encodeURIComponent(identity.packId)}/builds/${encodeURIComponent(identity.buildId)}`,
    )
    assertRuntimeResponse(exactBuild, {
      status: 200,
      requiredHeaders: {
        ...securityHeaders,
        etag: `"${identity.checksum}"`,
        'cache-control': 'public, max-age=31536000, immutable',
      },
    })
    const exactPayload = (await exactBuild.json()) as {
      manifest?: { packId?: unknown; buildId?: unknown; checksum?: unknown }
    }
    const exactIdentity = catalogIdentity({ data: exactPayload.manifest })
    if (
      exactIdentity.packId !== identity.packId ||
      exactIdentity.buildId !== identity.buildId ||
      exactIdentity.checksum !== identity.checksum
    ) {
      throw new Error(
        'immutable build identity does not match catalog identity',
      )
    }
  } catch (error) {
    const detail = [output.stdout(), output.stderr()].filter(Boolean).join('\n')
    throw new Error(
      `${error instanceof Error ? error.message : String(error)}${detail ? `\n${detail}` : ''}`,
    )
  } finally {
    await stopServer(server)
    await rm(tempDirectory, { recursive: true, force: true })
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runApiRuntimeSmoke()
    .then(() =>
      console.info(
        'API runtime smoke passed: health, readiness, ETag cache, manifest, and immutable build contract.',
      ),
    )
    .catch(error => {
      console.error(
        `API runtime smoke failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      process.exitCode = 1
    })
}
