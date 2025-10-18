# Guía de Troubleshooting - Backend Simple Ouija Virtual

## Índice

1. [Problemas Comunes de Setup](#problemas-comunes-de-setup)
2. [Problemas con Prisma](#problemas-con-prisma)
3. [Problemas con Docker](#problemas-con-docker)
4. [Problemas con Ollama](#problemas-con-ollama)
5. [Problemas con Groq API](#problemas-con-groq-api)
6. [Problemas de Compilación](#problemas-de-compilación)
7. [Problemas de Tests](#problemas-de-tests)
8. [Problemas de Performance](#problemas-de-performance)
9. [Problemas de Deploy](#problemas-de-deploy)
10. [Comandos Útiles](#comandos-útiles)

---

## Problemas Comunes de Setup

### Error: `command not found: nest`

**Síntoma:**
```bash
$ nest --version
-bash: nest: command not found
```

**Causa**: NestJS CLI no está instalado globalmente.

**Solución:**
```bash
# Instalar NestJS CLI
npm install -g @nestjs/cli

# Verificar instalación
nest --version
```

**Alternativa** (sin instalación global):
```bash
# Usar npx
npx @nestjs/cli --version
npx @nestjs/cli new backend-simple
```

---

### Error: `Cannot find module '@nestjs/core'`

**Síntoma:**
```
Error: Cannot find module '@nestjs/core'
```

**Causa**: Dependencias no instaladas correctamente.

**Solución:**
```bash
# Limpiar node_modules y reinstalar
rm -rf node_modules package-lock.json
npm install

# Verificar que package.json tiene las dependencias correctas
cat package.json | grep "@nestjs/core"
```

---

### Error: `Port 3001 is already in use`

**Síntoma:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Causa**: Otro proceso está usando el puerto 3001.

**Solución (Linux/Mac):**
```bash
# Encontrar proceso usando el puerto
lsof -ti:3001

# Matar el proceso
lsof -ti:3001 | xargs kill -9

# O cambiar de puerto en .env
echo "PORT=3002" >> .env
```

**Solución (Windows):**
```bash
# Encontrar proceso
netstat -ano | findstr :3001

# Matar proceso (reemplazar PID)
taskkill /PID <PID> /F

# O cambiar puerto en .env
echo PORT=3002 >> .env
```

---

### Error: `Cannot read .env file`

**Síntoma:**
```
WARNING: .env file not found
```

**Causa**: Archivo .env no existe.

**Solución:**
```bash
# Copiar desde ejemplo
cp .env.example .env

# Verificar que existe
ls -la .env

# Editar con tus valores
nano .env  # o code .env
```

---

## Problemas con Prisma

### Error: `Cannot find module '@prisma/client'`

**Síntoma:**
```
Error: Cannot find module '@prisma/client'
```

**Causa**: Prisma Client no ha sido generado.

**Solución:**
```bash
# Generar Prisma Client
npx prisma generate

# Verificar que se creó
ls -la node_modules/.prisma/client

# Si persiste, reinstalar
npm install @prisma/client
npx prisma generate
```

---

### Error: `P1003: Database does not exist`

**Síntoma:**
```
Error: P1003: Database `dev.db` does not exist at `file:./dev.db`
```

**Causa**: Base de datos SQLite no ha sido creada.

**Solución:**
```bash
# Crear base de datos con migración
npx prisma migrate dev --name init

# Verificar que dev.db existe
ls -la prisma/dev.db

# Si existe pero está corrupta, resetear
npx prisma migrate reset
```

---

### Error: Seed falla con `unique constraint`

**Síntoma:**
```
Error: Unique constraint failed on the fields: (`id`)
```

**Causa**: Intentando insertar datos duplicados.

**Solución:**
```bash
# Resetear base de datos
npx prisma migrate reset

# Ejecutar seed de nuevo
npm run prisma:seed

# O modificar seed.ts para limpiar primero:
# await prisma.fallbackResponse.deleteMany({});
```

---

### Error: `Schema file not found`

**Síntoma:**
```
Error: Schema file not found: prisma/schema.prisma
```

**Causa**: Ejecutando comando Prisma desde directorio incorrecto.

**Solución:**
```bash
# Verificar ubicación actual
pwd

# Debe estar en la raíz del proyecto (donde está prisma/)
cd backend-simple

# Verificar que schema existe
ls -la prisma/schema.prisma

# Ejecutar comando
npx prisma generate
```

---

### Prisma Studio no abre

**Síntoma:**
```
$ npx prisma studio
Error: Cannot open browser
```

**Solución:**
```bash
# Prisma Studio debería abrir en http://localhost:5555
# Abrir manualmente en el navegador
open http://localhost:5555  # Mac
xdg-open http://localhost:5555  # Linux
start http://localhost:5555  # Windows

# O especificar puerto diferente
npx prisma studio --port 5556
```

---

## Problemas con Docker

### Error: `docker: command not found`

**Síntoma:**
```bash
$ docker --version
docker: command not found
```

**Causa**: Docker no está instalado.

**Solución:**
- **Mac**: Descargar [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- **Linux**:
  ```bash
  curl -fsSL https://get.docker.com -o get-docker.sh
  sudo sh get-docker.sh
  ```
- **Windows**: Descargar [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Verificar instalación:**
```bash
docker --version
docker-compose --version
```

---

### Error: `Cannot connect to Docker daemon`

**Síntoma:**
```
Error: Cannot connect to the Docker daemon at unix:///var/run/docker.sock
```

**Causa**: Docker daemon no está corriendo.

**Solución:**
```bash
# Mac/Windows: Abrir Docker Desktop

# Linux: Iniciar servicio
sudo systemctl start docker
sudo systemctl enable docker

# Verificar que está corriendo
docker ps
```

---

### Error: `docker-compose.yml not found`

**Síntoma:**
```
Error: Can't find a suitable configuration file in this directory
```

**Causa**: Ejecutando docker-compose desde directorio incorrecto.

**Solución:**
```bash
# Verificar ubicación
pwd

# Debe estar en la raíz del proyecto
cd backend-simple

# Verificar que docker-compose.yml existe
ls -la docker-compose.yml

# Ejecutar
docker-compose up
```

---

### Contenedores no se detienen

**Síntoma:**
```bash
$ docker-compose down
# No se detienen los contenedores
```

**Solución:**
```bash
# Forzar detención
docker-compose down --remove-orphans

# Si persiste, matar manualmente
docker ps
docker kill <container_id>

# Limpiar todo
docker-compose down -v  # Incluye volúmenes
docker system prune -a  # Limpieza completa
```

---

### Error: `port is already allocated`

**Síntoma:**
```
Error: Bind for 0.0.0.0:3001 failed: port is already allocated
```

**Causa**: Puerto ya está en uso.

**Solución:**
```bash
# Opción 1: Matar proceso en el puerto
lsof -ti:3001 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :3001 && taskkill /PID <PID> /F  # Windows

# Opción 2: Cambiar puerto en docker-compose.yml
# ports:
#   - "3002:3001"  # host:container

docker-compose up -d
```

---

### Volúmenes no persisten datos

**Síntoma:**
Al reiniciar contenedores, los datos se pierden.

**Solución:**
```bash
# Verificar que volúmenes están creados
docker volume ls

# Inspeccionar volumen
docker volume inspect ouija-ollama-models

# En docker-compose.yml, asegurar volúmenes:
# volumes:
#   - ollama-models:/root/.ollama
#
# volumes:
#   ollama-models:

# Recrear con volúmenes
docker-compose down -v
docker-compose up -d
```

---

## Problemas con Ollama

### Ollama no responde (timeout)

**Síntoma:**
```
Error: Ollama request timed out
```

**Soluciones posibles:**

#### 1. Verificar que Ollama está corriendo
```bash
docker-compose ps | grep ollama

# Si no está UP, iniciarlo
docker-compose up -d ollama

# Ver logs
docker-compose logs -f ollama
```

#### 2. Aumentar timeout
```bash
# En .env
OLLAMA_TIMEOUT=60000  # 60 segundos
```

#### 3. Verificar health check
```bash
curl http://localhost:11434/api/tags

# Dentro del contenedor
docker-compose exec ollama curl http://localhost:11434/api/tags
```

#### 4. Reiniciar Ollama
```bash
docker-compose restart ollama

# Ver logs en tiempo real
docker-compose logs -f ollama
```

---

### Modelo no se descarga

**Síntoma:**
```
Error: model 'qwen2.5:0.5b' not found
```

**Solución:**
```bash
# Verificar modelos disponibles
docker-compose exec ollama ollama list

# Descargar modelo manualmente
docker-compose exec ollama ollama pull qwen2.5:0.5b

# Usar script automatizado
npm run docker:ollama:models

# Ver progreso
docker-compose logs -f ollama
```

---

### Ollama muy lento

**Síntoma:**
Respuestas de Ollama toman > 60s

**Causas posibles:**
1. Modelo muy grande para hardware
2. Sin GPU disponible
3. Memoria insuficiente

**Soluciones:**

#### 1. Usar modelo más pequeño
```bash
# En .env
OLLAMA_MODEL=qwen2.5:0.5b  # Más rápido (500MB)
# en lugar de
OLLAMA_MODEL=llama3:8b     # Más lento (4GB)

# Descargar nuevo modelo
docker-compose exec ollama ollama pull qwen2.5:0.5b
```

#### 2. Aumentar memoria del contenedor
```yaml
# En docker-compose.yml
services:
  ollama:
    deploy:
      resources:
        limits:
          memory: 4G  # Aumentar memoria
```

#### 3. Verificar recursos
```bash
# Ver uso de CPU/memoria
docker stats ouija-ollama

# Si está al límite, cerrar otros programas
```

---

### Circuit Breaker abierto

**Síntoma:**
```
Error: Circuit breaker is open - Ollama unavailable
```

**Causa**: Ollama ha fallado 3+ veces consecutivas.

**Solución:**
```bash
# 1. Verificar que Ollama funciona ahora
curl http://localhost:11434/api/tags

# 2. Esperar 60 segundos (circuit se auto-resetea)
sleep 60

# 3. Reiniciar backend para resetear inmediatamente
docker-compose restart backend

# 4. Verificar estado en /health
curl http://localhost:3000/health | jq '.ollama'
```

---

## Problemas con Groq API

### Error: `Invalid API key`

**Síntoma:**
```
Error: Groq API authentication failed
```

**Solución:**
```bash
# 1. Verificar que API key está en .env
grep GROQ_API_KEY .env

# 2. Obtener nueva API key
# Ir a: https://console.groq.com/keys

# 3. Actualizar .env
echo "GROQ_API_KEY=gsk_tu_api_key_aqui" >> .env

# 4. Reiniciar backend
docker-compose restart backend
```

---

### Error: `Rate limit exceeded`

**Síntoma:**
```
Error: 429 Too Many Requests - Rate limit exceeded
```

**Causa**: Superaste el límite de requests de Groq.

**Solución:**
```bash
# 1. Verificar límites en Groq Console
# https://console.groq.com/usage

# 2. Implementar rate limiting en código
# (Ya debería estar en Iteración 3)

# 3. Usar Ollama como primario
# En .env, vaciar GROQ_API_KEY temporalmente
GROQ_API_KEY=

# 4. Sistema fallback a Ollama → SQLite
```

---

### Groq muy lento

**Síntoma:**
Groq toma > 10s en responder (normalmente es < 2s)

**Solución:**
```bash
# 1. Verificar estado de Groq
# https://status.groq.com/

# 2. Usar modelo más rápido
# En .env
GROQ_MODEL=llama-3.1-8b-instant  # Más rápido
# en lugar de
GROQ_MODEL=llama-3.1-70b-versatile  # Más lento

# 3. Aumentar timeout
GROQ_TIMEOUT=15000  # 15 segundos
```

---

## Problemas de Compilación

### Error: `Cannot find name 'X'`

**Síntoma:**
```
Error: Cannot find name 'PrismaService'
```

**Causa**: Import faltante o incorrecto.

**Solución:**
```typescript
// Agregar import al inicio del archivo
import { PrismaService } from '@/prisma/prisma.service';

// O con path relativo
import { PrismaService } from '../../prisma/prisma.service';

// Verificar tsconfig.json tiene paths configurados
// "paths": { "@/*": ["src/*"] }
```

---

### Error: TypeScript version mismatch

**Síntoma:**
```
Error: TypeScript compiler version mismatch
```

**Solución:**
```bash
# Actualizar TypeScript
npm install typescript@latest --save-dev

# Verificar versión
npx tsc --version

# Limpiar y recompilar
rm -rf dist
npm run build
```

---

### ESLint warnings que no desaparecen

**Síntoma:**
```
Warning: 'any' type is not allowed
```

**Solución:**
```bash
# Opción 1: Fixear automáticamente
npm run lint -- --fix

# Opción 2: Desactivar regla específica en .eslintrc.js
// rules: {
//   '@typescript-eslint/no-explicit-any': 'off',
// }

# Opción 3: Ignorar archivo específico
// Agregar al inicio del archivo:
/* eslint-disable @typescript-eslint/no-explicit-any */
```

---

## Problemas de Tests

### Tests fallan con `Cannot find module`

**Síntoma:**
```
Error: Cannot find module '@/prisma/prisma.service'
```

**Causa**: Jest no resuelve path aliases.

**Solución:**
```json
// En jest.config.js o package.json
{
  "jest": {
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    }
  }
}
```

---

### Error: `Timeout exceeded`

**Síntoma:**
```
Error: Timeout - Async callback was not invoked within the 5000 ms timeout
```

**Causa**: Test tarda más del timeout por defecto.

**Solución:**
```typescript
// Aumentar timeout en test específico
it('should generate response', async () => {
  // ...
}, 30000); // 30 segundos

// O globalmente en jest.config.js
{
  "testTimeout": 30000
}
```

---

### Tests pasan localmente pero fallan en CI

**Causas posibles:**
1. Variables de entorno diferentes
2. Base de datos no configurada
3. Servicios externos no disponibles

**Solución:**
```yaml
# En GitHub Actions (.github/workflows/test.yml)
- name: Setup test database
  run: |
    cp .env.example .env
    npx prisma migrate dev
    npm run prisma:seed

- name: Run tests
  run: npm run test
  env:
    NODE_ENV: test
    DATABASE_URL: file:./test.db
```

---

## Problemas de Performance

### Respuestas muy lentas (> 5s)

**Diagnóstico:**
```bash
# Ver logs con tiempo de respuesta
docker-compose logs -f backend | grep "latency"

# Verificar qué servicio está fallando
curl -w "@curl-format.txt" http://localhost:3000/ouija/ask

# curl-format.txt:
# time_total: %{time_total}s\n
```

**Soluciones:**

#### Si Groq es lento:
```bash
# Ver latencia de Groq
grep "Groq" logs | grep "latency"

# Cambiar a modelo más rápido
GROQ_MODEL=llama-3.1-8b-instant
```

#### Si Ollama es lento:
```bash
# Usar modelo más pequeño
OLLAMA_MODEL=qwen2.5:0.5b

# Dar más memoria al contenedor
# docker-compose.yml:
#   deploy:
#     resources:
#       limits:
#         memory: 4G
```

#### Si SQLite es lento:
```bash
# Verificar índices en schema.prisma
# @@index([personality, category, language])

# Regenerar migración
npx prisma migrate dev
```

---

### Memoria creciendo sin control

**Síntoma:**
```bash
$ docker stats
# CONTAINER     MEM USAGE
# backend       2.5GB / 4GB  (creciendo)
```

**Causa**: Cache de preguntas sin límite.

**Solución:**
```typescript
// En ouija.service.ts
private readonly MAX_CACHE_SIZE = 100;

clearCache() {
  if (this.questionCache.size > this.MAX_CACHE_SIZE) {
    // Limpiar oldest entries
    const entries = Array.from(this.questionCache.entries());
    const toRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => this.questionCache.delete(key));
  }
}
```

---

## Problemas de Deploy

### Koyeb: Build falla

**Síntoma:**
```
Error: Docker build failed
```

**Solución:**
```bash
# 1. Probar build localmente
docker build -t test-backend .

# 2. Si falla, verificar Dockerfile
# Asegurar multi-stage build correcto

# 3. Verificar .dockerignore
# node_modules debe estar excluido

# 4. Ver logs en Koyeb Console
# Identificar error específico
```

---

### Variables de entorno no funcionan en producción

**Síntoma:**
```
Error: GROQ_API_KEY is not defined
```

**Solución en Koyeb:**
```bash
# 1. Ir a Koyeb Dashboard
# 2. Service → Settings → Environment variables
# 3. Agregar:
#    - GROQ_API_KEY=gsk_xxx
#    - OLLAMA_URL=https://tu-ollama.koyeb.app
#    - NODE_ENV=production

# 4. Redeploy
```

---

### Health check falla en producción

**Síntoma:**
```
Error: Health check timeout
```

**Solución:**
```dockerfile
# En Dockerfile, aumentar tiempo de start_period
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# En Koyeb, configurar health check:
# Path: /health
# Port: 3000
# Interval: 30s
# Timeout: 10s
# Healthy threshold: 2
```

---

## Comandos Útiles

### Diagnóstico Rápido

```bash
# Estado general
docker-compose ps
curl http://localhost:3000/health | jq

# Logs de todos los servicios
docker-compose logs -f

# Logs de servicio específico
docker-compose logs -f backend
docker-compose logs -f ollama

# Ver últimas 100 líneas
docker-compose logs --tail=100 backend

# Recursos en uso
docker stats

# Espacio en disco
docker system df
```

---

### Limpieza

```bash
# Limpiar todo (CUIDADO: borra datos)
docker-compose down -v
docker system prune -a
rm -rf node_modules dist prisma/dev.db

# Reinstalar desde cero
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run build
npm run start:dev
```

---

### Debugging

```bash
# Ejecutar en modo debug
npm run start:debug

# Conectar con Chrome DevTools
# chrome://inspect

# Ver todas las variables de entorno
docker-compose exec backend env

# Entrar al contenedor
docker-compose exec backend sh
docker-compose exec ollama sh

# Ejecutar comando dentro del contenedor
docker-compose exec backend npm run prisma:studio
```

---

### Testing Rápido

```bash
# Test de conectividad
curl http://localhost:3000/health

# Test de Ollama
curl http://localhost:11434/api/tags

# Test de endpoint principal
curl -X POST http://localhost:3000/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "test", "personality": "wise", "language": "es"}'

# Test de Groq (si está configurado)
curl -X POST http://localhost:3000/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "test", "personality": "wise", "language": "es", "preferGroq": true}'
```

---

## Obtener Ayuda

Si ninguna de estas soluciones funciona:

1. **Ver logs detallados:**
   ```bash
   docker-compose logs -f --tail=1000 > debug.log
   ```

2. **Verificar configuración:**
   ```bash
   cat .env
   cat docker-compose.yml
   docker-compose config  # Ver configuración merged
   ```

3. **Crear issue en GitHub:**
   - Incluir logs
   - Incluir versiones (node, docker, npm)
   - Incluir pasos para reproducir

4. **Consultar documentación:**
   - [NestJS Docs](https://docs.nestjs.com/)
   - [Prisma Docs](https://www.prisma.io/docs)
   - [Ollama GitHub](https://github.com/ollama/ollama)
   - [Docker Docs](https://docs.docker.com/)

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
