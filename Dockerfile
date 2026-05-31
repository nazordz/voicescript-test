
FROM node:24.15.0-alpine3.22 AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable pnpm
RUN apk add --no-cache dumb-init libc6-compat

FROM base AS builder
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack prepare pnpm@11.4.0 --activate
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .

RUN pnpm prisma:generate
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NODE_ENV=production


COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

RUN chown -R node:node /app

USER node

EXPOSE 3000

CMD ["dumb-init", "node", "/app/server.js"]
