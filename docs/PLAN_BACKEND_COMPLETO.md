# Plan de Desarrollo Backend Iterativo - Ouija Virtual API

## Fecha: 2025-10-16
## Equipo: 2-4 Desarrolladores Backend
## Metodología: Híbrida Kanban + XP
## Duración estimada: 4-6 semanas

---

# 📋 RESUMEN EJECUTIVO

## Visión del Proyecto

**Ouija Virtual API** es una API REST y WebSocket que permite a aplicaciones frontend comunicarse con "espíritus" virtuales impulsados por IA. La API gestiona sesiones individuales y multiplayer, donde se procesan preguntas y se generan respuestas místicas mediante modelos de lenguaje (DeepSeek/Ollama).

## Propuesta de Valor

- **API RESTful** completa y bien documentada (OpenAPI/Swagger)
- **WebSockets** para comunicación en tiempo real (multiplayer)
- **IA Integrada** con fallback inteligente
- **Arquitectura Simplificada** (1 servicio de IA vs 5)
- **Altamente Escalable** con Redis y PostgreSQL optimizado

## Objetivos del Proyecto

1. ✅ Implementar arquitectura backend simplificada y optimizada
2. ✅ API RESTful completa para chat individual
3. ✅ WebSocket Gateway para multiplayer
4. ✅ Integración con Ollama (local) y DeepSeek (cloud)
5. ✅ Sistema de fallback robusto
6. ✅ Testing >80% coverage
7. ✅ Documentación completa (Swagger + Postman)

## Métricas de Éxito

| Métrica | Objetivo |
|---------|----------|
| Tiempo de respuesta IA | < 3 segundos |
| Uptime del sistema | > 99.5% |
| Sesiones concurrentes | 100+ |
| Cobertura de tests | > 80% |
| Latencia WebSocket | < 100ms |

---

# 🏗️ ARQUITECTURA TÉCNICA

## Stack Tecnológico Backend

### Core
- **Framework**: NestJS 10+ (TypeScript)
- **Runtime**: Node.js 18+
- **Package Manager**: npm

### Base de Datos
- **Relacional**: PostgreSQL 15+
- **ORM**: Prisma 5+
- **Cache**: Redis 7+

### Comunicación
- **REST**: Express (integrado en NestJS)
- **WebSockets**: Socket.io + @nestjs/websockets
- **Documentación**: Swagger/OpenAPI

### IA / LLM
- **Primario**: Ollama (local) - modelo qwen2.5:3b
- **Secundario**: DeepSeek API (cloud, opcional)
- **Fallback**: Templates en código

### Testing
- **Unit Tests**: Jest
- **E2E Tests**: Supertest
- **Coverage**: Istanbul

### DevOps
- **Contenedores**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Logs**: Winston
- **Monitoring**: Health checks + métricas

## Arquitectura Simplificada

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Otro equipo)                    │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP REST + WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                      BACKEND (NestJS)                        │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │  OuijaController (REST)  │  MultiplayerGateway (WS)    │ │
│ └──────────┬───────────────┴──────────────┬───────────────┘ │
│            │                               │                 │
│ ┌──────────▼─────────────┐   ┌────────────▼──────────────┐ │
│ │ SpiritSessionService    │   │  MultiplayerService       │ │
│ └──────────┬──────────────┘   └────────────┬──────────────┘ │
│            │                                │                │
│            └───────────┬────────────────────┘                │
│                        │                                     │
│            ┌───────────▼──────────────┐                     │
│            │  ConversationService      │ (Lógica centralizada)
│            └───────────┬───────────────┘                    │
│                        │                                     │
│            ┌───────────▼──────────────┐                     │
│            │      AIService            │ (Unificado)        │
│            │  - DeepSeek API           │                    │
│            │  - Ollama Local           │                    │
│            │  - Fallback Templates     │                    │
│            └───────────┬───────────────┘                    │
│                        │                                     │
│            ┌───────────▼──────────────┐                     │
│            │    PrismaService          │                    │
│            └───────────┬───────────────┘                    │
└────────────────────────┼───────────────────────────────────┘
                         │
        ┌────────────────▼────────────────┐
        │   PostgreSQL 15 (5 tablas)      │
        │  - spirits                       │
        │  - ouija_sessions                │
        │  - session_messages              │
        │  - multiplayer_rooms             │
        │  - room_participants             │
        └──────────────────────────────────┘
```

## Modelo de Datos Optimizado

### Diagrama ER

```
Spirit (7 campos)
  ├─ 1:N → OuijaSession (8 campos)
  │          └─ 1:N → SessionMessage (7 campos)
  │          └─ N:1 → MultiplayerRoom (10 campos)
  └─ 1:N → MultiplayerRoom
               └─ 1:N → RoomParticipant (8 campos)
```

### Características Clave
- ✅ **5 tablas** (vs 7 en versión no optimizada)
- ✅ **FK explícitas** con CASCADE para integridad referencial
- ✅ **Sin campos redundantes** (messageCount, currentPlayers se calculan dinámicamente)
- ✅ **Índices compuestos** para queries optimizadas
- ✅ **Sin tablas no críticas** (Response, QueryHistory eliminadas)

## Principios de Diseño

### 1. Simplicidad
- **1 servicio de IA** en lugar de 5 separados
- **Lógica centralizada** en ConversationService
- **Configuración mínima** (10 variables .env vs 20+)

### 2. DRY (Don't Repeat Yourself)
- Lógica de conversación compartida entre single/multiplayer
- Templates de fallback en código (no en BD)
- Prompts integrados en AIService

### 3. SOLID
- Single Responsibility: cada servicio tiene un propósito claro
- Dependency Injection: testeable y desacoplado
- Interface Segregation: DTOs específicos por caso de uso

### 4. Testeable
- Inyección de dependencias
- Servicios desacoplados
- Mocks fáciles de crear

---

# 🎯 ROLES Y RESPONSABILIDADES

## Configuración de Equipo Backend

### Equipo de 2 Devs
- **Dev 1 (Backend Lead)**: Arquitectura + Core Services + IA Integration
- **Dev 2 (Backend Dev)**: REST API + WebSockets + Testing

### Equipo de 3 Devs
- **Dev 1 (Backend Lead)**: Arquitectura + AIService + ConversationService
- **Dev 2 (API Dev)**: REST Controllers + DTOs + Validation
- **Dev 3 (Real-time Dev)**: WebSocket Gateway + Multiplayer + Redis

### Equipo de 4 Devs
- **Dev 1 (Backend Lead)**: Arquitectura + AIService
- **Dev 2 (API Dev)**: REST Controllers + SpiritSessionService
- **Dev 3 (Real-time Dev)**: WebSocket Gateway + MultiplayerService
- **Dev 4 (QA/DevOps)**: Testing + CI/CD + Monitoring

## Ceremonias Ágiles

### Diarias
- **Daily Stand-up**: 15 min (async en Slack/Discord si remoto)
- **Formato**: ¿Qué hice? ¿Qué haré? ¿Bloqueos?

### Semanales
- **Planning**: 1-2 horas (inicio de iteración)
- **Review/Demo**: 1 hora (fin de iteración)
- **Retrospectiva**: 30 min (fin de iteración)

### Por Iteración (1-2 semanas)
- **Refinement**: 1 hora (mitad de iteración)
- **Pair Programming**: Ad-hoc según necesidad
- **Code Review**: Continuo (PR reviews)

---

# 📊 MÉTRICAS Y DEFINICIÓN DE HECHO

## Definition of Done (DoD)

Una tarea está "Done" cuando:

✅ **Código**
- [ ] Implementado según criterios de aceptación
- [ ] Code review aprobado por al menos 1 dev
- [ ] Sin warnings de ESLint/TSC
- [ ] Comentarios JSDoc en funciones públicas

✅ **Testing**
- [ ] Tests unitarios escritos y pasando (>80% coverage)
- [ ] Tests de integración para endpoints/servicios
- [ ] Tests E2E para flujos críticos con Supertest
- [ ] Tests manuales documentados en Postman

✅ **Documentación**
- [ ] Swagger/OpenAPI actualizado para endpoints
- [ ] Comentarios JSDoc en funciones públicas
- [ ] README actualizado si aplica
- [ ] Changelog actualizado

✅ **Deploy**
- [ ] Merge a rama de desarrollo
- [ ] CI/CD pipeline pasando
- [ ] Smoke tests pasando

## Velocity Tracking

### Story Points
- **1 punto** = 1-2 horas (tarea trivial)
- **2 puntos** = 3-4 horas (tarea pequeña)
- **3 puntos** = 5-8 horas (tarea mediana)
- **5 puntos** = 1-2 días (tarea grande)
- **8 puntos** = 2-3 días (épica pequeña, dividir)

### Capacity por Iteración (1 semana)
- **2 devs**: 20-25 puntos
- **3 devs**: 30-40 puntos
- **4 devs**: 40-50 puntos

---

# 🗓️ CRONOGRAMA GENERAL

## Vista de Alto Nivel

| Iteración | Duración | Objetivo Principal | Story Points |
|-----------|----------|-------------------|--------------|
| **Iteración 0** | 2-3 días | Setup + Arquitectura Base | 12-15 |
| **Iteración 1** | 1-2 semanas | Core Services + IA Integration | 25-30 |
| **Iteración 2** | 1 semana | REST API Completa | 20-25 |
| **Iteración 3** | 1-2 semanas | WebSockets + Multiplayer | 30-35 |
| **Iteración 4** | 3-5 días | Testing + Polish | 15-20 |
| **Iteración 5** | 2-3 días | Deploy + Monitoring | 10-15 |

**Total**: 4-6 semanas (20-30 días laborables)

---

# 🚀 PLAN DE ITERACIONES DETALLADO

## Entregables por Iteración

### Iteración 0: Fundación (2-3 días)
- ✅ Repositorio Git configurado
- ✅ NestJS con estructura modular funcionando
- ✅ PostgreSQL + Prisma configurado con schema optimizado
- ✅ Redis configurado
- ✅ Docker Compose listo
- ✅ CI/CD básico
- ✅ Endpoint `/health` funcionando

### Iteración 1: Backend Core (1-2 semanas)
- ✅ AIService unificado funcionando
- ✅ ConversationService operativo
- ✅ PrismaService configurado
- ✅ Integración con Ollama
- ✅ Integración con DeepSeek (opcional)
- ✅ Sistema de fallback
- ✅ Tests unitarios >80%

### Iteración 2: REST API (1 semana)
- ✅ SpiritSessionService completo
- ✅ Todos los endpoints REST funcionando:
  - GET /api/ouija/spirits
  - POST /api/ouija/session/create
  - POST /api/ouija/session/ask
  - POST /api/ouija/session/:token/end
  - GET /api/ouija/session/:token/history
- ✅ Validación con class-validator
- ✅ Swagger completamente documentado
- ✅ Postman collection
- ✅ Tests E2E

### Iteración 3: Multiplayer (1-2 semanas)
- ✅ WebSocket Gateway funcionando
- ✅ MultiplayerService operativo
- ✅ Sistema de salas multiplayer
- ✅ Sincronización en tiempo real
- ✅ Redis para gestión de salas
- ✅ Tests de integración WebSocket

### Iteración 4: Testing & Polish (3-5 días)
- ✅ Cobertura de tests >80%
- ✅ Tests E2E completos
- ✅ Error handling robusto
- ✅ Logging estructurado (Winston)
- ✅ Performance optimizado
- ✅ Documentación completa

### Iteración 5: Deploy & Monitoring (2-3 días)
- ✅ Dockerfile optimizado
- ✅ Docker Compose para producción
- ✅ CI/CD pipeline completo
- ✅ Health checks avanzados
- ✅ Métricas y monitoring
- ✅ Backups configurados
- ✅ Runbook operativo

---

# 📦 API ENDPOINTS COMPLETOS

## REST API

### Health & Status
```
GET /api/health
GET /api/health/detailed
```

### Spirits
```
GET /api/ouija/spirits
GET /api/ouija/spirits/:id
```

### Sessions (Individual)
```
POST /api/ouija/session/create
POST /api/ouija/session/ask
POST /api/ouija/session/:token/end
GET  /api/ouija/session/:token/history
GET  /api/ouija/session/:token/status
```

### Multiplayer Rooms
```
POST /api/multiplayer/room/create
POST /api/multiplayer/room/join
POST /api/multiplayer/room/:code/leave
GET  /api/multiplayer/room/:code
GET  /api/multiplayer/rooms/active
```

## WebSocket Events

### Cliente → Servidor
```
create-room      { spiritId, userId, username }
join-room        { roomCode, userId, username }
leave-room       { roomCode, userId }
send-message     { roomCode, userId, username, message }
```

### Servidor → Cliente
```
room-created     { roomCode, spirit, participants }
room-joined      { participants }
user-joined      { username, participants }
user-left        { username, participants }
new-message      { role, username?, content, timestamp }
room-ended       { reason }
```

---

# 📚 STACK DE DEPENDENCIAS

## Dependencias de Producción

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@nestjs/platform-socket.io": "^10.0.0",
    "@nestjs/websockets": "^10.0.0",
    "@nestjs/config": "^3.0.0",
    "@nestjs/swagger": "^7.0.0",
    "@prisma/client": "^5.0.0",
    "prisma": "^5.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "socket.io": "^4.6.0",
    "redis": "^4.6.0",
    "winston": "^3.11.0"
  }
}
```

## Dependencias de Desarrollo

```json
{
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@nestjs/testing": "^10.0.0",
    "@types/node": "^20.0.0",
    "@types/jest": "^29.5.0",
    "@types/supertest": "^2.0.12",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "jest": "^29.5.0",
    "prettier": "^3.0.0",
    "supertest": "^6.3.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.3"
  }
}
```

---

# 🎓 ONBOARDING PARA NUEVOS DESARROLLADORES

## Día 1: Setup Local (2-3 horas)

### Prerequisitos
```bash
# Verificar versiones
node --version    # v18+ requerido
npm --version     # v9+ requerido
docker --version  # v24+ requerido
git --version     # v2.30+ requerido
```

### Setup Paso a Paso

1. **Clonar repositorio**
```bash
git clone <repo-url>
cd ouija-virtual-backend
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar .env**
```bash
cp .env.example .env
# Editar DATABASE_URL, OLLAMA_URL, etc.
```

4. **Levantar infraestructura**
```bash
docker-compose up -d postgres redis
```

5. **Ejecutar migraciones**
```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

6. **Iniciar servidor**
```bash
npm run start:dev
```

7. **Verificar**
```bash
# Health check
curl http://localhost:3000/api/health

# Swagger
open http://localhost:3000/api/docs

# Prisma Studio
npx prisma studio
```

## Día 2: Exploración de Código (2-3 horas)

### Lectura Recomendada (en orden)

1. **Arquitectura** (30 min)
   - `README.md`
   - `ARQUITECTURA_SIMPLIFICADA.md`
   - Este archivo (`PLAN_BACKEND_COMPLETO.md`)

2. **Código Core** (1.5 horas)
   - `src/main.ts` - Entry point
   - `src/modules/ouija/ouija.module.ts`
   - `src/modules/ouija/services/ai.service.ts`
   - `src/modules/ouija/services/conversation.service.ts`
   - `src/modules/ouija/controllers/ouija.controller.ts`
   - `prisma/schema.prisma`

3. **Tests** (30 min)
   - `src/modules/ouija/services/__tests__/ai.service.spec.ts`
   - `test/e2e/ouija.e2e-spec.ts`

### Ejercicio Práctico

**Objetivo**: Implementar un endpoint simple

**Tarea**: Agregar endpoint `GET /api/ouija/stats` que retorne:
- Total de sesiones activas
- Total de mensajes enviados hoy
- Espíritu más consultado

**Tiempo estimado**: 2-3 horas

---

# 📚 RECURSOS Y REFERENCIAS

## Documentación Técnica
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Socket.io Docs](https://socket.io/docs/v4)
- [Swagger Docs](https://swagger.io/docs/)

## Convenciones de Código

### Commits
```
feat: agregar endpoint para estadísticas
fix: corregir validación en SessionDTO
docs: actualizar README con nuevos endpoints
test: agregar tests para AIService
refactor: simplificar lógica de ConversationService
perf: optimizar query de mensajes
```

### Branches
```
main           - Producción
develop        - Desarrollo
feature/US-123-nombre  - Features nuevas
bugfix/456-bug-name    - Corrección de bugs
hotfix/789-critical    - Fixes urgentes en prod
```

---

# ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Ollama no disponible/lento | Media | Alto | Fallback a DeepSeek + templates |
| Performance en multiplayer | Media | Medio | Load testing desde iteración 3 |
| Complejidad WebSockets | Media | Medio | Spike técnico en iteración 2.5 |
| Scope creep | Alta | Alto | Backlog priorizado, decir NO |
| Bugs en producción | Media | Alto | Tests >80%, staging environment |
| Sincronización Redis | Baja | Medio | Retry logic + health checks |

---

# 🎉 CONCLUSIÓN

Este plan proporciona una ruta clara y ejecutable para desarrollar el backend de Ouija Virtual desde cero. La arquitectura simplificada reduce la complejidad técnica en ~50% comparado con el enfoque tradicional de 5 servicios de IA separados.

## Siguientes Pasos Inmediatos

1. ✅ **Leer iteración 0**: Ver archivo separado con detalles técnicos
2. ✅ **Crear repositorio Git**
3. ✅ **Configurar proyecto según iteración 0**
4. ✅ **Primera daily stand-up**
5. ✅ **Comenzar desarrollo**

## Archivos de Referencia

- `ITERACION_0_BACKEND.md` - Setup inicial detallado
- `ITERACIONES_BACKEND.md` - Iteraciones 1-5 detalladas
- `GUIA_BACKEND_RAPIDA.md` - Quick start y troubleshooting

**¡Buena suerte con el desarrollo del backend! 🚀**
