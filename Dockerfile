# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY sdk/tsconfig.json ./sdk/

# Install dependencies
RUN npm ci

# Copy source code
COPY backend/src ./backend/src
COPY sdk/src ./sdk/src

# Build SDK
RUN npm run build

# Build backend
RUN npx tsc -p tsconfig.json --outDir ./dist

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy built files
COPY --from=builder /app/sdk/dist ./sdk/dist
COPY --from=builder /app/dist ./dist

# Create logs directory
RUN mkdir -p logs

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

# Expose port
EXPOSE 3000

# Start application
CMD ["node", "dist/backend/src/index.js"]
