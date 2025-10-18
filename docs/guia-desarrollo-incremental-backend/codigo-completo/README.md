# Código Completo - Archivos de REFERENCIA

⚠️ **IMPORTANTE:** Esta carpeta contiene código de **REFERENCIA**, **NO para copiar directamente**.

## 📖 Uso Correcto de Esta Carpeta

### ✅ SÍ úsala cuando:
- Te atascas implementando algo y necesitas ver cómo se hace
- Quieres validar tu implementación contra una referencia
- No entiendes un concepto y necesitas un ejemplo concreto
- Terminaste una tarea y quieres comparar enfoques

### ❌ NO la uses para:
- Copiar todo el código sin pensar
- Saltarte el proceso de desarrollo
- Evitar leer TAREAS.md
- "Terminar rápido" sin aprender

## 🎯 Filosofía

Estos archivos fueron creados para **ayudarte cuando te atasques**, no para que copies sin entender.

**El objetivo es que TÚ desarrolles siguiendo TAREAS.md**. Esta carpeta es tu red de seguridad, no tu atajo.

---

## 📁 Estructura de esta Carpeta

```
codigo-completo/
│
├── services/                    # Servicios principales
│   ├── ollama.service.ts        # Servicio de IA local (Ollama)
│   ├── groq.service.ts          # Servicio de IA cloud (Groq)
│   └── fallback.service.ts      # Servicio de fallback SQLite
│
├── tests/                       # Tests unitarios completos
│   ├── fallback.service.spec.ts # Tests del FallbackService
│   └── ouija.service.spec.ts    # Tests del OuijaService
│
├── config/                      # Configuraciones
│   ├── docker-compose.yml       # Docker Compose completo
│   ├── swagger-setup.ts         # Configuración de Swagger/OpenAPI
│   └── main-with-swagger.ts     # main.ts con Swagger integrado
│
└── README.md                    # Este archivo
```

---

## 🎯 Cómo Usar Estos Archivos

### 1. Servicios (services/)

Estos archivos deben copiarse en `backend-simple/src/modules/ouija/services/`

```bash
# Copiar servicios
cp codigo-completo/services/ollama.service.ts backend-simple/src/modules/ouija/services/
cp codigo-completo/services/groq.service.ts backend-simple/src/modules/ouija/services/
cp codigo-completo/services/fallback.service.ts backend-simple/src/modules/ouija/services/
```

**Cuándo copiar:**
- `ollama.service.ts` - Durante IT1-002 (puede usarse desde el inicio)
- `groq.service.ts` - Durante IT3-001 (Iteración 3)
- `fallback.service.ts` - Durante IT1-002 (Iteración 1)

---

### 2. Tests (tests/)

Estos archivos deben copiarse en `backend-simple/src/modules/ouija/`

```bash
# Copiar tests
cp codigo-completo/tests/fallback.service.spec.ts backend-simple/src/modules/ouija/services/
cp codigo-completo/tests/ouija.service.spec.ts backend-simple/src/modules/ouija/
```

**Cuándo copiar:**
- Durante IT1-004 (Tests unitarios)

**Ejecutar tests:**
```bash
cd backend-simple
npm run test
npm run test:cov  # Con coverage
```

---

### 3. Docker Compose (config/docker-compose.yml)

Este archivo debe copiarse en la raíz del proyecto `backend-simple/`

```bash
# Copiar docker-compose
cp codigo-completo/config/docker-compose.yml backend-simple/
```

**Cuándo copiar:**
- Durante IT1-006 (Docker Compose local)
- Durante IT2-001 (Integración con Ollama)

**Usar:**
```bash
cd backend-simple

# Primera vez - descargar modelo de Ollama
docker-compose up -d ollama
docker-compose exec ollama ollama pull qwen2.5:0.5b

# Iniciar todo
docker-compose up

# Ver logs
docker-compose logs -f

# Detener
docker-compose down
```

---

### 4. Swagger (config/swagger-setup.ts)

Este archivo debe copiarse en `backend-simple/src/config/`

```bash
# Crear carpeta y copiar archivo
mkdir -p backend-simple/src/config
cp codigo-completo/config/swagger-setup.ts backend-simple/src/config/
cp codigo-completo/config/main-with-swagger.ts backend-simple/src/main.ts
```

**Cuándo copiar:**
- Durante IT1-005 (Documentación Swagger)

**Antes de usar, instalar dependencias:**
```bash
cd backend-simple
npm install @nestjs/swagger swagger-ui-express
```

**Acceder a Swagger:**
- UI: http://localhost:3001/api
- JSON: http://localhost:3001/api-json

---

## 🔍 Descripción de Cada Archivo

### services/ollama.service.ts

**Propósito:** Conectarse a Ollama (IA local) para generar respuestas místicas

**Características:**
- Timeout de 30 segundos
- Health check para verificar disponibilidad
- Logging detallado
- Manejo robusto de errores (ECONNREFUSED, ETIMEDOUT)

**Variables de entorno:**
- `OLLAMA_URL` - URL de Ollama (default: http://localhost:11434)
- `OLLAMA_MODEL` - Modelo a usar (default: qwen2.5:0.5b)

**Métodos principales:**
- `generate(prompt: string)` - Generar respuesta
- `healthCheck()` - Verificar disponibilidad
- `getModel()` - Obtener nombre del modelo

---

### services/groq.service.ts

**Propósito:** Conectarse a Groq Cloud API (IA ultra-rápida) como fuente primaria

**Características:**
- Respuestas en ~500ms (10x más rápido que Ollama)
- API compatible con OpenAI
- Manejo de rate limiting (429)
- Logging de tokens consumidos

**Variables de entorno:**
- `GROQ_API_KEY` - API key (obtener en https://console.groq.com/keys)
- `GROQ_MODEL` - Modelo a usar (default: llama-3.1-8b-instant)

**Métodos principales:**
- `generate(prompt: string)` - Generar respuesta
- `isAvailable()` - Verificar si hay API key
- `getModel()` - Obtener nombre del modelo

**Rate limits (free tier):**
- 30 requests/minuto
- 6000 tokens/minuto

---

### services/fallback.service.ts

**Propósito:** Servicio de último recurso usando SQLite con keyword matching

**Características:**
- Keyword matching inteligente
- Filtrado por personalidad, categoría, idioma
- Selección aleatoria del top 3
- Respuestas genéricas si no hay match
- Estadísticas de respuestas

**Algoritmo:**
1. Extraer keywords de la pregunta (elimina stopwords)
2. Buscar respuestas en DB que coincidan
3. Calcular score (keywords + categoría)
4. Seleccionar top 3 y elegir aleatoriamente

**Métodos principales:**
- `getFallbackResponse()` - Obtener respuesta de fallback
- `getStats()` - Estadísticas de la base de datos

---

### tests/fallback.service.spec.ts

**Propósito:** Tests unitarios del FallbackService

**Cobertura:**
- ✅ Extracción de keywords
- ✅ Cálculo de match score
- ✅ Filtrado por personalidad/categoría/idioma
- ✅ Respuestas genéricas
- ✅ Manejo de errores
- ✅ Estadísticas

**Ejecutar:**
```bash
npm run test fallback.service.spec.ts
```

---

### tests/ouija.service.spec.ts

**Propósito:** Tests unitarios del OuijaService (servicio principal)

**Cobertura:**
- ✅ Sistema de fallback triple (Groq → Ollama → Database)
- ✅ Cache de preguntas repetidas
- ✅ Respuestas "molestas" después de 3+ repeticiones
- ✅ Detección de categorías
- ✅ Manejo de diferentes personalidades e idiomas

**Ejecutar:**
```bash
npm run test ouija.service.spec.ts
```

---

### config/docker-compose.yml

**Propósito:** Configuración completa de Docker Compose para desarrollo local

**Servicios:**
- `backend` - NestJS backend (puerto 3001)
- `ollama` - Ollama AI service (puerto 11434)

**Características:**
- Hot reload del código
- Persistencia de modelos de Ollama
- Health checks
- Restart automático
- Network aislado

**Comandos útiles:**
```bash
docker-compose up              # Iniciar
docker-compose up -d           # Iniciar en background
docker-compose logs -f         # Ver logs
docker-compose ps              # Estado de servicios
docker-compose restart         # Reiniciar
docker-compose down            # Detener
docker-compose down -v         # Detener y eliminar volúmenes
```

---

### config/swagger-setup.ts

**Propósito:** Configuración completa de Swagger/OpenAPI

**Características:**
- Documentación interactiva
- Múltiples tags de organización
- Ejemplos de request/response
- Customización de UI
- Soporte para autenticación (JWT - comentado)

**Genera:**
- UI en `/api`
- JSON en `/api-json`

---

### config/main-with-swagger.ts

**Propósito:** Archivo main.ts completo con todas las configuraciones

**Incluye:**
- CORS configurado
- Validación global de DTOs
- Swagger/OpenAPI
- Logging mejorado
- Mensajes de startup bonitos
- Manejo de señales de terminación (SIGTERM, SIGINT)

---

## 📝 Orden de Implementación Recomendado

Si estás siguiendo la guía paso a paso:

### Iteración 1 (Semana 1-2)
1. ✅ Setup inicial (IT1-000)
2. ✅ Copiar `fallback.service.ts` (IT1-002)
3. ✅ Copiar tests (IT1-004)
4. ✅ Copiar `swagger-setup.ts` y `main-with-swagger.ts` (IT1-005)
5. ✅ Copiar `docker-compose.yml` (IT1-006)

### Iteración 2 (Semana 2-3)
6. ✅ Copiar `ollama.service.ts` (IT2-002)
7. ✅ Actualizar `docker-compose.yml` (ya tiene Ollama)

### Iteración 3 (Semana 3-4)
8. ✅ Copiar `groq.service.ts` (IT3-001)

---

## 🧪 Testing

### Ejecutar todos los tests:
```bash
npm run test
```

### Ejecutar con coverage:
```bash
npm run test:cov
```

### Ejecutar un test específico:
```bash
npm run test fallback.service
```

### Ver coverage en browser:
```bash
npm run test:cov
open coverage/lcov-report/index.html
```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@nestjs/swagger'"
```bash
npm install @nestjs/swagger swagger-ui-express
```

### Error: "Ollama connection refused"
```bash
# Verificar que Ollama esté corriendo
docker-compose ps

# Iniciar Ollama si está detenido
docker-compose up -d ollama

# Descargar modelo si no existe
docker-compose exec ollama ollama pull qwen2.5:0.5b
```

### Error: "Groq API key not configured"
```bash
# Agregar API key al .env
echo "GROQ_API_KEY=tu-api-key-aqui" >> .env

# Reiniciar backend
docker-compose restart backend
```

### Error en tests: "PrismaService not found"
```bash
# Generar Prisma Client
npx prisma generate

# Ejecutar tests de nuevo
npm run test
```

---

## 📚 Referencias

- **NestJS**: https://docs.nestjs.com/
- **Prisma**: https://www.prisma.io/docs
- **Ollama**: https://ollama.ai/
- **Groq**: https://console.groq.com/docs
- **Swagger**: https://docs.nestjs.com/openapi/introduction
- **Jest**: https://jestjs.io/docs/getting-started

---

## 🎓 Conceptos Cubiertos

Estos archivos demuestran:

- ✅ Dependency Injection en NestJS
- ✅ Servicios con lógica de negocio compleja
- ✅ Manejo de errores robusto
- ✅ Logging estructurado
- ✅ Testing con mocks
- ✅ Docker Compose multi-servicio
- ✅ Documentación automática con Swagger
- ✅ Variables de entorno
- ✅ Health checks
- ✅ Algoritmos de keyword matching
- ✅ Sistemas de fallback en cascada

---

## 💡 Próximos Pasos

Después de copiar estos archivos:

1. **Validar que todo compile:**
   ```bash
   npm run build
   ```

2. **Ejecutar tests:**
   ```bash
   npm run test
   ```

3. **Iniciar en desarrollo:**
   ```bash
   npm run start:dev
   ```

4. **Verificar Swagger:**
   - Abrir http://localhost:3001/api
   - Probar endpoints

5. **Continuar con la siguiente iteración**

---

**¡Estos archivos completan al 100% lo que faltaba en la guía!** 🎉

Ahora tienes todo el código necesario para recrear el proyecto desde cero.
