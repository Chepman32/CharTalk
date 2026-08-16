import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export interface ContainerContractResult {
  ok: boolean
  errors: string[]
}

export function validateContainerContract(
  dockerfile: string,
  workspacePackagePaths: readonly string[],
): ContainerContractResult {
  const errors: string[] = []
  const installMarker = dockerfile.indexOf('RUN npm ci')
  if (installMarker < 0) {
    errors.push('Dockerfile must run npm ci in the build stage')
  }

  for (const manifestPath of workspacePackagePaths) {
    const copyInstruction = `COPY ${manifestPath} ${manifestPath}`
    if (
      !dockerfile.includes(copyInstruction) ||
      (installMarker >= 0 &&
        dockerfile.indexOf(copyInstruction) > installMarker)
    ) {
      errors.push(
        `workspace manifest is not copied before npm ci: ${manifestPath}`,
      )
    }
  }

  if (!dockerfile.includes('FROM node:24-bookworm-slim AS runtime')) {
    errors.push('runtime image must use the pinned Node 24 slim base')
  }
  if (!dockerfile.includes('ENV NODE_ENV=production')) {
    errors.push('runtime image must set NODE_ENV=production')
  }
  if (!dockerfile.includes('CHARTALK_API_DB_PATH=/app/var/chartalk-api.db')) {
    errors.push(
      'runtime image must point its database path at the durable volume',
    )
  }
  if (!dockerfile.includes('CHARTALK_CONTENT_ASSET_ROOT=/app/content-assets')) {
    errors.push(
      'runtime image must point its content asset root at the durable volume',
    )
  }
  if (!dockerfile.includes('USER node')) {
    errors.push('runtime image must run as the non-root node user')
  }
  if (!dockerfile.includes('EXPOSE 8787')) {
    errors.push('runtime image must expose API port 8787')
  }
  if (!dockerfile.includes('HEALTHCHECK')) {
    errors.push('runtime image must define a readiness healthcheck')
  }
  if (!dockerfile.includes('VOLUME ["/app/var", "/app/content-assets"]')) {
    errors.push(
      'runtime image must declare durable database and content volumes',
    )
  }
  if (
    !dockerfile.includes(
      'CMD ["node", "--enable-source-maps", "/app/server.js"]',
    )
  ) {
    errors.push('runtime image must start the bundled API server')
  }

  return { ok: errors.length === 0, errors }
}

async function workspacePackagePaths(projectRoot: string): Promise<string[]> {
  const roots = ['apps', 'services', 'packages']
  const paths: string[] = []
  for (const root of roots) {
    const entries = await readdir(resolve(projectRoot, root), {
      withFileTypes: true,
    })
    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const relativePath = join(root, entry.name, 'package.json')
      await readFile(resolve(projectRoot, relativePath), 'utf8')
      paths.push(relativePath)
    }
  }
  return paths.sort()
}

export async function runContainerContract(
  projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..'),
): Promise<ContainerContractResult> {
  const [dockerfile, manifests] = await Promise.all([
    readFile(resolve(projectRoot, 'Dockerfile'), 'utf8'),
    workspacePackagePaths(projectRoot),
  ])
  return validateContainerContract(dockerfile, manifests)
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  runContainerContract()
    .then(result => {
      if (!result.ok) {
        for (const error of result.errors)
          console.error(`Container contract: ${error}`)
        process.exitCode = 1
        return
      }
      console.info(
        'Container contract passed: workspace manifests, non-root runtime, volumes, and readiness healthcheck are present.',
      )
    })
    .catch(error => {
      console.error(
        `Container contract failed: ${error instanceof Error ? error.message : String(error)}`,
      )
      process.exitCode = 1
    })
}
