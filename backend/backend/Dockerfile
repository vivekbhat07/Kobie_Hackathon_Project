# ---- backend/Dockerfile ----
FROM node:20-alpine

WORKDIR /app

# Install runtime dependencies first (better layer caching)
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# App source
COPY src ./src

ENV NODE_ENV=production
ENV PORT=4000
EXPOSE 4000

# Run as the built-in non-root user
USER node

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1

CMD ["node", "src/index.js"]
