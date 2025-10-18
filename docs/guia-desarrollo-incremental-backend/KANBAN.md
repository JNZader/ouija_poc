# Tablero Kanban - Backend Simple Ouija Virtual

## Configuración del Tablero

### WIP Limits (Work In Progress)
- **Backlog**: ∞ (sin límite)
- **Ready**: 5 tareas máximo
- **In Progress**: 2 tareas máximo ⚠️ CRÍTICO
- **Review**: 3 tareas máximo
- **Done**: ∞ (archivo)

### Carriles de Prioridad
- 🔥 **P0 - Crítico**: Bloqueante, debe hacerse ahora
- ⚡ **P1 - Alta**: Importante, siguiente en cola
- 📝 **P2 - Media**: Normal, se hace después de P1
- 🔧 **P3 - Baja**: Nice to have, se hace si hay tiempo

---

## Estado Actual del Tablero

**Última actualización**: 2025-10-17
**Iteración Activa**: Iteración 1 - Fallback SQLite
**WIP Actual**: 0/2

---

## Backlog

### Iteración 1: Fallback SQLite (21 pts)
- [ ] **[IT1-001]** 🔥 Crear seed de datos SQLite (5 pts)
- [ ] **[IT1-002]** 🔥 Implementar FallbackService puro (8 pts)
- [ ] **[IT1-003]** ⚡ Mejorar categorización de preguntas (3 pts)
- [ ] **[IT1-004]** ⚡ Tests unitarios de FallbackService (5 pts)
- [ ] **[IT1-005]** 📝 Documentar API con Swagger (3 pts)
- [ ] **[IT1-006]** 📝 Docker Compose local (2 pts)
- [ ] **[IT1-007]** 🔧 Health endpoint con diagnóstico (2 pts)

### Iteración 2: Ollama Local (18 pts)
- [ ] **[IT2-001]** 🔥 Docker Compose con Ollama (8 pts)
- [ ] **[IT2-002]** 🔥 Mejorar OllamaService con retry (5 pts)
- [ ] **[IT2-003]** ⚡ Health check de Ollama (3 pts)
- [ ] **[IT2-004]** ⚡ Tests de integración Ollama (5 pts)
- [ ] **[IT2-005]** 📝 Logging estructurado (2 pts)
- [ ] **[IT2-006]** 🔧 Script de descarga de modelos (2 pts)

### Iteración 3: Groq Cloud (13 pts)
- [ ] **[IT3-001]** 🔥 Mejorar GroqService con retry (5 pts)
- [ ] **[IT3-002]** ⚡ Sistema de fallback completo (5 pts)
- [ ] **[IT3-003]** ⚡ Rate limiting Groq (3 pts)
- [ ] **[IT3-004]** 📝 Dashboard de métricas (3 pts)
- [ ] **[IT3-005]** 📝 Tests E2E completos (5 pts)

### Iteración 4: Deploy Koyeb (21 pts)
- [ ] **[IT4-001]** 🔥 Dockerfile multi-stage (8 pts)
- [ ] **[IT4-002]** 🔥 Deploy Koyeb (5 pts)
- [ ] **[IT4-003]** ⚡ Variables de entorno seguras (3 pts)
- [ ] **[IT4-004]** ⚡ GitHub Actions CI/CD (5 pts)
- [ ] **[IT4-005]** 📝 Health checks producción (2 pts)
- [ ] **[IT4-006]** 📝 Documentación deploy (3 pts)

---

## Ready (0/5)

_Tareas preparadas para empezar. Mueve aquí cuando tengas todos los requisitos._

---

## In Progress (0/2) ⚠️ WIP: 2 MAX

_Tareas en las que estás trabajando AHORA MISMO. Nunca más de 2._

---

## Review (0/3)

_Código completado, esperando revisión/testing._

---

## Done (Iteración Actual)

_Tareas completadas en la iteración actual._

---

## Leyenda de Etiquetas

### Por Tipo
- 🎯 **FEATURE**: Nueva funcionalidad
- 🐛 **BUG**: Corrección de error
- 🔧 **TECH**: Deuda técnica/refactoring
- 📝 **DOCS**: Documentación
- ⚙️ **SETUP**: Configuración/infraestructura
- 🧪 **TEST**: Testing

### Por Área
- `api` - REST API endpoints
- `database` - SQLite/Prisma
- `ollama` - Servicio Ollama
- `groq` - Servicio Groq
- `docker` - Containerización
- `deploy` - Deployment
- `monitoring` - Logs/métricas

---

## Tablero Detallado por Iteración

## ITERACIÓN 1: Fallback SQLite

### Backlog
```
┌─────────────────────────────────────────────────────────────┐
│ [IT1-001] 🔥 P0 | SETUP | database                          │
│ Crear seed de datos SQLite                            [5pt] │
│ ─────────────────────────────────────────────────────────── │
│ Crear 50+ respuestas categorizadas para todas las          │
│ combinaciones de personalidad/idioma/categoría             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT1-002] 🔥 P0 | FEATURE | database                        │
│ Implementar FallbackService puro                      [8pt] │
│ ─────────────────────────────────────────────────────────── │
│ Servicio que consulta SOLO SQLite, sin dependencias IA     │
│ Algoritmo de matching inteligente por keywords             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT1-003] ⚡ P1 | FEATURE | api                             │
│ Mejorar categorización de preguntas                   [3pt] │
│ ─────────────────────────────────────────────────────────── │
│ Añadir más keywords por categoría                          │
│ Mejorar algoritmo de detección                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT1-004] ⚡ P1 | TEST | database                           │
│ Tests unitarios de FallbackService                    [5pt] │
│ ─────────────────────────────────────────────────────────── │
│ Cobertura > 80% de FallbackService                         │
│ Tests de edge cases (categoría inexistente, etc)           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT1-005] 📝 P2 | DOCS | api                                │
│ Documentar API con Swagger                            [3pt] │
│ ─────────────────────────────────────────────────────────── │
│ Swagger UI en /api/docs                                    │
│ Documentar todos los endpoints                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT1-006] 📝 P2 | SETUP | docker                            │
│ Docker Compose local                                  [2pt] │
│ ─────────────────────────────────────────────────────────── │
│ Backend + SQLite en Docker                                 │
│ Volúmenes persistentes                                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT1-007] 🔧 P3 | FEATURE | api                             │
│ Health endpoint con diagnóstico                       [2pt] │
│ ─────────────────────────────────────────────────────────── │
│ GET /health con estado de SQLite                           │
│ Cuenta de respuestas en DB                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ITERACIÓN 2: Ollama Local

### Backlog
```
┌─────────────────────────────────────────────────────────────┐
│ [IT2-001] 🔥 P0 | SETUP | docker, ollama                    │
│ Docker Compose con Ollama                             [8pt] │
│ ─────────────────────────────────────────────────────────── │
│ Ollama container con modelo qwen2.5:0.5b                   │
│ Backend conectado a Ollama                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT2-002] 🔥 P0 | FEATURE | ollama                          │
│ Mejorar OllamaService con retry                       [5pt] │
│ ─────────────────────────────────────────────────────────── │
│ Retry logic (3 intentos)                                   │
│ Circuit breaker pattern                                    │
│ Fallback automático a SQLite                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT2-003] ⚡ P1 | FEATURE | ollama                          │
│ Health check de Ollama                                [3pt] │
│ ─────────────────────────────────────────────────────────── │
│ Verificar disponibilidad antes de usar                     │
│ Actualizar /health endpoint                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT2-004] ⚡ P1 | TEST | ollama                             │
│ Tests de integración Ollama                           [5pt] │
│ ─────────────────────────────────────────────────────────── │
│ Test con Ollama real (Docker)                              │
│ Test de fallback cuando Ollama falla                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT2-005] 📝 P2 | FEATURE | monitoring                      │
│ Logging estructurado                                  [2pt] │
│ ─────────────────────────────────────────────────────────── │
│ Winston logger con niveles                                 │
│ Logs de performance (response time)                        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ [IT2-006] 🔧 P3 | SETUP | ollama                            │
│ Script de descarga de modelos                         [2pt] │
│ ─────────────────────────────────────────────────────────── │
│ Automatizar pull de modelo Ollama                          │
│ Verificar modelo existe antes de usar                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Cómo Usar Este Tablero

### 1. Movimiento de Tareas
```
Backlog → Ready → In Progress → Review → Done
```

### 2. Reglas de WIP
- Nunca más de 2 tareas en "In Progress"
- Si tienes 2 WIP, termina una antes de empezar otra
- Si estás bloqueado, mueve a "Review" o vuelve a "Ready"

### 3. Flujo de Trabajo
```
1. Selecciona tarea de "Ready" (prioridad más alta)
2. Muévela a "In Progress"
3. Desarrolla la tarea
4. Escribe tests
5. Mueve a "Review"
6. Auto-revisa código
7. Si OK → "Done", si no → "In Progress"
```

### 4. Priorización
1. Primero todas las P0 (críticas)
2. Luego todas las P1 (altas)
3. Luego P2 (medias)
4. P3 solo si hay tiempo

### 5. Actualización
- Actualiza este archivo cada día
- Al completar tarea, mueve a "Done"
- Al final de iteración, archiva "Done"

---

## Métricas del Tablero

### Velocidad
- **Objetivo**: 10-13 puntos/semana
- **Actual**: 0 puntos (aún no iniciado)

### Cycle Time
- **Objetivo**: < 2 días por tarea
- **Actual**: N/A

### Lead Time
- **Objetivo**: < 3 días (Ready → Done)
- **Actual**: N/A

### WIP Efficiency
- **Objetivo**: WIP siempre ≤ 2
- **Actual**: 0/2 ✅

---

## Retrospectiva

### ¿Qué funcionó bien?
_Se completa al final de cada iteración_

### ¿Qué mejorar?
_Se completa al final de cada iteración_

### Acciones para próxima iteración
_Se completa al final de cada iteración_

---

**Recuerda**: El objetivo es entregar valor incremental, no completar tareas rápido. Calidad > velocidad.
