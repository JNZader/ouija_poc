# Guía de Aprendizaje Técnico - Backend Simple Ouija Virtual

## Introducción

Este documento explica los conceptos técnicos fundamentales del proyecto para que entiendas el "por qué" detrás de cada decisión de arquitectura.

---

## Arquitectura de Fallback Progresivo

### ¿Qué es un Fallback?

Un **fallback** es un sistema de respaldo que se activa cuando el sistema principal falla.

**Analogía**: Es como tener velas cuando se va la luz:
- 🔌 **Principal**: Electricidad (Groq API - rápida, moderna)
- 🕯️ **Fallback 1**: Generador (Ollama - local, confiable)
- 🔦 **Fallback 2**: Linterna (SQLite - siempre funciona)

### ¿Por qué Triple Fallback?

**Problema**: Los servicios de IA pueden fallar por múltiples razones:
- API caída
- Rate limiting (límite de requests)
- Timeout (respuesta muy lenta)
- Sin conexión a internet
- Sin créditos/cuota excedida

**Solución**: Cascada de fallbacks
```
Usuario hace pregunta
    ↓
1. Groq API (si está disponible y configurada)
    ├─ ✓ Éxito → Retorna respuesta rápida
    └─ ✗ Error → Intenta siguiente
        ↓
2. Ollama Local (si está corriendo)
    ├─ ✓ Éxito → Retorna respuesta local
    └─ ✗ Error → Intenta siguiente
        ↓
3. SQLite Fallback (siempre disponible)
    └─ ✓ Retorna respuesta pre-definida
```

### Ventajas de Este Enfoque

1. **Alta disponibilidad**: Sistema nunca falla completamente
2. **Degradación graceful**: Usuario siempre recibe respuesta
3. **Optimización de costos**: Usa API pagada solo cuando local falla
4. **Testing fácil**: Cada capa testeable independientemente

---

## Prisma + SQLite

### ¿Qué es Prisma?

**Prisma** es un ORM (Object-Relational Mapping) que traduce código TypeScript a queries SQL.

**Sin Prisma** (SQL crudo):
```typescript
const results = await db.query(
  'SELECT * FROM FallbackResponse WHERE personality = ? AND language = ?',
  ['wise', 'es']
);
```

**Con Prisma** (TypeScript):
```typescript
const results = await prisma.fallbackResponse.findMany({
  where: {
    personality: 'wise',
    language: 'es'
  }
});
```

### Ventajas de Prisma

1. **Type-safe**: TypeScript detecta errores en tiempo de desarrollo
2. **Auto-completion**: IDE sugiere campos disponibles
3. **Migraciones**: Cambios de schema versionados
4. **Prisma Studio**: UI para visualizar datos

### ¿Por qué SQLite?

**SQLite** es una base de datos embebida (archivo local).

**Comparación**:
| Característica | SQLite | PostgreSQL | MongoDB |
|----------------|--------|------------|---------|
| Setup | Sin instalación | Requiere servidor | Requiere servidor |
| Deployment | Archivo .db | Conexión externa | Conexión externa |
| Complejidad | Muy simple | Moderada | Moderada |
| Performance | Rápida (lectura) | Muy rápida | Rápida |
| Uso ideal | < 100K rows | Millones de rows | Documentos |

**Para este proyecto**: SQLite es perfecto porque:
- Solo almacena ~200 respuestas (dataset pequeño)
- Solo lecturas (no escrituras concurrentes)
- Fácil de deployar (es un archivo)
- Sin dependencias externas

---

## NestJS Dependency Injection

### ¿Qué es Dependency Injection (DI)?

**Dependency Injection** es un patrón donde las dependencias se "inyectan" en lugar de crear instancias manualmente.

**Sin DI** (acoplamiento fuerte):
```typescript
class OuijaService {
  private prisma: PrismaService;

  constructor() {
    this.prisma = new PrismaService(); // ❌ Creación manual
  }
}
```

**Con DI** (desacoplamiento):
```typescript
@Injectable()
class OuijaService {
  constructor(private prisma: PrismaService) {} // ✅ Inyectado
}
```

### Ventajas de DI

1. **Testeable**: Fácil mockear dependencias en tests
```typescript
// En tests
const mockPrisma = { findMany: jest.fn() };
const service = new OuijaService(mockPrisma);
```

2. **Mantenible**: Cambiar implementación sin tocar código
3. **Reutilizable**: Mismo servicio en múltiples lugares
4. **Lifecycle management**: NestJS maneja creación/destrucción

### Cómo Funciona en NestJS

```typescript
// 1. Declarar servicio como @Injectable()
@Injectable()
export class FallbackService {
  constructor(private prisma: PrismaService) {}
}

// 2. Registrar en módulo
@Module({
  providers: [FallbackService, PrismaService]
})
export class OuijaModule {}

// 3. Inyectar donde se necesite
@Injectable()
export class OuijaService {
  constructor(private fallback: FallbackService) {} // ✅ Automático
}
```

---

## Keyword Matching Algorithm

### Problema

Dada una pregunta del usuario, ¿cómo seleccionar la respuesta más relevante de la base de datos?

### Algoritmo Simple (Bag of Words)

```typescript
function selectBestMatch(responses, question) {
  // 1. Normalizar pregunta
  const q = question.toLowerCase();

  // 2. Calcular score para cada respuesta
  const scored = responses.map(response => {
    const keywords = JSON.parse(response.keywords);
    const score = keywords.filter(kw =>
      q.includes(kw.toLowerCase())
    ).length;

    return { text: response.text, score };
  });

  // 3. Ordenar por score (mayor primero)
  scored.sort((a, b) => b.score - a.score);

  // 4. Retornar mejor match
  return scored[0];
}
```

### Ejemplo

```
Pregunta: "¿Encontraré el amor este año?"
Normalizada: "encontraré el amor este año"

Respuesta A:
  Text: "El amor llega cuando menos lo esperas..."
  Keywords: ["amor", "pareja", "corazón"]
  Score: 1 (match: "amor")

Respuesta B:
  Text: "Las estrellas indican unión próxima..."
  Keywords: ["estrellas", "destino", "futuro"]
  Score: 0 (no matches)

Resultado: Respuesta A (score más alto)
```

### Limitaciones

1. **No entiende sinónimos**: "amor" ≠ "cariño"
2. **No entiende contexto**: "no amor" = "amor"
3. **No entiende orden**: "amor odio" = "odio amor"

**Por qué es suficiente**:
- Dataset pequeño (< 200 respuestas)
- Respuestas místicas (vagas por naturaleza)
- Fallback a aleatorio si no hay match

**Mejora futura**: Usar embeddings (vector similarity) si el dataset crece.

---

## Docker y Containerización

### ¿Qué es Docker?

**Docker** empaqueta tu aplicación con todas sus dependencias en un "container" aislado.

**Analogía**: Es como un contenedor de envío que contiene todo lo necesario.

**Sin Docker**:
```
Tu máquina:
- Node 20
- NPM 10
- SQLite instalado
→ Funciona

Servidor producción:
- Node 18 ❌
- NPM 8 ❌
- SQLite falta ❌
→ No funciona
```

**Con Docker**:
```
Dockerfile define:
- Node 20
- NPM 10
- SQLite

Container funciona igual en:
- Tu máquina ✅
- Servidor producción ✅
- Máquina de tu compañero ✅
```

### Docker vs Docker Compose

**Docker**: Ejecuta un solo container
```bash
docker run my-app
```

**Docker Compose**: Orquesta múltiples containers
```yaml
services:
  backend:    # Container 1
  ollama:     # Container 2
  database:   # Container 3
```

### ¿Por qué Docker Compose para Desarrollo?

**Problema**: Configurar Ollama + Backend manualmente es tedioso

**Solución**: Un solo comando levanta todo
```bash
docker-compose up
# ✅ Backend corriendo
# ✅ Ollama corriendo
# ✅ SQLite creada
# ✅ Todo conectado
```

---

## Ollama: IA Local

### ¿Qué es Ollama?

**Ollama** es como "Docker pero para modelos de IA". Ejecuta LLMs localmente.

**Ventajas**:
- Sin costo por request
- Privacidad (datos no salen de tu máquina)
- Sin rate limits
- Funciona sin internet

**Desventajas**:
- Lento (10-30s por respuesta)
- Requiere mucha RAM/CPU
- Modelos más pequeños (menos capaces)

### Modelos Recomendados

| Modelo | Tamaño | RAM | Velocidad | Calidad |
|--------|--------|-----|-----------|---------|
| qwen2.5:0.5b | 500MB | 2GB | Muy rápida | Básica |
| llama3.2:1b | 1GB | 4GB | Rápida | Buena |
| llama3.1:8b | 4.7GB | 8GB | Media | Excelente |

**Para este proyecto**: `qwen2.5:0.5b`
- Modelo más pequeño disponible
- Respuestas en ~5-10s
- Suficiente para respuestas cortas místicas

### Cómo Funciona en Docker

```yaml
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama

  backend:
    environment:
      - OLLAMA_URL=http://ollama:11434
```

Backend se conecta a Ollama vía HTTP:
```typescript
const response = await axios.post('http://ollama:11434/api/generate', {
  model: 'qwen2.5:0.5b',
  prompt: 'Tu pregunta aquí'
});
```

---

## Groq: IA en la Nube

### ¿Qué es Groq?

**Groq** es una API de IA ultra-rápida que ejecuta modelos LLM en hardware especializado.

**Comparación**:
| Característica | Groq | OpenAI | Ollama |
|----------------|------|--------|--------|
| Velocidad | 500 tokens/s | 50 tokens/s | 10 tokens/s |
| Costo | Muy bajo | Moderado | Gratis |
| Setup | API key | API key | Docker |
| Internet | Requiere | Requiere | No requiere |

### ¿Por qué Groq como Primario?

1. **Velocidad**: Respuestas en < 2s
2. **Costo**: Free tier generoso (30 req/min)
3. **Calidad**: Modelos grandes (Llama 3.1 8B)

### Cómo Funciona

```typescript
const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${GROQ_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'llama-3.1-8b-instant',
    messages: [{ role: 'user', content: 'Tu pregunta' }]
  })
});
```

### Rate Limiting

**Problema**: Groq limita a 30 requests/minuto (free tier)

**Solución**: Circuit breaker + fallback
```typescript
try {
  return await groq.generate(prompt);
} catch (error) {
  if (error.status === 429) {
    // Rate limit exceeded → fallback a Ollama
    return await ollama.generate(prompt);
  }
}
```

---

## Testing: Por qué y Cómo

### ¿Por qué Tests?

**Problema sin tests**:
- Cambias código → no sabes si rompiste algo
- Refactorizas → miedo de introducir bugs
- Deploy → cruces dedos esperando que funcione

**Solución con tests**:
- Cambias código → tests detectan problemas
- Refactorizas → tests garantizan mismo comportamiento
- Deploy → confianza que todo funciona

### Tipos de Tests

1. **Tests Unitarios**: Testean una función/clase aislada
```typescript
// Testear solo FallbackService
it('should return best match', () => {
  const service = new FallbackService(mockPrisma);
  const result = service.getResponse(...);
  expect(result.score).toBeGreaterThan(0);
});
```

2. **Tests de Integración**: Testean múltiples componentes juntos
```typescript
// Testear FallbackService + PrismaService + SQLite real
it('should fetch from real database', async () => {
  const result = await service.getResponse('wise', 'es', 'love');
  expect(result.text).toBeDefined();
});
```

3. **Tests E2E**: Testean todo el sistema como usuario
```typescript
// Testear API completa
it('POST /ouija/ask should return response', async () => {
  const response = await request(app)
    .post('/ouija/ask')
    .send({ question: '¿Amor?', personality: 'wise', language: 'es' });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});
```

### TDD (Test-Driven Development)

**Proceso**:
1. **Red**: Escribir test que falla
2. **Green**: Escribir código mínimo para que pase
3. **Refactor**: Mejorar código sin romper test

**Ejemplo**:
```typescript
// 1. RED - Test falla (función no existe)
it('should categorize love questions', () => {
  expect(categorizeQuestion('¿Amor?')).toBe('love');
});

// 2. GREEN - Implementar mínimo
function categorizeQuestion(q) {
  return 'love'; // Hardcoded
}

// 3. REFACTOR - Generalizar
function categorizeQuestion(q) {
  if (q.includes('amor')) return 'love';
  if (q.includes('trabajo')) return 'career';
  return 'general';
}
```

**Ventajas**:
- Diseño más limpio (piensas en interfaz primero)
- Cobertura 100% (escribes test antes de código)
- Documentación viva (tests muestran cómo usar el código)

---

## Swagger/OpenAPI

### ¿Qué es Swagger?

**Swagger** (ahora OpenAPI) es una especificación para documentar APIs REST.

**Beneficios**:
1. **Documentación auto-generada**: No se desactualiza
2. **UI interactiva**: Probar endpoints sin Postman
3. **Generación de clientes**: Auto-generar código de consumo

### Cómo Funciona en NestJS

```typescript
// 1. Decorar DTOs
class OuijaQuestionDto {
  @ApiProperty({
    description: 'The question to ask the spirit',
    example: '¿Encontraré el amor?'
  })
  question: string;
}

// 2. Decorar endpoints
@ApiOperation({ summary: 'Ask a question to the Ouija spirit' })
@ApiResponse({ status: 200, description: 'Successful response' })
@Post('ask')
async ask(@Body() dto: OuijaQuestionDto) {
  // ...
}

// 3. Swagger genera JSON automáticamente
// → UI en http://localhost:3000/api/docs
```

---

## Koyeb: Platform-as-a-Service

### ¿Qué es Koyeb?

**Koyeb** es una plataforma de deployment (como Heroku, Railway, Render).

**Ventajas**:
- Deploy desde GitHub (push → auto-deploy)
- Free tier generoso
- Soporta Docker nativo
- Global edge network

### ¿Por qué Koyeb?

**Comparación**:
| Plataforma | Free Tier | Docker | Deploy Time |
|------------|-----------|--------|-------------|
| Koyeb | 512MB RAM | ✅ | ~3 min |
| Railway | 500h/mes | ✅ | ~2 min |
| Render | 750h/mes | ✅ | ~5 min |
| Heroku | Removed | ❌ | N/A |

**Decisión**: Koyeb por Docker nativo (necesario para Ollama).

### Cómo Funciona

```
1. Push código a GitHub
   ↓
2. Koyeb detecta cambios
   ↓
3. Koyeb construye Dockerfile
   ↓
4. Koyeb deploya container
   ↓
5. Aplicación live en <app>.koyeb.app
```

---

## Performance y Optimización

### Response Time Targets

| Fuente | Target | Realista |
|--------|--------|----------|
| SQLite | < 100ms | 20-50ms |
| Groq API | < 5s | 1-3s |
| Ollama | < 30s | 10-20s |

### Cómo Medir Performance

```typescript
const startTime = Date.now();
const result = await service.getResponse(...);
const elapsed = Date.now() - startTime;
console.log(`⏱️ Response time: ${elapsed}ms`);
```

### Optimizaciones Aplicadas

1. **Índices en SQLite**
```prisma
model FallbackResponse {
  @@index([personality, category, language])
}
```

2. **Cache en memoria**
```typescript
private cache = new Map<string, Response>();

async getResponse(key) {
  if (this.cache.has(key)) {
    return this.cache.get(key); // O(1)
  }
  const result = await this.fetch(key);
  this.cache.set(key, result);
  return result;
}
```

3. **Timeouts agresivos**
```typescript
await axios.post(url, data, {
  timeout: 10000 // 10s max
});
```

---

## Resumen de Conceptos Aprendidos

### Por Iteración

**Iteración 1**:
- ✅ Prisma ORM + SQLite
- ✅ Dependency Injection
- ✅ Keyword matching algorithm
- ✅ Testing unitario
- ✅ Swagger documentation

**Iteración 2**:
- ✅ Docker Compose
- ✅ Ollama local
- ✅ Retry logic + Circuit breaker
- ✅ Testing de integración

**Iteración 3**:
- ✅ APIs externas (Groq)
- ✅ Fallback triple
- ✅ Rate limiting
- ✅ Tests E2E

**Iteración 4**:
- ✅ Docker multi-stage builds
- ✅ CI/CD con GitHub Actions
- ✅ Deploy en Koyeb
- ✅ Variables de entorno seguras

---

## Recursos de Aprendizaje

### Documentación Oficial
- [NestJS Docs](https://docs.nestjs.com/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Ollama GitHub](https://github.com/ollama/ollama)
- [Groq API Docs](https://console.groq.com/docs)
- [Docker Docs](https://docs.docker.com/)

### Tutoriales Recomendados
- [NestJS Crash Course](https://www.youtube.com/watch?v=GHTA143_b-s)
- [Prisma in 100 Seconds](https://www.youtube.com/watch?v=rLRIB6AF2Dg)
- [Docker for Beginners](https://www.youtube.com/watch?v=pTFZFxd4hOI)

### Práctica
- Implementa cada iteración paso a paso
- Lee los tests para entender comportamiento esperado
- Experimenta con diferentes configuraciones
- Contribuye mejoras al proyecto

---

**Próximo Paso**: Iniciar Iteración 1 con entendimiento profundo de los conceptos.
