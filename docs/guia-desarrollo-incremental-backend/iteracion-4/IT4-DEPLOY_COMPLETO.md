# [IT4-DEPLOY] Guía Completa de Deployment a Producción

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Prerequisitos](#prerequisitos)
3. [Archivos de Deployment](#archivos-de-deployment)
4. [Setup Paso a Paso](#setup-paso-a-paso)
5. [Configuración de GitHub Actions](#configuración-de-github-actions)
6. [Configuración de Koyeb](#configuración-de-koyeb)
7. [Testing del Deployment](#testing-del-deployment)
8. [Troubleshooting](#troubleshooting)
9. [Rollback](#rollback)
10. [Monitoreo](#monitoreo)

---

## Descripción General

Esta guía te llevará paso a paso por el deployment completo del backend de Ouija Virtual a producción usando:

- **GitHub Actions** - CI/CD pipeline
- **Koyeb** - Hosting serverless
- **Docker** - Containerización
- **Prisma** - Migraciones de base de datos

**Tiempo estimado**: 2-3 horas (primer deployment)

---

## Prerequisitos

### Cuentas Necesarias

- [ ] Cuenta de GitHub (con repositorio del proyecto)
- [ ] Cuenta de Koyeb (free tier disponible)
- [ ] Cuenta de Groq (para API key)
- [ ] (Opcional) Cuenta de Docker Hub

### Software Local

- [ ] Git instalado
- [ ] Node.js >= 20
- [ ] npm >= 10
- [ ] (Opcional) Koyeb CLI

### Conocimientos

- [ ] Git básico (push, branches)
- [ ] GitHub básico (secrets, actions)
- [ ] Docker básico (conceptos)
- [ ] Prisma básico (migraciones)

---

## Archivos de Deployment

Esta sección documenta TODOS los archivos necesarios para deployment.

### 1. `.github/workflows/deploy.yml`

**Ubicación**: `.github/workflows/deploy.yml` (raíz del repositorio)

**Propósito**: Pipeline de CI/CD que ejecuta:
- Linting
- Tests
- Build de Docker image
- Deploy a Koyeb
- Smoke tests

**Contenido completo**: Ver archivo `github-workflows-deploy.yml` en esta carpeta.

**Cómo crear**:

```bash
# Desde la raíz del repositorio
mkdir -p .github/workflows
cp guia-desarrollo-incremental-backend/iteracion-4/github-workflows-deploy.yml .github/workflows/deploy.yml
```

---

### 2. `docker-entrypoint.sh`

**Ubicación**: `backend-simple/docker-entrypoint.sh`

**Propósito**: Script que se ejecuta al iniciar el contenedor Docker:
- Valida variables de entorno
- Ejecuta migraciones de Prisma
- Ejecuta seed (opcional)
- Inicia la aplicación

**Contenido completo**: Ver archivo `docker-entrypoint.sh` en esta carpeta.

**Cómo crear**:

```bash
# Desde backend-simple/
cp ../guia-desarrollo-incremental-backend/iteracion-4/docker-entrypoint.sh .

# Dar permisos de ejecución
chmod +x docker-entrypoint.sh
```

---

### 3. `koyeb.yaml`

**Ubicación**: `backend-simple/koyeb.yaml`

**Propósito**: Configuración declarativa de deployment para Koyeb:
- Configuración de build
- Variables de entorno
- Health checks
- Volúmenes persistentes

**Contenido completo**: Ver archivo `koyeb.yaml` en esta carpeta.

**Cómo crear**:

```bash
# Desde backend-simple/
cp ../guia-desarrollo-incremental-backend/iteracion-4/koyeb.yaml .
```

---

### 4. Actualizar `Dockerfile`

Tu `Dockerfile` debe usar el entrypoint script:

```dockerfile
# Dockerfile multi-stage para producción
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Build
RUN npm run build

# Generar Prisma Client
RUN npx prisma generate

# ========================================
# Stage 2: Production
# ========================================
FROM node:20-alpine AS production

WORKDIR /app

# Instalar bash para el entrypoint script
RUN apk add --no-cache bash curl

# Copiar solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar build desde builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/prisma ./prisma

# Copiar entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Crear directorio para base de datos
RUN mkdir -p /data && chown -R node:node /data

# Cambiar a usuario no-root
USER node

# Exponer puerto
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Usar entrypoint script
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]
```

---

## Setup Paso a Paso

### Paso 1: Preparar el Repositorio

```bash
# 1. Asegurar que estás en la rama main/master
git checkout main

# 2. Crear los archivos de deployment
mkdir -p .github/workflows

# Copiar archivos desde la guía
cp guia-desarrollo-incremental-backend/iteracion-4/github-workflows-deploy.yml \
   .github/workflows/deploy.yml

cd backend-simple

cp ../guia-desarrollo-incremental-backend/iteracion-4/docker-entrypoint.sh .
chmod +x docker-entrypoint.sh

cp ../guia-desarrollo-incremental-backend/iteracion-4/koyeb.yaml .

# 3. Verificar que Dockerfile está actualizado
cat Dockerfile  # Debe incluir ENTRYPOINT

# 4. Commit
git add .
git commit -m "feat: Add deployment configuration (GitHub Actions + Koyeb)"
git push origin main
```

---

### Paso 2: Configurar GitHub Secrets

1. **Ir a tu repositorio en GitHub**
   - URL: `https://github.com/tu-usuario/tu-repo`

2. **Navegar a Settings > Secrets and variables > Actions**

3. **Crear los siguientes secrets**:

#### GROQ_API_KEY (Requerido)

```
Name: GROQ_API_KEY
Value: gsk_xxxxxxxxxxxxxxxxxxxxx
```

**Cómo obtenerlo**:
1. Ir a https://console.groq.com/keys
2. Login o crear cuenta
3. Click "Create API Key"
4. Copiar y guardar

#### KOYEB_API_TOKEN (Requerido)

```
Name: KOYEB_API_TOKEN
Value: xxxxxxxxxxxxxxxxxxxxx
```

**Cómo obtenerlo**:
1. Ir a https://app.koyeb.com/account/api
2. Login o crear cuenta
3. Click "Generate API Token"
4. Copiar y guardar

#### DOCKER_USERNAME (Opcional)

```
Name: DOCKER_USERNAME
Value: tu-usuario-docker-hub
```

#### DOCKER_PASSWORD (Opcional)

```
Name: DOCKER_PASSWORD
Value: tu-password-o-token
```

**Resultado esperado**:
```
✅ GROQ_API_KEY
✅ KOYEB_API_TOKEN
✅ DOCKER_USERNAME (opcional)
✅ DOCKER_PASSWORD (opcional)
```

---

### Paso 3: Configurar Koyeb

#### Opción A: Deployment Automático (Recomendado)

El workflow de GitHub Actions se encargará de deployar automáticamente.

**Solo necesitas**:
1. ✅ Tener secrets configurados en GitHub
2. ✅ Push a la rama main

#### Opción B: Deployment Manual con Koyeb UI

1. **Ir a https://app.koyeb.com**

2. **Click "Create Service"**

3. **Seleccionar "GitHub"** como fuente

4. **Configurar**:
   - Repository: `tu-usuario/tu-repo`
   - Branch: `main`
   - Build method: `Buildpack` (o `Dockerfile` si prefieres)
   - Working directory: `backend-simple`

5. **Environment Variables**:
   ```
   NODE_ENV=production
   PORT=8000
   DATABASE_URL=file:/data/ouija.db
   GROQ_API_KEY=gsk_xxxxx (usar secret)
   ```

6. **Instance type**: `nano` (free tier)

7. **Region**: `Frankfurt (fra)`

8. **Click "Deploy"**

---

### Paso 4: Primer Deployment

```bash
# 1. Asegurar que todo está committed
git status

# 2. Push a main (esto triggerea el deploy)
git push origin main

# 3. Ver el progreso en GitHub
# Ir a: https://github.com/tu-usuario/tu-repo/actions

# 4. Esperar que termine (5-10 minutos primera vez)
```

**Stages del deployment**:
1. ✅ Lint & Format Check (~1 min)
2. ✅ Run Tests (~2 min)
3. ✅ Build Docker Image (~3-5 min)
4. ✅ Deploy to Koyeb (~2-3 min)
5. ✅ Smoke Tests (~1 min)

---

## Testing del Deployment

### 1. Verificar que el servicio está up

```bash
# Health check
curl https://ouija-virtual-backend.koyeb.app/health

# Respuesta esperada:
{
  "status": "ok",
  "timestamp": "2025-01-15T10:30:00.000Z",
  "database": "connected",
  "ai": {
    "groq": "available",
    "ollama": "unavailable",
    "fallback": "available"
  }
}
```

### 2. Probar endpoint principal

```bash
# Test con Groq
curl -X POST https://ouija-virtual-backend.koyeb.app/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Cuál es mi destino?",
    "personality": "wise",
    "language": "es"
  }'

# Respuesta esperada:
{
  "answer": "Los espíritus ancestrales murmuran...",
  "personality": "wise",
  "language": "es",
  "source": "groq",
  "model": "llama-3.1-8b-instant",
  "timestamp": "2025-01-15T10:31:00.000Z"
}
```

### 3. Verificar logs

**En Koyeb Dashboard**:
1. Ir a https://app.koyeb.com
2. Click en tu servicio
3. Tab "Logs"
4. Buscar mensajes de inicio

**Con Koyeb CLI**:
```bash
# Instalar CLI
npm install -g @koyeb/cli

# Login
koyeb login

# Ver logs en tiempo real
koyeb logs service backend -f
```

### 4. Verificar base de datos

```bash
# Test fallback (forzar error en Groq)
curl -X POST https://ouija-virtual-backend.koyeb.app/ouija/ask \
  -H "Content-Type: application/json" \
  -H "X-Force-Fallback: true" \
  -d '{
    "question": "test",
    "personality": "wise",
    "language": "es"
  }'

# Debe retornar respuesta de SQLite (source: "fallback")
```

---

## Troubleshooting

### Problema: "Build failed"

**Síntoma**:
```
Error: npm run build failed
```

**Soluciones**:

1. **Verificar que build funciona localmente**:
   ```bash
   cd backend-simple
   npm run build
   # Debe completar sin errores
   ```

2. **Verificar package.json tiene script build**:
   ```json
   {
     "scripts": {
       "build": "nest build"
     }
   }
   ```

3. **Verificar versión de Node.js**:
   ```yaml
   # En deploy.yml
   - uses: actions/setup-node@v4
     with:
       node-version: '20'  # Debe coincidir con tu versión local
   ```

---

### Problema: "Prisma migrations failed"

**Síntoma**:
```
Error: P3009 - Migration failed to apply
```

**Soluciones**:

1. **Verificar que migraciones existen**:
   ```bash
   ls -la backend-simple/prisma/migrations/
   # Debe haber al menos una carpeta de migración
   ```

2. **Recrear migraciones**:
   ```bash
   cd backend-simple
   rm -rf prisma/migrations
   npx prisma migrate dev --name init
   git add prisma/migrations
   git commit -m "fix: Recreate Prisma migrations"
   git push
   ```

3. **Verificar schema.prisma**:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   ```

---

### Problema: "Application not responding on port 8000"

**Síntoma**:
```
Error: Health check failed
```

**Soluciones**:

1. **Verificar que main.ts escucha en PORT**:
   ```typescript
   // src/main.ts
   const port = process.env.PORT || 3000;
   await app.listen(port);
   ```

2. **Verificar variable de entorno**:
   ```yaml
   # En koyeb.yaml
   env:
     - name: PORT
       value: "8000"
   ```

3. **Verificar logs de Koyeb**:
   ```bash
   koyeb logs service backend --tail 100
   ```

---

### Problema: "Out of memory"

**Síntoma**:
```
Error: JavaScript heap out of memory
```

**Soluciones**:

1. **Reducir dependencias**:
   ```bash
   npm prune --production
   ```

2. **Optimizar build**:
   ```json
   // tsconfig.json
   {
     "compilerOptions": {
       "incremental": false,
       "skipLibCheck": true
     }
   }
   ```

3. **Upgrade a instancia más grande**:
   ```yaml
   # En koyeb.yaml
   instance:
     type: small  # Cambiar de nano a small
   ```

---

### Problema: "Groq API quota exceeded"

**Síntoma**:
```
Error: Rate limit exceeded
```

**Soluciones**:

1. **Verificar que fallback funciona**:
   - El sistema debe automáticamente usar Ollama o SQLite

2. **Aumentar timeout**:
   ```typescript
   // groq.service.ts
   timeout: 10000  // Aumentar a 10 segundos
   ```

3. **Implementar cache**:
   ```typescript
   // Agregar cache de respuestas
   private cache = new Map();
   ```

---

## Rollback

Si algo sale mal, puedes hacer rollback:

### Opción 1: Rollback con Git

```bash
# Revertir último commit
git revert HEAD
git push origin main

# O rollback a commit específico
git reset --hard abc1234
git push origin main --force
```

### Opción 2: Rollback en Koyeb

1. Ir a Koyeb Dashboard
2. Click en tu servicio
3. Tab "Deployments"
4. Click en deployment anterior
5. Click "Redeploy"

### Opción 3: Rollback manual con GitHub Actions

1. Ir a GitHub Actions
2. Seleccionar workflow exitoso anterior
3. Click "Re-run jobs"

---

## Monitoreo

### Logs en Tiempo Real

```bash
# Con Koyeb CLI
koyeb logs service backend -f

# O en dashboard
https://app.koyeb.com > Tu servicio > Logs
```

### Métricas

**En Koyeb Dashboard**:
- CPU usage
- Memory usage
- Request count
- Response time

### Alertas (Opcional)

Configurar alertas en Koyeb:
1. Settings > Notifications
2. Agregar email o webhook
3. Configurar triggers:
   - Service down
   - High memory usage
   - High CPU usage

### Uptime Monitoring (Opcional)

Usar servicios externos:
- **UptimeRobot** (gratis): https://uptimerobot.com
- **Pingdom**
- **StatusCake**

Configurar health check:
```
URL: https://ouija-virtual-backend.koyeb.app/health
Interval: 5 minutos
```

---

## Checklist Final de Deployment

### Pre-Deployment

- [ ] Código testeado localmente
- [ ] Tests pasando (`npm run test`)
- [ ] Build exitoso (`npm run build`)
- [ ] Migraciones de Prisma creadas
- [ ] .env.example actualizado
- [ ] Documentación actualizada

### GitHub

- [ ] Repositorio pushed a GitHub
- [ ] Secret GROQ_API_KEY configurado
- [ ] Secret KOYEB_API_TOKEN configurado
- [ ] Workflow deploy.yml committed
- [ ] Branch protection rules (opcional)

### Koyeb

- [ ] Cuenta creada
- [ ] API token generado
- [ ] Servicio creado (auto o manual)
- [ ] Variables de entorno configuradas
- [ ] Health check funcionando

### Post-Deployment

- [ ] Health endpoint responde 200
- [ ] Endpoint /ouija/ask funciona
- [ ] Groq API funciona
- [ ] Fallback a SQLite funciona
- [ ] Logs sin errores críticos
- [ ] Monitoring configurado
- [ ] Alertas configuradas (opcional)

---

## Próximos Pasos

Después de completar el deployment:

1. **Configurar dominio personalizado** (opcional)
   - Koyeb > Domains > Add custom domain
   - Configurar DNS

2. **Agregar HTTPS** (automático en Koyeb)
   - Koyeb provee certificado SSL gratis

3. **Optimizar performance**
   - Implementar cache
   - Optimizar queries de base de datos
   - Implementar CDN para assets

4. **Monitoreo avanzado**
   - Integrar con Sentry para error tracking
   - Configurar APM (Application Performance Monitoring)

5. **Backup de base de datos**
   - Configurar backup automático de SQLite
   - Implementar estrategia de restore

---

## Recursos Adicionales

- [Koyeb Documentation](https://www.koyeb.com/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment)
- [NestJS Deployment](https://docs.nestjs.com/deployment)

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
**Estado**: ✅ COMPLETO
