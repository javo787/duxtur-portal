# Build context is the REPOSITORY ROOT (not this directory): the bundle includes the shared bot code from /src.
# On Render: Root Directory empty, Dockerfile Path ./services/render-service/Dockerfile (see docs/RENDER_SETUP.md).

# ── Stage 1: bundle ─────────────────────────────────────────────────────────────────────────────────────────────────
FROM node:22-slim AS build
WORKDIR /repo
COPY services/render-service/package.json services/render-service/package-lock.json ./services/render-service/
RUN cd services/render-service && npm ci --no-audit --no-fund
COPY src ./src
COPY services/render-service ./services/render-service
RUN cd services/render-service && npm run build

# ── Stage 2: runtime ────────────────────────────────────────────────────────────────────────────────────────────────
FROM node:22-slim

# System Chromium from apt, not puppeteer's bundled one: smaller and predictable in a container.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app
COPY services/render-service/package.json services/render-service/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=build /repo/services/render-service/dist ./dist
# fonts.js reads ../assets/fonts relative to the bundle (/app/dist -> /app/assets)
COPY services/render-service/assets ./assets

# Unprivileged user: Chromium runs with --no-sandbox and must not do that as root.
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser && chown -R appuser:appuser /home/appuser /app
USER appuser

EXPOSE 3000
CMD ["node", "dist/server.js"]
