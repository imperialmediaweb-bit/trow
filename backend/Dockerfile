FROM node:20-alpine AS builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

RUN npm run build

# ─── Production ──────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S throwbox && \
    adduser -S throwbox -u 1001

COPY backend/package.json backend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER throwbox

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
