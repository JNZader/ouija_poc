# Iteración 4: Deploy en Koyeb con Ollama

## Objetivos

Desplegar el **sistema completo en producción** en Koyeb, incluyendo Ollama en container.

## Resumen Ejecutivo

```
Duración:     1 semana
Complejidad:  21 puntos
Features:     6 tareas
Tests:        5+ smoke tests
Deploy:       Koyeb Production
```

## Arquitectura de Producción

```
Internet
   ↓
Koyeb Load Balancer
   ↓
┌─────────────────────────────────┐
│ Docker Container (Koyeb)        │
│                                 │
│ ┌─────────────────────────┐    │
│ │ NestJS Backend          │    │
│ │ (port 3000)             │    │
│ └─────────────────────────┘    │
│                                 │
│ ┌─────────────────────────┐    │
│ │ Ollama Service          │    │
│ │ (internal only)         │    │
│ │ Model: qwen2.5:0.5b     │    │
│ └─────────────────────────┘    │
│                                 │
│ ┌─────────────────────────┐    │
│ │ SQLite (embedded)       │    │
│ │ /app/data/prod.db       │    │
│ └─────────────────────────┘    │
└─────────────────────────────────┘
         ↓
External APIs:
- Groq Cloud (primary)
```

## Decisiones Técnicas

### ¿Por qué Koyeb?

**Comparación**:
| Plataforma | Free Tier | Docker | Ollama | Auto-deploy |
|------------|-----------|--------|--------|-------------|
| Koyeb | 512MB RAM | ✅ | ⚠️ Tight | ✅ |
| Railway | 500h/mes | ✅ | ✅ | ✅ |
| Render | 750h/mes | ✅ | ⚠️ Slow | ✅ |
| Fly.io | 3GB RAM | ✅ | ✅ | ✅ |

**Decisión**: Koyeb como primario, Railway como plan B

**Razones**:
- Docker nativo
- Deploy desde GitHub
- Free tier permanente
- Global CDN

### Limitaciones de Ollama en Koyeb

**Problema**: Koyeb free tier = 512MB RAM
**Realidad**: qwen2.5:0.5b necesita ~2GB RAM

**Solución**: Ollama como best-effort
```
En Producción:
1. Groq (primario) → 90% tráfico
2. Ollama (si cabe en memoria) → 5% tráfico
3. SQLite (siempre) → 5% tráfico
```

**Alternativa**: Railway (2GB RAM) si Ollama es crítico

## Tareas Principales

### [IT4-001] Dockerfile Multi-Stage (8 pts)

**Objetivo**: Dockerfile optimizado para producción

```dockerfile
# Dockerfile
# STAGE 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma
RUN npm ci --only=production && \
    npm install -g prisma

# Copy source
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build application
RUN npm run build

# STAGE 2: Ollama
FROM ollama/ollama:latest AS ollama

# Download model
RUN ollama pull qwen2.5:0.5b

# STAGE 3: Production
FROM node:20-alpine

WORKDIR /app

# Install Ollama binary (lightweight)
COPY --from=ollama /usr/bin/ollama /usr/bin/ollama

# Copy built app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Copy Ollama models
COPY --from=ollama /root/.ollama /root/.ollama

# Create data directory for SQLite
RUN mkdir -p /app/data

# Seed database
COPY prisma/seed.ts ./prisma/
RUN npx prisma db push && \
    npx ts-node prisma/seed.ts

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => { process.exit(r.statusCode === 200 ? 0 : 1); })"

# Start script
COPY scripts/start-production.sh ./
RUN chmod +x start-production.sh

CMD ["./start-production.sh"]
```

**Start script**:
```bash
#!/bin/sh
# scripts/start-production.sh

echo "🚀 Starting Ouija Virtual Backend..."

# Start Ollama in background (best-effort)
echo "🤖 Starting Ollama..."
ollama serve &
OLLAMA_PID=$!

# Wait for Ollama to be ready (with timeout)
timeout=30
while [ $timeout -gt 0 ]; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama ready"
    break
  fi
  timeout=$((timeout-1))
  sleep 1
done

if [ $timeout -eq 0 ]; then
  echo "⚠️ Ollama failed to start (continuing without it)"
fi

# Start backend
echo "🚀 Starting NestJS backend..."
exec node dist/main.js
```

**¿Por qué multi-stage?**
- **Reduce tamaño**: Solo artifacts necesarios
- **Seguridad**: No incluye código fuente
- **Velocidad**: Cachea layers independientes

---

### [IT4-002] Deploy en Koyeb (5 pts)

**Objetivo**: Configurar deploy automático

#### Paso 1: Crear cuenta Koyeb
```bash
# 1. Ir a https://koyeb.com
# 2. Sign up con GitHub
# 3. Conectar repositorio
```

#### Paso 2: Configurar Service
```yaml
# koyeb.yaml
name: ouija-virtual-backend

services:
  - name: backend
    type: web
    git:
      repository: github.com/tu-usuario/ouija-virtual
      branch: main
      workdir: backend-simple

    build:
      type: docker
      dockerfile: Dockerfile

    instance:
      type: nano  # Free tier (512MB RAM)

    ports:
      - port: 3000
        protocol: http

    env:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        value: file:/app/data/prod.db
      - key: OLLAMA_URL
        value: http://localhost:11434
      - key: OLLAMA_MODEL
        value: qwen2.5:0.5b
      - key: GROQ_API_KEY
        secret: GROQ_API_KEY  # Set in Koyeb dashboard
      - key: GROQ_MODEL
        value: llama-3.1-8b-instant

    health_checks:
      - path: /health
        port: 3000
        initial_delay: 60
        interval: 30

    autoscaling:
      min: 1
      max: 1  # Free tier = 1 instance
```

#### Paso 3: Configurar Secrets
```bash
# En Koyeb Dashboard:
# Settings → Secrets → Add Secret
#
# Name: GROQ_API_KEY
# Value: gsk_xxxxxxxxxx
```

#### Paso 4: Deploy
```bash
# Push to GitHub
git add .
git commit -m "feat: add production deployment"
git push origin main

# Koyeb auto-deploys
# Monitor: https://app.koyeb.com/deployments
```

---

### [IT4-003] Variables de Entorno Seguras (3 pts)

**Objetivo**: Gestionar secrets de forma segura

```typescript
// src/config/env.validation.ts
import { plainToInstance } from 'class-transformer';
import { IsString, IsOptional, validateSync } from 'class-validator';

export class EnvironmentVariables {
  @IsString()
  NODE_ENV: string;

  @IsString()
  DATABASE_URL: string;

  @IsString()
  @IsOptional()
  OLLAMA_URL?: string;

  @IsString()
  @IsOptional()
  OLLAMA_MODEL?: string;

  @IsString()
  @IsOptional()
  GROQ_API_KEY?: string;

  @IsString()
  @IsOptional()
  GROQ_MODEL?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
```

**Usar en main.ts**:
```typescript
import { validateEnv } from './config/env.validation';

async function bootstrap() {
  // Validate environment
  validateEnv(process.env);

  const app = await NestFactory.create(AppModule);
  // ...
}
```

---

### [IT4-004] GitHub Actions CI/CD (5 pts)

**Objetivo**: Auto-testing antes de deploy

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend-simple/package-lock.json

      - name: Install dependencies
        working-directory: ./backend-simple
        run: npm ci

      - name: Generate Prisma Client
        working-directory: ./backend-simple
        run: npx prisma generate

      - name: Lint
        working-directory: ./backend-simple
        run: npm run lint

      - name: Type Check
        working-directory: ./backend-simple
        run: npm run build

      - name: Unit Tests
        working-directory: ./backend-simple
        run: npm run test

      - name: Test Coverage
        working-directory: ./backend-simple
        run: npm run test:cov

      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend-simple/coverage/lcov.info
          fail_ci_if_error: false

  build:
    runs-on: ubuntu-latest
    needs: test
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Build Docker Image
        working-directory: ./backend-simple
        run: docker build -t ouija-backend .

      - name: Test Docker Image
        run: |
          docker run -d -p 3000:3000 --name test-container ouija-backend
          sleep 30
          curl -f http://localhost:3000/health || exit 1
          docker stop test-container

  deploy:
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to Koyeb
        run: |
          echo "🚀 Deployment triggered by push to main"
          echo "Koyeb will auto-deploy from GitHub"
          # Koyeb auto-deploys when main branch changes
```

---

### [IT4-005] Health Checks en Producción (2 pts)

**Objetivo**: Monitoreo robusto

```typescript
@Get('health')
async check() {
  const checks = await Promise.allSettled([
    this.checkDatabase(),
    this.checkOllama(),
    this.checkGroq(),
  ]);

  const [dbCheck, ollamaCheck, groqCheck] = checks;

  const status =
    dbCheck.status === 'fulfilled' ? 'ok' : 'critical';

  return {
    status,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: {
        status: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
        count: dbCheck.status === 'fulfilled' ? dbCheck.value : 0,
        error: dbCheck.status === 'rejected' ? dbCheck.reason.message : null,
      },
      ollama: {
        status: ollamaCheck.status === 'fulfilled' ? 'ok' : 'degraded',
        available: ollamaCheck.status === 'fulfilled',
        error: ollamaCheck.status === 'rejected' ? ollamaCheck.reason.message : null,
      },
      groq: {
        status: groqCheck.status === 'fulfilled' ? 'ok' : 'degraded',
        available: groqCheck.status === 'fulfilled',
        error: groqCheck.status === 'rejected' ? groqCheck.reason.message : null,
      },
    },
  };
}

private async checkDatabase(): Promise<number> {
  return await this.prisma.fallbackResponse.count();
}

private async checkOllama(): Promise<boolean> {
  return await this.ollama.healthCheck();
}

private async checkGroq(): Promise<boolean> {
  return this.groq.isAvailable();
}
```

**Response esperado**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T12:00:00.000Z",
  "version": "1.0.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "count": 54,
      "error": null
    },
    "ollama": {
      "status": "degraded",
      "available": false,
      "error": "Connection refused"
    },
    "groq": {
      "status": "ok",
      "available": true,
      "error": null
    }
  }
}
```

---

### [IT4-006] Documentación de Deploy (3 pts)

**Objetivo**: README completo para deployment

```markdown
# Deployment Guide - Ouija Virtual Backend

## Prerequisites
- GitHub account
- Koyeb account
- Groq API key

## Deploy to Koyeb

### 1. Prepare Repository
\`\`\`bash
# Clone repo
git clone https://github.com/tu-usuario/ouija-virtual
cd ouija-virtual/backend-simple

# Install dependencies
npm install

# Test locally
npm run build
npm run start:dev
\`\`\`

### 2. Configure Koyeb
1. Go to https://app.koyeb.com
2. Click "Create Service"
3. Select "GitHub"
4. Choose repository: `ouija-virtual`
5. Set working directory: `backend-simple`
6. Select "Dockerfile" build
7. Configure environment variables (see below)

### 3. Environment Variables
\`\`\`
NODE_ENV=production
DATABASE_URL=file:/app/data/prod.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
GROQ_API_KEY=<your-api-key>  # Secret
GROQ_MODEL=llama-3.1-8b-instant
\`\`\`

### 4. Deploy
- Click "Deploy"
- Wait ~5 minutes
- Check health: `https://your-app.koyeb.app/health`

## Monitoring

### Health Check
\`\`\`bash
curl https://your-app.koyeb.app/health
\`\`\`

### Logs
\`\`\`bash
# Koyeb Dashboard → Service → Logs
\`\`\`

## Troubleshooting

### Ollama Not Starting
- Expected in free tier (512MB RAM)
- System falls back to Groq/SQLite
- Check logs for "Ollama failed to start"

### Database Empty
- Check if seed ran: look for "Seeded XX responses"
- Re-deploy to re-run seed

### Groq Rate Limiting
- Free tier: 30 req/min
- System falls back to Ollama/SQLite
- Consider upgrading Groq plan
\`\`\`
```

---

## Criterios de Aceptación (Iteración 4 Completa)

### Funcional
- [ ] Deploy en Koyeb exitoso
- [ ] Health endpoint retorna 200
- [ ] API responde a requests
- [ ] Fallback funciona en producción
- [ ] Secrets configurados correctamente

### Técnico
- [ ] GitHub Actions pasa al 100%
- [ ] Docker build sin errores
- [ ] Logs accesibles en Koyeb
- [ ] Variables de entorno validadas
- [ ] Sin errores críticos en logs

### Performance
- [ ] Response time < 10s (p95)
- [ ] Uptime > 99%
- [ ] Health check < 1s

### Monitoreo
- [ ] Health endpoint funcional
- [ ] Logs informativos
- [ ] Métricas disponibles

---

## Resultado Final

Al completar esta iteración, tendrás:

✅ **Sistema completo en producción**
✅ **Triple fallback funcional** (Groq → Ollama → SQLite)
✅ **CI/CD automatizado**
✅ **Monitoreo robusto**
✅ **Documentación completa**

**URL Producción**: `https://ouija-virtual-backend.koyeb.app`

**Endpoints**:
- `POST /ouija/ask` - Consultar espíritu
- `GET /health` - Estado del sistema
- `GET /dashboard` - Métricas
- `GET /api/docs` - Documentación Swagger

---

**¡Proyecto Completo!** 🎉
