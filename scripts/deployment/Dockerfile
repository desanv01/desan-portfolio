# Build with the repository root as context. .dockerignore excludes private data.
FROM node:24.22.1-bookworm-slim AS build
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm install --global npm@11.19.1 && npm ci
COPY . .
# Build-only placeholders. No database connection or production secret is used.
RUN DATABASE_URI=postgresql://build:build@127.0.0.1:5432/build PAYLOAD_SECRET=build-only-placeholder-never-a-production-secret npm run build

FROM node:24.22.1-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 HOSTNAME=0.0.0.0 PORT=3000
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
# The job/migration CLI runs the same reviewed source and exact dependencies.
COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/src ./src
COPY --from=build --chown=node:node /app/scripts ./scripts
COPY --from=build --chown=node:node /app/tsconfig.json ./tsconfig.json
RUN mkdir -p /data/media /data/github /data/recovery && chown -R node:node /data
USER node
EXPOSE 3000
CMD ["node", "server.js"]
