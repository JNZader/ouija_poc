# User Stories - Iteración 1: Fallback SQLite

## Formato de User Stories

Usamos el formato estándar de XP/Agile:

```
Como [rol]
Quiero [funcionalidad]
Para [beneficio]

Criterios de Aceptación:
- [ ] Criterio 1
- [ ] Criterio 2

Notas Técnicas:
- Detalles de implementación
```

---

## US-1.1: Seed de Respuestas Místicas

**Como** desarrollador del sistema
**Quiero** tener una base de datos poblada con respuestas místicas variadas
**Para** que el sistema pueda responder preguntas sin depender de IA

### Criterios de Aceptación
- [ ] La base de datos contiene mínimo 50 respuestas únicas
- [ ] Todas las personalidades están representadas (wise, cryptic, dark, playful)
- [ ] Todas las categorías están cubiertas (love, career, health, etc.)
- [ ] Ambos idiomas están soportados (español e inglés)
- [ ] Cada respuesta tiene keywords relevantes en formato JSON
- [ ] El seed es idempotente (puede ejecutarse múltiples veces)
- [ ] Ejecutar `npm run prisma:seed` completa sin errores

### Notas Técnicas
```typescript
// Estructura de datos del seed
interface SeedResponse {
  personality: 'wise' | 'cryptic' | 'dark' | 'playful';
  category: 'love' | 'career' | 'health' | 'family' | 'death' | 'future' | 'money' | 'spirituality' | 'general';
  language: 'es' | 'en';
  text: string; // La respuesta mística
  keywords: string[]; // Para matching, se convierte a JSON
}

// Ejemplo
{
  personality: 'wise',
  category: 'love',
  language: 'es',
  text: 'El amor verdadero no se busca, se encuentra cuando el alma está preparada...',
  keywords: ['amor', 'pareja', 'corazón', 'relación', 'encontrar', 'soulmate']
}
```

### Estimación
**5 puntos** (4-6 horas)

**Razón**: Requiere creatividad para escribir 50+ respuestas variadas y coherentes. Es trabajo manual pero crítico.

---

## US-1.2: Servicio de Fallback SQLite

**Como** sistema backend
**Quiero** tener un servicio dedicado para consultar respuestas de SQLite
**Para** poder responder preguntas incluso cuando las APIs de IA fallen

### Criterios de Aceptación
- [ ] FallbackService inyectable vía Dependency Injection
- [ ] Método `getResponse()` acepta personality, language, category, y question opcional
- [ ] Filtra respuestas por personality, language y category
- [ ] Implementa algoritmo de keyword matching cuando se proporciona pregunta
- [ ] Si no hay matches, retorna respuesta aleatoria de la categoría
- [ ] Si categoría no tiene respuestas, hace fallback a 'general'
- [ ] Logging detallado del proceso de selección
- [ ] Retorna objeto con {text, matchScore, category}

### Notas Técnicas
```typescript
// Interfaz del servicio
@Injectable()
export class FallbackService {
  constructor(private prisma: PrismaService) {}

  async getResponse(
    personality: string,
    language: string,
    category: string,
    question?: string
  ): Promise<{
    text: string;
    matchScore: number;
    category: string;
  }> {
    // 1. Query respuestas filtradas
    const responses = await this.prisma.fallbackResponse.findMany({
      where: { personality, language, category }
    });

    // 2. Si no hay respuestas, fallback a 'general'
    if (responses.length === 0) {
      return this.getResponse(personality, language, 'general', question);
    }

    // 3. Si hay pregunta, hacer keyword matching
    if (question) {
      return this.selectBestMatch(responses, question);
    }

    // 4. Sin pregunta, retornar aleatorio
    return this.selectRandom(responses);
  }

  private selectBestMatch(responses, question): {...} {
    // Algoritmo de scoring por keywords
  }
}
```

### Estimación
**8 puntos** (1 día completo)

**Razón**: Lógica compleja de matching, múltiples edge cases, integración con Prisma.

---

## US-1.3: Categorización Mejorada

**Como** sistema backend
**Quiero** categorizar preguntas de usuario con alta precisión
**Para** retornar respuestas relevantes del contexto correcto

### Criterios de Aceptación
- [ ] Cada categoría tiene mínimo 10 keywords diferentes
- [ ] Keywords soportan español e inglés
- [ ] Detecta correctamente categoría en > 80% de casos de prueba
- [ ] Fallback a 'general' cuando no hay match
- [ ] Logging de categoría detectada
- [ ] Tests cubren casos edge (preguntas ambiguas, múltiples categorías)

### Notas Técnicas
```typescript
// Expansión de keywords en PromptsService
private readonly categoryKeywords = {
  love: [
    // Español
    'amor', 'pareja', 'relación', 'corazón', 'enamorado',
    'novio', 'novia', 'matrimonio', 'casarse', 'soltero',
    // Inglés
    'love', 'partner', 'relationship', 'heart', 'boyfriend',
    'girlfriend', 'marriage', 'marry', 'single', 'couple'
  ],
  career: [
    'trabajo', 'carrera', 'empleo', 'jefe', 'empresa',
    'job', 'career', 'boss', 'company', 'promotion'
  ],
  // ... más categorías
};

categorizeQuestion(question: string): string {
  const normalized = question.toLowerCase();

  // Contar matches por categoría
  const scores = Object.entries(this.categoryKeywords).map(([category, keywords]) => {
    const matches = keywords.filter(kw => normalized.includes(kw)).length;
    return { category, score: matches };
  });

  // Ordenar por score
  scores.sort((a, b) => b.score - a.score);

  // Retornar mejor match o 'general'
  return scores[0].score > 0 ? scores[0].category : 'general';
}
```

### Estimación
**3 puntos** (2-3 horas)

**Razón**: Principalmente expansión de datos (keywords), lógica simple.

---

## US-1.4: API REST con Respuestas Fallback

**Como** desarrollador frontend
**Quiero** poder hacer requests al backend y recibir respuestas
**Para** mostrar mensajes místicos a los usuarios

### Criterios de Aceptación
- [ ] POST `/ouija/ask` acepta {question, personality, language}
- [ ] Retorna {success, data: {question, response, category, source, model}}
- [ ] Source indica 'database' cuando usa fallback
- [ ] Response time < 100ms (p95)
- [ ] Maneja errores gracefully (500, 400)
- [ ] CORS habilitado para desarrollo
- [ ] Logging de cada request

### Notas Técnicas
```typescript
// Request
POST /ouija/ask
Content-Type: application/json

{
  "question": "¿Encontraré el amor?",
  "personality": "wise",
  "language": "es"
}

// Response
{
  "success": true,
  "data": {
    "question": "¿Encontraré el amor?",
    "response": "El amor verdadero no se busca, se encuentra...",
    "personality": "wise",
    "language": "es",
    "category": "love",
    "source": "database",
    "model": "sqlite-fallback"
  }
}
```

### Estimación
**3 puntos** (integración)

**Razón**: La lógica ya existe, solo hay que integrar FallbackService.

---

## US-1.5: Documentación Swagger

**Como** desarrollador frontend
**Quiero** tener documentación interactiva de la API
**Para** entender cómo consumir los endpoints sin leer código

### Criterios de Aceptación
- [ ] Swagger UI accesible en `http://localhost:3000/api/docs`
- [ ] Todos los endpoints documentados
- [ ] DTOs tienen descripciones y ejemplos
- [ ] Responses incluyen ejemplos de éxito y error
- [ ] Posible probar endpoints desde Swagger UI
- [ ] JSON schema generado automáticamente

### Notas Técnicas
```typescript
// main.ts
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

const config = new DocumentBuilder()
  .setTitle('Ouija Virtual API')
  .setDescription('API para consultar al espíritu de la Ouija')
  .setVersion('1.0')
  .addTag('ouija')
  .build();

const document = SwaggerModule.createDocument(app, config);
SwaggerModule.setup('api/docs', app, document);

// ouija.controller.ts
@ApiTags('ouija')
export class OuijaController {
  @Post('ask')
  @ApiOperation({ summary: 'Ask a question to the Ouija spirit' })
  @ApiResponse({
    status: 200,
    description: 'Successful response',
    type: OuijaResponseDto
  })
  async ask(@Body() dto: OuijaQuestionDto) {
    // ...
  }
}
```

### Estimación
**3 puntos** (2-3 horas)

**Razón**: Configuración inicial + decoradores en múltiples archivos.

---

## US-1.6: Docker Compose para Desarrollo

**Como** desarrollador
**Quiero** levantar el proyecto completo con un solo comando
**Para** facilitar el desarrollo local y onboarding

### Criterios de Aceptación
- [ ] `docker-compose up` levanta el backend
- [ ] Hot reload funciona (cambios reflejan automáticamente)
- [ ] Base de datos SQLite persiste entre reinicios
- [ ] Logs visibles en tiempo real
- [ ] Puerto 3000 expuesto al host
- [ ] Variables de entorno configurables
- [ ] README con instrucciones de uso

### Notas Técnicas
```yaml
# docker-compose.yml
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

### Estimación
**2 puntos** (1-2 horas)

**Razón**: Configuración estándar de Docker, sin complejidad especial.

---

## US-1.7: Health Check Endpoint

**Como** DevOps / desarrollador
**Quiero** un endpoint de salud que me indique el estado del sistema
**Para** monitorear la aplicación y hacer debugging

### Criterios de Aceptación
- [ ] GET `/health` retorna status 200 cuando todo OK
- [ ] Incluye timestamp de la respuesta
- [ ] Incluye count de respuestas en base de datos
- [ ] Incluye versión de la aplicación
- [ ] Indica estado de conexión a SQLite
- [ ] Formato JSON estructurado
- [ ] No requiere autenticación

### Notas Técnicas
```typescript
// health.controller.ts
@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async check() {
    const responsesCount = await this.prisma.fallbackResponse.count();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: true,
        responsesCount
      }
    };
  }
}

// Response esperado
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

### Estimación
**2 puntos** (1 hora)

**Razón**: Endpoint simple, lógica directa.

---

## US-1.8: Suite de Tests Unitarios

**Como** desarrollador
**Quiero** tener tests unitarios completos del FallbackService
**Para** garantizar que la lógica de fallback siempre funciona correctamente

### Criterios de Aceptación
- [ ] Tests cubren > 80% de FallbackService
- [ ] Tests usan mocks de PrismaService
- [ ] Casos cubiertos:
  - [ ] Matching exitoso por keywords
  - [ ] Sin matching (retorno aleatorio)
  - [ ] Categoría no existe (fallback a 'general')
  - [ ] Base de datos vacía
  - [ ] Múltiples respuestas con mismo score
- [ ] Todos los tests pasan
- [ ] Tests ejecutan en < 5 segundos
- [ ] No se conectan a base de datos real

### Notas Técnicas
```typescript
// fallback.service.spec.ts
describe('FallbackService', () => {
  let service: FallbackService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FallbackService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ]
    }).compile();

    service = module.get<FallbackService>(FallbackService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should return best match when keywords match', async () => {
    // Mock data
    jest.spyOn(prisma.fallbackResponse, 'findMany').mockResolvedValue([
      {
        text: 'Response 1',
        keywords: JSON.stringify(['love', 'heart']),
        // ...
      }
    ]);

    const result = await service.getResponse(
      'wise',
      'es',
      'love',
      '¿Encontraré el amor?'
    );

    expect(result.matchScore).toBeGreaterThan(0);
    expect(result.text).toBe('Response 1');
  });

  // ... más tests
});
```

### Estimación
**5 puntos** (4-5 horas)

**Razón**: Testing exhaustivo requiere pensar en múltiples edge cases y escribir mocks.

---

## Matriz de Trazabilidad

| User Story | Tarea KANBAN | Prioridad | Dependencias |
|------------|--------------|-----------|--------------|
| US-1.1     | IT1-001      | P0        | Ninguna      |
| US-1.2     | IT1-002      | P0        | US-1.1       |
| US-1.3     | IT1-003      | P1        | Ninguna      |
| US-1.4     | (integración)| P1        | US-1.2       |
| US-1.5     | IT1-005      | P2        | US-1.4       |
| US-1.6     | IT1-006      | P2        | Ninguna      |
| US-1.7     | IT1-007      | P3        | US-1.1       |
| US-1.8     | IT1-004      | P1        | US-1.2       |

## Orden de Implementación Recomendado

```
Día 1-2:
1. US-1.1 (Seed) → Base de datos poblada
2. US-1.7 (Health) → Validar que seed funcionó

Día 3-4:
3. US-1.3 (Categorización) → Mejorar detección
4. US-1.2 (FallbackService) → Lógica core
5. US-1.4 (API REST) → Integración

Día 5:
6. US-1.8 (Tests) → Validación

Día 6:
7. US-1.5 (Swagger) → Documentación
8. US-1.6 (Docker) → Infraestructura

Día 7:
9. Testing manual completo
10. Demo & retrospectiva
```

---

**Próximo Documento**: [TAREAS.md](./TAREAS.md)
