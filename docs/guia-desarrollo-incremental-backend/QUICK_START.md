# Quick Start Guide - Backend Simple Ouija Virtual

## TL;DR - Inicio Rápido

```bash
# 1. Clonar proyecto
cd backend-simple

# 2. Instalar dependencias
npm install

# 3. Setup base de datos
npx prisma generate
npm run prisma:seed

# 4. Ejecutar en desarrollo
npm run start:dev

# 5. Probar endpoint
curl -X POST http://localhost:3000/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Encontraré el amor?", "personality": "wise", "language": "es"}'
```

## Roadmap Visual de 4 Semanas

```
┌─────────────────────────────────────────────────────────────────┐
│                     DESARROLLO INCREMENTAL                       │
└─────────────────────────────────────────────────────────────────┘

SEMANA 1: Iteración 1 - Base Sólida
├─ Lun-Mar: Seed SQLite + FallbackService
├─ Mié-Jue: Categorización + Tests
├─ Vie:     Swagger + Docker
└─ ✅ DEMO: Sistema funcional sin IA

SEMANA 2: Iteración 2 - Ollama Local
├─ Lun:     Docker Compose con Ollama
├─ Mar-Mié: Integración + Retry logic
├─ Jue:     Health checks + Logging
├─ Vie:     Tests integración
└─ ✅ DEMO: IA local funcionando

SEMANA 3: Iteración 3 - Groq Cloud
├─ Lun-Mar: GroqService + Fallback triple
├─ Mié:     Rate limiting
├─ Jue:     Dashboard métricas
├─ Vie:     Tests E2E
└─ ✅ DEMO: Sistema completo local

SEMANA 4: Iteración 4 - Producción
├─ Lun-Mar: Dockerfile + GitHub Actions
├─ Mié:     Deploy Koyeb
├─ Jue:     Monitoring + Documentación
├─ Vie:     Testing producción
└─ 🚀 GO LIVE: Sistema en producción
```

## Iteraciones en 1 Minuto

### Iteración 1: SQLite Base (1-2 semanas)
**¿Qué construyes?** Sistema que responde preguntas usando SQLite

**Tecnologías**:
- NestJS
- Prisma + SQLite
- Swagger

**Resultado**:
```
POST /ouija/ask
→ Busca en SQLite
→ Retorna respuesta mística
```

**¿Por qué empezar aquí?**
- Base sólida sin dependencias externas
- Sistema funcional desde día 1
- Fácil de testear

---

### Iteración 2: + Ollama (1-2 semanas)
**¿Qué agregas?** IA local que genera respuestas dinámicas

**Nuevas tecnologías**:
- Docker Compose
- Ollama (qwen2.5:0.5b)

**Resultado**:
```
POST /ouija/ask
→ Intenta Ollama
  ├─ ✓ Respuesta generada por IA
  └─ ✗ Fallback a SQLite
```

**¿Por qué Ollama?**
- Gratis (sin costos por request)
- Privado (datos no salen de tu máquina)
- Sin rate limits

---

### Iteración 3: + Groq (1 semana)
**¿Qué agregas?** API de IA ultra-rápida

**Nuevas tecnologías**:
- Groq API
- Rate limiting

**Resultado**:
```
POST /ouija/ask
→ Intenta Groq (2s)
  ├─ ✓ Respuesta rápida
  └─ ✗ Intenta Ollama (20s)
      ├─ ✓ Respuesta local
      └─ ✗ SQLite (50ms)
```

**¿Por qué Groq?**
- Velocidad extrema (500 tokens/s)
- Free tier generoso
- Modelos grandes (Llama 3.1 8B)

---

### Iteración 4: Deploy Koyeb (1 semana)
**¿Qué agregas?** Sistema en producción con CI/CD

**Nuevas tecnologías**:
- Dockerfile multi-stage
- GitHub Actions
- Koyeb PaaS

**Resultado**:
```
Push a GitHub
  ↓
GitHub Actions (CI)
  ├─ Tests
  ├─ Lint
  └─ Build
      ↓
Koyeb Auto-deploy
  ↓
https://ouija-backend.koyeb.app
```

**¿Por qué Koyeb?**
- Free tier permanente
- Docker nativo
- Deploy automático

---

## Arquitectura Final

```
┌──────────────────────────────────────────────────────┐
│                   USUARIO FRONTEND                   │
└─────────────────────┬────────────────────────────────┘
                      │
                      ▼
┌──────────────────────────────────────────────────────┐
│              NestJS Backend (Koyeb)                  │
│                                                      │
│  ┌────────────────────────────────────────────┐    │
│  │ OuijaController                            │    │
│  │   POST /ouija/ask                          │    │
│  │   GET  /health                             │    │
│  │   GET  /dashboard                          │    │
│  └──────────┬─────────────────────────────────┘    │
│             │                                        │
│  ┌──────────▼─────────────────────────────────┐    │
│  │ OuijaService                               │    │
│  │                                             │    │
│  │  1️⃣ Try GroqService                        │    │
│  │     ├─ API Call (timeout 10s)              │    │
│  │     └─ Success: 70% casos                  │    │
│  │                                             │    │
│  │  2️⃣ Try OllamaService                      │    │
│  │     ├─ Health check                        │    │
│  │     ├─ Generate (timeout 30s)              │    │
│  │     └─ Success: 25% casos                  │    │
│  │                                             │    │
│  │  3️⃣ FallbackService                        │    │
│  │     ├─ Query SQLite                        │    │
│  │     └─ Success: 5% casos                   │    │
│  └─────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
         ↓              ↓              ↓
    ┌────────┐    ┌──────────┐   ┌─────────┐
    │ Groq   │    │ Ollama   │   │ SQLite  │
    │ Cloud  │    │ Local    │   │ Local   │
    └────────┘    └──────────┘   └─────────┘
```

## Checklist de Progreso

### Preparación
- [ ] Node.js 20+ instalado
- [ ] Docker instalado
- [ ] Git configurado
- [ ] Editor (VSCode recomendado)
- [ ] Cuenta GitHub creada
- [ ] Cuenta Koyeb creada (para Iteración 4)
- [ ] API Key Groq obtenida (para Iteración 3)

### Iteración 1
- [ ] Prisma schema entendido
- [ ] Seed ejecutado (50+ respuestas)
- [ ] FallbackService implementado
- [ ] Tests unitarios > 80%
- [ ] Swagger en /api/docs
- [ ] Docker Compose local
- [ ] Health endpoint funcional

### Iteración 2
- [ ] Ollama corriendo en Docker
- [ ] OllamaService mejorado
- [ ] Retry logic + Circuit breaker
- [ ] Health checks implementados
- [ ] Logging estructurado
- [ ] Tests de integración

### Iteración 3
- [ ] Groq API key configurada
- [ ] GroqService mejorado
- [ ] Triple fallback funcional
- [ ] Rate limiting implementado
- [ ] Dashboard métricas
- [ ] Tests E2E

### Iteración 4
- [ ] Dockerfile multi-stage
- [ ] GitHub Actions CI/CD
- [ ] Deploy Koyeb exitoso
- [ ] Variables entorno seguras
- [ ] Health checks producción
- [ ] Documentación completa

## Comandos Esenciales

### Desarrollo
```bash
# Instalar dependencias
npm install

# Generar Prisma client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev

# Seedear base de datos
npm run prisma:seed

# Ver base de datos (UI)
npx prisma studio

# Modo desarrollo (hot reload)
npm run start:dev

# Build para producción
npm run build

# Ejecutar producción
npm run start:prod
```

### Testing
```bash
# Tests unitarios
npm run test

# Tests en watch mode
npm run test:watch

# Coverage
npm run test:cov

# Tests E2E
npm run test:e2e
```

### Docker
```bash
# Levantar todo
docker-compose up

# Levantar en background
docker-compose up -d

# Ver logs
docker-compose logs -f

# Reconstruir
docker-compose up --build

# Detener
docker-compose down

# Limpiar todo
docker-compose down -v
```

### Git
```bash
# Crear rama feature
git checkout -b feature/iteracion-1

# Commits atómicos
git add .
git commit -m "feat: implement FallbackService"

# Push
git push origin feature/iteracion-1

# Merge a main
git checkout main
git merge feature/iteracion-1
```

## Endpoints de la API

### POST /ouija/ask
Consultar al espíritu de la Ouija

**Request**:
```json
{
  "question": "¿Encontraré el amor?",
  "personality": "wise",
  "language": "es"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "question": "¿Encontraré el amor?",
    "response": "El amor verdadero no se busca...",
    "personality": "wise",
    "language": "es",
    "category": "love",
    "source": "groq",
    "model": "llama-3.1-8b-instant",
    "responseTime": 1543
  }
}
```

### GET /health
Estado del sistema

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T12:00:00.000Z",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "ok", "count": 54 },
    "ollama": { "status": "ok", "available": true },
    "groq": { "status": "ok", "available": true }
  }
}
```

### GET /dashboard
Métricas y estadísticas

**Response**:
```json
{
  "timestamp": "2025-10-17T12:00:00.000Z",
  "services": {
    "groq": {
      "healthy": true,
      "rateLimit": { "remaining": 27, "nextRefill": 45000 }
    },
    "ollama": { "healthy": true, "model": "qwen2.5:0.5b" },
    "database": { "totalResponses": 54 }
  },
  "cache": { "size": 12, "questions": [...] }
}
```

## Recursos de Aprendizaje

### Documentación Oficial
- **NestJS**: https://docs.nestjs.com/
- **Prisma**: https://www.prisma.io/docs
- **Ollama**: https://github.com/ollama/ollama
- **Groq**: https://console.groq.com/docs
- **Docker**: https://docs.docker.com/

### Videos Recomendados
- NestJS Crash Course (60 min)
- Prisma in 100 Seconds (2 min)
- Docker for Beginners (2h)
- REST APIs with NestJS (45 min)

### Práctica
1. Implementa Iteración 1 siguiendo [PLAN.md](./iteracion-1/PLAN.md)
2. Lee [APRENDIZAJE.md](./APRENDIZAJE.md) para conceptos
3. Experimenta con diferentes configuraciones
4. Contribuye mejoras al proyecto

## Troubleshooting Común

### Prisma no genera client
```bash
npx prisma generate
# Si falla, borrar y regenerar:
rm -rf node_modules/.prisma
npm install
npx prisma generate
```

### Ollama no responde
```bash
# Verificar que está corriendo
curl http://localhost:11434/api/tags

# Ver logs
docker-compose logs ollama

# Reiniciar
docker-compose restart ollama
```

### Tests fallan
```bash
# Limpiar caché Jest
npm run test -- --clearCache

# Verificar variables entorno
cat .env.test

# Ver logs detallados
npm run test -- --verbose
```

### Build falla
```bash
# Limpiar dist
rm -rf dist

# Reinstalar dependencias
rm -rf node_modules
npm install

# Build desde cero
npm run build
```

## Métricas de Éxito

### Por Iteración
- **Funcionalidad**: Sistema desplegable 100%
- **Tests**: > 80% coverage
- **Performance**: Targets alcanzados
- **Documentación**: Completa

### Proyecto Completo
- **Tiempo**: 4-6 semanas
- **Velocidad**: 10-15 pts/semana
- **Features**: 17 implementadas
- **Tests**: 29+ pasando
- **Uptime**: > 99% en producción

## Siguiente Paso

1. **Ahora**: Lee [README.md](./README.md) para visión completa
2. **Luego**: Lee [ROADMAP.md](./ROADMAP.md) para timeline
3. **Después**: Lee [APRENDIZAJE.md](./APRENDIZAJE.md) para conceptos
4. **Finalmente**: Empieza [Iteración 1 - PLAN.md](./iteracion-1/PLAN.md)

---

**¡Listo para empezar!** 🚀

```bash
cd backend-simple
npm install
npm run start:dev
# → Sistema corriendo en http://localhost:3000
# → Swagger en http://localhost:3000/api/docs
```
