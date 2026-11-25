# Build the frontend and the read-only datasets
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
RUN npm run build && npm run build:data

# Runtime: the Node server only (it has no npm dependencies)
FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    DB_PATH=/app/var/staysafe.sqlite \
    TILES_DIR=/app/tiles
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:8080/api/health || exit 1
CMD ["node", "server/server.mjs"]
