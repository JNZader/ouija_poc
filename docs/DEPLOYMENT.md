# Deployment Guide - Ouija Virtual Backend

Esta guía cubre todos los aspectos del deployment de la aplicación Ouija Virtual Backend en diferentes entornos.

## Tabla de Contenidos

1. [Pre-requisitos](#pre-requisitos)
2. [Configuración de Entornos](#configuración-de-entornos)
3. [Deployment Local (Development)](#deployment-local-development)
4. [Deployment con Docker](#deployment-con-docker)
5. [Deployment en Producción](#deployment-en-producción)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring y Observabilidad](#monitoring-y-observabilidad)
8. [Troubleshooting](#troubleshooting)

---

## Pre-requisitos

### Software Requerido

- **Node.js** >= 20.x
- **npm** >= 10.x
- **Docker** >= 24.x
- **Docker Compose** >= 2.x
- **PostgreSQL** 16+ (si no usas Docker)
- **Redis** 7+ (si no usas Docker)
- **Git**

### Servicios Opcionales

- **Ollama** (para AI local)
- **DeepSeek API Key** (para AI en cloud)

---

## Configuración de Entornos

### Variables de Entorno

Copia el archivo `.env.example` a `.env` y configura las variables según tu entorno:

```bash
cp .env.example .env
```

#### Development

```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_FILE_LOGGING=false
DEFAULT_AI_ENGINE=ollama
```

#### Staging

```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_FILE_LOGGING=true
DEFAULT_AI_ENGINE=deepseek
```

#### Production

```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_FILE_LOGGING=true
DEFAULT_AI_ENGINE=deepseek
ALLOWED_ORIGINS=https://ouija-virtual.com
```

---

## Deployment Local (Development)

### 1. Instalar Dependencias

```bash
npm install
```

### 2. Configurar Base de Datos

```bash
# Iniciar servicios con Docker Compose
docker-compose up -d postgres redis

# Ejecutar migraciones
npx prisma migrate dev

# Seed de datos iniciales
npm run prisma:seed
```

### 3. Iniciar Aplicación

```bash
# Modo desarrollo (hot reload)
npm run start:dev

# Modo debug
npm run start:debug
```

### 4. Verificar Health Check

```bash
curl http://localhost:3000/api/health
```

---

## Deployment con Docker

### Development con Docker Compose

```bash
# Iniciar todos los servicios (API + DB + Redis + Monitoring)
docker-compose up -d

# Ver logs
docker-compose logs -f api

# Ejecutar migraciones
docker-compose exec api npx prisma migrate deploy

# Detener servicios
docker-compose down
```

### Production con Docker Compose

```bash
# Usar docker-compose.prod.yml
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f api

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Detener servicios
docker-compose -f docker-compose.prod.yml down
```

### Build Manual de la Imagen Docker

```bash
# Build de la imagen
docker build -t ouija-virtual-api:latest .

# Run de la imagen
docker run -d \
  --name ouija-api \
  -p 3000:3000 \
  --env-file .env \
  ouija-virtual-api:latest
```

---

## Deployment en Producción

### Opción 1: VPS/Servidor Dedicado

#### 1. Configurar el Servidor

```bash
# Conectar al servidor
ssh user@your-server.com

# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Clonar repositorio
git clone https://github.com/your-org/ouija-virtual-backend.git
cd ouija-virtual-backend
```

#### 2. Configurar Variables de Entorno

```bash
# Crear archivo .env para producción
nano .env
```

Configurar todas las variables necesarias (ver `.env.example`)

#### 3. Deploy de la Aplicación

```bash
# Build y deploy
docker-compose -f docker-compose.prod.yml up -d

# Ejecutar migraciones
docker-compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### 4. Configurar Nginx como Reverse Proxy (Opcional)

```nginx
server {
    listen 80;
    server_name api.ouija-virtual.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Opción 2: Railway

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar proyecto
railway init

# Deploy
railway up
```

### Opción 3: Fly.io

```bash
# Instalar Fly CLI
curl -L https://fly.io/install.sh | sh

# Login
fly auth login

# Launch app
fly launch

# Deploy
fly deploy
```

---

## CI/CD Pipeline

### GitHub Actions

El proyecto incluye un pipeline de CI/CD automatizado en `.github/workflows/ci.yml`:

#### Workflow:

1. **Lint & Test** - Ejecuta en cada push/PR
2. **Build Docker Image** - Solo en push a `main`/`develop`
3. **Deploy to Staging** - Auto-deploy en push a `develop`
4. **Deploy to Production** - Auto-deploy en push a `main`

### Configurar Secrets en GitHub

Ve a **Settings > Secrets and variables > Actions** y agrega:

#### Production:

- `DEPLOY_HOST` - IP o hostname del servidor
- `DEPLOY_USER` - Usuario SSH
- `DEPLOY_SSH_KEY` - Private key SSH
- `DEPLOY_PATH` - Path del proyecto en el servidor (ej: `/var/www/ouija-api`)
- `DEPLOY_PORT` - Puerto SSH (default: 22)

#### Staging:

- `STAGING_HOST`
- `STAGING_USER`
- `STAGING_SSH_KEY`
- `STAGING_PATH`
- `STAGING_PORT`

### Trigger Manual de Deploy

```bash
# Via GitHub CLI
gh workflow run ci.yml

# Via Git
git commit -m "deploy: trigger deployment" --allow-empty
git push origin main
```

---

## Monitoring y Observabilidad

### Prometheus

Accede a las métricas en:

- Development: `http://localhost:9090`
- Production: Configurar según tu deployment

### Grafana

Accede a los dashboards en:

- Development: `http://localhost:3001`
- Login: `admin` / `admin` (cambiar en producción)

Dashboards pre-configurados:
- **Ouija API Dashboard** - Métricas de la API

### Endpoints de Monitoring

```bash
# Health check básico
curl http://localhost:3000/api/health

# Health check detallado
curl http://localhost:3000/api/health/detailed

# Métricas en formato Prometheus
curl http://localhost:3000/api/metrics

# Métricas en formato JSON
curl http://localhost:3000/api/metrics/json

# Liveness probe (Kubernetes)
curl http://localhost:3000/api/health/live

# Readiness probe (Kubernetes)
curl http://localhost:3000/api/health/ready
```

### Logs

Los logs se almacenan en:

```
logs/
├── app-YYYY-MM-DD.log       # Logs generales de la aplicación
├── error-YYYY-MM-DD.log     # Solo errores
├── combined-YYYY-MM-DD.log  # Todos los logs combinados
├── exceptions.log           # Excepciones no capturadas
└── rejections.log           # Promise rejections
```

Ver logs en tiempo real:

```bash
# Con Docker Compose
docker-compose logs -f api

# Logs locales
tail -f logs/app-*.log
```

---

## Troubleshooting

### La aplicación no inicia

```bash
# Verificar logs
docker-compose logs api

# Verificar conectividad a la base de datos
docker-compose exec api npx prisma db push

# Verificar variables de entorno
docker-compose exec api env | grep DATABASE_URL
```

### Errores de Base de Datos

```bash
# Resetear base de datos (CUIDADO: borra datos)
npx prisma migrate reset

# Ejecutar migraciones manualmente
npx prisma migrate deploy

# Verificar estado de migraciones
npx prisma migrate status
```

### Problemas con Ollama

```bash
# Verificar que Ollama está corriendo
curl http://localhost:11434/api/tags

# Descargar modelo
ollama pull qwen2.5:3b

# Cambiar a DeepSeek como fallback
# En .env: DEFAULT_AI_ENGINE=deepseek
```

### Problemas con WebSocket

```bash
# Verificar conexión
curl -i -N -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  http://localhost:3000/socket.io/

# Verificar CORS
# En .env: ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Prometheus no recolecta métricas

```bash
# Verificar endpoint de métricas
curl http://localhost:3000/api/metrics

# Verificar configuración de Prometheus
docker-compose exec prometheus cat /etc/prometheus/prometheus.yml

# Reiniciar Prometheus
docker-compose restart prometheus
```

### Alto uso de CPU/Memoria

```bash
# Ver uso de recursos
docker stats

# Verificar logs de errores
docker-compose logs api | grep ERROR

# Reiniciar servicio
docker-compose restart api
```

---

## Comandos Útiles

### Docker

```bash
# Ver servicios activos
docker-compose ps

# Ver logs de todos los servicios
docker-compose logs -f

# Reiniciar un servicio específico
docker-compose restart api

# Ejecutar comando en contenedor
docker-compose exec api sh

# Ver estadísticas de recursos
docker stats

# Limpiar recursos no usados
docker system prune -a
```

### Prisma

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear nueva migración
npx prisma migrate dev --name migration_name

# Aplicar migraciones en producción
npx prisma migrate deploy

# Abrir Prisma Studio
npx prisma studio

# Ver estado de migraciones
npx prisma migrate status
```

### NPM

```bash
# Instalar dependencias
npm ci

# Ejecutar tests
npm test

# Cobertura de tests
npm run test:cov

# Lint
npm run lint

# Build
npm run build

# Iniciar en producción
npm run start:prod
```

---

## Seguridad en Producción

### Checklist de Seguridad

- [ ] Cambiar contraseñas por defecto (Postgres, Redis, Grafana)
- [ ] Configurar HTTPS/SSL con certificados válidos
- [ ] Restringir CORS solo a dominios permitidos
- [ ] Habilitar rate limiting
- [ ] Configurar firewall en el servidor
- [ ] Usar secrets manager para variables sensibles
- [ ] Habilitar logs de auditoría
- [ ] Configurar backups automáticos de la base de datos
- [ ] Implementar rotación de API keys
- [ ] Mantener dependencias actualizadas (`npm audit`)

---

## Backup y Restauración

### Backup de Base de Datos

```bash
# Backup manual
docker-compose exec postgres pg_dump -U ouija_user ouija_db > backup.sql

# Backup automatizado (cron)
# Agregar a crontab:
0 2 * * * cd /path/to/project && docker-compose exec -T postgres pg_dump -U ouija_user ouija_db > backups/backup-$(date +\%Y\%m\%d).sql
```

### Restaurar Base de Datos

```bash
# Restaurar desde backup
cat backup.sql | docker-compose exec -T postgres psql -U ouija_user -d ouija_db
```

---

## Soporte

Para más información, consulta:

- [Documentación del Proyecto](./README.md)
- [Plan de Iteraciones](./PLAN_BACKEND_COMPLETO.md)
- [Issues en GitHub](https://github.com/your-org/ouija-virtual-backend/issues)
