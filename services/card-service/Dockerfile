FROM node:20-slim

# Системный Chromium из apt — не пакет puppeteer's bundled chromium
# (тот тяжелее и менее предсказуем в контейнере). Этот же подход
# работает одинаково что на Render, что на Railway/Fly.io.
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-liberation \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV CHROMIUM_PATH=/usr/bin/chromium
ENV NODE_ENV=production

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --omit=dev --no-audit --no-fund

COPY . .

# Непривилегированный пользователь — Chromium с --no-sandbox не должен
# работать от root в проде.
RUN groupadd -r appuser && useradd -r -g appuser -G audio,video appuser \
    && mkdir -p /home/appuser/Downloads \
    && chown -R appuser:appuser /home/appuser /app
USER appuser

EXPOSE 3000

CMD ["node", "src/server.js"]
