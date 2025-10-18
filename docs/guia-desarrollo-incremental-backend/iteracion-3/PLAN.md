# Iteración 3: Integración Groq Cloud

## Objetivos

Añadir **Groq como capa primaria** para respuestas ultra-rápidas. Sistema completo con **triple fallback**: Groq → Ollama → SQLite.

## Resumen Ejecutivo

```
Duración:     1 semana
Complejidad:  13 puntos
Features:     5 tareas
Tests:        6+ E2E
Deploy:       Local con Groq API
```

## Arquitectura Final

```
Frontend Request
      ↓
┌─────────────────────────────────┐
│ OuijaService                    │
│                                 │
│ 1️⃣ Try Groq API (primario)      │
│    ├─ API Key check            │
│    ├─ Rate limit check         │
│    ├─ Call Groq                │
│    └─ Timeout: 10s             │
│         ↓ (success)             │
│         Return (70% casos)      │
│         ↓ (error)               │
│                                 │
│ 2️⃣ Try Ollama (secundario)      │
│    ├─ Health check             │
│    ├─ Call Ollama              │
│    └─ Timeout: 30s             │
│         ↓ (success)             │
│         Return (25% casos)      │
│         ↓ (error)               │
│                                 │
│ 3️⃣ SQLite Fallback (último)     │
│    └─ FallbackService          │
│         ↓                       │
│         Return (5% casos)       │
└─────────────────────────────────┘
```

## Decisiones Técnicas

### ¿Por qué Groq primero?

**Opción A**: Ollama → Groq → SQLite
**Opción B**: Groq → Ollama → SQLite ✅

**Razones para Opción B**:
1. **Velocidad**: Groq 10x más rápido (2s vs 20s)
2. **UX**: Usuario prefiere respuesta rápida
3. **Costo**: Free tier generoso (30 req/min)
4. **Ollama como backup**: Solo usa recursos cuando Groq falla

### Rate Limiting Strategy

**Problema**: Groq limita a 30 requests/minuto (free tier)

**Solución**: Token bucket algorithm
```typescript
class RateLimiter {
  private tokens = 30;
  private lastRefill = Date.now();

  async checkLimit(): Promise<boolean> {
    // Refill tokens cada minuto
    const now = Date.now();
    if (now - this.lastRefill >= 60000) {
      this.tokens = 30;
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false; // Rate limit exceeded
  }
}
```

## Tareas Principales

### [IT3-001] Mejorar GroqService (5 pts)

**Objetivo**: Añadir retry, timeout y mejor manejo de errores

```typescript
@Injectable()
export class GroqService {
  private readonly logger = new Logger(GroqService.name);
  private readonly apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  private readonly apiKey: string;
  private readonly model: string;
  private rateLimiter: RateLimiter;

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    this.rateLimiter = new RateLimiter(30, 60000); // 30 req/min

    if (!this.apiKey) {
      this.logger.warn('⚠️ GROQ_API_KEY not configured');
    } else {
      this.logger.log(`✅ Groq initialized: ${this.model}`);
    }
  }

  async generate(prompt: string): Promise<string> {
    if (!this.apiKey) {
      throw new Error('Groq API key not configured');
    }

    // Check rate limit
    const allowed = await this.rateLimiter.checkLimit();
    if (!allowed) {
      throw new Error('Rate limit exceeded');
    }

    // Retry logic (2 attempts)
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const startTime = Date.now();

        const response = await this.callGroqAPI(prompt);

        const elapsed = Date.now() - startTime;
        this.logger.log(`✅ Groq response in ${elapsed}ms`);

        return response;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt}/2 failed: ${error.message}`);

        if (attempt === 2) {
          throw error;
        }

        await this.sleep(2000); // 2s wait
      }
    }
  }

  private async callGroqAPI(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

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

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Groq API error (${response.status}): ${error}`);
      }

      const data = await response.json();
      return data.choices[0].message.content.trim();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Groq timeout (>10s)');
      }

      throw error;
    }
  }
}
```

---

### [IT3-002] Sistema de Fallback Completo (5 pts)

**Objetivo**: Orquestar triple fallback en OuijaService

```typescript
async processQuestion(
  question: string,
  personality: string = 'wise',
  language: string = 'es',
): Promise<OuijaResponse> {
  const startTime = Date.now();
  const category = this.prompts.categorizeQuestion(question);

  this.logger.log(`🔮 Processing: ${question.substring(0, 50)}...`);
  this.logger.log(`   Category: ${category} | Personality: ${personality}`);

  const prompt = this.prompts.getPrompt(question, personality, language, category);

  // LEVEL 1: Try Groq (fastest)
  if (this.groq.isAvailable()) {
    try {
      this.logger.log('🚀 Trying Groq API...');
      const response = await this.groq.generate(prompt);

      const elapsed = Date.now() - startTime;
      this.logger.log(`✅ Groq success (${elapsed}ms)`);

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
      this.logger.warn(`⚠️ Groq failed: ${error.message}`);
      // Continue to Ollama
    }
  }

  // LEVEL 2: Try Ollama (local)
  const ollamaHealthy = await this.ollama.healthCheck();
  if (ollamaHealthy) {
    try {
      this.logger.log('🔄 Trying Ollama...');
      const response = await this.ollama.generate(prompt);

      const elapsed = Date.now() - startTime;
      this.logger.log(`✅ Ollama success (${elapsed}ms)`);

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
      this.logger.warn(`⚠️ Ollama failed: ${error.message}`);
      // Continue to SQLite
    }
  }

  // LEVEL 3: SQLite Fallback (always works)
  this.logger.log('🔄 Using SQLite fallback...');
  const fallbackResult = await this.fallback.getResponse(
    personality,
    language,
    category,
    question,
  );

  const elapsed = Date.now() - startTime;
  this.logger.log(`✅ SQLite fallback (${elapsed}ms)`);

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
```

---

### [IT3-003] Rate Limiting (3 pts)

**Objetivo**: Implementar token bucket para Groq

```typescript
// src/common/rate-limiter.ts
export class RateLimiter {
  private tokens: number;
  private lastRefill: number;

  constructor(
    private maxTokens: number,
    private refillInterval: number, // ms
  ) {
    this.tokens = maxTokens;
    this.lastRefill = Date.now();
  }

  async checkLimit(): Promise<boolean> {
    const now = Date.now();

    // Refill tokens if interval passed
    if (now - this.lastRefill >= this.refillInterval) {
      this.tokens = this.maxTokens;
      this.lastRefill = now;
    }

    if (this.tokens > 0) {
      this.tokens--;
      return true;
    }

    return false;
  }

  getRemainingTokens(): number {
    return this.tokens;
  }

  getTimeUntilRefill(): number {
    const elapsed = Date.now() - this.lastRefill;
    return Math.max(0, this.refillInterval - elapsed);
  }
}
```

**Endpoint de métricas**:
```typescript
@Get('metrics')
getMetrics() {
  return {
    groq: {
      remainingRequests: this.groq.getRateLimitInfo().remaining,
      nextRefill: this.groq.getRateLimitInfo().nextRefill,
    },
    cache: this.ouija.getCacheStats(),
  };
}
```

---

### [IT3-004] Dashboard de Métricas (3 pts)

**Objetivo**: Endpoint para monitoreo

```typescript
@Get('dashboard')
async getDashboard() {
  const [groqHealthy, ollamaHealthy] = await Promise.all([
    this.groq.healthCheck(),
    this.ollama.healthCheck(),
  ]);

  const stats = await this.fallback.getStats();

  return {
    timestamp: new Date().toISOString(),
    services: {
      groq: {
        healthy: groqHealthy,
        available: this.groq.isAvailable(),
        rateLimit: this.groq.getRateLimitInfo(),
      },
      ollama: {
        healthy: ollamaHealthy,
        model: this.ollama.getModel(),
      },
      database: {
        totalResponses: stats.total,
        byCategory: stats.byCategory,
      },
    },
    cache: this.ouija.getCacheStats(),
  };
}
```

---

### [IT3-005] Tests E2E (5 pts)

**Objetivo**: Tests del flujo completo

```typescript
describe('E2E: Triple Fallback', () => {
  it('should use Groq when available', async () => {
    const response = await request(app)
      .post('/ouija/ask')
      .send({
        question: '¿Encontraré el amor?',
        personality: 'wise',
        language: 'es',
      });

    expect(response.status).toBe(200);
    expect(response.body.data.source).toBe('groq');
    expect(response.body.data.responseTime).toBeLessThan(10000);
  });

  it('should fallback to Ollama when Groq fails', async () => {
    // Mock Groq failure
    jest.spyOn(groq, 'generate').mockRejectedValue(new Error());

    const response = await request(app)
      .post('/ouija/ask')
      .send({
        question: '¿Amor?',
        personality: 'wise',
        language: 'es',
      });

    expect(response.body.data.source).toBe('ollama');
  });

  it('should fallback to SQLite when all AI fails', async () => {
    jest.spyOn(groq, 'generate').mockRejectedValue(new Error());
    jest.spyOn(ollama, 'generate').mockRejectedValue(new Error());

    const response = await request(app)
      .post('/ouija/ask')
      .send({
        question: '¿Amor?',
        personality: 'wise',
        language: 'es',
      });

    expect(response.body.data.source).toBe('database');
  });
});
```

---

## Variables de Entorno

```bash
# .env
NODE_ENV=development

# Database
DATABASE_URL=file:./data/dev.db

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b

# Groq
GROQ_API_KEY=gsk_xxxxxxxxxxxxx
GROQ_MODEL=llama-3.1-8b-instant
```

## Criterios de Aceptación

### Funcional
- [ ] Triple fallback funciona: Groq → Ollama → SQLite
- [ ] Rate limiting de Groq implementado
- [ ] Métricas disponibles en `/dashboard`
- [ ] Logs muestran claramente qué servicio respondió

### Técnico
- [ ] Tests E2E pasan al 100%
- [ ] Response time < 10s (p95)
- [ ] Sin errores no controlados
- [ ] Groq API key configurable

### Performance
- [ ] Groq: < 5s (p95)
- [ ] Ollama: < 30s (p95)
- [ ] SQLite: < 100ms (p95)

---

**Próximo**: Iteración 4 - Deploy en Koyeb con sistema completo.
