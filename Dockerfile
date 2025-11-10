# ============================================================================
# Gabriel Family Clinic - Production Dockerfile
# ============================================================================
# Multi-stage build for optimized production image
# Base image: Node.js Alpine for smaller size
# Security: Non-root user, minimal attack surface
# ============================================================================

# ============================================================================
# Stage 1: Dependencies
# ============================================================================
FROM node:18-alpine AS deps

# Install system dependencies
RUN apk add --no-cache libc6-compat python3 make g++

WORKDIR /app

# Copy dependency files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies with exact versions
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================================================
# Stage 2: Builder
# ============================================================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copy dependencies from previous stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set build-time environment variables
ARG NEXT_PUBLIC_APP_ENV=production
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_APP_ENV=${NEXT_PUBLIC_APP_ENV}
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# ============================================================================
# Stage 3: Runner (Production Image)
# ============================================================================
FROM node:18-alpine AS runner

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Copy built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma schema and migrations
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy custom scripts
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Create necessary directories with correct permissions
RUN mkdir -p /app/.next/cache && \
    chown -R nextjs:nodejs /app

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD node healthcheck.js || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start application
CMD ["./docker-entrypoint.sh"]
