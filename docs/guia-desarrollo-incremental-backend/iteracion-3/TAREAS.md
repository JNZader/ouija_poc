# Tareas Detalladas - Iteración 3: Integración Groq Cloud

## Índice de Tareas
- [IT3-001: Mejorar GroqService](#it3-001-mejorar-groqservice-5-pts)
- [IT3-002: Sistema de Fallback Completo](#it3-002-sistema-de-fallback-completo-5-pts)
- [IT3-003: Rate Limiting](#it3-003-rate-limiting-3-pts)
- [IT3-004: Dashboard de Métricas](#it3-004-dashboard-de-métricas-3-pts)
- [IT3-005: Tests End-to-End](#it3-005-tests-end-to-end-5-pts)
- [Checklist Final](#checklist-final-de-iteración-3)

---

## IT3-001: Mejorar GroqService (5 pts)

### Objetivo
Crear servicio robusto de Groq con retry logic, timeout y validación de API key.

### Archivos a Modificar

#### 1. `backend/src/modules/groq/groq.service.ts`

```typescript
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class GroqService implements OnModuleInit {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey: string;
  private readonly model: string;
  private readonly timeout: number;
  private readonly maxRetries: number;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    this.timeout = parseInt(process.env.GROQ_TIMEOUT || '10000', 10);
    this.maxRetries = 2;
  }

  async onModuleInit() {
    if (!this.apiKey) {
      this.logger.warn('⚠️ GROQ_API_KEY not configured - Groq will be disabled');
    } else {
      this.logger.log(`✅ Groq initialized: ${this.model}`);

      // Validar API key con test call
      try {
        await this.testConnection();
        this.logger.log('✅ Groq API key validated');
      } catch (error) {
        this.logger.error(`❌ Groq API key validation failed: ${error.message}`);
      }
    }
  }

  /**
   * Verifica si Groq está disponible
   */
  isAvailable(): boolean {
    return !!this.apiKey;
  }

  /**
   * Retorna el modelo configurado
   */
  getModel(): string {
    return this.model;
  }

  /**
   * Genera una respuesta usando Groq con retry logic
   */
  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    let lastError: Error;

    // Retry loop
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        this.logger.log({
          message: 'Groq request',
          attempt,
          maxRetries: this.maxRetries,
          model: this.model,
          promptLength: prompt.length,
        });

        const startTime = Date.now();
        const response = await this.callGroqAPI(prompt);
        const elapsed = Date.now() - startTime;

        this.logger.log({
          message: 'Groq success',
          attempt,
          elapsed: `${elapsed}ms`,
          responseLength: response.length,
        });

        return response;

      } catch (error) {
        lastError = error as Error;

        this.logger.warn({
          message: `Groq attempt ${attempt}/${this.maxRetries} failed`,
          error: lastError.message,
          willRetry: attempt < this.maxRetries,
        });

        if (attempt < this.maxRetries) {
          // Wait 2s before retry
          await this.sleep(2000);
        }
      }
    }

    this.logger.error({
      message: 'Groq failed after all retries',
      error: lastError.message,
    });

    throw lastError;
  }

  /**
   * Llamada individual a Groq API
   */
  private async callGroqAPI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.8,
          max_tokens: 150,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle HTTP errors
      if (!response.ok) {
        const errorText = await response.text();

        if (response.status === 429) {
          throw new Error('Rate limit exceeded');
        }

        if (response.status === 401) {
          throw new Error('Invalid API key');
        }

        throw new Error(`Groq API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from Groq');
      }

      return data.choices[0].message.content.trim();

    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error(`Groq timeout (>${this.timeout}ms)`);
      }

      throw error;
    }
  }

  /**
   * Test de conexión para validar API key
   */
  private async testConnection(): Promise<void> {
    await this.callGroqAPI('Test connection - respond with "OK"');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Implementación Paso a Paso

#### Paso 1: Actualizar el servicio
Reemplazar el contenido de `groq.service.ts` con el código anterior.

#### Paso 2: Actualizar variables de entorno
Agregar a `.env`:
```env
GROQ_API_KEY=gsk_tu_api_key_aqui
GROQ_MODEL=llama-3.1-8b-instant
GROQ_TIMEOUT=10000
```

#### Paso 3: Tests unitarios
```bash
cd backend
npm run test -- groq.service.spec.ts
```

### Testing Manual

```bash
# Test 1: Con API key válida
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Tendré suerte?"}'
```

**Esperado**: Respuesta de Groq en < 5s

### Criterios de Aceptación
- [x] API key validada al inicio
- [x] Retry logic implementado (2 intentos)
- [x] Timeout de 10s por request
- [x] Errores 429 y 401 manejados
- [x] Logs estructurados

---

## IT3-002: Sistema de Fallback Completo (5 pts)

### Objetivo
Implementar triple fallback: Groq → Ollama → SQLite

### Archivos a Modificar

#### 1. `backend/src/modules/ouija/services/ouija.service.ts`

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { OllamaService } from '../../ollama/ollama.service';
import { GroqService } from '../../groq/groq.service';
import { FallbackService } from './fallback.service';
import { PromptsService } from './prompts.service';

export interface OuijaResponse {
  question: string;
  response: string;
  personality: string;
  language: string;
  category: string;
  source: 'groq' | 'ollama' | 'database';
  model: string;
  responseTime: number;
}

@Injectable()
export class OuijaService {
  private readonly logger = new Logger(OuijaService.name);

  constructor(
    private readonly groq: GroqService,
    private readonly ollama: OllamaService,
    private readonly fallback: FallbackService,
    private readonly prompts: PromptsService,
  ) {}

  /**
   * Procesa pregunta con triple fallback
   */
  async processQuestion(
    question: string,
    personality: string = 'wise',
    language: string = 'es',
  ): Promise<OuijaResponse> {
    const startTime = Date.now();
    const category = this.prompts.categorizeQuestion(question);

    this.logger.log({
      message: 'Processing question',
      question: question.substring(0, 50),
      category,
      personality,
      language,
    });

    const prompt = this.prompts.getPrompt(
      question,
      personality,
      language,
      category,
    );

    // LEVEL 1: Try Groq (fastest - cloud)
    if (this.groq.isAvailable()) {
      try {
        this.logger.log('🚀 [1/3] Trying Groq API...');
        const response = await this.groq.generate(prompt);
        const elapsed = Date.now() - startTime;

        this.logger.log({
          message: '✅ Groq success',
          elapsed: `${elapsed}ms`,
        });

        return {
          question,
          response,
          personality,
          language,
          category,
          source: 'groq',
          model: this.groq.getModel(),
          responseTime: elapsed,
        };
      } catch (error) {
        this.logger.warn({
          message: '⚠️ Groq failed, trying Ollama',
          error: error.message,
        });
        // Continue to Ollama
      }
    } else {
      this.logger.log('⏭️ Groq not available, skipping to Ollama');
    }

    // LEVEL 2: Try Ollama (local AI)
    const ollamaHealthy = await this.ollama.healthCheck();
    if (ollamaHealthy) {
      try {
        this.logger.log('🔄 [2/3] Trying Ollama...');
        const response = await this.ollama.generate(prompt);
        const elapsed = Date.now() - startTime;

        this.logger.log({
          message: '✅ Ollama success',
          elapsed: `${elapsed}ms`,
        });

        return {
          question,
          response,
          personality,
          language,
          category,
          source: 'ollama',
          model: this.ollama.getModel(),
          responseTime: elapsed,
        };
      } catch (error) {
        this.logger.warn({
          message: '⚠️ Ollama failed, using SQLite',
          error: error.message,
        });
        // Continue to SQLite
      }
    } else {
      this.logger.log('⏭️ Ollama not healthy, skipping to SQLite');
    }

    // LEVEL 3: SQLite Fallback (always works)
    this.logger.log('💾 [3/3] Using SQLite fallback...');
    const fallbackResult = await this.fallback.getResponse(
      personality,
      language,
      category,
      question,
    );

    const elapsed = Date.now() - startTime;

    this.logger.log({
      message: '✅ SQLite success',
      elapsed: `${elapsed}ms`,
    });

    return {
      question,
      response: fallbackResult.text,
      personality,
      language,
      category: fallbackResult.category,
      source: 'database',
      model: 'sqlite-fallback',
      responseTime: elapsed,
    };
  }
}
```

### Testing Manual

```bash
# Test con Groq
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Tendré suerte?"}' | jq '.data.source'

# Esperado: "groq"

# Test fallback (sin GROQ_API_KEY)
unset GROQ_API_KEY
npm run start:dev

curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Amor?"}' | jq '.data.source'

# Esperado: "ollama"
```

### Criterios de Aceptación
- [x] Triple fallback implementado
- [x] Campo source correcto
- [x] Logs claros del flujo
- [x] Latencia total < 35s

---

## IT3-003: Rate Limiting (3 pts)

### Objetivo
Implementar token bucket para respetar límites de Groq.

### Archivos a Crear

#### 1. `backend/src/common/utils/rate-limiter.ts`

```typescript
import { Logger } from '@nestjs/common';

export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);
  private tokens: number;
  private lastRefill: number;

  constructor(
    private readonly maxTokens: number,
    private readonly refillInterval: number, // milliseconds
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  /**
   * Verifica si hay tokens disponibles
   */
  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // Refill tokens si pasó el intervalo
    if (now - this.lastRefill >= this.refillInterval) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;

      this.logger.debug({
        message: 'Rate limiter refilled',
        tokens: this.tokens,
      });
    }

    // Verificar si hay tokens disponibles
    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    this.logger.warn({
      message: 'Rate limit exceeded',
      nextRefill: this.getTimeUntilRefill(),
    });

    return false;
  }

  /**
   * Obtiene tokens restantes
   */
  getRemainingTokens(): number {
    return this.tokens;
  }

  /**
   * Obtiene tiempo hasta próximo refill (ms)
   */
  getTimeUntilRefill(): number {
    const elapsed = Date.now() - this.lastRefill;
    return Math.max(0, this.refillInterval - elapsed);
  }

  /**
   * Obtiene información del rate limiter
   */
  getInfo(): {
    remaining: number;
    total: number;
    nextRefillMs: number;
  } {
    return {
      remaining: this.getRemainingTokens(),
      total: this.maxTokens,
      nextRefillMs: this.getTimeUntilRefill(),
    };
  }
}
```

#### 2. Actualizar `backend/src/modules/groq/groq.service.ts`

```typescript
import { RateLimiter } from '../../common/utils/rate-limiter';

export class GroqService implements OnModuleInit {
  // ... código existente ...
  private rateLimiter: RateLimiter;

  constructor() {
    // ... código existente ...
    this.rateLimiter = new RateLimiter(30, 60000); // 30 req/min
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    // Check rate limit
    const allowed = await this.rateLimiter.checkLimit();
    if (!allowed) {
      throw new Error('Rate limit exceeded - try again later');
    }

    // ... resto del código ...
  }

  getRateLimitInfo() {
    return this.rateLimiter.getInfo();
  }
}
```

### Testing Manual

```bash
# Test rate limit
for i in {1..35}; do
  curl -X POST http://localhost:3000/api/ouija \
    -H "Content-Type: application/json" \
    -d '{"question": "test '$i'"}' > /dev/null 2>&1 &
done
wait

# Ver logs
docker-compose logs backend | grep "Rate limit"
```

### Criterios de Aceptación
- [x] Token bucket implementado
- [x] 30 requests/minuto
- [x] Refill automático cada minuto
- [x] Método getRateLimitInfo()

---

## IT3-004: Dashboard de Métricas (3 pts)

### Objetivo
Crear endpoint con métricas del sistema.

### Archivos a Crear

#### 1. `backend/src/modules/ouija/controllers/dashboard.controller.ts`

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { GroqService } from '../../groq/groq.service';
import { OllamaService } from '../../ollama/ollama.service';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly groq: GroqService,
    private readonly ollama: OllamaService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get system metrics and health' })
  @ApiResponse({ status: 200, description: 'System metrics' })
  async getDashboard() {
    const [ollamaHealthy, totalResponses] = await Promise.all([
      this.ollama.healthCheck(),
      this.prisma.fallbackResponse.count(),
    ]);

    const responsesByCategory = await this.prisma.fallbackResponse.groupBy({
      by: ['category'],
      _count: true,
    });

    return {
      timestamp: new Date().toISOString(),
      services: {
        groq: {
          available: this.groq.isAvailable(),
          model: this.groq.getModel(),
          rateLimit: this.groq.getRateLimitInfo(),
        },
        ollama: {
          healthy: ollamaHealthy,
          model: this.ollama.getModel(),
          circuitBreaker: this.ollama.getCircuitBreakerStatus(),
        },
        database: {
          totalResponses,
          byCategory: responsesByCategory.map(r => ({
            category: r.category,
            count: r._count,
          })),
        },
      },
    };
  }
}
```

#### 2. Actualizar `backend/src/modules/ouija/ouija.module.ts`

```typescript
import { DashboardController } from './controllers/dashboard.controller';

@Module({
  imports: [PrismaModule, OllamaModule, GroqModule],
  controllers: [OuijaController, DashboardController],
  providers: [OuijaService, FallbackService, PromptsService],
})
export class OuijaModule {}
```

### Testing Manual

```bash
curl http://localhost:3000/dashboard | jq
```

### Criterios de Aceptación
- [x] Endpoint /dashboard implementado
- [x] Muestra estado de todos los servicios
- [x] Incluye métricas de rate limiting
- [x] Documentación Swagger

---

## IT3-005: Tests End-to-End (5 pts)

### Objetivo
Tests completos del flujo de fallback.

### Archivos a Crear

#### 1. `backend/test/e2e/triple-fallback.e2e-spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('E2E: Triple Fallback System', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /ouija/ask', () => {
    it('should use Groq when available', async () => {
      const response = await request(app.getHttpServer())
        .post('/ouija/ask')
        .send({
          question: '¿Encontraré el amor?',
          personality: 'wise',
          language: 'es',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.source).toBe('groq');
      expect(response.body.data.responseTime).toBeLessThan(10000);
      expect(response.body.data.response).toBeDefined();
    }, 15000);

    it('should return correct response structure', async () => {
      const response = await request(app.getHttpServer())
        .post('/ouija/ask')
        .send({
          question: '¿Tendré suerte?',
        })
        .expect(200);

      expect(response.body.data).toHaveProperty('question');
      expect(response.body.data).toHaveProperty('response');
      expect(response.body.data).toHaveProperty('source');
      expect(response.body.data).toHaveProperty('model');
      expect(response.body.data).toHaveProperty('responseTime');
    });

    it('should handle invalid requests', async () => {
      await request(app.getHttpServer())
        .post('/ouija/ask')
        .send({})
        .expect(400);
    });

    it('should work with different personalities', async () => {
      const personalities = ['wise', 'playful', 'cryptic'];

      for (const personality of personalities) {
        const response = await request(app.getHttpServer())
          .post('/ouija/ask')
          .send({
            question: '¿Test?',
            personality,
          })
          .expect(200);

        expect(response.body.data.personality).toBe(personality);
      }
    }, 30000);

    it('should work with different languages', async () => {
      const languages = ['es', 'en'];

      for (const language of languages) {
        const response = await request(app.getHttpServer())
          .post('/ouija/ask')
          .send({
            question: '¿Test?',
            language,
          })
          .expect(200);

        expect(response.body.data.language).toBe(language);
      }
    }, 20000);

    it('should always return a response (fallback guarantee)', async () => {
      // Hacer request sin importar estado de servicios
      const response = await request(app.getHttpServer())
        .post('/ouija/ask')
        .send({
          question: '¿Funcionará el fallback?',
        })
        .expect(200);

      expect(response.body.data.response).toBeDefined();
      expect(response.body.data.response.length).toBeGreaterThan(0);
      expect(['groq', 'ollama', 'database']).toContain(
        response.body.data.source,
      );
    }, 40000);
  });

  describe('GET /dashboard', () => {
    it('should return system metrics', async () => {
      const response = await request(app.getHttpServer())
        .get('/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      expect(response.body.services).toHaveProperty('groq');
      expect(response.body.services).toHaveProperty('ollama');
      expect(response.body.services).toHaveProperty('database');
    });
  });
});
```

### Ejecutar Tests

```bash
cd backend
npm run test:e2e
```

### Criterios de Aceptación
- [x] 6+ tests E2E
- [x] Todos los tests pasan
- [x] Coverage > 85%
- [x] Tests independientes

---

## Checklist Final de Iteración 3

### Funcional
- [ ] Triple fallback funciona correctamente
- [ ] Groq responde en < 5s cuando disponible
- [ ] Rate limiting previene exceder 30 req/min
- [ ] Dashboard muestra métricas en tiempo real
- [ ] Logs muestran claramente qué servicio respondió

### Técnico
- [ ] IT3-001: GroqService completado
- [ ] IT3-002: Triple fallback completado
- [ ] IT3-003: Rate limiting completado
- [ ] IT3-004: Dashboard completado
- [ ] IT3-005: Tests E2E completados
- [ ] Todos los tests pasan
- [ ] Coverage > 85%

### Performance
- [ ] Groq: < 5s (p95)
- [ ] Ollama: < 30s (p95)
- [ ] SQLite: < 500ms (p95)
- [ ] Dashboard: < 500ms

### Documentación
- [ ] README actualizado
- [ ] .env.example con GROQ_API_KEY
- [ ] Swagger con endpoint /dashboard
- [ ] Comentarios JSDoc agregados

---

**Total de Tareas**: 5
**Complejidad Total**: 13 puntos
**Duración Estimada**: 1 semana

**¡Éxito con la implementación!** 🚀
