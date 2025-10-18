# Criterios de Aceptación - Iteración 1

## Definición de "Done"

Una tarea está **DONE** cuando cumple TODOS estos criterios:

### Criterios Generales (Aplican a Todas las Tareas)
- [ ] Código implementado y funcional
- [ ] Sin errores de TypeScript
- [ ] Sin warnings de ESLint
- [ ] Código formateado con Prettier
- [ ] Tests escritos y pasando (donde aplique)
- [ ] Documentación inline (JSDoc) en funciones públicas
- [ ] Commit con mensaje descriptivo
- [ ] Branch pusheado a Git

### Criterios Específicos por Tarea

---

## IT1-001: Seed de Datos SQLite

### Funcional
- [ ] Archivo `prisma/seed.ts` existe y es ejecutable
- [ ] Script `npm run prisma:seed` ejecuta sin errores
- [ ] Base de datos contiene **mínimo 50 respuestas** después del seed
- [ ] Todas las **4 personalidades** están representadas
  - [ ] wise
  - [ ] cryptic
  - [ ] dark
  - [ ] playful
- [ ] Todas las **9 categorías** están representadas
  - [ ] love
  - [ ] career
  - [ ] health
  - [ ] family
  - [ ] death
  - [ ] future
  - [ ] money
  - [ ] spirituality
  - [ ] general
- [ ] Ambos **idiomas** están soportados
  - [ ] Español (es)
  - [ ] Inglés (en)

### Calidad de Datos
- [ ] Cada respuesta tiene texto único (no duplicados)
- [ ] Cada respuesta tiene mínimo **3 keywords** relevantes
- [ ] Keywords en formato JSON array válido: `["keyword1", "keyword2"]`
- [ ] Textos coherentes con la personalidad asignada
  - **Wise**: Tono sabio, consejero, esperanzador
  - **Cryptic**: Tono misterioso, enigmático, vago
  - **Dark**: Tono oscuro, ominoso, dramático
  - **Playful**: Tono juguetón, divertido, irónico

### Técnico
- [ ] Seed es **idempotente** (puede ejecutarse múltiples veces)
- [ ] Limpia datos existentes antes de insertar (`deleteMany`)
- [ ] Muestra estadísticas al finalizar (count por personalidad/idioma)
- [ ] Logs informativos durante el proceso
- [ ] Maneja errores gracefully

### Validación
```bash
# 1. Ejecutar seed
npm run prisma:seed
# Debe mostrar: "✅ Seeded XX responses"

# 2. Verificar en Prisma Studio
npm run prisma:studio
# → Tabla FallbackResponse debe tener 50+ filas

# 3. Query de validación
SELECT COUNT(*) FROM FallbackResponse;
-- Resultado esperado: >= 50

# 4. Validar distribución
SELECT personality, language, COUNT(*) as count
FROM FallbackResponse
GROUP BY personality, language;
-- Debe haber datos para todas las combinaciones
```

---

## IT1-002: FallbackService

### Funcional
- [ ] Clase `FallbackService` creada en `src/modules/ouija/services/fallback.service.ts`
- [ ] Servicio inyectable vía Dependency Injection
- [ ] Registrado en `OuijaModule` como provider
- [ ] Método `getResponse()` implementado con firma correcta:
```typescript
async getResponse(
  personality: string,
  language: string,
  category: string,
  question?: string
): Promise<FallbackResult>
```

### Lógica de Negocio
- [ ] **Caso 1**: Query exitosa con resultados
  - [ ] Filtra por personality + language + category
  - [ ] Retorna respuesta válida
- [ ] **Caso 2**: Con pregunta (keyword matching)
  - [ ] Parsea keywords de JSON
  - [ ] Cuenta matches en la pregunta
  - [ ] Retorna respuesta con mayor score
  - [ ] Si score = 0, retorna respuesta aleatoria
- [ ] **Caso 3**: Sin pregunta
  - [ ] Retorna respuesta aleatoria de la categoría
- [ ] **Caso 4**: Categoría sin respuestas
  - [ ] Hace fallback a categoría 'general'
  - [ ] Si 'general' también vacía, retorna mensaje por defecto
- [ ] **Caso 5**: Manejo de errores
  - [ ] Keywords JSON inválidas no rompen el sistema
  - [ ] Logs de errores informativos

### Retorno
El objeto retornado debe incluir:
```typescript
{
  text: string;           // La respuesta seleccionada
  matchScore: number;     // 0 si aleatorio, >0 si keyword match
  category: string;       // Categoría usada (puede ser 'general' si hubo fallback)
  method: 'keyword-match' | 'random' | 'fallback-general';
}
```

### Integración
- [ ] `OuijaService` usa `FallbackService` en lugar de `getFallbackResponse()`
- [ ] Endpoint `/ouija/ask` funciona sin Ollama/Groq
- [ ] Response incluye `source: 'database'` y `model: 'sqlite-fallback'`

### Performance
- [ ] Response time < 100ms (p95)
- [ ] Query optimizada (usa índice en schema)

### Logging
- [ ] Log al iniciar consulta: `🔍 Querying fallback: wise/es/love`
- [ ] Log de resultado: `✅ Best match found with score: 3` o `🎲 Random selection`
- [ ] Log de fallback: `⚠️ No responses for category 'X', trying 'general'`

### Validación
```bash
# Test 1: Keyword matching
curl -X POST http://localhost:3000/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Encontraré el amor?", "personality": "wise", "language": "es"}'

# Verificar en logs:
# - "Querying fallback: wise/es/love"
# - "Best match found with score: X" (X > 0)

# Test 2: Categoría inexistente
curl -X POST http://localhost:3000/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "Test", "personality": "wise", "language": "es"}'

# Verificar respuesta coherente (no error)
```

---

## IT1-003: Categorización Mejorada

### Funcional
- [ ] Método `categorizeQuestion()` en `PromptsService` mejorado
- [ ] Cada categoría tiene **mínimo 10 keywords**
- [ ] Keywords soportan **español e inglés**

### Precisión
- [ ] Categorización correcta en > 80% de casos de prueba
- [ ] Preguntas sin matches → categoría 'general'
- [ ] Preguntas ambiguas → categoría con más matches

### Casos de Prueba
```typescript
// Test cases
const testCases = [
  { question: '¿Encontraré el amor?', expected: 'love' },
  { question: 'Will I find love?', expected: 'love' },
  { question: '¿Conseguiré trabajo?', expected: 'career' },
  { question: 'Should I change jobs?', expected: 'career' },
  { question: '¿Estaré sano?', expected: 'health' },
  { question: 'Will I be healthy?', expected: 'health' },
  { question: '¿Qué me depara el futuro?', expected: 'future' },
  { question: 'Random text here', expected: 'general' },
];

// Validar que 80%+ sean correctos
```

### Validación
- [ ] Tests unitarios en `prompts.service.spec.ts`
- [ ] Cobertura > 80% del método `categorizeQuestion()`

---

## IT1-004: Tests Unitarios

### Cobertura
- [ ] FallbackService: > 80% cobertura
- [ ] PromptsService.categorizeQuestion(): > 80% cobertura
- [ ] Todos los tests pasan (`npm run test`)
- [ ] Tests ejecutan en < 5 segundos

### Casos Cubiertos
- [ ] **Test 1**: Matching exitoso con keywords
```typescript
it('should return best match when keywords match', async () => {
  // Mock PrismaService
  // Asegurar que retorna respuesta con score > 0
});
```

- [ ] **Test 2**: Sin matching (aleatorio)
```typescript
it('should return random when no keywords match', async () => {
  // Asegurar que matchScore = 0
  // Asegurar que method = 'random'
});
```

- [ ] **Test 3**: Fallback a 'general'
```typescript
it('should fallback to general category when no responses', async () => {
  // Mock categoría vacía
  // Verificar recursión a 'general'
});
```

- [ ] **Test 4**: JSON inválido en keywords
```typescript
it('should handle invalid JSON keywords', async () => {
  // Mock respuesta con keywords: "invalid json"
  // No debe romper, debe log warning
});
```

- [ ] **Test 5**: Base de datos vacía
```typescript
it('should return default message when DB is empty', async () => {
  // Mock findMany retorna []
  // Verificar mensaje por defecto
});
```

### Estructura
```bash
backend-simple/src/modules/ouija/services/
├── fallback.service.ts
├── fallback.service.spec.ts  ← NUEVO
├── prompts.service.ts
└── prompts.service.spec.ts   ← MEJORADO
```

### Validación
```bash
# Ejecutar tests
npm run test

# Ver cobertura
npm run test:cov

# Resultados esperados:
# ✓ All tests passing
# ✓ Coverage > 80%
```

---

## IT1-005: Documentación Swagger

### Configuración
- [ ] `@nestjs/swagger` instalado
- [ ] Swagger configurado en `main.ts`
- [ ] Swagger UI accesible en `http://localhost:3000/api/docs`

### Documentación de Endpoints
- [ ] **POST /ouija/ask**
  - [ ] Decorador `@ApiOperation()`
  - [ ] Request body documentado
  - [ ] Response 200 documentado
  - [ ] Response 400/500 documentados
  - [ ] Ejemplo de request/response

- [ ] **GET /ouija/cache/stats**
  - [ ] Documentado

- [ ] **DELETE /ouija/cache**
  - [ ] Documentado

- [ ] **GET /health**
  - [ ] Documentado

### DTOs
- [ ] `OuijaQuestionDto` con decoradores `@ApiProperty()`
  - [ ] Ejemplo de valores
  - [ ] Descripción de cada campo
  - [ ] Validaciones documentadas

### Validación
```bash
# 1. Levantar servidor
npm run start:dev

# 2. Abrir navegador
open http://localhost:3000/api/docs

# 3. Verificar:
# - Todos los endpoints visibles
# - "Try it out" funcional
# - Ejemplos de request/response claros
# - Schemas generados automáticamente
```

---

## IT1-006: Docker Compose

### Archivos
- [ ] `docker-compose.yml` creado en raíz de backend-simple
- [ ] `Dockerfile.dev` creado (si es necesario)
- [ ] `.dockerignore` creado

### Funcionalidad
- [ ] `docker-compose up` levanta el backend
- [ ] Backend accesible en `http://localhost:3000`
- [ ] **Hot reload** funciona (cambios en código reflejan sin reiniciar)
- [ ] SQLite persiste en volumen (datos sobreviven a `docker-compose down`)
- [ ] Logs visibles en tiempo real
- [ ] `docker-compose down` limpia correctamente

### Configuración
```yaml
# docker-compose.yml mínimo
version: '3.8'
services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./src:/app/src
      - ./prisma:/app/prisma
      - ./data:/app/data  # Persistir SQLite
    environment:
      - NODE_ENV=development
      - DATABASE_URL=file:./data/dev.db
    command: npm run start:dev
```

### Validación
```bash
# 1. Construir y levantar
docker-compose up --build

# 2. Verificar logs
# Debe mostrar: "Application is running on: http://localhost:3000"

# 3. Probar endpoint
curl http://localhost:3000/health

# 4. Verificar hot reload
# Editar archivo .ts → guardar → ver logs actualizándose

# 5. Verificar persistencia
docker-compose down
docker-compose up
# Los datos de SQLite deben seguir ahí
```

---

## IT1-007: Health Endpoint

### Funcional
- [ ] Endpoint `GET /health` existe
- [ ] Retorna status 200 cuando todo OK
- [ ] No requiere autenticación
- [ ] Response en formato JSON

### Información Incluida
```json
{
  "status": "ok",
  "timestamp": "2025-10-17T10:30:00.000Z",
  "version": "1.0.0",
  "database": {
    "connected": true,
    "responsesCount": 54
  }
}
```

- [ ] Campo `status`: "ok" cuando funcional
- [ ] Campo `timestamp`: ISO 8601
- [ ] Campo `version`: Version del package.json
- [ ] Campo `database.connected`: Verificación de conexión
- [ ] Campo `database.responsesCount`: Count real de tabla FallbackResponse

### Módulo Dedicado
- [ ] `src/health/health.controller.ts` creado
- [ ] `src/health/health.module.ts` creado
- [ ] Módulo importado en `app.module.ts`

### Validación
```bash
# Test básico
curl http://localhost:3000/health

# Debe retornar JSON con status 200
# Verificar que responsesCount sea correcto
```

---

## Definición de "Iteración 1 Completa"

La iteración está **DONE** cuando:

### Funcional
- [ ] Sistema responde preguntas SIN Ollama/Groq
- [ ] Respuestas vienen de SQLite
- [ ] Categorización funciona correctamente
- [ ] Keyword matching funcional
- [ ] Fallback a 'general' funciona

### Técnico
- [ ] Todas las tareas (IT1-001 a IT1-007) en "Done"
- [ ] Tests pasan al 100%
- [ ] Cobertura > 80%
- [ ] Sin errores en logs
- [ ] Docker Compose funcional

### Documentación
- [ ] Swagger completo y accesible
- [ ] README actualizado con instrucciones
- [ ] Comentarios inline en código complejo

### Calidad
- [ ] Código sin warnings
- [ ] Performance < 100ms (p95)
- [ ] Logs informativos y útiles

### Demo
- [ ] Se puede hacer demo completa del sistema
- [ ] Respuestas coherentes y variadas
- [ ] Sistema estable (no crashes)

---

## Checklist Final

```
Preparación:
[ ] Git branch creada: feature/iteracion-1-fallback-sqlite
[ ] Dependencias instaladas: npm install
[ ] Prisma generado: npm run prisma:generate

Desarrollo:
[ ] IT1-001: Seed ejecutado correctamente
[ ] IT1-002: FallbackService implementado y testeado
[ ] IT1-003: Categorización mejorada
[ ] IT1-004: Tests > 80% coverage
[ ] IT1-005: Swagger accesible
[ ] IT1-006: Docker Compose funcional
[ ] IT1-007: Health endpoint funcional

Validación:
[ ] npm run test → All passing
[ ] npm run build → No errors
[ ] npm run start:dev → App running
[ ] curl tests → All endpoints work
[ ] docker-compose up → Works
[ ] Swagger UI → Accessible

Git:
[ ] Commits atómicos y descriptivos
[ ] Branch pushed to origin
[ ] README actualizado
[ ] CHANGELOG.md creado

Demo:
[ ] Sistema funciona sin IA
[ ] Respuestas variadas y coherentes
[ ] Performance aceptable
[ ] Sin errores en logs
```

---

**Estado de Completitud**: 0/28 criterios cumplidos
**Siguiente Paso**: Iniciar con IT1-001 (Seed de datos)
