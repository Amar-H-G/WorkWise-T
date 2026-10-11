# API Backend Dockerfile
FROM node:20-alpine AS base
WORKDIR /app

# ─── Dependencies ─────────────────────────────────────────────────────────
FROM base AS deps
COPY apps/api/package*.json ./
RUN npm ci --only=production

FROM base AS dev-deps
COPY apps/api/package*.json ./
RUN npm ci

# ─── Builder ──────────────────────────────────────────────────────────────
FROM dev-deps AS builder
COPY apps/api/ ./
COPY prisma/ ../prisma/
RUN npx prisma generate --schema=../prisma/schema.prisma
RUN npm run build

# ─── Production ───────────────────────────────────────────────────────────
FROM base AS production
ENV NODE_ENV=production

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy compiled code
COPY --from=builder /app/dist ./dist

# Copy Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 4000

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodeuser -u 1001
USER nodeuser

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/server.js"]
