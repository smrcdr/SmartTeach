FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package*.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN npm ci

FROM deps AS builder
COPY . .
RUN npm run prisma:generate -w @smarteach/api
RUN npm run build -w @smarteach/api

FROM base AS runner
ARG DATABASE_URL=postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public
ENV NODE_ENV=production
ENV DATABASE_URL=$DATABASE_URL
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/prisma.config.ts ./apps/api/prisma.config.ts
COPY package*.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY packages/shared/package.json ./packages/shared/package.json
RUN node ./node_modules/prisma/build/index.js generate --config ./apps/api/prisma.config.ts
EXPOSE 3000
CMD ["sh", "-c", "node ./node_modules/prisma/build/index.js migrate deploy --config ./apps/api/prisma.config.ts && node ./dist/apps/api/main.js"]
