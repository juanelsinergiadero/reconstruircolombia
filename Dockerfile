# syntax=docker/dockerfile:1.6
# =============================================================
# reconstruircolombia — imagen de produccion (Next.js standalone)
# =============================================================
# Mismo patron que el resto de apps Next.js del servidor (ver
# prod.elsinergiadero/web/Dockerfile): deps -> builder -> runner,
# pnpm via corepack, usuario no-root en runtime.
#
# Diferencia clave por usar Prisma: se corre `prisma generate` en el
# builder (mismo entorno musl/alpine del runtime, para que el engine
# nativo generado sea el correcto). Con pnpm, el file-tracing de
# `output: standalone` SI incluye el cliente generado y el engine nativo
# (viven dentro de node_modules/.pnpm/@prisma+client@.../node_modules/.prisma,
# no en node_modules/.prisma como con npm) — verificado inspeccionando
# .next/standalone tras el build, no copiado a mano.
# =============================================================

FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:20-alpine AS builder
WORKDIR /app
# openssl: requerido por el engine nativo de Prisma en Alpine/musl.
RUN apk add --no-cache openssl
RUN corepack enable && corepack prepare pnpm@10.34.1 --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN pnpm build

FROM node:20-alpine AS runner
WORKDIR /app
RUN apk add --no-cache openssl
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
