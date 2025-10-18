# Roadmap Completo - Backend Simple Ouija Virtual

## Vista General del Proyecto

**Objetivo**: Construir un backend robusto con sistema de fallback progresivo: Groq → Ollama → SQLite

**Duración Total**: 4-6 semanas
**Metodología**: Kanban Light + XP Adaptado
**Complejidad Total**: 73 puntos

---

## Cronograma Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                     TIMELINE DEL PROYECTO                        │
└─────────────────────────────────────────────────────────────────┘

SEMANA 1-2 📅 Iteración 1: Base Sólida (SQLite)
├─ Día 1-2:   IT1-000 Setup + IT1-001 Seed SQLite
├─ Día 3-5:   IT1-002 FallbackService + IT1-003 Categorización
├─ Día 6:     IT1-004 Tests Unitarios
├─ Día 7-9:   IT1-005 Swagger + IT1-006 Docker + IT1-007 Health
├─ Día 10:    🎯 DEMO Iteración 1
└─ ✅ ENTREGABLE: Sistema funcional sin IA

SEMANA 2-3 📅 Iteración 2: Ollama Local
├─ Día 1-2:   IT2-001 Docker Compose con Ollama
├─ Día 3-4:   IT2-002 OllamaService con Retry
├─ Día 5:     IT2-003 Health Check de Ollama
├─ Día 6-7:   IT2-004 Tests de Integración
├─ Día 8:     IT2-005 Logging + IT2-006 Scripts
├─ Día 9:     🎯 DEMO Iteración 2
└─ ✅ ENTREGABLE: IA local funcionando

SEMANA 4 📅 Iteración 3: Groq Cloud
├─ Día 1-2:   IT3-001 GroqService mejorado
├─ Día 3:     IT3-002 Sistema Triple Fallback
├─ Día 4:     IT3-003 Rate Limiting
├─ Día 5:     IT3-004 Dashboard de Métricas
├─ Día 6-7:   IT3-005 Tests E2E completos
└─ ✅ ENTREGABLE: Sistema completo local

SEMANA 5-6 📅 Iteración 4: Producción
├─ Día 1-2:   IT4-001 Dockerfile Multi-stage
├─ Día 3:     IT4-002 Deploy en Koyeb
├─ Día 4:     IT4-003 Variables de Entorno Seguras
├─ Día 5-6:   IT4-004 GitHub Actions CI/CD
├─ Día 7:     IT4-005 Health Checks Producción
├─ Día 8:     IT4-006 Documentación Deploy
└─ 🚀 GO LIVE: Sistema en producción

```

---

## Evolución Arquitectónica

### Iteración 1: Sistema Base SQLite

```
┌──────────────┐
│   Frontend   │ (futuro)
└───────┬──────┘
        │
        ▼
┌───────────────────────────────────┐
│      NestJS Backend               │
│                                   │
│  ┌────────────────────────────┐  │
│  │  OuijaController           │  │
│  │  POST /ouija/ask           │  │
│  └──────────┬─────────────────┘  │
│             │                     │
│  ┌──────────▼─────────────────┐  │
│  │  FallbackService (NUEVO)   │  │
│  │  - Keyword matching        │  │
│  │  - Category detection      │  │
│  └──────────┬─────────────────┘  │
│             │                     │
│  ┌──────────▼─────────────────┐  │
│  │  PrismaService             │  │
│  └──────────┬─────────────────┘  │
└─────────────┼─────────────────────┘
              │
       ┌──────▼──────┐
       │   SQLite    │
       │   (50+ )    │
       │  responses  │
       └─────────────┘

🎯 Objetivo: Sistema funcional sin dependencias externas
⏱️ Response Time: < 100ms
✅ Uptime: 100% (no APIs externas)
```

---

### Iteración 2: + Ollama Local

```
┌──────────────┐
│   Frontend   │ (futuro)
└───────┬──────┘
        │
        ▼
┌──────────────────────────────────────────┐
│      NestJS Backend                      │
│                                          │
│  ┌───────────────────────────────────┐  │
│  │  OuijaService                     │  │
│  │  - Orchestration                  │  │
│  │  - Cache                          │  │
│  └─────────────┬─────────────────────┘  │
│                │                         │
│     ┌──────────▼──────────┐             │
│     │                     │             │
│  ┌──▼────────────┐  ┌────▼──────────┐  │
│  │ OllamaService │  │ FallbackService│  │
│  │ (NUEVO)       │  │                │  │
│  │ - Retry       │  │ - SQLite       │  │
│  │ - Circuit     │  │                │  │
│  │   Breaker     │  │                │  │
│  └───────┬───────┘  └────────────────┘  │
└──────────┼──────────────────────────────┘
           │
    ┌──────▼──────┐
    │   Ollama    │
    │  Container  │
    │  (qwen2.5)  │
    └─────────────┘

🔄 Fallback: Ollama → SQLite
⏱️ Ollama: < 30s | SQLite: < 100ms
🔧 Circuit Breaker: Abre después de 3 fallos
```

---

### Iteración 3: Triple Fallback Completo

```
┌──────────────┐
│   Frontend   │
└───────┬──────┘
        │
        ▼
┌──────────────────────────────────────────────────┐
│      NestJS Backend                              │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  OuijaService (Orquestador)                │ │
│  │  - Try Groq → Try Ollama → Fallback SQLite│ │
│  │  - Cache de preguntas                      │ │
│  │  - "Espíritu molesto" (3+ repeticiones)   │ │
│  └────────┬─────────┬──────────┬──────────────┘ │
│           │         │          │                 │
│    ┌──────▼──┐ ┌───▼─────┐ ┌──▼───────────┐    │
│    │ Groq    │ │ Ollama  │ │ Fallback     │    │
│    │ Service │ │ Service │ │ Service      │    │
│    │ (NUEVO) │ │         │ │              │    │
│    │ - Rate  │ │ - Retry │ │ - Keyword    │    │
│    │   Limit │ │ - Circuit│ │   matching   │    │
│    └────┬────┘ └────┬────┘ └──────┬───────┘    │
└─────────┼───────────┼─────────────┼─────────────┘
          │           │             │
    ┌─────▼────┐ ┌────▼────┐  ┌────▼────┐
    │ Groq API │ │ Ollama  │  │ SQLite  │
    │ (Cloud)  │ │(Docker) │  │ (Local) │
    └──────────┘ └─────────┘  └─────────┘

🔄 Fallback: Groq → Ollama → SQLite
⏱️ Groq: 2s | Ollama: 20s | SQLite: 50ms
📊 Success Rate: 70% Groq, 25% Ollama, 5% SQLite
```

---

### Iteración 4: Arquitectura de Producción

```
┌──────────────┐
│   Frontend   │
│   (Vercel)   │
└───────┬──────┘
        │ HTTPS
        ▼
┌────────────────────────────────────────────────┐
│           Koyeb Cloud                          │
│                                                │
│  ┌──────────────────────────────────────────┐ │
│  │   NestJS Backend Container               │ │
│  │   - GitHub Actions Auto-deploy           │ │
│  │   - Health checks                        │ │
│  │   - Environment variables encrypted      │ │
│  └──────┬────────┬──────────┬────────────────┘ │
│         │        │          │                   │
│    ┌────▼───┐ ┌─▼─────┐ ┌──▼──────────┐       │
│    │ Groq   │ │Ollama │ │ SQLite      │       │
│    │ Cloud  │ │(Best  │ │ (Embedded)  │       │
│    │        │ │effort)│ │             │       │
│    └────────┘ └───────┘ └─────────────┘       │
└────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│   Monitoring & Logs         │
│   - Koyeb Dashboard         │
│   - Application logs        │
│   - Error tracking          │
└─────────────────────────────┘

🚀 Deploy: Automático desde GitHub
🔒 Secrets: Variables de entorno encriptadas
📈 Scaling: Automático según carga
🌍 URL: https://ouija-backend.koyeb.app
```

---

## Desglose de Tareas por Iteración

### Iteración 1: SQLite Base (23 puntos)

| ID | Tarea | Pts | Duración | Dependencias |
|----|-------|-----|----------|--------------|
| IT1-000 | Setup inicial del proyecto | 2 | 1-2h | Ninguna |
| IT1-001 | Seed SQLite (50+ respuestas) | 5 | 4-6h | IT1-000 |
| IT1-002 | FallbackService completo | 8 | 6-8h | IT1-001 |
| IT1-003 | Mejorar categorización | 3 | 2-3h | - |
| IT1-004 | Tests unitarios (> 80%) | 5 | 4-5h | IT1-002 |
| IT1-005 | Documentación Swagger | 3 | 2h | - |
| IT1-006 | Docker Compose local | 2 | 1h | - |
| IT1-007 | Health endpoint | 2 | 1h | - |

**Total**: 23 puntos | **Duración**: 1-2 semanas

**Criterios de Éxito**:
- ✅ Sistema funciona sin APIs externas
- ✅ Tests > 80% coverage
- ✅ Response time < 100ms
- ✅ Swagger en /api/docs

---

### Iteración 2: Ollama Local (25 puntos)

| ID | Tarea | Pts | Duración | Dependencias |
|----|-------|-----|----------|--------------|
| IT2-001 | Docker Compose con Ollama | 8 | 6-8h | IT1 completa |
| IT2-002 | OllamaService + Retry | 5 | 4-5h | IT2-001 |
| IT2-003 | Health check Ollama | 3 | 2h | IT2-002 |
| IT2-004 | Tests de integración | 5 | 4-5h | IT2-002 |
| IT2-005 | Logging estructurado | 2 | 1-2h | - |
| IT2-006 | Script descarga modelos | 2 | 1h | IT2-001 |

**Total**: 25 puntos | **Duración**: 1-2 semanas

**Criterios de Éxito**:
- ✅ Ollama en Docker funcionando
- ✅ Retry con backoff exponencial
- ✅ Circuit breaker funcional
- ✅ Latencia Ollama < 30s

---

### Iteración 3: Groq Cloud (21 puntos)

| ID | Tarea | Pts | Duración | Dependencias |
|----|-------|-----|----------|--------------|
| IT3-001 | GroqService mejorado | 5 | 4h | IT2 completa |
| IT3-002 | Triple fallback completo | 5 | 4h | IT3-001 |
| IT3-003 | Rate limiting | 3 | 2h | IT3-001 |
| IT3-004 | Dashboard de métricas | 3 | 2-3h | IT3-002 |
| IT3-005 | Tests E2E completos | 5 | 4-5h | IT3-002 |

**Total**: 21 puntos | **Duración**: 1 semana

**Criterios de Éxito**:
- ✅ Groq como primario
- ✅ Triple fallback funciona
- ✅ Rate limiting en acción
- ✅ Dashboard muestra métricas

---

### Iteración 4: Producción (26 puntos)

| ID | Tarea | Pts | Duración | Dependencias |
|----|-------|-----|----------|--------------|
| IT4-001 | Dockerfile multi-stage | 8 | 6h | IT3 completa |
| IT4-002 | Deploy en Koyeb | 5 | 3-4h | IT4-001 |
| IT4-003 | Variables seguras | 3 | 2h | IT4-002 |
| IT4-004 | GitHub Actions CI/CD | 5 | 4h | IT4-002 |
| IT4-005 | Health checks prod | 2 | 1h | IT4-002 |
| IT4-006 | Documentación deploy | 3 | 2h | IT4-004 |

**Total**: 26 puntos | **Duración**: 1 semana

**Criterios de Éxito**:
- ✅ Deploy automático funciona
- ✅ CI/CD pipeline completo
- ✅ Uptime > 99%
- ✅ Documentación completa

---

## Métricas y KPIs

### Métricas de Performance

| Métrica | Iteración 1 | Iteración 2 | Iteración 3 | Iteración 4 |
|---------|-------------|-------------|-------------|-------------|
| **Response Time (p50)** | < 50ms | < 3s | < 2s | < 2s |
| **Response Time (p95)** | < 100ms | < 30s | < 5s | < 5s |
| **Response Time (p99)** | < 150ms | < 60s | < 10s | < 10s |
| **Success Rate** | 100% | 95% | 98% | 98% |
| **Uptime** | 100% | 99% | 99% | 99.5% |

### Métricas de Calidad

| Métrica | Target | Iteración 1 | Iteración 2 | Iteración 3 | Iteración 4 |
|---------|--------|-------------|-------------|-------------|-------------|
| **Test Coverage** | > 80% | 85% | 85% | 90% | 90% |
| **ESLint Warnings** | 0 | 0 | 0 | 0 | 0 |
| **TypeScript Errors** | 0 | 0 | 0 | 0 | 0 |
| **Security Vulnerabilities** | 0 | 0 | 0 | 0 | 0 |

### Métricas de Fallback

| Fuente | Iteración 1 | Iteración 2 | Iteración 3 | Iteración 4 (Prod) |
|--------|-------------|-------------|-------------|---------------------|
| **Groq** | - | - | 70% | 70% |
| **Ollama** | - | 100% | 25% | 20% |
| **SQLite** | 100% | fallback | 5% | 10% |

---

## Dependencias y Tecnologías

### Stack Tecnológico

#### Backend
- **Framework**: NestJS 10.x
- **Language**: TypeScript 5.1+
- **Runtime**: Node.js 20 LTS

#### Base de Datos
- **ORM**: Prisma 5.x
- **Database**: SQLite (desarrollo/producción embebida)
- **Migrations**: Prisma Migrate

#### IA
- **Local**: Ollama (qwen2.5:0.5b, 500MB)
- **Cloud**: Groq API (llama-3.1-8b-instant)
- **Fallback**: SQLite pre-seeded

#### DevOps
- **Containerización**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **Deployment**: Koyeb PaaS
- **Monitoring**: Koyeb Dashboard + Custom /health

#### Testing
- **Unit**: Jest + @nestjs/testing
- **Integration**: Supertest + Docker
- **E2E**: Supertest
- **Coverage**: Istanbul (via Jest)

#### Linting & Formato
- **Linter**: ESLint + @typescript-eslint
- **Formatter**: Prettier
- **Pre-commit**: Husky (opcional)

---

## Gestión de Riesgos

### Riesgos Técnicos

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Ollama muy lento en hardware limitado** | Alta | Medio | Usar modelo pequeño (0.5b), fallback a Groq |
| **Groq rate limit excedido** | Media | Bajo | Implementar rate limiting local, fallback a Ollama |
| **SQLite no suficiente para producción** | Baja | Alto | Monitoreo, plan de migración a PostgreSQL |
| **Koyeb free tier insuficiente** | Media | Medio | Optimizar recursos, plan de upgrade |

### Riesgos de Proyecto

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| **Scope creep (features extra)** | Media | Alto | WIP limit estricto (máx 2 tareas) |
| **Complejidad subestimada** | Media | Medio | Buffer de 20% en estimaciones |
| **Dependencias bloqueadas** | Baja | Medio | Trabajo en paralelo cuando posible |
| **Testing insuficiente** | Baja | Alto | TDD en componentes críticos |

---

## Hitos y Entregas

### Hito 1: MVP Funcional (Fin de Iteración 1)
**Fecha Objetivo**: Semana 2
**Entregables**:
- ✅ Sistema backend funcional
- ✅ API REST documentada
- ✅ 50+ respuestas en SQLite
- ✅ Tests > 80%
- ✅ Docker Compose local

**Demo**: Sistema responde preguntas sin dependencias externas

---

### Hito 2: IA Local Integrada (Fin de Iteración 2)
**Fecha Objetivo**: Semana 4
**Entregables**:
- ✅ Ollama funcionando en Docker
- ✅ Retry logic + Circuit breaker
- ✅ Logging estructurado
- ✅ Tests de integración

**Demo**: Sistema genera respuestas con IA local, fallback a SQLite

---

### Hito 3: Sistema Completo Local (Fin de Iteración 3)
**Fecha Objetivo**: Semana 5
**Entregables**:
- ✅ Groq API integrado
- ✅ Triple fallback funcional
- ✅ Rate limiting
- ✅ Dashboard de métricas
- ✅ Tests E2E completos

**Demo**: Sistema completo con 3 capas de fallback

---

### Hito 4: GO LIVE (Fin de Iteración 4)
**Fecha Objetivo**: Semana 6
**Entregables**:
- ✅ Deploy en Koyeb
- ✅ CI/CD pipeline
- ✅ Monitoring en producción
- ✅ Documentación completa
- 🚀 **URL Pública**: https://ouija-backend.koyeb.app

**Demo**: Sistema en producción con uptime monitoring

---

## Velocidad del Equipo

### Estimación de Velocidad

Asumiendo **desarrollo individual freelance**:

| Semana | Puntos Objetivo | Puntos Reales | Velocidad |
|--------|-----------------|---------------|-----------|
| 1-2 | 23 | TBD | - |
| 2-3 | 25 | TBD | - |
| 4 | 21 | TBD | - |
| 5-6 | 26 | TBD | - |

**Promedio Esperado**: 10-15 puntos/semana (freelance part-time)

---

## Próximos Pasos Después del MVP

### Post-Iteración 4 (Opcionales)

#### Mejoras de Performance
- [ ] Implementar caché Redis
- [ ] Optimizar queries Prisma
- [ ] CDN para assets estáticos

#### Mejoras de Seguridad
- [ ] Rate limiting por IP
- [ ] API key authentication
- [ ] HTTPS enforced

#### Mejoras de Funcionalidad
- [ ] Soporte para más idiomas (pt, fr)
- [ ] Más personalidades (neutral, funny)
- [ ] Histórico de preguntas por usuario

#### Migración de DB
- [ ] PostgreSQL en lugar de SQLite
- [ ] Backup automatizado
- [ ] Replicación de datos

---

## Recursos y Referencias

### Documentación Oficial
- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Groq API Docs](https://console.groq.com/docs)
- [Koyeb Documentation](https://www.koyeb.com/docs)

### Tutoriales Recomendados
- NestJS Crash Course (YouTube)
- Prisma Quickstart (10 min)
- Docker for Beginners (2h)
- CI/CD with GitHub Actions (30 min)

### Herramientas
- **Design**: Excalidraw (diagramas)
- **API Testing**: Postman / Insomnia
- **DB Browser**: Prisma Studio
- **Monitoring**: Koyeb Dashboard
- **Logs**: Docker logs / Koyeb logs

---

## Resumen Ejecutivo

### ¿Qué estamos construyendo?
Un backend de Ouija Virtual con sistema de fallback progresivo que garantiza respuestas místicas siempre, incluso si los servicios de IA fallan.

### ¿Por qué este enfoque?
- **Resiliencia**: Múltiples capas de fallback
- **Performance**: Groq ultra-rápido, SQLite instantáneo
- **Aprendizaje**: Progresión lógica de simple a complejo
- **Costo**: Free tier hasta 10K requests/mes

### ¿Cuánto tiempo tomará?
**4-6 semanas** (freelance part-time)

### ¿Qué entregamos?
- Sistema backend robusto
- API REST documentada
- Deploy automático
- 90% test coverage
- Sistema en producción

---

**Última actualización**: 2025-10-17
**Versión**: 2.0.0
**Status**: ✅ Planificación Completa - Versión Expandida
