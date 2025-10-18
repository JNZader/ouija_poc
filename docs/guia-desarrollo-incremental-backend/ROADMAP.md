# Roadmap de Desarrollo - Backend Simple Ouija Virtual

## Visión General del Proyecto

Transformar el backend actual en un sistema robusto de respuestas místicas con triple fallback:
**Groq Cloud → Ollama Local → SQLite Fallback**

## Timeline Visual

```
Semanas:  1─────────2─────────3─────────4─────────5
          │         │         │         │         │
Iter 1:   ████████──┘         │         │         │  SQLite Base
          │                   │         │         │
Iter 2:   │         ████████──┘         │         │  + Ollama
          │                   │         │         │
Iter 3:   │         │         ████████──┘         │  + Groq
          │                   │         │         │
Iter 4:   │         │         │         ██████────┘  Deploy
          │                   │         │         │
Deploy:   │         ▲         │         ▲         ▲
         Dev     Staging     Test    Staging    Prod
```

## Arquitectura Evolutiva

### Iteración 1: Base SQLite (Semana 1-2)
```
Frontend
   ↓
API REST
   ↓
SQLite ─→ [FallbackResponse]
           └─> Respuestas pre-definidas
               por categoría/personalidad
```

**Valor**: Sistema funcional sin dependencias externas

### Iteración 2: + Ollama Local (Semana 2-3)
```
Frontend
   ↓
API REST
   ↓
Ollama Local ──✓──→ Respuesta IA
   ↓ (error)
SQLite Fallback
```

**Valor**: IA local, privacidad, sin costos API

### Iteración 3: + Groq Cloud (Semana 3-4)
```
Frontend
   ↓
API REST
   ↓
Groq Cloud ──✓──→ Respuesta rápida
   ↓ (error)
Ollama Local ──✓──→ Respuesta local
   ↓ (error)
SQLite Fallback
```

**Valor**: Alta velocidad + alta disponibilidad

### Iteración 4: Deploy Producción (Semana 5)
```
Usuario
   ↓
Koyeb Cloud
   ↓
Backend Docker
   ├─> Groq Cloud API
   ├─> Ollama Container
   └─> SQLite Embedded
```

**Valor**: Sistema completo en producción

## Detalles por Iteración

### Iteración 1: Fallback SQLite Funcional
**Duración**: 1-2 semanas
**Complejidad Total**: 21 puntos
**Estado**: 🚀 PRÓXIMA

#### Objetivos
- Sistema base completamente funcional
- Sin dependencias de IA
- Respuestas categorizadas y personalizadas
- API REST documentada

#### Entregables
- ✅ Base de datos seeded con 50+ respuestas
- ✅ API REST funcional (/ask, /health)
- ✅ Tests unitarios básicos
- ✅ Documentación Swagger
- ✅ Docker Compose local

#### Dependencias
- Ninguna (primera iteración)

---

### Iteración 2: Integración Ollama Local
**Duración**: 1-2 semanas
**Complejidad Total**: 18 puntos
**Estado**: ⏳ PLANIFICADA

#### Objetivos
- Ollama corriendo en Docker
- Integración con backend
- Fallback graceful a SQLite
- Logging robusto

#### Entregables
- ✅ Docker Compose con Ollama
- ✅ OllamaService mejorado
- ✅ Health checks de Ollama
- ✅ Tests de integración
- ✅ Manejo de timeouts

#### Dependencias
- Iteración 1 completa
- Docker instalado
- Modelo Ollama descargado

---

### Iteración 3: Integración Groq
**Duración**: 1 semana
**Complejidad Total**: 13 puntos
**Estado**: 📋 BACKLOG

#### Objetivos
- API Groq integrada
- Triple fallback funcional
- Rate limiting
- Monitoring de uso

#### Entregables
- ✅ GroqService mejorado
- ✅ Sistema de fallback completo
- ✅ Dashboard de métricas
- ✅ Tests E2E
- ✅ Documentación de API keys

#### Dependencias
- Iteración 2 completa
- API Key de Groq
- Variables de entorno configuradas

---

### Iteración 4: Deploy en Koyeb
**Duración**: 1 semana
**Complejidad Total**: 21 puntos
**Estado**: 📋 BACKLOG

#### Objetivos
- Dockerfile optimizado
- Deploy automático
- Variables de entorno seguras
- Monitoring en producción

#### Entregables
- ✅ Dockerfile multi-stage
- ✅ Koyeb configurado
- ✅ CI/CD con GitHub Actions
- ✅ Health checks en producción
- ✅ Rollback strategy

#### Dependencias
- Iteración 3 completa
- Cuenta Koyeb configurada
- GitHub repo con Actions habilitado

## Riesgos y Mitigaciones

### Riesgo 1: Ollama muy lento en Koyeb
**Probabilidad**: Alta
**Impacto**: Medio

**Mitigación**:
- Usar modelo pequeño (qwen2.5:0.5b)
- Timeout agresivo (10s)
- Fallback rápido a Groq

### Riesgo 2: Groq rate limiting
**Probabilidad**: Media
**Impacto**: Bajo

**Mitigación**:
- Cache de respuestas en backend
- Fallback a Ollama inmediato
- Monitoreo de rate limits

### Riesgo 3: SQLite en producción
**Probabilidad**: Baja
**Impacto**: Bajo

**Mitigación**:
- Solo para fallback (< 1% tráfico)
- Datos estáticos (no escribe)
- Backup en GitHub

## Métricas de Progreso

### Por Iteración
| Iteración | Puntos | Duración | Features | Tests |
|-----------|--------|----------|----------|-------|
| 1         | 21     | 1-2 sem  | 5        | 10+   |
| 2         | 18     | 1-2 sem  | 4        | 8+    |
| 3         | 13     | 1 sem    | 3        | 6+    |
| 4         | 21     | 1 sem    | 5        | 5+    |
| **TOTAL** | **73** | **4-6 sem** | **17** | **29+** |

### Velocidad Esperada
- **Semana 1**: 8-10 puntos (setup inicial)
- **Semana 2**: 10-13 puntos (ritmo normal)
- **Semana 3+**: 13-15 puntos (máxima velocidad)

## Hitos Críticos

### Hito 1: API Funcional (Fin Iteración 1)
- Sistema desplegable localmente
- Tests pasan al 100%
- Documentación básica

### Hito 2: IA Local Funcional (Fin Iteración 2)
- Ollama responde en < 30s
- Fallback funciona
- Docker Compose estable

### Hito 3: Triple Fallback (Fin Iteración 3)
- Groq como primario
- Todos los fallbacks probados
- Logging completo

### Hito 4: Producción Live (Fin Iteración 4)
- Deploy en Koyeb exitoso
- Health checks verdes
- Uptime > 99%

## Cronograma Detallado

### Semana 1
- [ ] Día 1-2: Seed SQLite + Tests
- [ ] Día 3: API REST mejorada
- [ ] Día 4: Documentación Swagger
- [ ] Día 5: Demo + Retrospectiva

### Semana 2
- [ ] Día 1: Docker Compose Ollama
- [ ] Día 2-3: Integración Ollama
- [ ] Día 4: Tests integración
- [ ] Día 5: Demo + Retrospectiva

### Semana 3
- [ ] Día 1-2: Integración Groq
- [ ] Día 3: Sistema fallback completo
- [ ] Día 4: Tests E2E
- [ ] Día 5: Demo + Retrospectiva

### Semana 4
- [ ] Día 1-2: Dockerfile Koyeb
- [ ] Día 3: Deploy staging
- [ ] Día 4: Tests producción
- [ ] Día 5: Go Live!

## Decisiones Técnicas Clave

### ¿Por qué SQLite como fallback?
**PRO**:
- Sin dependencias externas
- Embebido en aplicación
- Rápido para lectura
- Fácil de seedear

**CONTRA**:
- Respuestas estáticas
- No aprende
- Limitado en variedad

**Decisión**: Usar solo como último recurso (< 1% casos)

### ¿Por qué Ollama antes que Groq?
**PRO**:
- Sin costos por request
- Privacidad (datos locales)
- Sin rate limits
- Control total

**CONTRA**:
- Más lento (10-30s)
- Consume recursos
- Necesita GPU/CPU potente

**Decisión**: Ollama secundario, Groq primario en producción

### ¿Por qué Koyeb y no Railway/Render?
**PRO**:
- Docker nativo
- Free tier generoso
- Deploy automático
- Good performance

**CONTRA**:
- Menos conocido
- Comunidad pequeña
- Documentación limitada

**Decisión**: Koyeb con fallback a Railway si hay problemas

## Entrega Final Esperada

### Sistema Completo (Semana 5)
```typescript
// Flujo de una request
1. POST /ouija/ask
   ↓
2. Categorizar pregunta (career/love/health...)
   ↓
3. Try Groq (timeout 5s)
   ├─> ✓ Return response (70% casos)
   └─> ✗ Try Ollama
       ├─> ✓ Return response (25% casos)
       └─> ✗ SQLite fallback (5% casos)
4. Cache response
5. Return JSON
```

### Características Finales
- ⚡ Response time: < 10s (p95)
- 🎯 Uptime: > 99%
- 🔄 Triple fallback
- 💾 Cache inteligente
- 📊 Logging completo
- 🧪 70%+ test coverage
- 📚 API documentada

---

**Inicio Proyecto**: Semana 1
**Finalización**: Semana 5
**Siguiente Revisión**: Al completar cada iteración
