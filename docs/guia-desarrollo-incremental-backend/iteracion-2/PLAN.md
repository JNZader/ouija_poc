# Iteración 2: Integración Ollama Local

## Objetivos

Añadir **Ollama como capa principal de IA**, manteniendo SQLite como fallback. El sistema debe intentar Ollama primero y, si falla, usar SQLite automáticamente.

## Resumen Ejecutivo

```
Duración:     1-2 semanas
Complejidad:  18 puntos
Features:     6 tareas
Tests:        8+ integración
Deploy:       Docker Compose con Ollama
```

## Arquitectura de la Iteración

```
Frontend
   ↓
API REST
   ↓
┌─────────────────────────┐
│ OuijaService            │
│  ├─ Try Ollama          │
│  │   ├─ Health check    │
│  │   ├─ Generate prompt │
│  │   ├─ Call Ollama API │
│  │   └─ Retry 3x        │
│  │                       │
│  └─ On Error:           │
│      └─ FallbackService │
│          └─ SQLite      │
└─────────────────────────┘
         ↓
┌─────────────────────────┐
│  Docker Compose         │
│  ┌──────────────────┐   │
│  │ Backend          │   │
│  │ (port 3000)      │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Ollama           │   │
│  │ (port 11434)     │   │
│  │ Model: qwen2.5   │   │
│  └──────────────────┘   │
└─────────────────────────┘
```

## Estado Actual vs Estado Deseado

### Estado Actual (Fin Iteración 1)
- ✅ FallbackService funcional
- ✅ SQLite con 50+ respuestas
- ✅ API REST funcionando
- ✅ Tests unitarios > 80%
- ⚠️ OllamaService existe pero no está integrado
- ⚠️ Sin Docker Compose para Ollama
- ⚠️ Sin manejo robusto de errores

### Estado Deseado (Fin Iteración 2)
- ✅ Ollama corriendo en Docker
- ✅ Backend conectado a Ollama
- ✅ Retry logic con 3 intentos
- ✅ Circuit breaker pattern
- ✅ Fallback automático a SQLite
- ✅ Health checks de Ollama
- ✅ Logging estructurado
- ✅ Tests de integración

## Tareas Principales

### [IT2-001] Docker Compose con Ollama (8 pts)

**Objetivo**: Configurar Docker Compose que levante backend + Ollama

**Archivos a crear**:
- `docker-compose.yml` (mejorado)
- `.env.example`

**Configuración**:
```yaml
version: '3.8'

services:
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - ollama
    environment:
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5:0.5b
    volumes:
      - ./src:/app/src
      - ./data:/app/data

volumes:
  ollama-models:
```

**Script de inicialización**:
```bash
# scripts/init-ollama.sh
#!/bin/bash
echo "🚀 Initializing Ollama..."
docker-compose up -d ollama
sleep 10

echo "📥 Pulling model qwen2.5:0.5b..."
docker-compose exec ollama ollama pull qwen2.5:0.5b

echo "✅ Ollama ready!"
```

---

### [IT2-002] Mejorar OllamaService con Retry (5 pts)

**Objetivo**: Añadir retry logic y circuit breaker al servicio existente

**Cambios en OllamaService**:
```typescript
@Injectable()
export class OllamaService {
  private circuitOpen = false;
  private failureCount = 0;
  private readonly MAX_FAILURES = 3;

  async generate(prompt: string): Promise<string> {
    // Circuit breaker check
    if (this.circuitOpen) {
      throw new Error('Circuit breaker is open');
    }

    // Retry logic (3 attempts)
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await this.tryGenerate(prompt);
        this.failureCount = 0; // Reset on success
        return response;
      } catch (error) {
        this.logger.warn(`Attempt ${attempt}/3 failed: ${error.message}`);

        if (attempt === 3) {
          this.failureCount++;

          // Open circuit if too many failures
          if (this.failureCount >= this.MAX_FAILURES) {
            this.circuitOpen = true;
            this.logger.error('🔴 Circuit breaker opened!');

            // Auto-reset after 60s
            setTimeout(() => {
              this.circuitOpen = false;
              this.failureCount = 0;
              this.logger.log('🟢 Circuit breaker reset');
            }, 60000);
          }

          throw error;
        }

        // Exponential backoff
        await this.sleep(Math.pow(2, attempt) * 1000);
      }
    }
  }

  private async tryGenerate(prompt: string): Promise<string> {
    const response = await axios.post(
      `${this.ollamaUrl}/api/generate`,
      {
        model: this.model,
        prompt,
        stream: false,
      },
      {
        timeout: 30000,
      },
    );

    return response.data.response.trim();
  }
}
```

**¿Por qué Circuit Breaker?**
- Evita saturar Ollama con requests cuando está caído
- Falla rápido sin esperar timeout
- Se auto-resetea para reintentar más tarde

---

### [IT2-003] Health Check de Ollama (3 pts)

**Objetivo**: Verificar disponibilidad antes de usar

```typescript
@Injectable()
export class OllamaService {
  private isHealthy = false;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 min

  async healthCheck(): Promise<boolean> {
    const now = Date.now();

    // Cache health check por 1 minuto
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      return this.isHealthy;
    }

    try {
      await axios.get(`${this.ollamaUrl}/api/tags`, { timeout: 5000 });
      this.isHealthy = true;
      this.lastHealthCheck = now;
      return true;
    } catch {
      this.isHealthy = false;
      this.lastHealthCheck = now;
      return false;
    }
  }

  async generate(prompt: string): Promise<string> {
    // Verificar salud antes de intentar
    const healthy = await this.healthCheck();
    if (!healthy) {
      throw new Error('Ollama is not healthy');
    }

    // ... resto del código
  }
}
```

**Actualizar /health endpoint**:
```typescript
@Get()
async check() {
  const ollamaHealthy = await this.ollama.healthCheck();

  return {
    status: ollamaHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    database: {
      connected: true,
      responsesCount: await this.prisma.fallbackResponse.count(),
    },
    ollama: {
      healthy: ollamaHealthy,
      url: process.env.OLLAMA_URL,
      model: process.env.OLLAMA_MODEL,
    },
  };
}
```

---

### [IT2-004] Tests de Integración (5 pts)

**Objetivo**: Testear integración real con Ollama

```typescript
// ollama.service.integration.spec.ts
describe('OllamaService Integration', () => {
  let service: OllamaService;

  beforeAll(async () => {
    // Requiere Ollama corriendo (docker-compose up ollama)
    const module = await Test.createTestingModule({
      providers: [OllamaService],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  it('should connect to Ollama', async () => {
    const healthy = await service.healthCheck();
    expect(healthy).toBe(true);
  });

  it('should generate response', async () => {
    const response = await service.generate('Say hello in Spanish');
    expect(response).toBeDefined();
    expect(response.length).toBeGreaterThan(0);
  }, 60000); // 60s timeout

  it('should handle timeout gracefully', async () => {
    await expect(
      service.generate('Very long prompt...'),
    ).rejects.toThrow();
  });
});
```

**Test de fallback**:
```typescript
// ouija.service.integration.spec.ts
it('should fallback to SQLite when Ollama fails', async () => {
  // Mock Ollama failure
  jest.spyOn(ollama, 'generate').mockRejectedValue(new Error('Ollama down'));

  const result = await ouijaService.processQuestion('¿Amor?', 'wise', 'es');

  expect(result.source).toBe('database');
  expect(result.model).toBe('sqlite-fallback');
  expect(result.response).toBeDefined();
});
```

---

### [IT2-005] Logging Estructurado (2 pts)

**Objetivo**: Mejorar logs para debugging

```typescript
// logger.config.ts
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

export const loggerConfig = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message, context }) => {
          return `${timestamp} [${context}] ${level}: ${message}`;
        }),
      ),
    }),
  ],
});
```

**Uso**:
```typescript
this.logger.log({
  message: 'Ollama request',
  model: this.model,
  promptLength: prompt.length,
  attempt: 1,
});

this.logger.error({
  message: 'Ollama failed',
  error: error.message,
  url: this.ollamaUrl,
});
```

---

### [IT2-006] Script de Descarga de Modelos (2 pts)

**Objetivo**: Automatizar pull de modelos

```bash
#!/bin/bash
# scripts/download-ollama-models.sh

MODELS=("qwen2.5:0.5b" "llama3.2:1b")

echo "🚀 Downloading Ollama models..."

for MODEL in "${MODELS[@]}"; do
  echo "📥 Pulling $MODEL..."
  docker-compose exec ollama ollama pull $MODEL

  if [ $? -eq 0 ]; then
    echo "✅ $MODEL downloaded successfully"
  else
    echo "❌ Failed to download $MODEL"
  fi
done

echo "🎉 All models downloaded!"

# Listar modelos disponibles
echo "\n📋 Available models:"
docker-compose exec ollama ollama list
```

---

## Criterios de Aceptación (Iteración 2 Completa)

### Funcional
- [ ] `docker-compose up` levanta backend + Ollama
- [ ] Ollama responde en < 30s
- [ ] Fallback a SQLite funciona cuando Ollama falla
- [ ] Health endpoint muestra estado de Ollama
- [ ] Logs estructurados y útiles

### Técnico
- [ ] Todas las tareas (IT2-001 a IT2-006) completadas
- [ ] Tests de integración pasan
- [ ] Circuit breaker funciona
- [ ] Retry logic implementado
- [ ] Sin errores en logs (salvo fallos esperados)

### Performance
- [ ] Ollama response time < 30s (p95)
- [ ] Fallback latency < 500ms
- [ ] Health check cached (no sobrecarga)

---

## Próxima Iteración

Con Ollama funcionando, estás listo para añadir Groq como capa más rápida (Iteración 3).
