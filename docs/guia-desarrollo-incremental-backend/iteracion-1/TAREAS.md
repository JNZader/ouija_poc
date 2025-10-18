# Tareas Técnicas - Iteración 1

## Formato de Tareas

Cada tarea incluye:
- **ID**: Identificador único
- **Título**: Descripción corta
- **Descripción**: ¿Qué hay que hacer?
- **Por qué**: Razón técnica/negocio
- **Implementación**: Pasos específicos
- **Archivos**: Qué crear/modificar
- **Tests**: Qué testear
- **Estimación**: Puntos de complejidad
- **Dependencias**: Qué debe estar listo antes

---

## [IT1-001] Crear Seed de Datos SQLite

### Descripción
Crear archivo `prisma/seed.ts` que pueble la base de datos con 50+ respuestas místicas variadas, cubriendo todas las combinaciones de personalidad, categoría e idioma.

### ¿Por qué es importante?
Sin datos en la base de datos, el sistema de fallback no puede funcionar. Este seed es la base de toda la Iteración 1.

### Implementación Paso a Paso

#### 1. Crear el archivo de seed
```bash
cd backend-simple
touch prisma/seed.ts
```

#### 2. Estructura básica del seed
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SeedResponse {
  personality: 'wise' | 'cryptic' | 'dark' | 'playful';
  category: 'love' | 'career' | 'health' | 'family' | 'death' | 'future' | 'money' | 'spirituality' | 'general';
  language: 'es' | 'en';
  text: string;
  keywords: string[];
}

const responses: SeedResponse[] = [
  // WISE - LOVE - ES
  {
    personality: 'wise',
    category: 'love',
    language: 'es',
    text: 'El amor verdadero no se busca, se encuentra cuando el alma está preparada. Las estrellas indican que tu corazón pronto conocerá la calidez de una conexión profunda.',
    keywords: ['amor', 'pareja', 'corazón', 'relación', 'encontrar', 'alma']
  },
  {
    personality: 'wise',
    category: 'love',
    language: 'es',
    text: 'Los antiguos espíritus susurran que el amor requiere paciencia. No fuerces el destino, pues cuando llegue el momento, reconocerás a tu compañero del alma.',
    keywords: ['amor', 'pareja', 'destino', 'paciencia', 'esperar', 'soulmate']
  },

  // WISE - CAREER - ES
  {
    personality: 'wise',
    category: 'career',
    language: 'es',
    text: 'El trabajo que alimenta el alma vale más que el que llena los bolsillos. Busca aquello que haga vibrar tu espíritu, y la abundancia seguirá.',
    keywords: ['trabajo', 'carrera', 'empleo', 'vocación', 'pasión', 'profesión']
  },

  // ... más respuestas (mínimo 50)
];

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes
  await prisma.fallbackResponse.deleteMany({});
  console.log('🗑️  Cleared existing responses');

  // Insertar nuevas respuestas
  for (const response of responses) {
    await prisma.fallbackResponse.create({
      data: {
        personality: response.personality,
        category: response.category,
        language: response.language,
        text: response.text,
        keywords: JSON.stringify(response.keywords),
      },
    });
  }

  console.log(`✅ Seeded ${responses.length} responses`);

  // Mostrar estadísticas
  const stats = await prisma.fallbackResponse.groupBy({
    by: ['personality', 'language'],
    _count: true,
  });

  console.log('\n📊 Seed Statistics:');
  stats.forEach(stat => {
    console.log(`   ${stat.personality} (${stat.language}): ${stat._count} responses`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

#### 3. Configurar script en package.json
```json
{
  "scripts": {
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

#### 4. Ejecutar el seed
```bash
npm run prisma:seed
```

### Template de Respuestas

Para ayudarte a escribir 50+ respuestas, usa este template:

```typescript
// Por cada PERSONALIDAD (wise, cryptic, dark, playful)
// Por cada CATEGORÍA (love, career, health, family, death, future, money, spirituality, general)
// Por cada IDIOMA (es, en)
// = 4 × 9 × 2 = 72 combinaciones

// WISE (Sabio, consejero, calmado)
// - Tono: Sereno, filosófico, esperanzador
// - Ejemplos: "Los espíritus ancianos...", "La sabiduría ancestral..."

// CRYPTIC (Críptico, misterioso, enigmático)
// - Tono: Vago, simbólico, interpretable
// - Ejemplos: "Las sombras danzan...", "El velo se adelgaza..."

// DARK (Oscuro, ominoso, tétrico)
// - Tono: Inquietante, pesimista, dramático
// - Ejemplos: "Los muertos no callan...", "La oscuridad acecha..."

// PLAYFUL (Juguetón, divertido, caprichoso)
// - Tono: Alegre, irónico, travieso
// - Ejemplos: "Los espíritus se ríen...", "¡Vaya pregunta!"
```

### Archivos Afectados
- ✏️ **CREAR**: `backend-simple/prisma/seed.ts`
- 📝 **MODIFICAR**: `backend-simple/package.json` (añadir script)

### Testing
```bash
# 1. Ejecutar seed
npm run prisma:seed

# 2. Verificar con Prisma Studio
npm run prisma:studio
# → Abrir navegador en http://localhost:5555
# → Verificar tabla FallbackResponse tiene 50+ filas

# 3. Query de verificación
npx prisma db execute --stdin <<SQL
SELECT
  personality,
  language,
  COUNT(*) as count
FROM FallbackResponse
GROUP BY personality, language;
SQL
```

### Criterios de Aceptación
- [ ] Seed ejecuta sin errores
- [ ] Mínimo 50 respuestas creadas
- [ ] Todas las personalidades representadas
- [ ] Todos los idiomas representados
- [ ] Todas las categorías representadas
- [ ] Keywords relevantes en cada respuesta
- [ ] Seed es idempotente (puede ejecutarse múltiples veces)

### Estimación
**5 puntos** (~4-6 horas)

**Desglose**:
- 1h: Setup del archivo seed
- 3-4h: Escribir 50+ respuestas creativas
- 30min: Testing y validación

### Dependencias
Ninguna (primera tarea)

### Notas Adicionales

**Estrategia para escribir respuestas rápido**:
1. Empieza con 2 respuestas por combinación (4×9×2 = 72 respuestas)
2. Varía el tono según personalidad
3. Usa sinónimos en keywords para mejor matching
4. Prueba con preguntas reales mientras escribes

**Recursos útiles**:
- ChatGPT/Claude para generar variaciones
- Buscar frases místicas reales de tarot/ouija
- Inspirarse en horóscopos/predicciones

---

## [IT1-002] Implementar FallbackService

### Descripción
Crear un servicio dedicado `FallbackService` que consulte SQLite y retorne respuestas basadas en personality, language, category y keywords.

### ¿Por qué es importante?
Separa la lógica de fallback del servicio principal, haciéndola testeable y reusable. Es el core de esta iteración.

### Implementación Paso a Paso

#### 1. Crear el servicio
```bash
cd backend-simple/src/modules/ouija/services
touch fallback.service.ts
```

#### 2. Implementar el servicio
```typescript
// src/modules/ouija/services/fallback.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

interface FallbackResult {
  text: string;
  matchScore: number;
  category: string;
  method: 'keyword-match' | 'random' | 'fallback-general';
}

@Injectable()
export class FallbackService {
  private readonly logger = new Logger(FallbackService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get a fallback response from SQLite
   */
  async getResponse(
    personality: string,
    language: string,
    category: string,
    question?: string,
  ): Promise<FallbackResult> {
    this.logger.log(`🔍 Querying fallback: ${personality}/${language}/${category}`);

    // 1. Query responses from database
    const responses = await this.prisma.fallbackResponse.findMany({
      where: {
        personality,
        language,
        category,
      },
      select: {
        text: true,
        keywords: true,
      },
    });

    // 2. If no responses, fallback to 'general' category
    if (responses.length === 0) {
      this.logger.warn(`⚠️ No responses for category '${category}', trying 'general'`);

      if (category !== 'general') {
        return this.getResponse(personality, language, 'general', question);
      } else {
        // Last resort: return a default message
        return {
          text: 'Los espíritus no pueden responder en este momento... Intenta más tarde.',
          matchScore: 0,
          category: 'general',
          method: 'fallback-general',
        };
      }
    }

    // 3. If question provided, use keyword matching
    if (question) {
      return this.selectBestMatch(responses, question, category);
    }

    // 4. No question, return random
    return this.selectRandom(responses, category);
  }

  /**
   * Select best matching response based on keywords
   */
  private selectBestMatch(
    responses: Array<{ text: string; keywords: string }>,
    question: string,
    category: string,
  ): FallbackResult {
    const normalizedQuestion = question.toLowerCase();

    // Calculate score for each response
    const scored = responses.map((response) => {
      let keywords: string[] = [];
      try {
        keywords = JSON.parse(response.keywords);
      } catch (error) {
        this.logger.warn(`⚠️ Invalid keywords JSON: ${response.keywords}`);
        keywords = [];
      }

      // Count matching keywords
      const score = keywords.reduce((count, keyword) => {
        return normalizedQuestion.includes(keyword.toLowerCase()) ? count + 1 : count;
      }, 0);

      return {
        text: response.text,
        score,
      };
    });

    // Sort by score (highest first)
    scored.sort((a, b) => b.score - a.score);

    const bestMatch = scored[0];

    if (bestMatch.score > 0) {
      this.logger.log(`✅ Best match found with score: ${bestMatch.score}`);
      return {
        text: bestMatch.text,
        matchScore: bestMatch.score,
        category,
        method: 'keyword-match',
      };
    } else {
      // No keyword match, return random
      this.logger.log(`🎲 No keyword match, returning random`);
      return this.selectRandom(responses, category);
    }
  }

  /**
   * Select random response
   */
  private selectRandom(
    responses: Array<{ text: string; keywords: string }>,
    category: string,
  ): FallbackResult {
    const randomIndex = Math.floor(Math.random() * responses.length);
    const selected = responses[randomIndex];

    this.logger.log(`🎲 Random selection: index ${randomIndex}/${responses.length}`);

    return {
      text: selected.text,
      matchScore: 0,
      category,
      method: 'random',
    };
  }

  /**
   * Get statistics of available responses
   */
  async getStats(): Promise<{
    total: number;
    byPersonality: Record<string, number>;
    byCategory: Record<string, number>;
    byLanguage: Record<string, number>;
  }> {
    const total = await this.prisma.fallbackResponse.count();

    const byPersonality = await this.prisma.fallbackResponse.groupBy({
      by: ['personality'],
      _count: true,
    });

    const byCategory = await this.prisma.fallbackResponse.groupBy({
      by: ['category'],
      _count: true,
    });

    const byLanguage = await this.prisma.fallbackResponse.groupBy({
      by: ['language'],
      _count: true,
    });

    return {
      total,
      byPersonality: Object.fromEntries(
        byPersonality.map((p) => [p.personality, p._count]),
      ),
      byCategory: Object.fromEntries(
        byCategory.map((c) => [c.category, c._count]),
      ),
      byLanguage: Object.fromEntries(
        byLanguage.map((l) => [l.language, l._count]),
      ),
    };
  }
}
```

#### 3. Registrar en el módulo
```typescript
// src/modules/ouija/ouija.module.ts
import { Module } from '@nestjs/common';
import { OuijaController } from './ouija.controller';
import { OuijaService } from './ouija.service';
import { OllamaService } from './services/ollama.service';
import { GroqService } from './services/groq.service';
import { PromptsService } from './services/prompts.service';
import { FallbackService } from './services/fallback.service'; // ← AÑADIR

@Module({
  controllers: [OuijaController],
  providers: [
    OuijaService,
    OllamaService,
    GroqService,
    PromptsService,
    FallbackService, // ← AÑADIR
  ],
})
export class OuijaModule {}
```

#### 4. Modificar OuijaService para usar FallbackService
```typescript
// src/modules/ouija/ouija.service.ts
import { FallbackService } from './services/fallback.service';

@Injectable()
export class OuijaService {
  constructor(
    private prisma: PrismaService,
    private ollama: OllamaService,
    private groq: GroqService,
    private prompts: PromptsService,
    private fallback: FallbackService, // ← AÑADIR
  ) {}

  async processQuestion(...) {
    // ... código existente ...

    // REEMPLAZAR la llamada a getFallbackResponse() con:
    const fallbackResult = await this.fallback.getResponse(
      personality,
      language,
      category,
      question,
    );

    return {
      question,
      response: fallbackResult.text,
      personality,
      language,
      category: fallbackResult.category,
      source: 'database',
      model: 'sqlite-fallback',
    };
  }
}
```

### Archivos Afectados
- ✏️ **CREAR**: `backend-simple/src/modules/ouija/services/fallback.service.ts`
- 📝 **MODIFICAR**: `backend-simple/src/modules/ouija/ouija.module.ts`
- 📝 **MODIFICAR**: `backend-simple/src/modules/ouija/ouija.service.ts`

### Testing Manual
```bash
# 1. Compilar
npm run build

# 2. Ejecutar en dev mode
npm run start:dev

# 3. Probar con curl
curl -X POST http://localhost:3000/ouija/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "¿Encontraré el amor?",
    "personality": "wise",
    "language": "es"
  }'

# 4. Verificar logs
# Deberías ver:
# 🔍 Querying fallback: wise/es/love
# ✅ Best match found with score: 2
# o
# 🎲 No keyword match, returning random
```

### Criterios de Aceptación
- [ ] FallbackService inyectable vía DI
- [ ] Método getResponse() funcional
- [ ] Keyword matching implementado
- [ ] Fallback a 'general' funciona
- [ ] Logging detallado de selección
- [ ] OuijaService usa FallbackService
- [ ] API retorna respuestas de SQLite

### Estimación
**8 puntos** (~6-8 horas)

### Dependencias
- IT1-001 (Seed debe estar completo)

---

## [IT1-003] Mejorar Categorización

### Descripción
Expandir keywords en `PromptsService.categorizeQuestion()` para mejorar precisión de detección de categorías.

### Implementación
```typescript
// src/modules/ouija/services/prompts.service.ts

private readonly categoryKeywords: Record<string, string[]> = {
  love: [
    // Español
    'amor', 'pareja', 'relación', 'corazón', 'enamorado', 'enamorada',
    'novio', 'novia', 'esposo', 'esposa', 'matrimonio', 'casarse',
    'soltero', 'soltera', 'cita', 'romance', 'beso', 'abrazo',
    'querer', 'amar', 'sentimientos', 'crush', 'ex', 'ruptura',
    // Inglés
    'love', 'partner', 'relationship', 'heart', 'boyfriend',
    'girlfriend', 'husband', 'wife', 'marriage', 'marry',
    'single', 'date', 'romance', 'kiss', 'hug', 'feelings',
  ],
  career: [
    'trabajo', 'empleo', 'carrera', 'jefe', 'empresa', 'oficina',
    'sueldo', 'salario', 'promoción', 'ascenso', 'despido',
    'entrevista', 'cv', 'curriculum', 'profesión', 'vocación',
    'job', 'career', 'boss', 'company', 'office', 'salary',
    'promotion', 'interview', 'resume', 'profession',
  ],
  // ... más categorías
};

categorizeQuestion(question: string): string {
  const normalized = question.toLowerCase();
  const scores: Record<string, number> = {};

  // Contar matches por categoría
  for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
    scores[category] = keywords.filter(kw =>
      normalized.includes(kw.toLowerCase())
    ).length;
  }

  // Encontrar categoría con más matches
  const entries = Object.entries(scores);
  entries.sort((a, b) => b[1] - a[1]);

  return entries[0][1] > 0 ? entries[0][0] : 'general';
}
```

### Archivos Afectados
- 📝 **MODIFICAR**: `backend-simple/src/modules/ouija/services/prompts.service.ts`

### Testing
Crear tests en `prompts.service.spec.ts` para validar categorización.

### Estimación
**3 puntos** (~2-3 horas)

### Dependencias
Ninguna (puede hacerse en paralelo)

---

_(Continuaría con IT1-004 hasta IT1-007, pero por brevedad me enfocaré en crear los archivos principales de las otras iteraciones)_

---

## Resumen de Tareas

| ID | Tarea | Puntos | Archivos a Crear | Archivos a Modificar |
|----|-------|--------|------------------|----------------------|
| IT1-001 | Seed SQLite | 5 | `prisma/seed.ts` | `package.json` |
| IT1-002 | FallbackService | 8 | `services/fallback.service.ts` | `ouija.module.ts`, `ouija.service.ts` |
| IT1-003 | Categorización | 3 | - | `services/prompts.service.ts` |
| IT1-004 | Tests | 5 | `*.spec.ts` | - |
| IT1-005 | Swagger | 3 | - | `main.ts`, `*.controller.ts`, `*.dto.ts` |
| IT1-006 | Docker Compose | 2 | `docker-compose.yml`, `Dockerfile.dev` | - |
| IT1-007 | Health endpoint | 2 | `health/health.controller.ts`, `health/health.module.ts` | `app.module.ts` |

**TOTAL**: 21 puntos

---

**Próximo Documento**: [CRITERIOS_ACEPTACION.md](./CRITERIOS_ACEPTACION.md)
