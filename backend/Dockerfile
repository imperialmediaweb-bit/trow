# ─── Stage 1: Build Frontend ──────────────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY frontend/ .
RUN npm run build

# ─── Stage 2: Build Backend ──────────────────────────────────
FROM node:20-alpine AS backend-builder

WORKDIR /app

COPY backend/package.json backend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

COPY backend/tsconfig.json ./
COPY backend/src/ ./src/

RUN npm run build

# ─── Stage 3: Production ─────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

RUN addgroup -g 1001 -S throwbox && \
    adduser -S throwbox -u 1001

COPY backend/package.json backend/package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci --omit=dev; else npm install --omit=dev; fi && npm cache clean --force

COPY --from=backend-builder /app/dist ./dist
COPY --from=frontend-builder /frontend/dist ./public

ENV NODE_ENV=production

USER throwbox

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/server.js"]
