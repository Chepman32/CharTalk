FROM node:24-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/content-studio/package.json apps/content-studio/package.json
COPY apps/mobile/package.json apps/mobile/package.json
COPY services/api/package.json services/api/package.json
COPY packages/app-core/package.json packages/app-core/package.json
COPY packages/content-compiler/package.json packages/content-compiler/package.json
COPY packages/content-integrity/package.json packages/content-integrity/package.json
COPY packages/content-schema/package.json packages/content-schema/package.json
COPY packages/design-system/package.json packages/design-system/package.json
COPY packages/dialogue-engine/package.json packages/dialogue-engine/package.json
COPY packages/sync-protocol/package.json packages/sync-protocol/package.json
COPY packages/test-fixtures/package.json packages/test-fixtures/package.json
COPY packages/analytics-schema/package.json packages/analytics-schema/package.json
RUN npm ci --ignore-scripts

COPY tsconfig.base.json ./
COPY services/api services/api
COPY packages packages
RUN npm run build --workspace @chartalk/api

FROM node:24-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=8787 \
    CHARTALK_API_HOST=0.0.0.0 \
    CHARTALK_API_DB_PATH=/app/var/chartalk-api.db \
    CHARTALK_CONTENT_ASSET_ROOT=/app/content-assets
WORKDIR /app
RUN install -d -o node -g node -m 0700 /app/var /app/content-assets
COPY --from=build --chown=node:node /app/services/api/dist/server.js /app/server.js
COPY --from=build --chown=node:node /app/services/api/dist/server.js.map /app/server.js.map
USER node
EXPOSE 8787
VOLUME ["/app/var", "/app/content-assets"]
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8787/ready').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node", "--enable-source-maps", "/app/server.js"]
