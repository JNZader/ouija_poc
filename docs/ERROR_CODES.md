# Error Codes - Ouija Virtual API

## HTTP Status Codes

La API utiliza códigos de estado HTTP estándar y códigos de error personalizados.

## Códigos de Error Personalizados

### Errores de Cliente (4xx)

#### BAD_REQUEST (400)
**Causas comunes:**
- Datos de entrada inválidos
- Parámetros faltantes
- Formato incorrecto

**Ejemplo:**
```json
{
  "statusCode": 400,
  "code": "BAD_REQUEST",
  "message": "Validation failed",
  "errors": [
    {
      "property": "message",
      "constraints": {
        "minLength": "message must be longer than 1 characters"
      }
    }
  ],
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask",
  "method": "POST"
}
```

#### VALIDATION_ERROR (400)
Datos de entrada no cumplen con las reglas de validación.

**Ejemplo:**
```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Validation failed",
  "errors": [
    {
      "property": "spiritId",
      "constraints": {
        "isNotEmpty": "spiritId should not be empty"
      },
      "value": ""
    }
  ],
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/create",
  "method": "POST"
}
```

#### INVALID_SPIRIT (400)
El espíritu especificado no está disponible o no existe.

**Ejemplo:**
```json
{
  "statusCode": 400,
  "code": "INVALID_SPIRIT",
  "message": "Spirit 999 is not available",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/create",
  "method": "POST"
}
```

#### NOT_FOUND (404)
**Causas comunes:**
- Sesión no encontrada
- Espíritu no encontrado
- Sala no encontrada

**Ejemplo:**
```json
{
  "statusCode": 404,
  "code": "NOT_FOUND",
  "message": "Session with token sess_abc123 not found",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/sess_abc123/history",
  "method": "GET"
}
```

#### CONFLICT (409)
**Causas comunes:**
- Sala llena
- Usuario ya en sala
- Sesión ya finalizada

**Ejemplo:**
```json
{
  "statusCode": 409,
  "code": "CONFLICT",
  "message": "Room ABC123 is full",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/multiplayer/room/join",
  "method": "POST"
}
```

#### ROOM_FULL (409)
La sala ha alcanzado su capacidad máxima de participantes.

**Ejemplo:**
```json
{
  "statusCode": 409,
  "code": "ROOM_FULL",
  "message": "Room XYZ789 is full",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/multiplayer/room/join",
  "method": "POST"
}
```

#### SESSION_EXPIRED (410)
Sesión ha expirado o ha sido finalizada.

**Ejemplo:**
```json
{
  "statusCode": 410,
  "code": "SESSION_EXPIRED",
  "message": "Session sess_old123 has expired or ended",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask",
  "method": "POST"
}
```

#### RATE_LIMIT_EXCEEDED (429)
Demasiadas peticiones en corto tiempo.

**Ejemplo:**
```json
{
  "statusCode": 429,
  "code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded. Try again in 60 seconds",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask",
  "method": "POST"
}
```

### Errores de Servidor (5xx)

#### INTERNAL_ERROR (500)
Error interno del servidor no especificado.

**Ejemplo:**
```json
{
  "statusCode": 500,
  "code": "INTERNAL_ERROR",
  "message": "Internal server error",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask",
  "method": "POST"
}
```

#### AI_SERVICE_UNAVAILABLE (503)
**Causa:** Servicios de IA (Ollama/DeepSeek) no disponibles.

**Nota:** La API intentará usar fallback templates antes de retornar este error.

```json
{
  "statusCode": 503,
  "code": "AI_SERVICE_UNAVAILABLE",
  "message": "AI service is currently unavailable",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask",
  "method": "POST"
}
```

#### DATABASE_ERROR (500)
Error en operación de base de datos.

**Subcódigos:**
- `DUPLICATE_ENTRY` (400): Violación de constraint único
- `INVALID_REFERENCE` (400): Foreign key inválida
- `NOT_FOUND` (404): Registro no encontrado (Prisma P2025)

**Ejemplo - Duplicate Entry:**
```json
{
  "statusCode": 400,
  "code": "DUPLICATE_ENTRY",
  "message": "Unique constraint violation",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/multiplayer/room/create",
  "method": "POST"
}
```

#### SERVICE_UNAVAILABLE (503)
Servicio temporalmente no disponible.

**Ejemplo:**
```json
{
  "statusCode": 503,
  "code": "SERVICE_UNAVAILABLE",
  "message": "Service temporarily unavailable",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "path": "/api/ouija/session/ask",
  "method": "POST"
}
```

## Estructura de Respuesta de Error

Todas las respuestas de error siguen esta estructura:

```typescript
{
  statusCode: number;      // Código HTTP
  code: string;            // Código de error personalizado
  message: string;         // Mensaje descriptivo
  timestamp: string;       // ISO 8601
  path: string;            // Endpoint que falló
  method: string;          // Método HTTP
  errors?: any[];          // Detalles de validación (opcional)
  stack?: string;          // Stack trace (solo en development)
  details?: any;           // Información adicional (solo en development)
}
```

## Manejo de Errores en Cliente

### Ejemplo en JavaScript

```javascript
async function createSession(spiritId) {
  try {
    const response = await fetch('/api/ouija/session/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spiritId }),
    });

    if (!response.ok) {
      const error = await response.json();

      switch (error.code) {
        case 'INVALID_SPIRIT':
          console.error('Invalid spirit ID:', spiritId);
          break;
        case 'VALIDATION_ERROR':
          console.error('Validation failed:', error.errors);
          break;
        case 'AI_SERVICE_UNAVAILABLE':
          console.error('AI temporarily unavailable, try again later');
          break;
        case 'RATE_LIMIT_EXCEEDED':
          console.error('Too many requests, please wait');
          break;
        case 'SESSION_EXPIRED':
          console.error('Session has expired, create a new one');
          break;
        case 'ROOM_FULL':
          console.error('Room is full, try another room');
          break;
        default:
          console.error('Unexpected error:', error.message);
      }

      throw error;
    }

    return await response.json();
  } catch (err) {
    console.error('Network error:', err);
    throw err;
  }
}
```

### Ejemplo con Axios

```javascript
import axios from 'axios';

// Configurar interceptor global
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { code, message, errors } = error.response.data;

      console.error(`Error ${code}: ${message}`);

      if (errors) {
        errors.forEach((err) => {
          console.error(`- ${err.property}: ${Object.values(err.constraints).join(', ')}`);
        });
      }
    }

    return Promise.reject(error);
  },
);

// Uso
async function askSpirit(sessionToken, message) {
  try {
    const response = await axios.post('/api/ouija/session/ask', {
      sessionToken,
      message,
    });
    return response.data;
  } catch (error) {
    if (error.response?.data?.code === 'SESSION_EXPIRED') {
      // Crear nueva sesión
      return createNewSession();
    }
    throw error;
  }
}
```

## Mejores Prácticas

### 1. Validación en Cliente
Implementa validación en el cliente antes de enviar requests para minimizar errores de validación.

### 2. Retry con Backoff
Para errores 5xx y timeouts, implementa retry con exponential backoff:

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.status < 500 || i === maxRetries - 1) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}
```

### 3. Manejo de Rate Limiting
Implementa rate limiting en el cliente para evitar errores 429:

```javascript
class RateLimiter {
  constructor(maxRequests, windowMs) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  async waitForSlot() {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return this.waitForSlot();
    }

    this.requests.push(now);
  }
}

// Uso: max 10 requests por minuto
const limiter = new RateLimiter(10, 60000);

async function apiCall() {
  await limiter.waitForSlot();
  return fetch('/api/ouija/session/ask', { /* ... */ });
}
```

### 4. Logging de Errores
Implementa logging estructurado de errores en el cliente:

```javascript
function logError(error, context) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    code: error.response?.data?.code,
    message: error.response?.data?.message,
    status: error.response?.status,
    path: error.response?.config?.url,
    method: error.response?.config?.method,
    context,
  };

  // Enviar a servicio de logging (Sentry, LogRocket, etc.)
  console.error('API Error:', errorLog);
}
```

## Monitoreo y Alertas

### Códigos que Requieren Atención Inmediata

- **AI_SERVICE_UNAVAILABLE**: Indica que todos los motores de IA han fallado
- **DATABASE_ERROR**: Problemas de conectividad o integridad de datos
- **INTERNAL_ERROR**: Errores no manejados en el servidor

### Métricas Recomendadas

1. **Tasa de Errores por Código**: Monitorear frecuencia de cada código de error
2. **Latencia de Respuesta**: Medir tiempos de respuesta para detectar degradación
3. **Disponibilidad de Servicios**: Health check de DB y AI engines
4. **Rate Limiting**: Tracking de usuarios afectados por límites

## Soporte

Si encuentras un error no documentado o tienes dudas sobre el manejo de errores, por favor:

1. Revisa la documentación completa en `/api/docs`
2. Verifica el health check en `/api/health/detailed`
3. Contacta al equipo de soporte con el `timestamp` y `path` del error

---

**Última actualización:** 2025-10-16
**Versión de API:** 1.0.0
