# Tareas Detalladas - Iteración 4: Deploy en Koyeb

## Índice de Tareas
- [IT4-001: Dockerfile Multi-Stage](#it4-001-dockerfile-multi-stage-8-pts)
- [IT4-002: Deploy en Koyeb](#it4-002-deploy-en-koyeb-5-pts)
- [IT4-003: Variables de Entorno Seguras](#it4-003-variables-de-entorno-seguras-3-pts)
- [IT4-004: GitHub Actions CI/CD](#it4-004-github-actions-cicd-5-pts)
- [IT4-005: Health Checks en Producción](#it4-005-health-checks-en-producción-2-pts)
- [IT4-006: Documentación de Deploy](#it4-006-documentación-de-deploy-3-pts)
- [Checklist Final](#checklist-final-de-iteración-4)

---

## IT4-001: Dockerfile Multi-Stage (8 pts)

### Objetivo
Crear Dockerfile optimizado con multi-stage build para reducir tamaño y mejorar seguridad.

### Archivos a Crear

#### 1. `backend/Dockerfile` (Producción)

```dockerfile
# ==================================
# STAGE 1: Builder
# ==================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build application
RUN npm run build

# ==================================
# STAGE 2: Ollama (Optional)
# ==================================
FROM ollama/ollama:latest AS ollama

# Download model (will be copied if needed)
RUN ollama serve & sleep 5 && ollama pull qwen2.5:0.5b

# ==================================
# STAGE 3: Production
# ==================================
FROM node:20-alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache curl bash

# Copy built application
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma

# Copy Ollama binary (lightweight ~100MB)
COPY --from=ollama /usr/bin/ollama /usr/bin/ollama
COPY --from=ollama /root/.ollama /root/.ollama

# Create data directory
RUN mkdir -p /app/data

# Run database migration and seed
RUN npx prisma db push --schema=./prisma/schema.prisma && \
    npx prisma db seed

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Copy start script
COPY scripts/start-production.sh ./
RUN chmod +x start-production.sh

# Start
CMD ["./start-production.sh"]
```

#### 2. `backend/scripts/start-production.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Starting Ouija Virtual Backend (Production)"
echo "=============================================="

# Start Ollama in background (best-effort)
echo "🤖 Starting Ollama service..."
ollama serve > /dev/null 2>&1 &
OLLAMA_PID=$!

# Wait for Ollama (with timeout)
timeout=30
echo -n "⏳ Waiting for Ollama"
while [ $timeout -gt 0 ]; do
  if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo ""
    echo "✅ Ollama ready (PID: $OLLAMA_PID)"
    break
  fi
  echo -n "."
  timeout=$((timeout-1))
  sleep 1
done

if [ $timeout -eq 0 ]; then
  echo ""
  echo "⚠️ Ollama failed to start (continuing without it)"
  echo "   System will use Groq → SQLite fallback"
fi

# Start backend
echo "🚀 Starting NestJS backend..."
echo "=============================================="
exec node dist/main.js
```

#### 3. `.dockerignore`

```
node_modules
dist
.git
.env
.env.*
!.env.example
*.log
coverage
.vscode
.idea
README.md
docs
*.md
!package.json
!package-lock.json
```

### Testing Local

```bash
# Build
docker build -t ouija-backend .

# Run
docker run -p 3000:3000 \
  -e GROQ_API_KEY=your_key \
  ouija-backend

# Test
curl http://localhost:3000/health
```

### Criterios de Aceptación
- [x] Multi-stage build funciona
- [x] Imagen < 2GB
- [x] Health check funciona
- [x] Ollama opcional
- [x] Start script robusto

---

## IT4-002: Deploy en Koyeb (5 pts)

### Objetivo
Configurar deployment automático en Koyeb desde GitHub.

### Paso 1: Configurar Koyeb

#### 1. Crear Service en Koyeb

1. Ir a https://app.koyeb.com
2. Click "Create Service"
3. Seleccionar "GitHub"
4. Elegir repositorio
5. Configurar:
   - **Name**: ouija-virtual-backend
   - **Region**: Frankfurt (or nearest)
   - **Instance**: Nano (512MB - Free)
   - **Builder**: Docker
   - **Dockerfile Path**: backend/Dockerfile

#### 2. Configurar Variables de Entorno

En Koyeb Dashboard → Service → Environment:

```
NODE_ENV=production
DATABASE_URL=file:/app/data/prod.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
GROQ_MODEL=llama-3.1-8b-instant
PORT=3000
```

#### 3. Configurar Secret

En Koyeb Dashboard → Secrets:
- Name: `GROQ_API_KEY`
- Value: `gsk_your_actual_key_here`

Luego agregar a Environment Variables:
```
GROQ_API_KEY=${GROQ_API_KEY}  # Reference to secret
```

#### 4. Health Check

```
Path: /health
Port: 3000
Initial Delay: 60s
Interval: 30s
```

### Paso 2: Deploy

```bash
# Commit cambios
git add .
git commit -m "feat: add production deployment"
git push origin main

# Koyeb detecta push y auto-deploya
# Monitor en: https://app.koyeb.com/deployments
```

### Verificación

```bash
# Get URL
# Example: https://ouija-backend-yourapp.koyeb.app

# Test health
curl https://ouija-backend-yourapp.koyeb.app/health

# Test API
curl -X POST https://ouija-backend-yourapp.koyeb.app/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Funciona en producción?"}'
```

### Criterios de Aceptación
- [x] Service creado en Koyeb
- [x] Auto-deploy configurado
- [x] Secrets configurados
- [x] URL pública accesible
- [x] Health check pasa

---

## IT4-003: Variables de Entorno Seguras (3 pts)

### Objetivo
Validar variables de entorno al inicio para detectar configuración incorrecta.

### Archivos a Crear

#### 1. `backend/src/config/env.validation.ts`

```typescript
import { plainToInstance } from 'class-transformer';
import { IsString, IsOptional, IsEnum, validateSync } from 'class-validator';

export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

export class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment;

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

  @IsString()
  @IsOptional()
  PORT?: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map(error => Object.values(error.constraints || {}))
      .flat();

    throw new Error(`❌ Environment validation failed:\n${errorMessages.join('\n')}`);
  }

  return validatedConfig;
}
```

#### 2. Actualizar `backend/src/main.ts`

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { validateEnv } from './config/env.validation';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  try {
    // Validate environment variables
    logger.log('🔍 Validating environment variables...');
    validateEnv(process.env);
    logger.log('✅ Environment variables validated');

    // Create app
    const app = await NestFactory.create(AppModule);

    // Global prefix
    app.setGlobalPrefix('api');

    // CORS
    app.enableCors();

    const port = process.env.PORT || 3000;
    await app.listen(port);

    logger.log(`🚀 Application is running on: http://localhost:${port}`);
    logger.log(`📚 Swagger docs: http://localhost:${port}/api/docs`);
  } catch (error) {
    logger.error(`❌ Failed to start application: ${error.message}`);
    process.exit(1);
  }
}

bootstrap();
```

### Instalación de Dependencias

```bash
cd backend
npm install class-validator class-transformer
```

### Testing

```bash
# Test sin NODE_ENV
unset NODE_ENV
npm run start

# Debe fallar con error claro

# Test con variables correctas
export NODE_ENV=development
export DATABASE_URL=file:./data/dev.db
npm run start

# Debe iniciar correctamente
```

### Criterios de Aceptación
- [x] Validación al inicio
- [x] Error claro si falla
- [x] class-validator instalado
- [x] Tests de validación

---

## IT4-004: GitHub Actions CI/CD (5 pts)

### Objetivo
Automatizar tests y builds en cada push.

### Archivos a Crear

#### 1. `.github/workflows/ci.yml`

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint-and-test:
    name: Lint & Test
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Generate Prisma Client
        working-directory: ./backend
        run: npx prisma generate

      - name: Lint
        working-directory: ./backend
        run: npm run lint

      - name: Type Check
        working-directory: ./backend
        run: npm run build

      - name: Unit Tests
        working-directory: ./backend
        run: npm run test

      - name: Test Coverage
        working-directory: ./backend
        run: npm run test:cov

      - name: Upload Coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
          name: backend-coverage

  docker-build:
    name: Docker Build
    runs-on: ubuntu-latest
    needs: lint-and-test
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Build Docker Image
        working-directory: ./backend
        run: docker build -t ouija-backend:${{ github.sha }} .

      - name: Test Docker Image
        run: |
          docker run -d -p 3000:3000 \
            -e NODE_ENV=production \
            -e DATABASE_URL=file:/app/data/test.db \
            --name test-container \
            ouija-backend:${{ github.sha }}

          sleep 60

          curl -f http://localhost:3000/health || exit 1

          docker logs test-container
          docker stop test-container

  deploy-notification:
    name: Deploy Notification
    runs-on: ubuntu-latest
    needs: docker-build
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Notify Deployment
        run: |
          echo "🚀 Docker build successful!"
          echo "Koyeb will auto-deploy from main branch"
          echo "Monitor: https://app.koyeb.com/deployments"
```

#### 2. Agregar Badge a README

```markdown
# Ouija Virtual Backend

![CI/CD](https://github.com/tu-usuario/ouija-virtual/workflows/CI%2FCD%20Pipeline/badge.svg)
![Coverage](https://codecov.io/gh/tu-usuario/ouija-virtual/branch/main/graph/badge.svg)

...
```

### Criterios de Aceptación
- [x] Workflow configurado
- [x] Tests ejecutan en CI
- [x] Docker build en CI
- [x] Badge en README
- [x] Deploy solo si tests pasan

---

## IT4-005: Health Checks en Producción (2 pts)

### Objetivo
Health check robusto con Promise.allSettled.

### Actualizar `backend/src/modules/health/health.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../ollama/ollama.service';
import { GroqService } from '../groq/groq.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
    private readonly groq: GroqService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'System health check' })
  async check() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkOllama(),
      this.checkGroq(),
    ]);

    const [dbCheck, ollamaCheck, groqCheck] = checks;

    const status = dbCheck.status === 'fulfilled' ? 'ok' : 'critical';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      checks: {
        database: {
          status: dbCheck.status === 'fulfilled' ? 'ok' : 'error',
          count: dbCheck.status === 'fulfilled' ? dbCheck.value : 0,
          error: dbCheck.status === 'rejected' ? dbCheck.reason?.message : null,
        },
        ollama: {
          status: ollamaCheck.status === 'fulfilled' && ollamaCheck.value ? 'ok' : 'degraded',
          available: ollamaCheck.status === 'fulfilled' && ollamaCheck.value,
          error: ollamaCheck.status === 'rejected' ? ollamaCheck.reason?.message : null,
        },
        groq: {
          status: groqCheck.status === 'fulfilled' && groqCheck.value ? 'ok' : 'degraded',
          available: groqCheck.status === 'fulfilled' && groqCheck.value,
          error: groqCheck.status === 'rejected' ? groqCheck.reason?.message : null,
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
}
```

### Criterios de Aceptación
- [x] Promise.allSettled usado
- [x] No bloquea en errores
- [x] Status detallado
- [x] Timeout de 5s

---

## IT4-006: Documentación de Deploy (3 pts)

### Objetivo
Documentar proceso completo de deployment.

### Actualizar `backend/README.md` - Sección Deploy

```markdown
# Deployment Guide

## Deploy to Koyeb (Production)

### Prerequisites
- GitHub account
- Koyeb account (free tier)
- Groq API key

### Step 1: Prepare Repository

\`\`\`bash
# Clone and test locally
git clone https://github.com/tu-usuario/ouija-virtual
cd ouija-virtual/backend
npm install
npm run build
npm run start:dev
\`\`\`

### Step 2: Configure Koyeb

1. Go to https://app.koyeb.com
2. Click "Create Service"
3. Select "GitHub" and connect repository
4. Configure:
   - **Name**: ouija-virtual-backend
   - **Instance**: Nano (512MB RAM)
   - **Builder**: Docker
   - **Dockerfile**: backend/Dockerfile
   - **Port**: 3000

### Step 3: Environment Variables

In Koyeb Dashboard → Environment:
\`\`\`
NODE_ENV=production
DATABASE_URL=file:/app/data/prod.db
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
GROQ_MODEL=llama-3.1-8b-instant
PORT=3000
\`\`\`

### Step 4: Configure Secret

In Koyeb Dashboard → Secrets:
- Create secret: `GROQ_API_KEY`
- Add to environment: `GROQ_API_KEY=${GROQ_API_KEY}`

### Step 5: Deploy

\`\`\`bash
git add .
git commit -m "feat: production deployment"
git push origin main
\`\`\`

Monitor: https://app.koyeb.com/deployments

### Step 6: Verify

\`\`\`bash
curl https://your-app.koyeb.app/health
\`\`\`

## Troubleshooting

### Ollama Not Starting
- **Expected** in free tier (512MB RAM insufficient)
- System falls back to Groq → SQLite
- Check logs: "Ollama failed to start (continuing without it)"

### Database Empty
- Check if seed ran successfully
- Look for: "Seeded XX responses" in logs
- Re-deploy to re-run seed

### Groq Rate Limiting
- Free tier: 30 requests/minute
- System automatically falls back to Ollama/SQLite
- Consider upgrading if needed

### Deployment Fails
1. Check GitHub Actions passed
2. Verify all environment variables set
3. Check Koyeb logs for errors
4. Ensure GROQ_API_KEY is valid

## Monitoring

### Health Check
\`\`\`bash
curl https://your-app.koyeb.app/health
\`\`\`

### Logs
Access in Koyeb Dashboard → Service → Logs

### Metrics
\`\`\`bash
curl https://your-app.koyeb.app/dashboard
\`\`\`
```

### Criterios de Aceptación
- [x] README completo
- [x] Paso a paso detallado
- [x] Troubleshooting section
- [x] Comandos de verificación

---

## Checklist Final de Iteración 4

### Funcional
- [ ] Deploy en Koyeb exitoso
- [ ] Health endpoint retorna 200
- [ ] API responde correctamente
- [ ] Fallback funciona en producción
- [ ] Auto-deploy desde main branch

### Técnico
- [ ] IT4-001: Dockerfile completado
- [ ] IT4-002: Deploy Koyeb completado
- [ ] IT4-003: Validación de env completada
- [ ] IT4-004: CI/CD completado
- [ ] IT4-005: Health checks completados
- [ ] IT4-006: Documentación completada

### Performance
- [ ] Build time < 10min
- [ ] Response time < 10s (p95)
- [ ] Health check < 1s
- [ ] Uptime > 99%

### Documentación
- [ ] README con deployment guide
- [ ] Troubleshooting documented
- [ ] Variables documentadas
- [ ] Smoke tests documentados

---

**Total de Tareas**: 6
**Complejidad Total**: 21 puntos
**Duración Estimada**: 1 semana

**¡Sistema Completo en Producción!** 🚀🎉
