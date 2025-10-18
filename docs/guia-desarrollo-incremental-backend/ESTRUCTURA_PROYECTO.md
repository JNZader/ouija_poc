# Estructura Completa del Proyecto - Backend Simple

## Vista General del Proyecto

Este documento describe la estructura completa de carpetas y archivos del proyecto `backend-simple` al finalizar todas las iteraciones.

---

## Estructura de Carpetas Completa

```
backend-simple/
│
├── src/                                    # Código fuente TypeScript
│   ├── main.ts                             # Punto de entrada de la aplicación
│   ├── app.module.ts                       # Módulo raíz de la aplicación
│   │
│   ├── prisma/                             # Módulo de Prisma (Global)
│   │   ├── prisma.module.ts                # Módulo de Prisma
│   │   └── prisma.service.ts               # Servicio de Prisma (conexión DB)
│   │
│   ├── modules/                            # Módulos de funcionalidad
│   │   │
│   │   ├── ouija/                          # Módulo principal de Ouija
│   │   │   ├── ouija.module.ts             # Módulo de Ouija
│   │   │   ├── ouija.controller.ts         # Controlador REST
│   │   │   ├── ouija.service.ts            # Servicio principal (orquestación)
│   │   │   │
│   │   │   ├── dto/                        # Data Transfer Objects
│   │   │   │   ├── ouija-question.dto.ts   # DTO para preguntas
│   │   │   │   └── ouija-response.dto.ts   # DTO para respuestas
│   │   │   │
│   │   │   └── services/                   # Servicios especializados
│   │   │       ├── ollama.service.ts       # Integración con Ollama
│   │   │       ├── groq.service.ts         # Integración con Groq API
│   │   │       ├── prompts.service.ts      # Generación de prompts
│   │   │       └── fallback.service.ts     # Servicio de fallback SQLite
│   │   │
│   │   └── health/                         # Módulo de salud del sistema
│   │       ├── health.module.ts            # Módulo de health checks
│   │       └── health.controller.ts        # Controlador de /health
│   │
│   └── common/                             # Código compartido (opcional)
│       ├── filters/                        # Filtros de excepción
│       ├── guards/                         # Guards de autenticación
│       ├── interceptors/                   # Interceptores HTTP
│       └── pipes/                          # Pipes de validación
│
├── prisma/                                 # Configuración de Prisma
│   ├── schema.prisma                       # Esquema de base de datos
│   ├── seed.ts                             # Script de seed de datos
│   ├── dev.db                              # Base de datos SQLite (desarrollo)
│   └── migrations/                         # Migraciones de base de datos
│       └── 20251017000000_init/            # Migración inicial
│           └── migration.sql               # SQL de migración
│
├── test/                                   # Tests end-to-end
│   ├── app.e2e-spec.ts                     # Test E2E de la aplicación
│   └── jest-e2e.json                       # Configuración Jest E2E
│
├── dist/                                   # Archivos compilados (generados)
│   ├── main.js                             # Entry point compilado
│   └── ...                                 # Resto del código compilado
│
├── node_modules/                           # Dependencias npm (no versionar)
│
├── .vscode/                                # Configuración VSCode (opcional)
│   ├── settings.json                       # Configuraciones del editor
│   └── launch.json                         # Configuración de debugging
│
├── .env                                    # Variables de entorno (local, NO VERSIONAR)
├── .env.example                            # Ejemplo de variables de entorno
├── .env.development                        # Variables para desarrollo
├── .env.production                         # Variables para producción
│
├── .gitignore                              # Archivos ignorados por Git
├── .dockerignore                           # Archivos ignorados por Docker
├── .eslintrc.js                            # Configuración ESLint
├── .prettierrc                             # Configuración Prettier
│
├── Dockerfile                              # Dockerfile para producción (multi-stage)
├── docker-compose.yml                      # Docker Compose para desarrollo local
├── docker-entrypoint.sh                    # Script de inicio para Docker
│
├── package.json                            # Dependencias y scripts npm
├── package-lock.json                       # Lockfile de npm
│
├── tsconfig.json                           # Configuración TypeScript
├── tsconfig.build.json                     # Configuración TypeScript para build
├── nest-cli.json                           # Configuración NestJS CLI
│
├── README.md                               # Documentación del proyecto
├── DEPLOYMENT.md                           # Guía de deployment
└── GUIA-ITERACIONES.md                     # Resumen de iteraciones realizadas
```

---

## Descripción de Carpetas Principales

### `/src` - Código Fuente

Contiene todo el código TypeScript de la aplicación.

**Archivos principales:**
- `main.ts`: Punto de entrada, configura CORS, validación, puerto
- `app.module.ts`: Módulo raíz que importa todos los submódulos

**Subcarpetas:**
- `prisma/`: Servicio global de conexión a la base de datos
- `modules/`: Módulos de funcionalidad (Ouija, Health)
- `common/`: Código compartido entre módulos (guards, filters, etc.)

---

### `/src/modules/ouija` - Módulo Principal

Implementa toda la lógica de la Ouija Virtual.

**Arquitectura:**
```
ouija.controller.ts  →  ouija.service.ts  →  [ollama|groq|fallback].service.ts
       ↓                      ↓                           ↓
  (Endpoints)         (Orquestación)              (Implementación)
```

**Flujo de una petición:**
1. `POST /ouija/ask` → `ouija.controller.ts`
2. Controller llama a `ouija.service.ts`
3. Service intenta:
   - Primero: `groq.service.ts`
   - Fallback 1: `ollama.service.ts`
   - Fallback 2: `fallback.service.ts` (SQLite)
4. Respuesta procesada y retornada al cliente

---

### `/prisma` - Base de Datos

Contiene configuración de Prisma ORM y la base de datos SQLite.

**Archivos clave:**
- `schema.prisma`: Define modelos y relaciones
- `seed.ts`: Script para poblar la DB con datos iniciales
- `dev.db`: Base de datos SQLite (solo desarrollo)
- `migrations/`: Historial de cambios en el schema

**Comandos útiles:**
```bash
npx prisma studio          # Abrir UI de base de datos
npx prisma migrate dev     # Crear nueva migración
npx prisma generate        # Generar Prisma Client
npm run prisma:seed        # Ejecutar seed
```

---

### `/test` - Tests

Contiene tests end-to-end (E2E) de la aplicación.

**Nota:** Los tests unitarios están en la misma carpeta que el código:
```
src/modules/ouija/ouija.service.ts
src/modules/ouija/ouija.service.spec.ts  ← Test unitario
```

---

### Archivos de Configuración Raíz

#### Variables de Entorno

| Archivo | Propósito | Versionar |
|---------|-----------|-----------|
| `.env` | Variables locales personales | ❌ NO |
| `.env.example` | Ejemplo de variables | ✅ SÍ |
| `.env.development` | Variables para desarrollo | ✅ SÍ |
| `.env.production` | Variables para producción | ✅ SÍ |

#### Linting y Formato

| Archivo | Propósito |
|---------|-----------|
| `.eslintrc.js` | Reglas de linting (detecta errores) |
| `.prettierrc` | Reglas de formato (estilo de código) |

#### Docker

| Archivo | Propósito |
|---------|-----------|
| `Dockerfile` | Build multi-stage para producción |
| `docker-compose.yml` | Desarrollo local (backend + Ollama) |
| `.dockerignore` | Archivos excluidos del build Docker |

#### TypeScript

| Archivo | Propósito |
|---------|-----------|
| `tsconfig.json` | Configuración base de TypeScript |
| `tsconfig.build.json` | Configuración para compilar (extiende la base) |

---

## Estructura por Iteración

### Al finalizar Iteración 1 (SQLite Funcional)

```
backend-simple/
├── src/
│   ├── main.ts                     ✅
│   ├── app.module.ts               ✅
│   ├── prisma/                     ✅
│   ├── modules/
│   │   ├── ouija/
│   │   │   ├── ouija.module.ts     ✅
│   │   │   ├── ouija.controller.ts ✅
│   │   │   ├── ouija.service.ts    ✅
│   │   │   ├── dto/                ✅
│   │   │   └── services/
│   │   │       ├── prompts.service.ts  ✅
│   │   │       └── fallback.service.ts ✅ (NUEVO)
│   │   └── health/                 ✅ (NUEVO)
│   │       ├── health.module.ts    ✅
│   │       └── health.controller.ts ✅
├── prisma/
│   ├── schema.prisma               ✅
│   ├── seed.ts                     ✅ (NUEVO - 50+ respuestas)
│   └── dev.db                      ✅ (poblada con seed)
├── .env.example                    ✅
├── Dockerfile                      ✅
└── docker-compose.yml              ✅ (NUEVO - solo backend)
```

**Nuevos servicios:**
- `FallbackService`: Consulta SQLite con keyword matching
- `HealthController`: Endpoint `/health` con diagnóstico

---

### Al finalizar Iteración 2 (+ Ollama Local)

```diff
backend-simple/
├── src/modules/ouija/services/
│   ├── prompts.service.ts
│   ├── fallback.service.ts
+   └── ollama.service.ts           ✅ (MEJORADO - retry logic)
├── docker-compose.yml              ✅ (ACTUALIZADO - + Ollama)
└── scripts/
+   └── download-models.sh          ✅ (NUEVO)
```

**Cambios principales:**
- `docker-compose.yml`: Añade servicio Ollama
- `OllamaService`: Mejorado con circuit breaker y retry
- Script para descargar modelos de Ollama

---

### Al finalizar Iteración 3 (+ Groq Cloud)

```diff
backend-simple/
├── src/modules/ouija/services/
│   ├── prompts.service.ts
│   ├── fallback.service.ts
│   ├── ollama.service.ts
+   └── groq.service.ts              ✅ (MEJORADO - rate limiting)
├── src/modules/
+   └── dashboard/                   ✅ (NUEVO)
+       ├── dashboard.module.ts
+       └── dashboard.controller.ts
```

**Nuevos endpoints:**
- `GET /dashboard`: Métricas y estadísticas
- Sistema de rate limiting implementado

---

### Al finalizar Iteración 4 (Producción)

```diff
backend-simple/
+├── .github/
+│   └── workflows/
+│       └── deploy.yml              ✅ (NUEVO - CI/CD)
├── Dockerfile                       ✅ (MEJORADO - multi-stage)
+├── docker-entrypoint.sh            ✅ (NUEVO)
+├── DEPLOYMENT.md                   ✅ (NUEVO - guía de deploy)
+└── koyeb.yaml                      ✅ (NUEVO - config Koyeb)
```

**Archivos para producción:**
- Dockerfile optimizado para Koyeb
- GitHub Actions para CI/CD
- Documentación de deployment

---

## Tamaño Aproximado del Proyecto

### Por Número de Archivos

| Tipo | Cantidad | Tamaño Aprox. |
|------|----------|---------------|
| Archivos `.ts` (código) | ~20 | ~15 KB total |
| Archivos `.spec.ts` (tests) | ~10 | ~8 KB total |
| Archivos de configuración | ~10 | ~5 KB total |
| Base de datos `dev.db` | 1 | ~20 KB |
| `node_modules/` | ~1500 | ~150 MB |
| **TOTAL (sin node_modules)** | ~40 | **~50 KB** |
| **TOTAL (con node_modules)** | ~1550 | **~150 MB** |

---

## Archivos Críticos a NO Versionar

Estos archivos **NUNCA** deben subirse a Git:

```gitignore
# Variables de entorno sensibles
.env                    ← Contiene API keys y secretos

# Base de datos local
*.db
*.db-journal
prisma/dev.db

# Dependencias
node_modules/

# Archivos compilados
dist/
build/

# Logs
*.log
```

**¿Por qué?**
- `.env`: Contiene secretos (API keys, passwords)
- `*.db`: Base de datos local con datos de desarrollo
- `node_modules/`: Demasiado grande, se regenera con `npm install`
- `dist/`: Código compilado, se regenera con `npm run build`

---

## Archivos Críticos a SÍ Versionar

Estos archivos **SÍ** deben estar en Git:

```
✅ .env.example          ← Ejemplo sin secretos
✅ prisma/schema.prisma  ← Schema de DB
✅ prisma/seed.ts        ← Script de seed
✅ prisma/migrations/    ← Migraciones (historial de DB)
✅ src/**/*.ts           ← Todo el código fuente
✅ package.json          ← Dependencias del proyecto
✅ Dockerfile            ← Configuración Docker
✅ .eslintrc.js          ← Configuración de linting
✅ README.md             ← Documentación
```

---

## Convenciones de Nombres

### Archivos TypeScript

```
kebab-case.type.ts
```

**Ejemplos:**
- `ouija.service.ts` - Servicio
- `ouija.controller.ts` - Controlador
- `ouija.module.ts` - Módulo
- `ouija-question.dto.ts` - Data Transfer Object
- `ouija.service.spec.ts` - Test unitario

### Clases TypeScript

```
PascalCase
```

**Ejemplos:**
- `class OuijaService { ... }`
- `class OuijaController { ... }`
- `class OuijaQuestionDto { ... }`

### Variables y Funciones

```
camelCase
```

**Ejemplos:**
- `const questionCache = new Map();`
- `async processQuestion() { ... }`

---

## Rutas de Importación

### Imports Absolutos (Recomendado)

```typescript
// ✅ BIEN (absoluto desde src/)
import { PrismaService } from '@/prisma/prisma.service';
import { OllamaService } from '@/modules/ouija/services/ollama.service';
```

### Imports Relativos

```typescript
// ✅ ACEPTABLE (relativo)
import { PrismaService } from '../../prisma/prisma.service';
import { OllamaService } from './services/ollama.service';
```

**Configuración en `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

---

## Navegación Rápida

### Archivos más Importantes

| Archivo | Ubicación | Descripción |
|---------|-----------|-------------|
| Entry Point | `src/main.ts` | Punto de entrada de la app |
| Módulo Raíz | `src/app.module.ts` | Importa todos los módulos |
| Controlador Principal | `src/modules/ouija/ouija.controller.ts` | Endpoints REST |
| Servicio Principal | `src/modules/ouija/ouija.service.ts` | Lógica de negocio |
| Fallback Service | `src/modules/ouija/services/fallback.service.ts` | Consultas SQLite |
| Schema DB | `prisma/schema.prisma` | Modelos de base de datos |
| Seed DB | `prisma/seed.ts` | Datos iniciales |
| Variables Env | `.env.example` | Configuración del proyecto |

### Comandos más Usados

```bash
# Desarrollo
npm run start:dev         # Iniciar en modo desarrollo (hot reload)
npm run build             # Compilar TypeScript
npm run lint              # Verificar código con ESLint
npm run format            # Formatear código con Prettier

# Prisma
npx prisma studio         # Abrir UI de base de datos
npm run prisma:seed       # Ejecutar seed
npx prisma generate       # Generar Prisma Client

# Testing
npm run test              # Tests unitarios
npm run test:cov          # Tests con coverage
npm run test:e2e          # Tests end-to-end

# Docker
docker-compose up         # Levantar todo (backend + Ollama)
docker-compose logs -f    # Ver logs en tiempo real
docker-compose down       # Detener todo
```

---

## Resumen Visual

```
backend-simple/
│
├── 🔹 CÓDIGO (src/)
│   ├── 🎯 Entry Point (main.ts)
│   ├── 📦 Módulos (modules/)
│   └── 🔌 Servicios (services/)
│
├── 💾 BASE DE DATOS (prisma/)
│   ├── 📋 Schema (schema.prisma)
│   ├── 🌱 Seed (seed.ts)
│   └── 🗄️ SQLite (dev.db)
│
├── 🧪 TESTS (test/ + *.spec.ts)
│
├── ⚙️ CONFIGURACIÓN
│   ├── 🔐 Variables (.env*)
│   ├── 🎨 Linting (.eslintrc.js)
│   ├── 📝 Formato (.prettierrc)
│   └── 🐳 Docker (Dockerfile, docker-compose.yml)
│
└── 📚 DOCUMENTACIÓN
    ├── README.md
    ├── DEPLOYMENT.md
    └── GUIA-ITERACIONES.md
```

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
