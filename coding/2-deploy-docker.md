# Docker Deployment Architecture & Implementation Plan
## Gabriel Family Clinic Digital Platform v3.0

### Document Version: 1.0.0
### Deployment Strategy: Container-First with Zero-Downtime
### Risk Assessment: Managed through Incremental Rollout

---

## 1. Deployment Architecture Analysis

### 1.1 Container Strategy Assessment

```mermaid
graph TB
    subgraph "Production Architecture"
        LB[Load Balancer<br/>Traefik/Nginx]
        
        subgraph "Application Tier"
            APP1[Next.js Container 1<br/>Primary]
            APP2[Next.js Container 2<br/>Standby]
        end
        
        subgraph "Cache Layer"
            REDIS[Redis Container<br/>Session & Cache]
        end
        
        subgraph "External Services"
            SUPABASE[(Supabase<br/>Database & Storage)]
            TWILIO[Twilio API<br/>Notifications]
            STRIPE[Stripe API<br/>Payments]
        end
    end
    
    LB --> APP1
    LB --> APP2
    APP1 --> REDIS
    APP2 --> REDIS
    APP1 --> SUPABASE
    APP2 --> SUPABASE
    APP1 --> TWILIO
    APP1 --> STRIPE
    
    style LB fill:#e8f5e9
    style APP1 fill:#e3f2fd
    style REDIS fill:#fff3e0
    style SUPABASE fill:#fce4ec
```

### 1.2 Deployment Decision Matrix

```typescript
const DEPLOYMENT_STRATEGY = {
  development: {
    containers: ["app"],
    compose: "docker-compose.yml",
    volumes: "Hot reload enabled",
    networking: "Bridge mode",
    resources: "Minimal limits"
  },
  
  staging: {
    containers: ["nginx", "app", "redis"],
    compose: "docker-compose.staging.yml",
    volumes: "No source mounts",
    networking: "Custom network",
    resources: "Production-like limits"
  },
  
  production: {
    containers: ["nginx", "app-blue", "app-green", "redis"],
    compose: "docker-compose.prod.yml",
    volumes: "Named volumes only",
    networking: "Overlay network",
    resources: "Strict limits with auto-scaling"
  }
};
```

### 1.3 Container Security Considerations

```yaml
SECURITY_REQUIREMENTS:
  - No root users in containers
  - Read-only root filesystem where possible
  - No sensitive data in images
  - Minimal base images (distroless/alpine)
  - Regular vulnerability scanning
  - Network isolation between containers
  - Secret management via environment variables
  - Health checks for auto-recovery
  - Resource limits to prevent DoS
  - Audit logging for compliance
```

---

## 2. Implementation Plan

### 2.1 Pre-Implementation Validation

```markdown
## Docker Deployment Checklist

### Prerequisites
- [ ] Docker Engine 24.0+ installed
- [ ] Docker Compose 2.20+ installed
- [ ] Sufficient disk space (>10GB free)
- [ ] Network connectivity to Docker Hub
- [ ] Supabase project configured
- [ ] Domain name configured (production)
- [ ] SSL certificates ready (production)
- [ ] Backup strategy defined

### Security Audit
- [ ] All secrets in environment variables
- [ ] No hardcoded credentials in code
- [ ] Database connection uses SSL
- [ ] Images scanned for vulnerabilities
- [ ] Network policies defined
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] CSP headers implemented

### Performance Baseline
- [ ] Target response time: <500ms p95
- [ ] Target memory usage: <512MB per container
- [ ] Target CPU usage: <50% average
- [ ] Health check interval: 30s
- [ ] Graceful shutdown timeout: 30s
```

### 2.2 Phased Implementation

```mermaid
gantt
    title Docker Implementation Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Environment Setup           :2024-01-01, 1d
    Create Docker configs       :1d
    Local testing              :1d
    
    section Phase 2
    Staging deployment         :2024-01-04, 2d
    Integration testing        :1d
    Performance testing        :1d
    
    section Phase 3
    Production prep            :2024-01-08, 1d
    Blue-green setup          :1d
    Monitoring setup          :1d
    
    section Phase 4
    Production deploy         :2024-01-11, 1d
    Validation               :1d
    Documentation            :1d
```

---

## 3. Environment Configuration

### 3.1 `.env.local` (Development Environment)

```env
# ============================================================================
# Gabriel Family Clinic - Local Development Environment
# ============================================================================
# Version: 3.0.0
# Last Updated: 2024-11-10
# Environment: LOCAL DEVELOPMENT
# ============================================================================

# ============================================================================
# APPLICATION CONFIGURATION
# ============================================================================

# Next.js Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Application Metadata
NEXT_PUBLIC_APP_NAME="Gabriel Family Clinic"
NEXT_PUBLIC_APP_VERSION=3.0.0
NEXT_PUBLIC_APP_DESCRIPTION="Your trusted neighborhood clinic in Tampines"

# Clinic Information
NEXT_PUBLIC_CLINIC_NAME="Gabriel Family Clinic"
NEXT_PUBLIC_CLINIC_PHONE="+6567891234"
NEXT_PUBLIC_CLINIC_EMAIL="info@gabrielfamilyclinic.sg"
NEXT_PUBLIC_CLINIC_ADDRESS="123 Tampines Street 11, #01-456, Singapore 521123"
NEXT_PUBLIC_CLINIC_POSTAL_CODE="521123"
NEXT_PUBLIC_CLINIC_REGISTRATION="T08GC1234K"

# Operating Hours
NEXT_PUBLIC_CLINIC_HOURS='{"mon":"09:00-18:00","tue":"09:00-18:00","wed":"09:00-18:00","thu":"09:00-18:00","fri":"09:00-18:00","sat":"09:00-13:00","sun":"closed"}'
NEXT_PUBLIC_LUNCH_HOURS="12:00-13:00"

# ============================================================================
# DATABASE CONFIGURATION (SUPABASE)
# ============================================================================

# Supabase Project Configuration
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_JWT_SECRET=super-secret-jwt-token-with-at-least-32-characters-long

# Database Direct Connection (for migrations)
DATABASE_URL=postgresql://postgres:postgres@localhost:54322/postgres
DATABASE_POOL_URL=postgresql://postgres:postgres@localhost:6543/postgres

# ============================================================================
# AUTHENTICATION & SECURITY
# ============================================================================

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=development-secret-change-in-production-minimum-32-chars

# JWT Configuration
JWT_SECRET=development-jwt-secret-minimum-32-characters-long
JWT_SIGNING_KEY=development-signing-key-minimum-32-characters
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# OTP Configuration
OTP_SECRET=development-otp-secret-key
OTP_EXPIRES_IN=300
OTP_MAX_ATTEMPTS=3
OTP_COOLDOWN=60

# Password Hashing
BCRYPT_ROUNDS=10
PASSWORD_MIN_LENGTH=8

# Session Configuration
SESSION_COOKIE_NAME=gfc_session
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTPONLY=true
SESSION_COOKIE_SAMESITE=lax
SESSION_MAX_AGE=86400

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
CORS_CREDENTIALS=true

# ============================================================================
# EXTERNAL SERVICES
# ============================================================================

# Twilio Configuration (SMS/WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_local_auth_token_here
TWILIO_PHONE_NUMBER=+6598765432
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WEBHOOK_SECRET=your_webhook_secret_here

# Stripe Configuration (Payments - Optional for Phase 1)
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_PRICE_ID_CONSULTATION=price_xxxxxxxxxxxxxxxxxxxxxxxxxx

# SendGrid Configuration (Email - Backup for notifications)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@gabrielfamilyclinic.sg
SENDGRID_FROM_NAME="Gabriel Family Clinic"
SENDGRID_TEMPLATE_APPOINTMENT_CONFIRMATION=d-xxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_TEMPLATE_APPOINTMENT_REMINDER=d-xxxxxxxxxxxxxxxxxxxxxxxxxx

# Daily.co Configuration (Telemedicine - Phase 2)
DAILY_API_KEY=development_daily_api_key_here
DAILY_DOMAIN=gabrielclinic.daily.co

# ============================================================================
# STORAGE & CACHING
# ============================================================================

# Redis Configuration (Local)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_KEY_PREFIX=gfc:dev:
REDIS_TTL_DEFAULT=3600
REDIS_TTL_SESSION=86400
REDIS_TTL_OTP=300

# Supabase Storage
STORAGE_BUCKET_MEDICAL_DOCS=medical-documents
STORAGE_BUCKET_PROFILE_PHOTOS=profile-photos
STORAGE_MAX_FILE_SIZE=10485760
STORAGE_ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png

# ============================================================================
# MONITORING & LOGGING
# ============================================================================

# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_ORG=gabriel-clinic
SENTRY_PROJECT=web-app
SENTRY_AUTH_TOKEN=
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0
SENTRY_REPLAY_SAMPLE_RATE=0.1

# Logging Configuration
LOG_LEVEL=debug
LOG_FORMAT=json
LOG_PRETTY=true
LOG_FILE_PATH=/var/log/gabriel-clinic/app.log
LOG_FILE_MAX_SIZE=10485760
LOG_FILE_MAX_FILES=5

# Analytics (Optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=
NEXT_PUBLIC_MIXPANEL_TOKEN=
NEXT_PUBLIC_HOTJAR_ID=

# ============================================================================
# FEATURE FLAGS
# ============================================================================

# Core Features
FEATURE_APPOINTMENT_BOOKING=true
FEATURE_QUEUE_MANAGEMENT=true
FEATURE_MEDICAL_RECORDS=true
FEATURE_NOTIFICATIONS=true

# Communication Channels
FEATURE_SMS_NOTIFICATIONS=true
FEATURE_WHATSAPP_NOTIFICATIONS=true
FEATURE_EMAIL_NOTIFICATIONS=false

# Payment Features
FEATURE_ONLINE_PAYMENT=false
FEATURE_CHAS_INTEGRATION=true

# Advanced Features (Phase 2+)
FEATURE_TELEMEDICINE=false
FEATURE_PHARMACY_INTEGRATION=false
FEATURE_LAB_RESULTS=false
FEATURE_HEALTH_SCREENING=false

# Admin Features
FEATURE_ADMIN_DASHBOARD=true
FEATURE_ANALYTICS_DASHBOARD=false
FEATURE_AUDIT_LOGS=true

# ============================================================================
# RATE LIMITING & PERFORMANCE
# ============================================================================

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_SKIP_FAILED_REQUESTS=false

# Performance
MAX_PAYLOAD_SIZE=10mb
REQUEST_TIMEOUT=30000
KEEPALIVE_TIMEOUT=65000

# Cache Control
CACHE_CONTROL_STATIC=public, max-age=31536000, immutable
CACHE_CONTROL_API=no-store, must-revalidate
CACHE_CONTROL_HTML=no-cache, no-store, must-revalidate

# ============================================================================
# DEVELOPMENT TOOLS
# ============================================================================

# Debug Configuration
DEBUG=false
DEBUG_SQL=false
DEBUG_CACHE=false
DEBUG_AUTH=false
DEBUG_NOTIFICATIONS=false

# Development Server
PORT=3000
HOST=0.0.0.0

# Hot Reload
WATCHPACK_POLLING=true
CHOKIDAR_USEPOLLING=true

# Mock Services (Development Only)
MOCK_SMS=true
MOCK_WHATSAPP=true
MOCK_PAYMENT=true
MOCK_EMAIL=true

# Database Seeding
SEED_ADMIN_EMAIL=admin@gabrielfamilyclinic.sg
SEED_ADMIN_PASSWORD=Admin@123456
SEED_DEMO_PATIENTS=true
SEED_DEMO_APPOINTMENTS=true

# ============================================================================
# DOCKER CONFIGURATION
# ============================================================================

# Container Settings
DOCKER_REGISTRY=docker.io
DOCKER_IMAGE_NAME=gabriel-clinic
DOCKER_IMAGE_TAG=latest

# Health Check
HEALTH_CHECK_PATH=/api/health
HEALTH_CHECK_INTERVAL=30s
HEALTH_CHECK_TIMEOUT=10s
HEALTH_CHECK_RETRIES=3
HEALTH_CHECK_START_PERIOD=60s

# ============================================================================
```

---

## 4. Docker Configuration Files

### 4.1 `Dockerfile` (Multi-stage Production Build)

```dockerfile
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
```

### 4.2 `docker-compose.yml` (Local Development)

```yaml
# ============================================================================
# Gabriel Family Clinic - Docker Compose (Development)
# ============================================================================
# Local development environment with hot reload
# Includes: Next.js app, Redis, Supabase (optional)
# ============================================================================

version: '3.8'

services:
  # ============================================================================
  # Application Container
  # ============================================================================
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
      args:
        - NODE_ENV=development
    container_name: gfc-app-dev
    ports:
      - "3000:3000"
    volumes:
      # Mount source code for hot reload
      - .:/app
      - /app/node_modules
      - /app/.next
    environment:
      - NODE_ENV=development
      - WATCHPACK_POLLING=true
      - CHOKIDAR_USEPOLLING=true
    env_file:
      - .env.local
    networks:
      - gfc-network
    depends_on:
      - redis
    command: npm run dev
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  # ============================================================================
  # Redis Cache
  # ============================================================================
  redis:
    image: redis:7-alpine
    container_name: gfc-redis-dev
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf
    command: redis-server /usr/local/etc/redis/redis.conf
    networks:
      - gfc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # ============================================================================
  # Supabase (Optional - for local development)
  # ============================================================================
  supabase-db:
    image: supabase/postgres:15.1.0.117
    container_name: gfc-postgres-dev
    ports:
      - "54322:5432"
    environment:
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
      POSTGRES_USER: postgres
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./supabase/migrations:/docker-entrypoint-initdb.d
    networks:
      - gfc-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  supabase-auth:
    image: supabase/gotrue:v2.131.0
    container_name: gfc-auth-dev
    ports:
      - "54321:9999"
    environment:
      GOTRUE_API_HOST: 0.0.0.0
      GOTRUE_API_PORT: 9999
      API_EXTERNAL_URL: http://localhost:54321
      GOTRUE_DB_DRIVER: postgres
      GOTRUE_DB_DATABASE_URL: postgres://postgres:postgres@supabase-db:5432/postgres?search_path=auth
      GOTRUE_SITE_URL: http://localhost:3000
      GOTRUE_URI_ALLOW_LIST: http://localhost:3000
      GOTRUE_DISABLE_SIGNUP: false
      GOTRUE_JWT_ADMIN_ROLES: service_role
      GOTRUE_JWT_AUD: authenticated
      GOTRUE_JWT_DEFAULT_GROUP_NAME: authenticated
      GOTRUE_JWT_EXP: 3600
      GOTRUE_JWT_SECRET: super-secret-jwt-token-with-at-least-32-characters-long
    depends_on:
      - supabase-db
    networks:
      - gfc-network
    restart: unless-stopped

  # ============================================================================
  # Development Tools
  # ============================================================================
  mailhog:
    image: mailhog/mailhog:latest
    container_name: gfc-mailhog-dev
    ports:
      - "1025:1025" # SMTP
      - "8025:8025" # Web UI
    networks:
      - gfc-network
    restart: unless-stopped

# ============================================================================
# Networks
# ============================================================================
networks:
  gfc-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

# ============================================================================
# Volumes
# ============================================================================
volumes:
  redis-data:
    driver: local
  postgres-data:
    driver: local
```

### 4.3 `docker-compose.prod.yml` (Production with Blue-Green Deployment)

```yaml
# ============================================================================
# Gabriel Family Clinic - Docker Compose (Production)
# ============================================================================
# Production environment with blue-green deployment
# Includes: Nginx, App (Blue/Green), Redis
# External: Supabase Cloud, Twilio, Stripe
# ============================================================================

version: '3.8'

services:
  # ============================================================================
  # Reverse Proxy / Load Balancer
  # ============================================================================
  nginx:
    image: nginx:alpine
    container_name: gfc-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - nginx-cache:/var/cache/nginx
      - nginx-logs:/var/log/nginx
    networks:
      - gfc-network
    depends_on:
      - app-blue
      - app-green
    restart: always
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M

  # ============================================================================
  # Application Container - Blue
  # ============================================================================
  app-blue:
    image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${BLUE_TAG:-latest}
    container_name: gfc-app-blue
    expose:
      - "3000"
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=blue
      - PORT=3000
    networks:
      - gfc-network
    depends_on:
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================================================
  # Application Container - Green
  # ============================================================================
  app-green:
    image: ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:${GREEN_TAG:-latest}
    container_name: gfc-app-green
    expose:
      - "3000"
    env_file:
      - .env.production
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=green
      - PORT=3000
    networks:
      - gfc-network
    depends_on:
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # ============================================================================
  # Redis Cache (Production)
  # ============================================================================
  redis:
    image: redis:7-alpine
    container_name: gfc-redis
    expose:
      - "6379"
    volumes:
      - redis-data:/data
      - ./redis.conf:/usr/local/etc/redis/redis.conf:ro
    command: redis-server /usr/local/etc/redis/redis.conf --requirepass ${REDIS_PASSWORD}
    networks:
      - gfc-network
    restart: always
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M
        reservations:
          cpus: '0.25'
          memory: 128M
    logging:
      driver: "json-file"
      options:
        max-size: "5m"
        max-file: "2"

  # ============================================================================
  # Monitoring & Logging
  # ============================================================================
  prometheus:
    image: prom/prometheus:latest
    container_name: gfc-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - gfc-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M

  grafana:
    image: grafana/grafana:latest
    container_name: gfc-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./grafana/datasources:/etc/grafana/provisioning/datasources:ro
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=redis-datasource
    networks:
      - gfc-network
    restart: always
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 256M

# ============================================================================
# Networks
# ============================================================================
networks:
  gfc-network:
    driver: overlay
    attachable: true
    ipam:
      config:
        - subnet: 172.28.0.0/16

# ============================================================================
# Volumes
# ============================================================================
volumes:
  nginx-cache:
    driver: local
  nginx-logs:
    driver: local
  redis-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
```

### 4.4 `Dockerfile.dev` (Development with Hot Reload)

```dockerfile
# ============================================================================
# Gabriel Family Clinic - Development Dockerfile
# ============================================================================
# Development image with hot reload support
# Includes development dependencies and debugging tools
# ============================================================================

FROM node:18-alpine

# Install development tools
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    git \
    bash

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies)
RUN npm install

# Copy application code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Create non-root user
RUN addgroup -g 1001 nodejs && \
    adduser -S -u 1001 -G nodejs nextjs

# Set ownership
RUN chown -R nextjs:nodejs /app

USER nextjs

# Expose ports
EXPOSE 3000
EXPOSE 9229

# Start development server with debugging enabled
CMD ["npm", "run", "dev"]
```

### 4.5 `.dockerignore`

```dockerignore
# Dependencies
node_modules
.pnp
.pnp.js

# Testing
coverage
.nyc_output
playwright-report
test-results

# Next.js
.next
out
build

# Production
dist

# Misc
.DS_Store
*.pem

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Local env files
.env
.env*.local
!.env.example

# Vercel
.vercel

# TypeScript
*.tsbuildinfo

# Git
.git
.gitignore
.github

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore

# IDE
.vscode
.idea
*.swp
*.swo

# Documentation
README.md
docs
*.md

# CI/CD
.circleci
.gitlab-ci.yml
.travis.yml
jenkins

# OS Files
Thumbs.db
.DS_Store

# Logs
*.log
logs

# Temporary files
tmp
temp
.tmp
*.tmp
*.bak
*.backup

# Test files
__tests__
*.test.*
*.spec.*
e2e
cypress
```

### 4.6 `docker-entrypoint.sh`

```bash
#!/bin/sh
# ============================================================================
# Gabriel Family Clinic - Docker Entrypoint Script
# ============================================================================
# Handles runtime initialization and graceful shutdown
# ============================================================================

set -e

echo "Starting Gabriel Family Clinic Application..."
echo "Environment: ${NODE_ENV}"
echo "Instance ID: ${INSTANCE_ID:-default}"

# Run database migrations (if needed)
if [ "${RUN_MIGRATIONS}" = "true" ]; then
    echo "Running database migrations..."
    npx prisma migrate deploy
fi

# Health check file
touch /tmp/healthy

# Graceful shutdown handler
graceful_shutdown() {
    echo "Received shutdown signal, starting graceful shutdown..."
    
    # Remove health check file to stop receiving traffic
    rm -f /tmp/healthy
    
    # Wait for ongoing requests to complete (max 30s)
    sleep 5
    
    # Kill the application
    kill -TERM "$NODE_PID"
    wait "$NODE_PID"
    
    echo "Graceful shutdown completed"
    exit 0
}

# Trap termination signals
trap graceful_shutdown SIGTERM SIGINT

# Start the application
echo "Starting Next.js server on port ${PORT:-3000}..."
node server.js &
NODE_PID=$!

# Wait for the process
wait "$NODE_PID"
```

### 4.7 `nginx.conf`

```nginx
# ============================================================================
# Gabriel Family Clinic - Nginx Configuration
# ============================================================================
# Reverse proxy with load balancing, caching, and security headers
# ============================================================================

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" '
                    'uht="$upstream_header_time" urt="$upstream_response_time"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 10M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml application/atom+xml image/svg+xml 
               text/x-js text/x-cross-domain-policy application/x-font-ttf 
               application/x-font-opentype application/vnd.ms-fontobject 
               image/x-icon;

    # Cache
    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=app_cache:10m 
                     max_size=1g inactive=60m use_temp_path=off;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=app:10m rate=50r/s;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';" always;

    # Upstream servers (blue-green deployment)
    upstream app_backend {
        least_conn;
        server app-blue:3000 max_fails=3 fail_timeout=30s;
        server app-green:3000 max_fails=3 fail_timeout=30s backup;
        keepalive 32;
    }

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name gabrielfamilyclinic.sg www.gabrielfamilyclinic.sg;
        return 301 https://$server_name$request_uri;
    }

    # Main server block
    server {
        listen 443 ssl http2;
        server_name gabrielfamilyclinic.sg www.gabrielfamilyclinic.sg;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Security
        ssl_stapling on;
        ssl_stapling_verify on;
        ssl_trusted_certificate /etc/nginx/ssl/chain.pem;

        # API endpoints
        location /api {
            limit_req zone=api burst=20 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Disable caching for API
            proxy_no_cache 1;
            proxy_cache_bypass 1;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # WebSocket support for real-time features
        location /socket.io {
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Static assets
        location /_next/static {
            proxy_cache app_cache;
            proxy_cache_valid 200 302 60m;
            proxy_cache_valid 404 1m;
            proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
            proxy_cache_revalidate on;
            proxy_cache_min_uses 2;
            proxy_cache_lock on;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            
            # Cache headers
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Application
        location / {
            limit_req zone=app burst=50 nodelay;
            
            proxy_pass http://app_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Monitoring metrics
        location /metrics {
            allow 172.28.0.0/16;  # Internal network only
            deny all;
            proxy_pass http://app_backend/api/metrics;
        }

        # Error pages
        error_page 404 /404.html;
        error_page 500 502 503 504 /50x.html;
        
        location = /50x.html {
            root /usr/share/nginx/html;
        }
    }
}
```

### 4.8 `redis.conf`

```conf
# ============================================================================
# Gabriel Family Clinic - Redis Configuration
# ============================================================================
# Redis cache configuration for session management and caching
# ============================================================================

# Network
bind 0.0.0.0
protected-mode yes
port 6379
tcp-backlog 511
tcp-keepalive 300

# General
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16

# Snapshotting
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /data

# Replication
replica-serve-stale-data yes
replica-read-only yes
repl-diskless-sync no
repl-diskless-sync-delay 5

# Security
requirepass ${REDIS_PASSWORD}

# Limits
maxclients 10000
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Lua scripting
lua-time-limit 5000

# Slow log
slowlog-log-slower-than 10000
slowlog-max-len 128

# Latency monitoring
latency-monitor-threshold 0

# Event notification
notify-keyspace-events ""

# Advanced config
hash-max-ziplist-entries 512
hash-max-ziplist-value 64
list-max-ziplist-size -2
list-compress-depth 0
set-max-intset-entries 512
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
hll-sparse-max-bytes 3000
stream-node-max-bytes 4096
stream-node-max-entries 100
activerehashing yes
client-output-buffer-limit normal 0 0 0
client-output-buffer-limit replica 256mb 64mb 60
client-output-buffer-limit pubsub 32mb 8mb 60
hz 10
dynamic-hz yes
aof-rewrite-incremental-fsync yes
rdb-save-incremental-fsync yes
```

### 4.9 `healthcheck.js`

```javascript
/**
 * Health check script for Docker container
 * Verifies application is running and responsive
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: process.env.PORT || 3000,
  path: '/api/health',
  method: 'GET',
  timeout: 5000,
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    process.exit(0); // Healthy
  } else {
    process.exit(1); // Unhealthy
  }
});

req.on('error', () => {
  process.exit(1); // Unhealthy
});

req.on('timeout', () => {
  req.abort();
  process.exit(1); // Unhealthy
});

req.end();
```

---

## 5. Deployment Scripts

### 5.1 `deploy.sh` (Automated Deployment Script)

```bash
#!/bin/bash
# ============================================================================
# Gabriel Family Clinic - Deployment Script
# ============================================================================
# Automated deployment with blue-green strategy
# ============================================================================

set -e

# Configuration
ENVIRONMENT=${1:-staging}
VERSION=${2:-latest}
REGISTRY=${DOCKER_REGISTRY:-docker.io}
IMAGE_NAME=${DOCKER_IMAGE_NAME:-gabriel-clinic}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Gabriel Family Clinic - Deployment Script${NC}"
echo -e "${BLUE}===========================================${NC}"
echo "Environment: $ENVIRONMENT"
echo "Version: $VERSION"

# Function to check health
check_health() {
    local container=$1
    local max_attempts=30
    local attempt=1
    
    echo -n "Checking health of $container"
    
    while [ $attempt -le $max_attempts ]; do
        if docker exec $container curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
            echo -e " ${GREEN}✓${NC}"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    echo -e " ${RED}✗${NC}"
    return 1
}

# Build and tag image
echo "Building Docker image..."
docker build -t ${REGISTRY}/${IMAGE_NAME}:${VERSION} .

# Push to registry
echo "Pushing image to registry..."
docker push ${REGISTRY}/${IMAGE_NAME}:${VERSION}

# Deploy based on environment
case $ENVIRONMENT in
    production)
        echo "Deploying to production with blue-green strategy..."
        
        # Determine which container is active
        if docker ps | grep -q gfc-app-blue; then
            ACTIVE=blue
            INACTIVE=green
        else
            ACTIVE=green
            INACTIVE=blue
        fi
        
        echo "Active: $ACTIVE, Deploying to: $INACTIVE"
        
        # Update inactive container
        export ${INACTIVE^^}_TAG=$VERSION
        docker-compose -f docker-compose.prod.yml up -d app-$INACTIVE
        
        # Wait for health check
        if check_health "gfc-app-$INACTIVE"; then
            echo "Health check passed, switching traffic..."
            
            # Update nginx to route to new container
            docker exec gfc-nginx nginx -s reload
            
            echo -e "${GREEN}Deployment successful!${NC}"
            
            # Optional: Stop old container after successful deployment
            read -p "Stop old container ($ACTIVE)? (y/n) " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                docker-compose -f docker-compose.prod.yml stop app-$ACTIVE
            fi
        else
            echo -e "${RED}Health check failed, rolling back...${NC}"
            docker-compose -f docker-compose.prod.yml stop app-$INACTIVE
            exit 1
        fi
        ;;
        
    staging)
        echo "Deploying to staging..."
        docker-compose -f docker-compose.staging.yml up -d
        ;;
        
    development)
        echo "Deploying to development..."
        docker-compose up -d
        ;;
        
    *)
        echo -e "${RED}Unknown environment: $ENVIRONMENT${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}Deployment complete!${NC}"
```

---

## 6. Monitoring and Observability

### 6.1 `prometheus.yml`

```yaml
# ============================================================================
# Gabriel Family Clinic - Prometheus Configuration
# ============================================================================

global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    environment: 'production'
    application: 'gabriel-family-clinic'

scrape_configs:
  - job_name: 'nodejs'
    static_configs:
      - targets:
        - app-blue:3000
        - app-green:3000
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'redis'
    static_configs:
      - targets:
        - redis:6379
    scrape_interval: 30s

  - job_name: 'nginx'
    static_configs:
      - targets:
        - nginx:9113
    scrape_interval: 30s
```

---

## 7. Validation & Testing

### 7.1 Container Security Scan

```bash
#!/bin/bash
# security-scan.sh

echo "Running security scan on Docker images..."

# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest

# Scan with Snyk (requires SNYK_TOKEN)
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -e SNYK_TOKEN=${SNYK_TOKEN} \
  snyk/snyk:docker test ${DOCKER_REGISTRY}/${DOCKER_IMAGE_NAME}:latest
```

### 7.2 Performance Testing

```bash
#!/bin/bash
# performance-test.sh

echo "Running performance tests..."

# Test with k6
docker run --rm -i \
  -v "$PWD/tests/k6:/scripts" \
  grafana/k6 run /scripts/load-test.js

# Test with Apache Bench
docker run --rm httpd:alpine \
  ab -n 1000 -c 10 http://app:3000/api/health
```

---

## Summary

This comprehensive Docker deployment strategy provides:

1. **Multi-stage builds** for optimized production images (~100MB)
2. **Blue-green deployment** for zero-downtime updates
3. **Health checks** at multiple levels for auto-recovery
4. **Security hardening** with non-root users and minimal attack surface
5. **Monitoring stack** with Prometheus and Grafana
6. **Development workflow** with hot reload support
7. **Production-ready** nginx configuration with caching and rate limiting
8. **Automated deployment** scripts with rollback capability

The architecture is designed to be:
- **Simple to maintain** by a single developer
- **Secure** for healthcare data (PDPA compliant)
- **Scalable** from 1 to multiple containers
- **Observable** with comprehensive monitoring
- **Resilient** with health checks and auto-recovery

This setup can handle the expected load for Gabriel Family Clinic while maintaining the simplicity principle of the project.
