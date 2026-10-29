# Production image of the API. Build context: repo root (pnpm workspace).
#   docker build -f apps/api/Dockerfile .
# Used by deploy/docker-compose.yml. Debian (not Alpine) so Prisma's engines
# resolve without musl quirks, on amd64 as well as arm64 (Oracle Ampere).
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates wget \
  && rm -rf /var/lib/apt/lists/* \
  && corepack enable

WORKDIR /app

# Manifests first, so dependency install is cached across code changes.
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
RUN pnpm install --frozen-lockfile --filter @delivero/api...

COPY apps/api apps/api
WORKDIR /app/apps/api
# Prisma 7 resolves env('DATABASE_URL') from prisma.config.ts at generate
# time: provide a dummy for the build (no connection is opened). The real
# URL is injected at runtime via deploy/.env and used by `migrate deploy`.
ARG DATABASE_URL=postgresql://build:build@localhost:5432/build?schema=public
# Dev dependencies are kept: the prisma CLI runs `migrate deploy` at startup.
RUN pnpm exec prisma generate && pnpm build

ENV NODE_ENV=production
EXPOSE 3000
# Least privilege: never run the API as root (container escape = host root).
RUN chown -R node:node /app
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1
CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node dist/src/main.js"]
