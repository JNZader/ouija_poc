# Tareas Detalladas - Iteración 2: Integración Ollama Local

## Índice de Tareas
- [IT2-001: Docker Compose con Ollama](#it2-001-docker-compose-con-ollama-8-pts)
- [IT2-002: Mejorar OllamaService con Retry](#it2-002-mejorar-ollamaservice-con-retry-5-pts)
- [IT2-003: Health Check de Ollama](#it2-003-health-check-de-ollama-3-pts)
- [IT2-004: Tests de Integración](#it2-004-tests-de-integración-5-pts)
- [IT2-005: Logging Estructurado](#it2-005-logging-estructurado-2-pts)
- [IT2-006: Script de Descarga de Modelos](#it2-006-script-de-descarga-de-modelos-2-pts)
- [Checklist Final](#checklist-final-de-iteración-2)

---

## IT2-001: Docker Compose con Ollama (8 pts)

### Objetivo
Configurar Docker Compose que levante backend + Ollama con health checks y volúmenes persistentes.

### Archivos a Crear/Modificar

#### 1. `docker-compose.yml` (raíz del proyecto)
```yaml
version: '3.8'

services:
  # Servicio Ollama - IA Local
  ollama:
    image: ollama/ollama:latest
    container_name: ouija-ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama-models:/root/.ollama
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    networks:
      - ouija-network
    restart: unless-stopped

  # Backend NestJS
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: ouija-backend
    ports:
      - "3000:3000"
    depends_on:
      ollama:
        condition: service_healthy
    environment:
      - NODE_ENV=development
      - OLLAMA_URL=http://ollama:11434
      - OLLAMA_MODEL=qwen2.5:0.5b
      - GROQ_API_KEY=${GROQ_API_KEY}
      - DATABASE_URL=file:./data/ouija.db
    volumes:
      - ./backend/src:/app/src
      - ./backend/data:/app/data
      - ./backend/prisma:/app/prisma
    networks:
      - ouija-network
    restart: unless-stopped
    command: npm run start:dev

volumes:
  ollama-models:
    name: ouija-ollama-models

networks:
  ouija-network:
    name: ouija-network
    driver: bridge
```

#### 2. `.env.example` (raíz del proyecto)
```env
# ==================================
# CONFIGURACIÓN BACKEND OUIJA VIRTUAL
# ==================================

# Entorno
NODE_ENV=development

# Ollama Configuration
OLLAMA_URL=http://ollama:11434
OLLAMA_MODEL=qwen2.5:0.5b
OLLAMA_TIMEOUT=30000

# Groq Configuration
GROQ_API_KEY=tu_api_key_aqui
GROQ_MODEL=llama-3.1-8b-instant

# Database
DATABASE_URL=file:./data/ouija.db

# Server
PORT=3000
```

#### 3. `backend/Dockerfile` (optimizado para desarrollo)
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar curl para health checks
RUN apk add --no-cache curl

# Copiar package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependencias
RUN npm ci

# Copiar código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Comando por defecto
CMD ["npm", "run", "start:dev"]
```

#### 4. `scripts/init-ollama.sh`
```bash
#!/bin/bash

echo "🚀 Initializing Ollama service..."

# Levantar Ollama
docker-compose up -d ollama

# Esperar a que esté healthy
echo "⏳ Waiting for Ollama to be healthy..."
timeout 60 bash -c '
  until docker-compose exec -T ollama curl -f http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo -n "."
    sleep 2
  done
'

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Ollama is healthy!"
else
  echo ""
  echo "❌ Ollama failed to start"
  exit 1
fi

# Verificar si el modelo ya existe
echo "🔍 Checking if model qwen2.5:0.5b exists..."
if docker-compose exec -T ollama ollama list | grep -q "qwen2.5:0.5b"; then
  echo "✅ Model already exists"
else
  echo "📥 Pulling model qwen2.5:0.5b (this may take a while)..."
  docker-compose exec -T ollama ollama pull qwen2.5:0.5b

  if [ $? -eq 0 ]; then
    echo "✅ Model downloaded successfully"
  else
    echo "❌ Failed to download model"
    exit 1
  fi
fi

echo "🎉 Ollama initialization complete!"
```

### Implementación Paso a Paso

#### Paso 1: Crear docker-compose.yml
```bash
# En la raíz del proyecto
touch docker-compose.yml
```

Copiar el contenido del archivo YAML mostrado arriba.

#### Paso 2: Crear .env.example
```bash
touch .env.example
```

Copiar el contenido del archivo .env.example.

#### Paso 3: Crear .env desde .env.example
```bash
cp .env.example .env
```

Editar `.env` y agregar tu GROQ_API_KEY real.

#### Paso 4: Actualizar backend/Dockerfile
Modificar el Dockerfile existente con el contenido mostrado arriba.

#### Paso 5: Crear script de inicialización
```bash
mkdir -p scripts
touch scripts/init-ollama.sh
chmod +x scripts/init-ollama.sh
```

Copiar el contenido del script.

#### Paso 6: Agregar scripts a package.json
```json
{
  "scripts": {
    "docker:up": "docker-compose up -d",
    "docker:down": "docker-compose down",
    "docker:logs": "docker-compose logs -f",
    "docker:ollama:init": "./scripts/init-ollama.sh",
    "docker:ollama:logs": "docker-compose logs -f ollama",
    "docker:backend:logs": "docker-compose logs -f backend"
  }
}
```

### Testing Manual

#### Test 1: Levantar servicios
```bash
npm run docker:up
```

**Esperado**: Ambos servicios levantan sin errores.

#### Test 2: Verificar Ollama
```bash
curl http://localhost:11434/api/tags
```

**Esperado**: Respuesta JSON con lista de modelos.

#### Test 3: Verificar Backend
```bash
curl http://localhost:3000/health
```

**Esperado**: Status 200 con información de salud.

#### Test 4: Inicializar Ollama con modelo
```bash
npm run docker:ollama:init
```

**Esperado**: Script descarga modelo y finaliza exitosamente.

### Criterios de Aceptación
- [x] docker-compose.yml creado
- [x] .env.example creado
- [x] Dockerfile optimizado
- [x] Scripts creados
- [x] package.json actualizado
- [x] Servicios levantan correctamente
- [x] Health checks funcionan
- [x] Volúmenes persistentes configurados

---

## IT2-002: Mejorar OllamaService con Retry (5 pts)

### Objetivo
Añadir retry logic con backoff exponencial y circuit breaker pattern.

### Archivos a Modificar

#### 1. `backend/src/modules/ollama/ollama.service.ts`

**Código Completo Mejorado:**

```typescript
import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

interface GenerateOptions {
  model: string;
  prompt: string;
  stream: boolean;
}

@Injectable()
export class OllamaService {
  private readonly logger = new Logger(OllamaService.name);
  private readonly ollamaUrl: string;
  private readonly model: string;
  private readonly timeout: number;

  // Circuit Breaker State
  private circuitOpen = false;
  private failureCount = 0;
  private readonly MAX_FAILURES = 3;
  private readonly CIRCUIT_RESET_TIMEOUT = 60000; // 60 segundos

  // Retry Configuration
  private readonly MAX_RETRIES = 3;
  private readonly BASE_DELAY = 2000; // 2 segundos

  constructor() {
    this.ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'qwen2.5:0.5b';
    this.timeout = parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10);
  }

  /**
   * Genera una respuesta usando Ollama con retry logic y circuit breaker
   */
  async generate(prompt: string): Promise<string> {
    // Circuit Breaker Check
    if (this.circuitOpen) {
      this.logger.warn('🔴 Circuit breaker is OPEN - failing fast');
      throw new Error('Circuit breaker is open - Ollama unavailable');
    }

    // Retry Loop
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        this.logger.log({
          message: 'Attempting Ollama request',
          attempt,
          maxRetries: this.MAX_RETRIES,
          model: this.model,
          promptLength: prompt.length,
        });

        const response = await this.tryGenerate(prompt);

        // Success - Reset failure count
        this.failureCount = 0;

        this.logger.log({
          message: 'Ollama request successful',
          attempt,
          responseLength: response.length,
        });

        return response;

      } catch (error) {
        lastError = error as Error;

        this.logger.warn({
          message: `Attempt ${attempt}/${this.MAX_RETRIES} failed`,
          error: lastError.message,
          willRetry: attempt < this.MAX_RETRIES,
        });

        // Si es el último intento, manejar fallo
        if (attempt === this.MAX_RETRIES) {
          this.handleFailure(lastError);
          throw lastError;
        }

        // Backoff exponencial antes del siguiente intento
        const delay = this.BASE_DELAY * Math.pow(2, attempt - 1);
        this.logger.debug(`⏳ Waiting ${delay}ms before retry...`);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Intento individual de generación (sin retry)
   */
  private async tryGenerate(prompt: string): Promise<string> {
    try {
      const payload: GenerateOptions = {
        model: this.model,
        prompt,
        stream: false,
      };

      const response = await axios.post(
        `${this.ollamaUrl}/api/generate`,
        payload,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response from Ollama');
      }

      return response.data.response.trim();

    } catch (error) {
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;

        if (axiosError.code === 'ECONNREFUSED') {
          throw new Error('Ollama service is not reachable');
        }

        if (axiosError.code === 'ETIMEDOUT') {
          throw new Error('Ollama request timed out');
        }

        throw new Error(`Ollama error: ${axiosError.message}`);
      }

      throw error;
    }
  }

  /**
   * Maneja fallos consecutivos y abre circuit breaker si es necesario
   */
  private handleFailure(error: Error): void {
    this.failureCount++;

    this.logger.error({
      message: 'Ollama request failed',
      failureCount: this.failureCount,
      maxFailures: this.MAX_FAILURES,
      error: error.message,
    });

    // Abrir circuit breaker si se supera el límite
    if (this.failureCount >= this.MAX_FAILURES) {
      this.openCircuitBreaker();
    }
  }

  /**
   * Abre el circuit breaker y programa auto-reset
   */
  private openCircuitBreaker(): void {
    this.circuitOpen = true;

    this.logger.error({
      message: '🔴 CIRCUIT BREAKER OPENED',
      reason: `${this.failureCount} consecutive failures`,
      resetIn: `${this.CIRCUIT_RESET_TIMEOUT / 1000}s`,
    });

    // Auto-reset después del timeout
    setTimeout(() => {
      this.resetCircuitBreaker();
    }, this.CIRCUIT_RESET_TIMEOUT);
  }

  /**
   * Resetea el circuit breaker
   */
  private resetCircuitBreaker(): void {
    this.circuitOpen = false;
    this.failureCount = 0;

    this.logger.log({
      message: '🟢 CIRCUIT BREAKER RESET',
      status: 'Ollama service will be retried',
    });
  }

  /**
   * Obtiene el estado actual del circuit breaker
   */
  getCircuitBreakerStatus(): {
    open: boolean;
    failureCount: number;
    maxFailures: number;
  } {
    return {
      open: this.circuitOpen,
      failureCount: this.failureCount,
      maxFailures: this.MAX_FAILURES,
    };
  }

  /**
   * Utility: Sleep function
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Implementación Paso a Paso

#### Paso 1: Backup del archivo original
```bash
cp backend/src/modules/ollama/ollama.service.ts backend/src/modules/ollama/ollama.service.ts.backup
```

#### Paso 2: Reemplazar el contenido
Reemplazar el contenido del archivo con el código mostrado arriba.

#### Paso 3: Verificar imports
Asegurarse de que las dependencias están instaladas:
```bash
cd backend
npm install axios
```

### Testing Manual

#### Test 1: Retry logic
```bash
# Detener Ollama temporalmente
docker-compose stop ollama

# Hacer request al backend
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

**Esperado**: 3 reintentos con backoff exponencial visible en logs.

#### Test 2: Circuit breaker
```bash
# Hacer 3 requests con Ollama detenido
for i in {1..3}; do
  curl -X POST http://localhost:3000/api/ouija \
    -H "Content-Type: application/json" \
    -d '{"question": "test '$i'"}'
done

# El 4to request debería fallar inmediatamente
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "test 4"}'
```

**Esperado**: 4to request falla instantáneamente (circuit abierto).

#### Test 3: Auto-reset
```bash
# Esperar 60 segundos
sleep 60

# Levantar Ollama
docker-compose start ollama

# Hacer request
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

**Esperado**: Circuit breaker se resetea y request funciona.

### Criterios de Aceptación
- [x] Retry logic implementado (3 intentos)
- [x] Backoff exponencial (2s, 4s, 8s)
- [x] Circuit breaker funciona
- [x] Auto-reset después de 60s
- [x] Logs claros de cada intento
- [x] Método getCircuitBreakerStatus() disponible

---

## IT2-003: Health Check de Ollama (3 pts)

### Objetivo
Verificar disponibilidad de Ollama antes de usarlo y exponer estado en /health endpoint.

### Archivos a Modificar

#### 1. `backend/src/modules/ollama/ollama.service.ts`

**Agregar métodos de health check:**

```typescript
// Agregar al OllamaService

export class OllamaService {
  // ... código existente ...

  // Health Check State
  private isHealthy = false;
  private lastHealthCheck = 0;
  private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minuto
  private readonly HEALTH_CHECK_TIMEOUT = 5000; // 5 segundos

  /**
   * Verifica si Ollama está disponible (con cache)
   */
  async healthCheck(): Promise<boolean> {
    const now = Date.now();

    // Usar cache si no ha expirado
    if (now - this.lastHealthCheck < this.HEALTH_CHECK_INTERVAL) {
      this.logger.debug('Using cached health check result');
      return this.isHealthy;
    }

    this.logger.debug('Performing fresh health check...');

    try {
      const response = await axios.get(`${this.ollamaUrl}/api/tags`, {
        timeout: this.HEALTH_CHECK_TIMEOUT,
      });

      this.isHealthy = response.status === 200;
      this.lastHealthCheck = now;

      this.logger.log({
        message: 'Ollama health check',
        healthy: this.isHealthy,
        url: this.ollamaUrl,
      });

      return this.isHealthy;

    } catch (error) {
      this.isHealthy = false;
      this.lastHealthCheck = now;

      this.logger.warn({
        message: 'Ollama health check failed',
        error: (error as Error).message,
      });

      return false;
    }
  }

  /**
   * Obtiene información detallada de salud
   */
  async getHealthInfo(): Promise<{
    healthy: boolean;
    url: string;
    model: string;
    circuitBreaker: {
      open: boolean;
      failureCount: number;
    };
    lastCheck: Date | null;
  }> {
    const healthy = await this.healthCheck();

    return {
      healthy,
      url: this.ollamaUrl,
      model: this.model,
      circuitBreaker: {
        open: this.circuitOpen,
        failureCount: this.failureCount,
      },
      lastCheck: this.lastHealthCheck > 0
        ? new Date(this.lastHealthCheck)
        : null,
    };
  }

  /**
   * Actualizar método generate para usar health check
   */
  async generate(prompt: string): Promise<string> {
    // Verificar salud antes de intentar
    const healthy = await this.healthCheck();
    if (!healthy) {
      this.logger.warn('Skipping Ollama - health check failed');
      throw new Error('Ollama is not healthy');
    }

    // Circuit Breaker Check
    if (this.circuitOpen) {
      this.logger.warn('🔴 Circuit breaker is OPEN - failing fast');
      throw new Error('Circuit breaker is open - Ollama unavailable');
    }

    // ... resto del código (retry loop)
  }
}
```

#### 2. `backend/src/modules/health/health.controller.ts`

**Actualizar endpoint /health:**

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service';
import { OllamaService } from '../ollama/ollama.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ollama: OllamaService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Check system health' })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2025-10-17T12:00:00.000Z',
        version: '1.0.0',
        database: {
          connected: true,
          responsesCount: 52
        },
        ollama: {
          healthy: true,
          url: 'http://ollama:11434',
          model: 'qwen2.5:0.5b',
          circuitBreaker: {
            open: false,
            failureCount: 0
          },
          lastCheck: '2025-10-17T12:00:00.000Z'
        }
      }
    }
  })
  async check() {
    // Obtener info de Ollama
    const ollamaInfo = await this.ollama.getHealthInfo();

    // Determinar estado general
    const status = ollamaInfo.healthy ? 'ok' : 'degraded';

    // Contar respuestas en DB
    const responsesCount = await this.prisma.fallbackResponse.count();

    return {
      status,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      database: {
        connected: true,
        responsesCount,
      },
      ollama: ollamaInfo,
    };
  }
}
```

#### 3. `backend/src/modules/health/health.module.ts`

**Agregar OllamaService al módulo:**

```typescript
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OllamaModule } from '../ollama/ollama.module';

@Module({
  imports: [PrismaModule, OllamaModule],
  controllers: [HealthController],
})
export class HealthModule {}
```

### Testing Manual

#### Test 1: Health check con Ollama funcionando
```bash
docker-compose up -d
curl http://localhost:3000/health | jq
```

**Esperado**:
```json
{
  "status": "ok",
  "ollama": {
    "healthy": true,
    "circuitBreaker": {
      "open": false,
      "failureCount": 0
    }
  }
}
```

#### Test 2: Health check con Ollama caído
```bash
docker-compose stop ollama
curl http://localhost:3000/health | jq
```

**Esperado**:
```json
{
  "status": "degraded",
  "ollama": {
    "healthy": false,
    "circuitBreaker": {
      "open": false,
      "failureCount": 0
    }
  }
}
```

#### Test 3: Cache de health check
```bash
# Primera llamada (fresh check)
time curl http://localhost:3000/health > /dev/null

# Segunda llamada (cached)
time curl http://localhost:3000/health > /dev/null
```

**Esperado**: Segunda llamada más rápida (< 10ms).

### Criterios de Aceptación
- [x] Health check implementado
- [x] Cache de 1 minuto funciona
- [x] Timeout de 5s en health check
- [x] /health endpoint actualizado
- [x] Estado "degraded" cuando Ollama está caído
- [x] Documentación Swagger actualizada

---

## IT2-004: Tests de Integración (5 pts)

### Objetivo
Crear tests que verifiquen integración real con Ollama.

### Archivos a Crear

#### 1. `backend/test/integration/ollama.service.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OllamaService } from '../../src/modules/ollama/ollama.service';

describe('OllamaService Integration Tests', () => {
  let service: OllamaService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OllamaService],
    }).compile();

    service = module.get<OllamaService>(OllamaService);
  });

  describe('Health Check', () => {
    it('should connect to Ollama successfully', async () => {
      const healthy = await service.healthCheck();
      expect(healthy).toBe(true);
    });

    it('should cache health check result', async () => {
      const start1 = Date.now();
      await service.healthCheck();
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await service.healthCheck();
      const time2 = Date.now() - start2;

      // Segunda llamada debería ser mucho más rápida (cached)
      expect(time2).toBeLessThan(time1 / 2);
    });

    it('should return detailed health info', async () => {
      const info = await service.getHealthInfo();

      expect(info).toHaveProperty('healthy');
      expect(info).toHaveProperty('url');
      expect(info).toHaveProperty('model');
      expect(info).toHaveProperty('circuitBreaker');
      expect(info.model).toBe('qwen2.5:0.5b');
    });
  });

  describe('Generate', () => {
    it('should generate a response successfully', async () => {
      const response = await service.generate(
        'Responde solo con "hola" en español'
      );

      expect(response).toBeDefined();
      expect(response.length).toBeGreaterThan(0);
      expect(typeof response).toBe('string');
    }, 60000); // 60s timeout

    it('should handle timeout gracefully', async () => {
      // Override timeout temporalmente
      process.env.OLLAMA_TIMEOUT = '1000'; // 1 segundo

      const testService = new OllamaService();

      await expect(
        testService.generate('Genera un texto muy largo de 5000 palabras...')
      ).rejects.toThrow();

      // Restore timeout
      delete process.env.OLLAMA_TIMEOUT;
    }, 10000);
  });

  describe('Circuit Breaker', () => {
    it('should open circuit after consecutive failures', async () => {
      // Forzar URL inválida para provocar fallos
      const originalUrl = process.env.OLLAMA_URL;
      process.env.OLLAMA_URL = 'http://invalid-host:11434';

      const testService = new OllamaService();

      // Provocar 3 fallos
      for (let i = 0; i < 3; i++) {
        await expect(testService.generate('test')).rejects.toThrow();
      }

      // Verificar que circuit está abierto
      const status = testService.getCircuitBreakerStatus();
      expect(status.open).toBe(true);

      // Restore URL
      process.env.OLLAMA_URL = originalUrl;
    }, 30000);
  });
});
```

#### 2. `backend/test/integration/ouija.service.integration.spec.ts`

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { OuijaService } from '../../src/modules/ouija/services/ouija.service';
import { OllamaService } from '../../src/modules/ollama/ollama.service';
import { FallbackService } from '../../src/modules/ouija/services/fallback.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';

describe('OuijaService Integration - Fallback Logic', () => {
  let ouijaService: OuijaService;
  let ollamaService: OllamaService;
  let fallbackService: FallbackService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OuijaService,
        OllamaService,
        FallbackService,
        PrismaService,
      ],
    }).compile();

    ouijaService = module.get<OuijaService>(OuijaService);
    ollamaService = module.get<OllamaService>(OllamaService);
    fallbackService = module.get<FallbackService>(FallbackService);
  });

  it('should use Ollama when available', async () => {
    const result = await ouijaService.processQuestion(
      '¿Tendré suerte?',
      'wise',
      'es'
    );

    expect(result).toBeDefined();
    expect(result.source).toBe('ollama');
    expect(result.model).toBe('qwen2.5:0.5b');
    expect(result.response).toBeDefined();
  }, 60000);

  it('should fallback to SQLite when Ollama fails', async () => {
    // Mock Ollama para que falle
    jest.spyOn(ollamaService, 'generate').mockRejectedValue(
      new Error('Ollama down')
    );

    const result = await ouijaService.processQuestion(
      '¿Amor?',
      'wise',
      'es'
    );

    expect(result.source).toBe('database');
    expect(result.model).toBe('sqlite-fallback');
    expect(result.response).toBeDefined();
    expect(result.latency).toBeLessThan(500); // Fallback debe ser rápido
  });

  it('should fallback when Ollama health check fails', async () => {
    // Mock health check para que falle
    jest.spyOn(ollamaService, 'healthCheck').mockResolvedValue(false);

    const result = await ouijaService.processQuestion(
      '¿Dinero?',
      'wise',
      'es'
    );

    expect(result.source).toBe('database');
  });
});
```

#### 3. Actualizar `backend/package.json`

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:integration": "jest --testPathPattern=integration --runInBand",
    "test:integration:watch": "jest --testPathPattern=integration --watch"
  },
  "jest": {
    "testMatch": [
      "**/*.spec.ts",
      "**/*.integration.spec.ts"
    ],
    "testPathIgnorePatterns": [
      "/node_modules/",
      "/dist/"
    ]
  }
}
```

### Testing Manual

#### Ejecutar tests de integración
```bash
# Asegurarse de que Ollama esté corriendo
npm run docker:up

# Ejecutar tests de integración
cd backend
npm run test:integration
```

**Esperado**: Todos los tests pasan.

### Criterios de Aceptación
- [x] 8+ tests de integración creados
- [x] Tests de health check
- [x] Tests de generación
- [x] Tests de timeout
- [x] Tests de circuit breaker
- [x] Tests de fallback
- [x] Todos los tests pasan
- [x] Scripts agregados a package.json

---

## IT2-005: Logging Estructurado (2 pts)

### Objetivo
Implementar logging estructurado con Winston para mejor debugging.

### Archivos a Crear/Modificar

#### 1. Instalar dependencias
```bash
cd backend
npm install winston nest-winston
```

#### 2. `backend/src/common/config/logger.config.ts`

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

export const loggerConfig = WinstonModule.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    isProduction
      ? winston.format.json() // JSON en producción
      : winston.format.combine(
          winston.format.colorize(),
          winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
            let msg = `${timestamp} [${context || 'Application'}] ${level}: ${message}`;

            // Agregar metadata si existe
            if (Object.keys(meta).length > 0) {
              msg += `\n${JSON.stringify(meta, null, 2)}`;
            }

            return msg;
          }),
        ),
  ),
  transports: [
    new winston.transports.Console(),
    // File transport para producción
    ...(isProduction
      ? [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
          }),
        ]
      : []),
  ],
});
```

#### 3. `backend/src/main.ts`

**Actualizar para usar el logger:**

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { loggerConfig } from './common/config/logger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: loggerConfig,
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  loggerConfig.log(`🚀 Application is running on: http://localhost:${port}`);
}
bootstrap();
```

#### 4. Actualizar logs en servicios existentes

**Los servicios ya usan this.logger, solo asegurarse de que los logs sean estructurados.**

Ejemplo en `OllamaService`:
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
  stack: error.stack,
  url: this.ollamaUrl,
});
```

### Testing Manual

#### Test 1: Logs en desarrollo
```bash
npm run start:dev
```

**Esperado**: Logs coloridos y legibles.

#### Test 2: Logs en producción
```bash
NODE_ENV=production npm run start
```

**Esperado**: Logs en formato JSON.

### Criterios de Aceptación
- [x] Winston instalado
- [x] Logger configurado
- [x] Logs coloridos en desarrollo
- [x] Logs JSON en producción
- [x] Niveles de log configurables
- [x] No hay información sensible en logs

---

## IT2-006: Script de Descarga de Modelos (2 pts)

### Objetivo
Automatizar descarga de modelos de Ollama.

### Archivos a Crear

#### 1. `scripts/download-ollama-models.sh`

```bash
#!/bin/bash

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Modelos a descargar
MODELS=("qwen2.5:0.5b" "llama3.2:1b")

echo -e "${GREEN}🚀 Downloading Ollama models...${NC}\n"

# Verificar que Ollama esté corriendo
if ! docker-compose ps | grep -q "ollama.*Up"; then
  echo -e "${RED}❌ Ollama service is not running${NC}"
  echo -e "   Run: docker-compose up -d ollama"
  exit 1
fi

# Esperar a que Ollama esté healthy
echo -e "${YELLOW}⏳ Waiting for Ollama to be ready...${NC}"
timeout 30 bash -c '
  until docker-compose exec -T ollama curl -f http://localhost:11434/api/tags > /dev/null 2>&1; do
    echo -n "."
    sleep 2
  done
'
echo ""

# Descargar cada modelo
for MODEL in "${MODELS[@]}"; do
  echo -e "\n${YELLOW}📥 Checking model: $MODEL${NC}"

  # Verificar si ya existe
  if docker-compose exec -T ollama ollama list | grep -q "$MODEL"; then
    echo -e "${GREEN}✅ Model $MODEL already exists${NC}"
  else
    echo -e "${YELLOW}📥 Pulling model $MODEL (this may take a while)...${NC}"

    if docker-compose exec -T ollama ollama pull $MODEL; then
      echo -e "${GREEN}✅ Model $MODEL downloaded successfully${NC}"
    else
      echo -e "${RED}❌ Failed to download model $MODEL${NC}"
      exit 1
    fi
  fi
done

echo -e "\n${GREEN}🎉 All models downloaded!${NC}\n"

# Listar modelos disponibles
echo -e "${GREEN}📋 Available models:${NC}"
docker-compose exec -T ollama ollama list

echo -e "\n${GREEN}✅ Done!${NC}"
```

#### 2. Dar permisos de ejecución
```bash
chmod +x scripts/download-ollama-models.sh
```

#### 3. Agregar a `package.json`
```json
{
  "scripts": {
    "docker:ollama:models": "./scripts/download-ollama-models.sh"
  }
}
```

### Testing Manual

```bash
npm run docker:ollama:models
```

**Esperado**: Script descarga modelos y muestra lista al final.

### Criterios de Aceptación
- [x] Script creado
- [x] Descarga múltiples modelos
- [x] Verifica si modelo ya existe
- [x] Muestra progreso
- [x] Maneja errores
- [x] Agregado a package.json

---

## Checklist Final de Iteración 2

### Funcional
- [ ] `docker-compose up` levanta backend + Ollama sin errores
- [ ] Ollama responde en < 30s (p95)
- [ ] Fallback a SQLite funciona cuando Ollama falla
- [ ] Health endpoint muestra estado correcto de Ollama
- [ ] Logs estructurados y útiles

### Técnico
- [ ] IT2-001: Docker Compose completado
- [ ] IT2-002: Retry logic y circuit breaker implementados
- [ ] IT2-003: Health check funcionando
- [ ] IT2-004: 8+ tests de integración pasan
- [ ] IT2-005: Winston configurado correctamente
- [ ] IT2-006: Script de modelos funcional

### Performance
- [ ] Ollama latency < 30s
- [ ] Fallback latency < 500ms
- [ ] Health check cacheado (no overhead)
- [ ] Circuit breaker funciona correctamente

### Documentación
- [ ] README actualizado con instrucciones Docker
- [ ] .env.example actualizado
- [ ] Scripts documentados en package.json
- [ ] Swagger actualizado con nuevo endpoint de health

### Testing
- [ ] Tests unitarios pasan
- [ ] Tests de integración pasan
- [ ] Coverage > 80%
- [ ] Tests documentados

---

## Próximos Pasos

Una vez completada la Iteración 2:
1. Verificar todos los criterios de aceptación
2. Actualizar KANBAN.md moviendo tareas a "Done"
3. Documentar aprendizajes en APRENDIZAJE.md
4. Proceder con **Iteración 3: Integración Groq Cloud**

---

**Total de Tareas**: 6
**Complejidad Total**: 18 puntos
**Duración Estimada**: 1-2 semanas

**¡Éxito con la implementación!** 🚀
