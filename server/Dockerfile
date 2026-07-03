# syntax=docker/dockerfile:1

# ---- Build stage ----------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app
ENV MONGOMS_DISABLE_POSTINSTALL=1

# Install dependencies using only the manifests first (better layer caching).
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY server/package.json ./server/
COPY client/package.json ./client/
RUN npm ci

# Build the server (tsup bundles the @blind/shared source into the output).
COPY tsconfig.base.json ./
COPY shared ./shared
COPY server ./server
RUN npm run build --workspace=server

# Drop dev dependencies so only runtime deps are carried into the final image.
RUN npm prune --omit=dev

# ---- Runtime stage --------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/server/package.json ./server/package.json
COPY --from=build /app/server/dist ./server/dist

WORKDIR /app/server
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1
CMD ["node", "dist/index.js"]
