import { describe, expect, it } from 'vitest'

import { validateContainerContract } from './container-contract'

const workspacePackagePaths = [
  'apps/content-studio/package.json',
  'apps/mobile/package.json',
  'services/api/package.json',
  'packages/analytics-schema/package.json',
  'packages/content-schema/package.json',
]

const validDockerfile = `
FROM node:24-bookworm-slim AS build
COPY package.json package-lock.json ./
COPY apps/content-studio/package.json apps/content-studio/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY services/api/package.json services/api/package.json
COPY packages/analytics-schema/package.json packages/analytics-schema/package.json
COPY packages/content-schema/package.json packages/content-schema/package.json
RUN npm ci --ignore-scripts
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production RAZVILKA_API_DB_PATH=/app/var/razvilka-api.db RAZVILKA_CONTENT_ASSET_ROOT=/app/content-assets
VOLUME ["/app/var", "/app/content-assets"]
USER node
EXPOSE 8787
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:8787/ready')"
CMD ["node", "--enable-source-maps", "/app/server.js"]
`

describe('container contract', () => {
  it('accepts a runtime image with every workspace manifest and safety hooks', () => {
    expect(
      validateContainerContract(validDockerfile, workspacePackagePaths),
    ).toEqual({
      ok: true,
      errors: [],
    })
  })

  it('reports missing workspace manifests and runtime safeguards', () => {
    const result = validateContainerContract(
      validDockerfile
        .replace(
          'COPY packages/analytics-schema/package.json packages/analytics-schema/package.json',
          '',
        )
        .replace('USER node', 'USER root')
        .replace(
          'RAZVILKA_API_DB_PATH=/app/var/razvilka-api.db',
          'RAZVILKA_API_DB_PATH=/tmp/razvilka-api.db',
        )
        .replace(
          'RAZVILKA_CONTENT_ASSET_ROOT=/app/content-assets',
          'RAZVILKA_CONTENT_ASSET_ROOT=/tmp/assets',
        )
        .replace('EXPOSE 8787\n', '')
        .replace(
          'CMD ["node", "--enable-source-maps", "/app/server.js"]\n',
          '',
        ),
      workspacePackagePaths,
    )
    expect(result.ok).toBe(false)
    expect(result.errors).toEqual(
      expect.arrayContaining([
        'workspace manifest is not copied before npm ci: packages/analytics-schema/package.json',
        'runtime image must run as the non-root node user',
        'runtime image must point its database path at the durable volume',
        'runtime image must point its content asset root at the durable volume',
        'runtime image must expose API port 8787',
        'runtime image must start the bundled API server',
      ]),
    )
  })
})
