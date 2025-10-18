# Iteración 1: Fallback SQLite Funcional

## Objetivos de la Iteración

Crear un **sistema base completamente funcional** que NO dependa de IA externa. Este sistema debe ser capaz de responder preguntas místicas usando únicamente respuestas pre-definidas almacenadas en SQLite.

### ¿Por qué empezar sin IA?

**Razón Técnica**: Establecer una base sólida y testeable antes de añadir la complejidad de servicios externos.

**Razón de Negocio**: Tener un sistema funcional desde el día 1 que pueda desplegarse y usarse, incluso si las APIs de IA fallan.

**Razón de Aprendizaje**: Entender primero cómo funciona la lógica de negocio (categorización, personalidades, idiomas) antes de delegar a IA.

## Resumen Ejecutivo

```
Duración:     1-2 semanas
Complejidad:  21 puntos
Features:     7 tareas
Tests:        10+ unitarios
Deploy:       Local con Docker Compose
```

## Estado Actual vs Estado Deseado

### Estado Actual
- ✅ Prisma configurado con schema SQLite
- ✅ PromptsService con categorización básica
- ✅ OuijaService que intenta usar Ollama/Groq
- ⚠️ Tabla FallbackResponse existe pero está VACÍA
- ⚠️ Sin fallback real funcionando
- ⚠️ Sin tests unitarios

### Estado Deseado (Al Finalizar Iteración 1)
- ✅ Tabla FallbackResponse con 50+ respuestas
- ✅ FallbackService puro que consulta SQLite
- ✅ API REST funcional sin depender de IA
- ✅ Tests unitarios > 80% cobertura
- ✅ Documentación Swagger completa
- ✅ Docker Compose para desarrollo local
- ✅ Health endpoint con diagnóstico

## Arquitectura de la Iteración

```
┌─────────────┐
│  Frontend   │
│  (futuro)   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────┐
│      NestJS Backend                 │
│  ┌───────────────────────────────┐  │
│  │   OuijaController             │  │
│  │   POST /ouija/ask             │  │
│  │   GET  /ouija/cache/stats     │  │
│  │   GET  /health                │  │
│  └──────────┬────────────────────┘  │
│             │                        │
│  ┌──────────▼────────────────────┐  │
│  │   FallbackService (NUEVO)    │  │
│  │   - categorizeQuestion()     │  │
│  │   - selectResponse()         │  │
│  │   - matchKeywords()          │  │
│  └──────────┬────────────────────┘  │
│             │                        │
│  ┌──────────▼────────────────────┐  │
│  │   PrismaService              │  │
│  │   - findMany()               │  │
│  │   - where filters            │  │
│  └──────────┬────────────────────┘  │
└─────────────┼────────────────────────┘
              │
       ┌──────▼──────┐
       │   SQLite    │
       │   dev.db    │
       │             │
       │ [Fallback   │
       │  Response]  │
       │  - id       │
       │  - personality │
       │  - category │
       │  - language │
       │  - text     │
       │  - keywords │
       └─────────────┘
```

## Decisiones Técnicas Clave

### 1. ¿Por qué crear un FallbackService separado?

**Opción A**: Usar solo OuijaService existente
**Opción B**: Crear FallbackService dedicado ✅

**Decisión**: Opción B

**Razones**:
- **Separation of Concerns**: FallbackService solo maneja SQLite
- **Testabilidad**: Más fácil testear lógica de fallback aislada
- **Reusabilidad**: Puede usarse desde múltiples servicios
- **Claridad**: Código más limpio y entendible

### 2. ¿Cómo almacenar keywords en SQLite?

**Opción A**: Tabla separada Keywords (relación 1-N)
**Opción B**: JSON string en columna keywords ✅

**Decisión**: Opción B

**Razones**:
- **Simplicidad**: Una sola query para obtener respuesta + keywords
- **Performance**: Menos JOINs, más rápido para lectura
- **Tamaño**: Dataset pequeño (< 200 respuestas)

**Tradeoff**: No se puede filtrar por keyword individual en SQL (no es necesario)

### 3. ¿Cómo categorizar preguntas?

**Opción A**: Machine Learning (NLP)
**Opción B**: Regex + keyword matching ✅

**Decisión**: Opción B

**Razones**:
- **Simplicidad**: No requiere entrenamiento
- **Velocidad**: O(n) muy rápido
- **Determinístico**: Mismo input = mismo output
- **Suficiente**: Para 8 categorías funciona bien

**Categorías Soportadas**:
- `love` - Amor y relaciones
- `career` - Trabajo y carrera
- `health` - Salud física/mental
- `family` - Familia
- `death` - Muerte y duelo
- `future` - Futuro general
- `money` - Dinero y finanzas
- `spirituality` - Espiritualidad
- `general` - Otras preguntas

### 4. ¿Cómo hacer matching de respuestas?

**Algoritmo de Matching**:
```typescript
1. Filtrar por personality + language + category
2. Para cada respuesta:
   a. Parsear keywords (JSON)
   b. Contar matches en la pregunta
   c. Asignar score
3. Ordenar por score (mayor primero)
4. Si score > 0: retornar mejor match
5. Si score = 0: retornar respuesta aleatoria
```

**Ejemplo**:
```
Pregunta: "¿Encontraré el amor este año?"
Category: love
Language: es
Personality: wise

Respuestas candidatas:
1. "El amor llega cuando menos lo esperas..."
   Keywords: ["amor", "pareja", "corazón"]
   Score: 1 (match: "amor")

2. "Las estrellas indican unión próxima..."
   Keywords: ["unión", "matrimonio", "pareja"]
   Score: 0 (no match)

Resultado: Respuesta 1 (score más alto)
```

## Estructura de Datos

### Schema Prisma (Ya Existe)
```prisma
model FallbackResponse {
  id          String   @id @default(uuid())
  personality String   // 'wise' | 'cryptic' | 'dark' | 'playful'
  category    String   // 'love' | 'career' | 'health' | ...
  language    String   // 'es' | 'en'
  text        String
  keywords    String   // JSON array: ["keyword1", "keyword2"]
  createdAt   DateTime @default(now())

  @@index([personality, category, language])
}
```

### Ejemplo de Datos
```typescript
{
  id: "uuid-1",
  personality: "wise",
  category: "love",
  language: "es",
  text: "El amor verdadero no se busca, se encuentra cuando el alma está preparada. Las estrellas indican que tu corazón pronto conocerá la calidez de una conexión profunda.",
  keywords: JSON.stringify(["amor", "pareja", "corazón", "relación", "encontrar"]),
  createdAt: new Date()
}
```

## Tareas Detalladas

### [IT1-000] Setup Inicial del Proyecto (2 pts)

**⚠️ IMPORTANTE**: Esta es la **tarea 0** que debe completarse ANTES de cualquier otra tarea.

**¿Qué?**: Crear proyecto NestJS desde cero con todas las configuraciones base

**¿Por qué?**: Sin un setup correcto, el proyecto no compilará ni ejecutará

**¿Cómo?**:
1. Instalar NestJS CLI
2. Crear proyecto con `nest new backend-simple`
3. Instalar dependencias (Prisma, axios, validators)
4. Configurar Prisma con SQLite
5. Crear migración inicial
6. Configurar archivos (.gitignore, .eslintrc, .prettierrc)
7. Implementar PrismaService
8. Configurar CORS y validación

**Documentación Completa**: Ver [IT1-000_SETUP_INICIAL.md](./IT1-000_SETUP_INICIAL.md)

**Criterios de Aceptación**:
- [ ] Proyecto NestJS creado
- [ ] Todas las dependencias instaladas
- [ ] Prisma configurado y migración inicial ejecutada
- [ ] Archivos de configuración creados
- [ ] PrismaService funcionando
- [ ] Servidor compila y arranca en puerto 3001

---

### [IT1-001] Crear seed de datos SQLite (5 pts)

**¿Qué?**: Crear archivo `prisma/seed.ts` con 50+ respuestas

**¿Por qué?**: Sin datos, el sistema no puede funcionar

**¿Cómo?**:
1. Crear matriz de combinaciones:
   - 4 personalidades × 9 categorías × 2 idiomas = 72 respuestas mínimo
2. Escribir respuestas creativas y variadas
3. Asignar keywords relevantes a cada respuesta
4. Ejecutar `npm run prisma:seed`

**Archivos a crear**:
- `backend-simple/prisma/seed.ts`

**Criterios de Aceptación**:
- [ ] Mínimo 50 respuestas únicas
- [ ] Todas las combinaciones personality × language cubiertas
- [ ] Todas las categorías representadas
- [ ] Keywords relevantes en cada respuesta
- [ ] Seed ejecuta sin errores

---

### [IT1-002] Implementar FallbackService puro (8 pts)

**¿Qué?**: Crear servicio dedicado para consultas SQLite

**¿Por qué?**: Separar lógica de fallback del servicio principal

**¿Cómo?**:
1. Crear `src/modules/ouija/services/fallback.service.ts`
2. Implementar método `getResponse(personality, language, category, question?)`
3. Implementar algoritmo de keyword matching
4. Añadir logging detallado

**Archivos a crear**:
- `backend-simple/src/modules/ouija/services/fallback.service.ts`

**Archivos a modificar**:
- `backend-simple/src/modules/ouija/ouija.module.ts` (añadir provider)

**Criterios de Aceptación**:
- [ ] FallbackService inyectable con DI
- [ ] Método getResponse() funcional
- [ ] Matching por keywords implementado
- [ ] Fallback a categoría 'general' si no hay resultados
- [ ] Logging de score de matching

---

### [IT1-003] Mejorar categorización de preguntas (3 pts)

**¿Qué?**: Expandir keywords en PromptsService.categorizeQuestion()

**¿Por qué?**: Más keywords = mejor detección de categoría

**¿Cómo?**:
1. Añadir más keywords por categoría (mínimo 10 por categoría)
2. Soportar sinónimos y variaciones
3. Añadir tests de categorización

**Archivos a modificar**:
- `backend-simple/src/modules/ouija/services/prompts.service.ts`

**Criterios de Aceptación**:
- [ ] Mínimo 10 keywords por categoría
- [ ] Soporte español e inglés
- [ ] Tests de edge cases

---

### [IT1-004] Tests unitarios de FallbackService (5 pts)

**¿Qué?**: Suite completa de tests unitarios

**¿Por qué?**: Garantizar que el fallback siempre funciona

**¿Cómo?**:
1. Crear `fallback.service.spec.ts`
2. Mockear PrismaService
3. Testear todos los casos:
   - Matching exitoso
   - Sin matching (random)
   - Categoría inexistente (fallback a general)
   - Sin respuestas en DB

**Archivos a crear**:
- `backend-simple/src/modules/ouija/services/fallback.service.spec.ts`

**Criterios de Aceptación**:
- [ ] Cobertura > 80%
- [ ] Todos los edge cases cubiertos
- [ ] Tests pasan al 100%

---

### [IT1-005] Documentar API con Swagger (3 pts)

**¿Qué?**: Añadir decoradores Swagger a controladores

**¿Por qué?**: Documentación auto-generada para frontend

**¿Cómo?**:
1. Instalar `@nestjs/swagger`
2. Añadir decoradores a OuijaController
3. Configurar Swagger en `main.ts`
4. Acceder a `/api/docs`

**Archivos a modificar**:
- `backend-simple/src/main.ts`
- `backend-simple/src/modules/ouija/ouija.controller.ts`
- `backend-simple/src/modules/ouija/dto/ouija-question.dto.ts`

**Criterios de Aceptación**:
- [ ] Swagger UI accesible en `/api/docs`
- [ ] Todos los endpoints documentados
- [ ] DTOs con ejemplos
- [ ] Responses documentados

---

### [IT1-006] Docker Compose local (2 pts)

**¿Qué?**: Crear docker-compose.yml para desarrollo local

**¿Por qué?**: Facilitar onboarding y desarrollo

**¿Cómo?**:
1. Crear `docker-compose.yml` en raíz de backend-simple
2. Servicio backend con hot reload
3. Volumen persistente para SQLite

**Archivos a crear**:
- `backend-simple/docker-compose.yml`
- `backend-simple/Dockerfile.dev`

**Criterios de Aceptación**:
- [ ] `docker-compose up` funciona
- [ ] Hot reload activo
- [ ] SQLite persiste entre reinicios
- [ ] Logs visibles en consola

---

### [IT1-007] Health endpoint con diagnóstico (2 pts)

**¿Qué?**: Endpoint `/health` con información útil

**¿Por qué?**: Debugging y monitoreo

**¿Cómo?**:
1. Crear `HealthController`
2. Verificar conexión SQLite
3. Contar respuestas en DB
4. Retornar info del sistema

**Archivos a crear**:
- `backend-simple/src/health/health.controller.ts`
- `backend-simple/src/health/health.module.ts`

**Archivos a modificar**:
- `backend-simple/src/app.module.ts`

**Criterios de Aceptación**:
- [ ] GET `/health` retorna status 200
- [ ] Incluye count de respuestas en DB
- [ ] Incluye timestamp
- [ ] Formato JSON estructurado

## Cronograma Sugerido

### Día 1-2: Setup de Datos
- [ ] Tarea IT1-001 (Seed SQLite)
- [ ] Validar que datos se insertan correctamente

### Día 3-4: Servicio Core
- [ ] Tarea IT1-002 (FallbackService)
- [ ] Tarea IT1-003 (Categorización)
- [ ] Integrar con OuijaController

### Día 5: Testing
- [ ] Tarea IT1-004 (Tests unitarios)
- [ ] Validar cobertura

### Día 6: Infraestructura
- [ ] Tarea IT1-005 (Swagger)
- [ ] Tarea IT1-006 (Docker Compose)
- [ ] Tarea IT1-007 (Health endpoint)

### Día 7: Demo & Retrospectiva
- [ ] Testing manual completo
- [ ] Demo del sistema funcionando
- [ ] Retrospectiva de la iteración

## Definición de "Done"

Una tarea está DONE cuando:
- [ ] Código implementado y funcional
- [ ] Tests escritos y pasando
- [ ] Documentación actualizada
- [ ] Code review personal completado
- [ ] Sin warnings de linter
- [ ] Commit pusheado a Git

La iteración está DONE cuando:
- [ ] Todas las tareas en "Done"
- [ ] Sistema desplegable localmente
- [ ] Tests pasan al 100%
- [ ] Documentación completa
- [ ] Demo exitosa

## Riesgos y Mitigaciones

### Riesgo 1: Respuestas muy genéricas
**Probabilidad**: Media
**Impacto**: Medio

**Mitigación**:
- Escribir respuestas variadas y específicas
- Testear con preguntas reales
- Iterar sobre calidad de respuestas

### Riesgo 2: Categorización incorrecta
**Probabilidad**: Media
**Impacto**: Bajo

**Mitigación**:
- Keywords exhaustivas
- Categoría 'general' como fallback
- Logging para detectar errores

### Riesgo 3: Performance lento
**Probabilidad**: Baja
**Impacto**: Bajo

**Mitigación**:
- SQLite es rápido para < 200 respuestas
- Índices en campos filtrados
- Cache en memoria si es necesario

## Métricas de Éxito

### Funcionales
- ✅ Sistema responde preguntas sin IA
- ✅ Categorización > 80% precisa
- ✅ Respuestas variadas y coherentes

### Técnicas
- ✅ Response time < 100ms (p95)
- ✅ Test coverage > 80%
- ✅ 0 errores en logs

### Aprendizaje
- ✅ Entendimiento de arquitectura de fallback
- ✅ Dominio de Prisma + SQLite
- ✅ Práctica de testing unitario

## Preparación para Iteración 2

Al finalizar esta iteración, deberías tener:
- [x] Sistema base sólido y testeable
- [x] Entendimiento de lógica de negocio
- [x] Infraestructura de testing
- [x] Base para integrar Ollama

Siguiente paso: Añadir Ollama como capa superior, usando este fallback como red de seguridad.

---

**Próximo Documento**: [USER_STORIES.md](./USER_STORIES.md)
