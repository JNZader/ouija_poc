# Iteración 5: Deploy & Monitoring - Ouija Virtual API

## Duración: 2-3 días
## Objetivo: Desplegar a producción con monitoring completo
## Story Points: 10-15
## Equipo: DevOps + Backend Lead

---

# 🎯 OBJETIVOS DE LA ITERACIÓN

Al finalizar esta iteración, el equipo tendrá:

✅ Dockerfile optimizado para producción
✅ Docker Compose para diferentes ambientes
✅ CI/CD pipeline completo (GitHub Actions)
✅ Health checks avanzados
✅ Sistema de monitoreo y alertas
✅ Backups automáticos configurados
✅ Runbook operativo documentado
✅ Sistema desplegado en producción
✅ Documentación de deployment

---

# 📋 BACKLOG DE LA ITERACIÓN

## Épica 1: Dockerización para Producción

### US-5.1: Crear Dockerfile Optimizado Multi-Stage
**Como** DevOps engineer
**Quiero** un Dockerfile optimizado para producción
**Para** desplegar la aplicación eficientemente

**Story Points**: 2
**Asignado a**: DevOps
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Multi-stage build implementado
- [ ] Imagen optimizada (<500MB)
- [ ] Usuario non-root
- [ ] Health check en Dockerfile
- [ ] Build cache optimizado

#### Tareas Técnicas

**T-5.1.1: Crear Dockerfile multi-stage** (1h)

```dockerfile
# Dockerfile
# ============================================
# Stage 1: Dependencies
# ============================================
FROM node:18-alpine AS dependencies

WORKDIR /app

# Instalar dependencias del sistema necesarias para Prisma
RUN apk add --no-cache openssl libc6-compat

# Copiar archivos de dependencias
COPY package*.json ./
COPY prisma ./prisma/

# Instalar todas las dependencias (incluyendo dev)
RUN npm ci

# Generar Prisma Client
RUN npx prisma generate

# ============================================
# Stage 2: Builder
# ============================================
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar dependencias del stage anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Build de la aplicación
RUN npm run build

# Limpiar dev dependencies
RUN npm prune --production

# ============================================
# Stage 3: Production
# ============================================
FROM node:18-alpine AS production

WORKDIR /app

# Crear usuario non-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# Instalar dumb-init para manejo correcto de señales
RUN apk add --no-cache dumb-init

# Copiar archivos necesarios
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Cambiar a usuario non-root
USER nestjs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); });"

# Usar dumb-init como entrypoint
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/main.js"]
```

**T-5.1.2: Crear .dockerignore** (0.25h)

```
# .dockerignore
# Node modules
node_modules
npm-debug.log

# Build artifacts
dist
build
.next

# Tests
coverage
*.spec.ts
*.spec.js
test
*.test.ts
*.test.js

# Development files
.env
.env.local
.env.*.local

# Git
.git
.gitignore
.github

# Documentation
*.md
docs

# IDE
.vscode
.idea
*.swp
*.swo

# Logs
logs
*.log

# OS files
.DS_Store
Thumbs.db

# Docker
Dockerfile*
docker-compose*.yml
.dockerignore
```

**T-5.1.3: Crear Docker Compose para diferentes ambientes** (1h)

```yaml
# docker-compose.yml (Development)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ouija-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: ouija_user
      POSTGRES_PASSWORD: ouija_pass
      POSTGRES_DB: ouija_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ouija_user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ouija-redis-dev
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    build:
      context: .
      dockerfile: Dockerfile
      target: production
    container_name: ouija-backend-dev
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://ouija_user:ouija_pass@postgres:5432/ouija_db
      REDIS_HOST: redis
      REDIS_PORT: 6379
      OLLAMA_URL: ${OLLAMA_URL:-http://host.docker.internal:11434}
      OLLAMA_MODEL: ${OLLAMA_MODEL:-qwen2.5:3b}
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 3s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

```yaml
# docker-compose.prod.yml (Production)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ouija-postgres-prod
    restart: always
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    networks:
      - ouija-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ouija-redis-prod
    restart: always
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - ouija-network
    healthcheck:
      test: ["CMD", "redis-cli", "--pass", "${REDIS_PASSWORD}", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  backend:
    image: ${DOCKER_REGISTRY}/ouija-backend:${VERSION:-latest}
    container_name: ouija-backend-prod
    restart: always
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      DATABASE_URL: ${DATABASE_URL}
      REDIS_HOST: redis
      REDIS_PORT: 6379
      REDIS_PASSWORD: ${REDIS_PASSWORD}
      OLLAMA_URL: ${OLLAMA_URL}
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      PORT: 3000
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    networks:
      - ouija-network
    volumes:
      - ./logs:/app/logs
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"]
      interval: 30s
      timeout: 3s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

  # Nginx reverse proxy (opcional)
  nginx:
    image: nginx:alpine
    container_name: ouija-nginx-prod
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
    networks:
      - ouija-network

networks:
  ouija-network:
    driver: bridge

volumes:
  postgres_data:
  redis_data:
```

**T-5.1.4: Crear scripts de deployment** (0.5h)

```bash
# scripts/deploy.sh
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Variables
ENV=${1:-production}
VERSION=${2:-latest}

echo "Environment: $ENV"
echo "Version: $VERSION"

# Cargar variables de entorno
if [ -f ".env.$ENV" ]; then
    echo "Loading .env.$ENV"
    export $(cat .env.$ENV | grep -v '^#' | xargs)
fi

# Build imagen Docker
echo "📦 Building Docker image..."
docker build -t ouija-backend:$VERSION .

# Tag imagen
if [ ! -z "$DOCKER_REGISTRY" ]; then
    echo "🏷️  Tagging image..."
    docker tag ouija-backend:$VERSION $DOCKER_REGISTRY/ouija-backend:$VERSION
    docker tag ouija-backend:$VERSION $DOCKER_REGISTRY/ouija-backend:latest

    echo "📤 Pushing to registry..."
    docker push $DOCKER_REGISTRY/ouija-backend:$VERSION
    docker push $DOCKER_REGISTRY/ouija-backend:latest
fi

# Detener servicios anteriores
echo "🛑 Stopping old services..."
docker-compose -f docker-compose.prod.yml down

# Ejecutar migraciones
echo "🔄 Running migrations..."
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# Iniciar servicios
echo "▶️  Starting services..."
VERSION=$VERSION docker-compose -f docker-compose.prod.yml up -d

# Health check
echo "🏥 Waiting for health check..."
sleep 10

MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
        echo "✅ Deployment successful!"
        docker-compose -f docker-compose.prod.yml ps
        exit 0
    fi

    echo "Waiting for service to be healthy... ($((RETRY_COUNT+1))/$MAX_RETRIES)"
    sleep 2
    RETRY_COUNT=$((RETRY_COUNT+1))
done

echo "❌ Deployment failed - service not healthy"
docker-compose -f docker-compose.prod.yml logs backend
exit 1
```

```bash
# scripts/rollback.sh
#!/bin/bash
set -e

echo "⏪ Rolling back deployment..."

PREVIOUS_VERSION=${1:-previous}

echo "Rolling back to version: $PREVIOUS_VERSION"

# Detener servicios actuales
docker-compose -f docker-compose.prod.yml down

# Iniciar con versión anterior
VERSION=$PREVIOUS_VERSION docker-compose -f docker-compose.prod.yml up -d

# Health check
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Rollback successful!"
else
    echo "❌ Rollback failed"
    exit 1
fi
```

---

## Épica 2: CI/CD Pipeline

### US-5.2: Implementar Pipeline de CI/CD con GitHub Actions
**Como** desarrollador
**Quiero** pipeline automatizado de CI/CD
**Para** desplegar cambios de forma segura y rápida

**Story Points**: 3
**Asignado a**: DevOps
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Tests automáticos en PRs
- [ ] Linting y type checking
- [ ] Build de Docker en main
- [ ] Deploy automático a staging
- [ ] Deploy manual a producción

#### Tareas Técnicas

**T-5.2.1: Crear workflow de CI** (1h)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  lint:
    name: Lint & Type Check
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript type check
        run: npx tsc --noEmit

      - name: Check formatting
        run: npm run format -- --check

  test:
    name: Unit & Integration Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 3s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
        run: npx prisma migrate deploy

      - name: Run unit tests
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
          REDIS_HOST: localhost
          REDIS_PORT: 6379
        run: npm run test -- --coverage --maxWorkers=2

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

  e2e:
    name: E2E Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 3s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run migrations
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
        run: npx prisma migrate deploy

      - name: Run E2E tests
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
          REDIS_HOST: localhost
          REDIS_PORT: 6379
        run: npm run test:e2e

  security:
    name: Security Audit
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Run npm audit
        run: npm audit --audit-level=moderate
        continue-on-error: true

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        continue-on-error: true
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

**T-5.2.2: Crear workflow de CD** (1h)

```yaml
# .github/workflows/cd.yml
name: CD

on:
  push:
    branches: [main]
    tags:
      - 'v*'

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-push:
    name: Build & Push Docker Image
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    outputs:
      version: ${{ steps.meta.outputs.version }}

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
          cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

  deploy-staging:
    name: Deploy to Staging
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment:
      name: staging
      url: https://staging-api.ouija-virtual.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to staging
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.STAGING_HOST }}
          username: ${{ secrets.STAGING_USER }}
          key: ${{ secrets.STAGING_SSH_KEY }}
          script: |
            cd /opt/ouija-backend
            export VERSION=${{ needs.build-and-push.outputs.version }}
            docker-compose -f docker-compose.staging.yml pull
            docker-compose -f docker-compose.staging.yml up -d
            docker-compose -f docker-compose.staging.yml exec -T backend npx prisma migrate deploy

      - name: Health check
        run: |
          sleep 10
          curl -f https://staging-api.ouija-virtual.com/api/health

  deploy-production:
    name: Deploy to Production
    needs: [build-and-push, deploy-staging]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    environment:
      name: production
      url: https://api.ouija-virtual.com

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Deploy to production
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/ouija-backend
            export VERSION=${{ needs.build-and-push.outputs.version }}

            # Backup database
            ./scripts/backup-db.sh

            # Deploy
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker-compose -f docker-compose.prod.yml exec -T backend npx prisma migrate deploy

      - name: Health check
        run: |
          sleep 15
          curl -f https://api.ouija-virtual.com/api/health

      - name: Rollback on failure
        if: failure()
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.PRODUCTION_HOST }}
          username: ${{ secrets.PRODUCTION_USER }}
          key: ${{ secrets.PRODUCTION_SSH_KEY }}
          script: |
            cd /opt/ouija-backend
            ./scripts/rollback.sh

      - name: Notify deployment
        if: success()
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          text: '🚀 Production deployment successful!'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

**T-5.2.3: Configurar secrets en GitHub** (0.25h)

```bash
# Secrets necesarios en GitHub:

# Docker Registry
GITHUB_TOKEN (auto-generated)

# Staging
STAGING_HOST=staging.example.com
STAGING_USER=deploy
STAGING_SSH_KEY=<private-key>

# Production
PRODUCTION_HOST=prod.example.com
PRODUCTION_USER=deploy
PRODUCTION_SSH_KEY=<private-key>

# Notifications
SLACK_WEBHOOK=https://hooks.slack.com/...

# Security
SNYK_TOKEN=<snyk-token>

# Database (production)
DATABASE_URL=postgresql://...
REDIS_PASSWORD=<password>
```

---

## Épica 3: Monitoring y Observabilidad

### US-5.3: Implementar Sistema de Monitoring
**Como** SRE
**Quiero** sistema de monitoring completo
**Para** detectar y resolver problemas proactivamente

**Story Points**: 3
**Asignado a**: DevOps + Backend Lead
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Prometheus configurado
- [ ] Grafana dashboards creados
- [ ] Alertas configuradas
- [ ] Logs centralizados
- [ ] Métricas de aplicación exportadas

#### Tareas Técnicas

**T-5.3.1: Instalar Prometheus y Grafana** (1h)

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: ouija-prometheus
    restart: always
    ports:
      - "9090:9090"
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: ouija-grafana
    restart: always
    ports:
      - "3001:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: ${GRAFANA_PASSWORD:-admin}
      GF_USERS_ALLOW_SIGN_UP: "false"
    volumes:
      - ./monitoring/grafana/datasources.yml:/etc/grafana/provisioning/datasources/datasources.yml:ro
      - ./monitoring/grafana/dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml:ro
      - ./monitoring/grafana/dashboards:/var/lib/grafana/dashboards:ro
      - grafana_data:/var/lib/grafana
    depends_on:
      - prometheus
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: ouija-node-exporter
    restart: always
    ports:
      - "9100:9100"
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: ouija-cadvisor
    restart: always
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
```

**T-5.3.2: Configurar Prometheus** (0.5h)

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s
  external_labels:
    cluster: 'ouija-backend'
    environment: 'production'

# Alertmanager configuration
alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

# Load rules once and periodically evaluate them
rule_files:
  - "alerts/*.yml"

# Scrape configurations
scrape_configs:
  # Backend API metrics
  - job_name: 'nestjs-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/health/metrics'
    scrape_interval: 10s

  # Node exporter (system metrics)
  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  # cAdvisor (container metrics)
  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  # PostgreSQL
  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  # Redis
  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
```

**T-5.3.3: Crear endpoints de métricas Prometheus** (1h)

```typescript
// src/modules/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // ... endpoints existentes ...

  @Get('metrics')
  @ApiExcludeEndpoint()
  async getMetrics() {
    const [
      totalSessions,
      activeSessions,
      totalMessages,
      activeRooms,
      totalParticipants,
    ] = await Promise.all([
      this.prisma.ouijaSession.count(),
      this.prisma.ouijaSession.count({ where: { status: 'active' } }),
      this.prisma.sessionMessage.count(),
      this.prisma.multiplayerRoom.count({ where: { status: 'active' } }),
      this.prisma.roomParticipant.count(),
    ]);

    // Formato Prometheus
    const metrics = `
# HELP ouija_sessions_total Total number of sessions created
# TYPE ouija_sessions_total counter
ouija_sessions_total ${totalSessions}

# HELP ouija_sessions_active Number of currently active sessions
# TYPE ouija_sessions_active gauge
ouija_sessions_active ${activeSessions}

# HELP ouija_messages_total Total number of messages exchanged
# TYPE ouija_messages_total counter
ouija_messages_total ${totalMessages}

# HELP ouija_rooms_active Number of currently active multiplayer rooms
# TYPE ouija_rooms_active gauge
ouija_rooms_active ${activeRooms}

# HELP ouija_participants_total Total number of multiplayer participants
# TYPE ouija_participants_total gauge
ouija_participants_total ${totalParticipants}

# HELP nodejs_memory_usage_bytes Memory usage in bytes
# TYPE nodejs_memory_usage_bytes gauge
nodejs_memory_usage_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}
nodejs_memory_usage_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}
nodejs_memory_usage_bytes{type="rss"} ${process.memoryUsage().rss}
nodejs_memory_usage_bytes{type="external"} ${process.memoryUsage().external}

# HELP nodejs_uptime_seconds Process uptime in seconds
# TYPE nodejs_uptime_seconds counter
nodejs_uptime_seconds ${process.uptime()}
`.trim();

    return metrics;
  }
}
```

**T-5.3.4: Crear dashboards de Grafana** (0.5h)

```json
// monitoring/grafana/dashboards/ouija-backend.json
{
  "dashboard": {
    "title": "Ouija Virtual Backend",
    "tags": ["backend", "nestjs"],
    "timezone": "browser",
    "panels": [
      {
        "title": "Active Sessions",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "ouija_sessions_active"
          }
        ]
      },
      {
        "title": "Active Rooms",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "ouija_rooms_active"
          }
        ]
      },
      {
        "title": "Messages Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(ouija_messages_total[5m])"
          }
        ]
      },
      {
        "title": "Memory Usage",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "nodejs_memory_usage_bytes{type=\"heap_used\"}"
          }
        ]
      },
      {
        "title": "HTTP Response Time (p95)",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds_bucket)"
          }
        ]
      },
      {
        "title": "Error Rate",
        "type": "graph",
        "datasource": "Prometheus",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      }
    ]
  }
}
```

**T-5.3.5: Configurar alertas** (0.5h)

```yaml
# monitoring/alerts/backend.yml
groups:
  - name: backend_alerts
    interval: 30s
    rules:
      # Alta tasa de errores
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} errors/sec (threshold: 0.05)"

      # Servicio caído
      - alert: ServiceDown
        expr: up{job="nestjs-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Backend service is down"
          description: "The Ouija backend service is not responding"

      # Alto uso de memoria
      - alert: HighMemoryUsage
        expr: nodejs_memory_usage_bytes{type="heap_used"} / nodejs_memory_usage_bytes{type="heap_total"} > 0.9
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage"
          description: "Memory usage is at {{ $value | humanizePercentage }}"

      # Base de datos lenta
      - alert: DatabaseSlowQueries
        expr: rate(prisma_query_duration_seconds_sum[5m]) / rate(prisma_query_duration_seconds_count[5m]) > 1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Database queries are slow"
          description: "Average query time is {{ $value }}s (threshold: 1s)"

      # Redis desconectado
      - alert: RedisDown
        expr: redis_up == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis is down"
          description: "Redis connection is not available"
```

---

## Épica 4: Backups y Disaster Recovery

### US-5.4: Implementar Sistema de Backups
**Como** SRE
**Quiero** backups automáticos y disaster recovery
**Para** proteger los datos en caso de fallo

**Story Points**: 2
**Asignado a**: DevOps
**Prioridad**: ALTA

#### Criterios de Aceptación
- [ ] Backups automáticos de PostgreSQL
- [ ] Backups de Redis (snapshots)
- [ ] Rotación de backups
- [ ] Procedimiento de restore documentado
- [ ] Backups verificados regularmente

#### Tareas Técnicas

**T-5.4.1: Crear scripts de backup** (1h)

```bash
# scripts/backup-db.sh
#!/bin/bash
set -e

echo "🗄️  Starting database backup..."

# Variables
BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME=${POSTGRES_DB:-ouija_db}
DB_USER=${POSTGRES_USER:-ouija_user}
RETENTION_DAYS=7

# Crear directorio de backups
mkdir -p $BACKUP_DIR

# Backup de PostgreSQL
echo "Backing up PostgreSQL..."
PGPASSWORD=$POSTGRES_PASSWORD pg_dump \
    -h ${POSTGRES_HOST:-postgres} \
    -U $DB_USER \
    -d $DB_NAME \
    -F c \
    -f "$BACKUP_DIR/postgres_${DB_NAME}_${TIMESTAMP}.backup"

# Comprimir backup
gzip "$BACKUP_DIR/postgres_${DB_NAME}_${TIMESTAMP}.backup"

# Backup de Redis (RDB snapshot)
echo "Backing up Redis..."
docker exec ouija-redis-prod redis-cli --pass $REDIS_PASSWORD BGSAVE
sleep 5
docker cp ouija-redis-prod:/data/dump.rdb "$BACKUP_DIR/redis_${TIMESTAMP}.rdb"
gzip "$BACKUP_DIR/redis_${TIMESTAMP}.rdb"

# Eliminar backups antiguos
echo "Cleaning old backups (retention: $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

# Verificar backups
BACKUP_COUNT=$(find $BACKUP_DIR -name "*.gz" -mtime -1 | wc -l)
if [ $BACKUP_COUNT -ge 2 ]; then
    echo "✅ Backup completed successfully!"
    echo "Backup files:"
    ls -lh $BACKUP_DIR/*${TIMESTAMP}*.gz
else
    echo "❌ Backup failed!"
    exit 1
fi

# Enviar notificación
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST $SLACK_WEBHOOK \
        -H 'Content-Type: application/json' \
        -d "{\"text\":\"✅ Database backup completed: $TIMESTAMP\"}"
fi
```

```bash
# scripts/restore-db.sh
#!/bin/bash
set -e

echo "♻️  Starting database restore..."

# Variables
BACKUP_FILE=$1
DB_NAME=${POSTGRES_DB:-ouija_db}
DB_USER=${POSTGRES_USER:-ouija_user}

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    echo "Example: $0 /backups/postgres_ouija_db_20250116_100000.backup.gz"
    exit 1
fi

if [ ! -f "$BACKUP_FILE" ]; then
    echo "Error: Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "⚠️  WARNING: This will overwrite the current database!"
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"
read -p "Are you sure? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Detener aplicación
echo "Stopping application..."
docker-compose -f docker-compose.prod.yml stop backend

# Descomprimir backup
echo "Decompressing backup..."
TEMP_BACKUP="/tmp/restore_$(date +%s).backup"
gunzip -c "$BACKUP_FILE" > "$TEMP_BACKUP"

# Restaurar PostgreSQL
echo "Restoring PostgreSQL..."
PGPASSWORD=$POSTGRES_PASSWORD pg_restore \
    -h ${POSTGRES_HOST:-postgres} \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --if-exists \
    "$TEMP_BACKUP"

# Limpiar archivo temporal
rm "$TEMP_BACKUP"

# Reiniciar aplicación
echo "Starting application..."
docker-compose -f docker-compose.prod.yml start backend

# Health check
sleep 10
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Restore completed successfully!"
else
    echo "⚠️  Restore completed but application is not healthy"
    docker-compose -f docker-compose.prod.yml logs backend
fi
```

**T-5.4.2: Configurar cron jobs para backups** (0.25h)

```bash
# crontab -e
# Backup diario a las 2 AM
0 2 * * * /opt/ouija-backend/scripts/backup-db.sh >> /var/log/ouija-backup.log 2>&1

# Backup semanal completo (domingos a las 3 AM)
0 3 * * 0 /opt/ouija-backend/scripts/backup-full.sh >> /var/log/ouija-backup.log 2>&1

# Verificación de backups (diaria a las 4 AM)
0 4 * * * /opt/ouija-backend/scripts/verify-backups.sh >> /var/log/ouija-backup.log 2>&1
```

**T-5.4.3: Crear script de verificación de backups** (0.5h)

```bash
# scripts/verify-backups.sh
#!/bin/bash
set -e

echo "🔍 Verifying backups..."

BACKUP_DIR="/backups"
ERRORS=0

# Verificar que hay backups recientes
RECENT_BACKUPS=$(find $BACKUP_DIR -name "*.gz" -mtime -1 | wc -l)
if [ $RECENT_BACKUPS -eq 0 ]; then
    echo "❌ No recent backups found!"
    ERRORS=$((ERRORS+1))
else
    echo "✅ Found $RECENT_BACKUPS recent backup(s)"
fi

# Verificar integridad de backups
echo "Checking backup integrity..."
for backup in $(find $BACKUP_DIR -name "*.gz" -mtime -1); do
    if gzip -t "$backup" 2>/dev/null; then
        echo "✅ $backup is valid"
    else
        echo "❌ $backup is corrupted!"
        ERRORS=$((ERRORS+1))
    fi
done

# Verificar espacio en disco
DISK_USAGE=$(df -h $BACKUP_DIR | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    echo "⚠️  Disk usage is high: ${DISK_USAGE}%"
    ERRORS=$((ERRORS+1))
fi

# Resultado final
if [ $ERRORS -eq 0 ]; then
    echo "✅ All backups are healthy!"
    exit 0
else
    echo "❌ Found $ERRORS error(s) in backups"

    # Notificar
    if [ ! -z "$SLACK_WEBHOOK" ]; then
        curl -X POST $SLACK_WEBHOOK \
            -H 'Content-Type: application/json' \
            -d "{\"text\":\"❌ Backup verification failed: $ERRORS error(s)\"}"
    fi

    exit 1
fi
```

---

## Épica 5: Documentación Operativa

### US-5.5: Crear Runbook y Documentación Operativa
**Como** ingeniero de operaciones
**Quiero** runbook completo y procedimientos documentados
**Para** resolver incidentes rápidamente

**Story Points**: 1
**Asignado a**: Backend Lead + DevOps
**Prioridad**: MEDIA

#### Tareas Técnicas

**T-5.5.1: Crear runbook operativo** (1h)

```markdown
# docs/RUNBOOK.md
# Runbook Operativo - Ouija Virtual API

## 🚨 Procedimientos de Emergencia

### 1. Servicio Caído

**Síntomas:**
- Health check retorna 500 o timeout
- Prometheus alerta "ServiceDown"
- Usuarios reportan error de conexión

**Diagnóstico:**
```bash
# Verificar estado de contenedores
docker-compose -f docker-compose.prod.yml ps

# Ver logs recientes
docker-compose -f docker-compose.prod.yml logs --tail=100 backend

# Verificar recursos del sistema
htop
df -h
```

**Resolución:**
```bash
# Reiniciar servicio
docker-compose -f docker-compose.prod.yml restart backend

# Si persiste, rebuild y restart
docker-compose -f docker-compose.prod.yml up -d --build backend

# Verificar health
curl http://localhost:3000/api/health
```

**Escalamiento:**
Si el problema persiste después de 2 reinicios, ejecutar rollback:
```bash
./scripts/rollback.sh <version-anterior>
```

---

### 2. Base de Datos Lenta

**Síntomas:**
- Response times >3s
- Prometheus alerta "DatabaseSlowQueries"
- Timeout errors en logs

**Diagnóstico:**
```bash
# Verificar conexiones activas
docker exec ouija-postgres-prod psql -U ouija_user -d ouija_db \
    -c "SELECT count(*) FROM pg_stat_activity;"

# Ver queries lentas
docker exec ouija-postgres-prod psql -U ouija_user -d ouija_db \
    -c "SELECT pid, now() - query_start as duration, query
        FROM pg_stat_activity
        WHERE state = 'active'
        ORDER BY duration DESC;"

# Ver tamaño de tablas
docker exec ouija-postgres-prod psql -U ouija_user -d ouija_db \
    -c "SELECT schemaname, tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
        FROM pg_tables
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;"
```

**Resolución:**
```bash
# Matar queries lentas (solo si es necesario)
docker exec ouija-postgres-prod psql -U ouija_user -d ouija_db \
    -c "SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE state = 'active' AND now() - query_start > interval '5 minutes';"

# Ejecutar VACUUM y ANALYZE
docker exec ouija-postgres-prod psql -U ouija_user -d ouija_db \
    -c "VACUUM ANALYZE;"

# Verificar y optimizar índices
npx prisma db pull
# Revisar schema y agregar índices faltantes
```

---

### 3. Redis Desconectado

**Síntomas:**
- Prometheus alerta "RedisDown"
- WebSocket rooms no funcionan
- Errores "ECONNREFUSED" en logs

**Diagnóstico:**
```bash
# Verificar estado de Redis
docker-compose -f docker-compose.prod.yml ps redis

# Ver logs
docker-compose -f docker-compose.prod.yml logs redis

# Probar conexión
redis-cli -h localhost -p 6379 -a $REDIS_PASSWORD ping
```

**Resolución:**
```bash
# Reiniciar Redis
docker-compose -f docker-compose.prod.yml restart redis

# Verificar que vuelve a funcionar
redis-cli -h localhost -p 6379 -a $REDIS_PASSWORD ping

# Si persiste, verificar red
docker network inspect ouija-network
```

---

### 4. Alto Uso de Memoria

**Síntomas:**
- Prometheus alerta "HighMemoryUsage"
- Sistema lento
- OOM killer en logs

**Diagnóstico:**
```bash
# Ver uso de memoria del contenedor
docker stats ouija-backend-prod

# Ver procesos dentro del contenedor
docker exec ouija-backend-prod ps aux

# Heap snapshot (requiere parar servicio temporalmente)
docker exec ouija-backend-prod node --expose-gc dist/main.js
```

**Resolución:**
```bash
# Reiniciar backend para liberar memoria
docker-compose -f docker-compose.prod.yml restart backend

# Si el problema es recurrente:
# 1. Aumentar límite de memoria en docker-compose.prod.yml
# 2. Investigar memory leaks en el código
# 3. Optimizar queries de base de datos
```

---

### 5. Disco Lleno

**Síntomas:**
- Errores de escritura en logs
- Backups fallan
- Sistema lento

**Diagnóstico:**
```bash
# Ver uso de disco
df -h

# Ver archivos más grandes
du -h /var/lib/docker | sort -rh | head -20
du -h /opt/ouija-backend/logs | sort -rh | head -20
```

**Resolución:**
```bash
# Limpiar logs antiguos
find /opt/ouija-backend/logs -name "*.log" -mtime +7 -delete

# Limpiar imágenes Docker no usadas
docker system prune -a -f

# Limpiar backups antiguos
find /backups -name "*.gz" -mtime +30 -delete

# Verificar espacio liberado
df -h
```

---

## 📊 Monitoreo Regular

### Daily Checks (Automatizado)
- [ ] Health check pasando
- [ ] Backup exitoso
- [ ] No alertas críticas
- [ ] Disk usage <80%
- [ ] Memory usage <80%

### Weekly Checks
- [ ] Revisar logs de errores
- [ ] Verificar métricas de performance
- [ ] Revisar alertas resueltas
- [ ] Actualizar documentación si cambió algo

### Monthly Checks
- [ ] Revisar y actualizar dependencias
- [ ] Test de restore de backups
- [ ] Revisar y optimizar queries
- [ ] Capacity planning

---

## 🔧 Mantenimiento

### Actualización de Dependencias
```bash
# 1. Crear rama
git checkout -b update-dependencies

# 2. Actualizar package.json
npm update

# 3. Ejecutar tests
npm run test
npm run test:e2e

# 4. Deploy a staging
git push origin update-dependencies
# CI/CD despliega a staging automáticamente

# 5. Validar en staging
curl https://staging-api.ouija-virtual.com/api/health

# 6. Merge y deploy a production
git checkout main
git merge update-dependencies
git push origin main
```

### Rotación de Secrets
```bash
# 1. Generar nuevos secrets
NEW_PASSWORD=$(openssl rand -base64 32)

# 2. Actualizar en .env.prod
vim .env.prod

# 3. Reiniciar servicios
docker-compose -f docker-compose.prod.yml restart

# 4. Actualizar en GitHub Secrets
# Ir a Settings > Secrets and variables > Actions
```

---

## 📞 Contactos

### On-Call Rotation
- **Primary**: Backend Lead
- **Secondary**: DevOps Engineer
- **Escalation**: CTO

### External Services
- **Hosting**: [Provider] - Support: support@provider.com
- **Domain**: [Registrar] - Support: support@registrar.com
- **CDN**: [CDN Provider] - Support: support@cdn.com

---

## 📚 Referencias

- [Arquitectura](../arquitectura_simplificada.md)
- [Troubleshooting](./TROUBLESHOOTING.md)
- [API Documentation](./WEBSOCKET_API.md)
- [Deployment Guide](./DEPLOYMENT.md)
```

---

## Checklist de Cierre de Iteración 5

### Dockerización
- [ ] Dockerfile multi-stage optimizado
- [ ] Imagen Docker <500MB
- [ ] Docker Compose para dev/staging/prod
- [ ] Health checks configurados
- [ ] Scripts de deployment funcionando

### CI/CD
- [ ] Pipeline de CI configurado
- [ ] Tests automáticos en PRs
- [ ] Pipeline de CD configurado
- [ ] Deploy a staging automático
- [ ] Deploy a producción manual/semi-automático
- [ ] Rollback automático funcional

### Monitoring
- [ ] Prometheus instalado y configurado
- [ ] Grafana dashboards creados
- [ ] Alertas configuradas
- [ ] Métricas exportadas
- [ ] Notificaciones funcionando

### Backups
- [ ] Scripts de backup funcionando
- [ ] Backups automáticos configurados (cron)
- [ ] Rotación de backups implementada
- [ ] Script de restore documentado
- [ ] Test de restore exitoso

### Documentación
- [ ] Runbook operativo completo
- [ ] Procedimientos de emergencia documentados
- [ ] Deployment guide
- [ ] Contactos actualizados
- [ ] Troubleshooting guide

### Production Ready
- [ ] Aplicación desplegada en staging
- [ ] Tests E2E en staging pasando
- [ ] Performance testing completado
- [ ] Security audit completado
- [ ] Go-live checklist completado

---

## Go-Live Checklist

### Pre-Deploy (T-1 semana)
- [ ] Revisar todos los PRs pendientes
- [ ] Ejecutar full test suite
- [ ] Performance testing
- [ ] Security audit
- [ ] Backup de producción actual
- [ ] Comunicar ventana de mantenimiento

### Deploy Day
- [ ] Anunciar inicio de mantenimiento
- [ ] Backup final de producción
- [ ] Deploy a producción
- [ ] Ejecutar migraciones
- [ ] Smoke tests
- [ ] Health checks
- [ ] Monitoring activo
- [ ] Anunciar fin de mantenimiento

### Post-Deploy (T+24h)
- [ ] Revisar logs de errores
- [ ] Verificar métricas
- [ ] Confirmar backups
- [ ] Revisar alertas
- [ ] Feedback de usuarios
- [ ] Retrospectiva del equipo

---

## Siguientes Pasos Post-Producción

### Semana 1
- Monitoreo intensivo 24/7
- Hot-fixes si es necesario
- Recolectar feedback

### Mes 1
- Optimizaciones basadas en métricas reales
- Ajustar límites y recursos
- Documentar lecciones aprendidas

### Roadmap Futuro
- Implementar rate limiting más granular
- Agregar autenticación JWT
- Implementar caching más agresivo
- Escalar horizontalmente
- Migrar a Kubernetes (opcional)

---

## Recursos Adicionales

### Herramientas Recomendadas

**Monitoring:**
- Prometheus + Grafana
- Sentry (error tracking)
- DataDog (APM)
- New Relic

**CI/CD:**
- GitHub Actions
- GitLab CI
- Jenkins
- ArgoCD

**Infrastructure:**
- Docker + Docker Compose
- Kubernetes (para escalar)
- Terraform (IaC)
- Ansible (configuration management)

### Comandos Útiles

```bash
# Ver logs en tiempo real
docker-compose -f docker-compose.prod.yml logs -f backend

# Ejecutar comando en contenedor
docker-compose -f docker-compose.prod.yml exec backend npm run prisma:studio

# Ver métricas de contenedor
docker stats ouija-backend-prod

# Backup manual
./scripts/backup-db.sh

# Restore backup
./scripts/restore-db.sh /backups/postgres_ouija_db_20250116.backup.gz

# Verificar health
curl http://localhost:3000/api/health

# Ver Grafana dashboards
open http://localhost:3001

# Ver Prometheus
open http://localhost:9090
```

---

**¡Felicitaciones! El proyecto está listo para producción 🚀🎉**
