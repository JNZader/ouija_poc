# [IT1-000] Setup Inicial del Proyecto

## Descripción
Crear el proyecto NestJS desde cero con todas las configuraciones base necesarias. Esta es la **tarea 0** que debe ejecutarse antes de cualquier otra tarea de la Iteración 1.

## ¿Por qué es importante?
Sin un setup inicial correcto, el proyecto no compilará ni ejecutará. Este paso establece la estructura base del proyecto, las herramientas de desarrollo y las configuraciones esenciales.

## Requisitos Previos

### Software Requerido
- **Node.js**: >= 20.0.0 (LTS recomendado)
- **npm**: >= 10.0.0
- **Git**: Cualquier versión reciente
- **Editor**: VSCode recomendado (con extensiones ESLint y Prettier)

### Verificar Instalación
```bash
node --version    # Debe mostrar v20.x.x o superior
npm --version     # Debe mostrar 10.x.x o superior
git --version     # Cualquier versión
```

---

## Implementación Paso a Paso

### Paso 1: Crear Proyecto NestJS Base

```bash
# Instalar NestJS CLI globalmente
npm install -g @nestjs/cli

# Verificar instalación
nest --version

# Crear proyecto nuevo
nest new backend-simple

# Opciones que aparecerán:
# ? Which package manager would you ❤️ to use?
# → Seleccionar: npm

# Esperar instalación de dependencias (puede tomar 2-3 minutos)
```

**Resultado esperado:**
```
✔ Installation in progress... ☕
✔ Packages installed successfully.
👉 Get started with the following commands:

$ cd backend-simple
$ npm run start
```

---

### Paso 2: Navegar al Proyecto e Instalar Dependencias Adicionales

```bash
cd backend-simple

# Instalar dependencias de producción
npm install @prisma/client axios class-transformer class-validator rxjs reflect-metadata

# Instalar dependencias de desarrollo
npm install -D prisma ts-node @types/node

# Verificar package.json
cat package.json
```

**package.json resultante debe incluir:**
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "@prisma/client": "^5.0.0",
    "axios": "^1.6.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.0",
    "reflect-metadata": "^0.1.13",
    "rxjs": "^7.8.1"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.0.0",
    "@nestjs/schematics": "^10.0.0",
    "@types/express": "^4.17.17",
    "@types/node": "^20.3.1",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.42.0",
    "eslint-config-prettier": "^9.0.0",
    "eslint-plugin-prettier": "^5.0.0",
    "prettier": "^3.0.0",
    "prisma": "^5.0.0",
    "source-map-support": "^0.5.21",
    "ts-loader": "^9.4.3",
    "ts-node": "^10.9.1",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.1.3"
  }
}
```

---

### Paso 3: Configurar Prisma

```bash
# Inicializar Prisma con SQLite
npx prisma init --datasource-provider sqlite
```

**Resultado esperado:**
```
✔ Your Prisma schema was created at prisma/schema.prisma
  You can now open it in your favorite editor.

warn You already have a .gitignore file. Don't forget to add `.env` in it to not commit any private information.

Next steps:
1. Set the DATABASE_URL in the .env file to point to your existing database
2. Run prisma db pull to turn your database schema into a Prisma schema
3. Run prisma generate to generate the Prisma Client
```

**Modificar `prisma/schema.prisma`:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model FallbackResponse {
  id          String   @id @default(uuid())
  personality String   // 'wise' | 'cryptic' | 'dark' | 'playful'
  category    String   // 'love' | 'career' | 'health' | 'family' | 'death' | 'future' | 'money' | 'spirituality' | 'general'
  language    String   // 'es' | 'en'
  text        String
  keywords    String   // JSON array of keywords for matching
  createdAt   DateTime @default(now())

  @@index([personality, category, language])
}
```

**Modificar `.env`:**
```bash
DATABASE_URL="file:./dev.db"
```

---

### Paso 4: Crear Migración Inicial

```bash
# Crear primera migración
npx prisma migrate dev --name init

# Generar Prisma Client
npx prisma generate
```

**Resultado esperado:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": SQLite database "dev.db" at "file:./dev.db"

SQLite database dev.db created at file:./dev.db

Applying migration `20251017000000_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20251017000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (5.0.0 | library) to ./node_modules/@prisma/client
```

**Verificar base de datos creada:**
```bash
ls -la prisma/

# Debe mostrar:
# dev.db           ← Base de datos SQLite creada
# schema.prisma    ← Schema de Prisma
# migrations/      ← Carpeta de migraciones
```

---

### Paso 5: Crear Archivos de Configuración

#### 5.1. Archivo `.gitignore`

Crear/modificar `.gitignore` en la raíz del proyecto:

```gitignore
# compiled output
/dist
/node_modules

# Logs
logs
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# OS
.DS_Store

# Tests
/coverage
/.nyc_output

# IDEs and editors
/.idea
.project
.classpath
.c9/
*.launch
.settings/
*.sublime-workspace

# IDE - VSCode
.vscode/*
!.vscode/settings.json
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/extensions.json

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Database
*.db
*.db-journal
prisma/dev.db
prisma/dev.db-journal

# Build files
dist/
build/
```

#### 5.2. Archivo `.eslintrc.js` (OPCIONAL)

> ⚠️ **NOTA IMPORTANTE**: Este archivo es **OPCIONAL**. El proyecto funciona perfectamente sin él.
> NestJS ya incluye configuración básica de TypeScript que detecta la mayoría de errores.
> Solo créalo si quieres linting personalizado adicional.

**Si decides crearlo**, usar `.eslintrc.js` en la raíz:

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'tsconfig.json',
    tsconfigRootDir: __dirname,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint/eslint-plugin'],
  extends: [
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  root: true,
  env: {
    node: true,
    jest: true,
  },
  ignorePatterns: ['.eslintrc.js'],
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
  },
};
```

#### 5.3. Archivo `.prettierrc` (OPCIONAL)

> ⚠️ **NOTA IMPORTANTE**: Este archivo es **OPCIONAL**. Solo créalo si quieres formateo automático de código.
> Puedes formatear manualmente o usar la configuración por defecto de tu editor.

**Si decides crearlo**, usar `.prettierrc` en la raíz:

```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

#### 5.4. Archivo `.dockerignore`

Crear `.dockerignore` en la raíz:

```
node_modules
npm-debug.log
dist
.git
.gitignore
.env
.env.*
!.env.example
README.md
.vscode
.idea
coverage
.nyc_output
*.db
*.db-journal
```

#### 5.5. Archivo `.env.example`

Crear `.env.example` en la raíz:

```bash
# ==============================================
# OUIJA VIRTUAL - Backend Simple Configuration
# ==============================================

# -----------------
# Server
# -----------------
PORT=3001
NODE_ENV=development

# -----------------
# Database (SQLite)
# -----------------
DATABASE_URL="file:./prisma/dev.db"

# -----------------
# AI Configuration (Triple Fallback)
# -----------------

# LEVEL 1: Ollama (Primary)
# Local development: http://localhost:11434
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b

# LEVEL 2: Groq API (Fallback 1)
# Get your API key from: https://console.groq.com/keys
GROQ_API_KEY=
GROQ_MODEL=llama-3.1-8b-instant

# LEVEL 3: Database fallback is always available (no config needed)

# -----------------
# CORS Configuration
# -----------------
CORS_ORIGINS=http://localhost,http://localhost:80,http://localhost:5173,http://localhost:3000

# -----------------
# Rate Limiting
# -----------------
RATE_LIMIT_TTL=60000
RATE_LIMIT_MAX=10

# -----------------
# Logging
# -----------------
LOG_LEVEL=debug
```

---

### Paso 6: Modificar Scripts en package.json

Añadir scripts de Prisma en `package.json`:

```json
{
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio",
    "prisma:seed": "ts-node prisma/seed.ts",
    "prisma:reset": "prisma migrate reset"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

---

### Paso 7: Crear Estructura de Módulos Base

```bash
# Crear carpetas de módulos
mkdir -p src/modules/ouija/services
mkdir -p src/modules/ouija/dto
mkdir -p src/prisma

# Crear archivos base (vacíos por ahora)
touch src/modules/ouija/ouija.module.ts
touch src/modules/ouija/ouija.controller.ts
touch src/modules/ouija/ouija.service.ts
touch src/modules/ouija/dto/ouija-question.dto.ts
touch src/prisma/prisma.module.ts
touch src/prisma/prisma.service.ts
```

**Estructura resultante:**
```
src/
├── app.module.ts
├── main.ts
├── modules/
│   └── ouija/
│       ├── ouija.module.ts
│       ├── ouija.controller.ts
│       ├── ouija.service.ts
│       ├── dto/
│       │   └── ouija-question.dto.ts
│       └── services/
│           (vacío por ahora - se llenarán en IT1-002)
└── prisma/
    ├── prisma.module.ts
    └── prisma.service.ts
```

---

### Paso 8: Implementar PrismaService

**Crear `src/prisma/prisma.service.ts`:**

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

**Crear `src/prisma/prisma.module.ts`:**

```typescript
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

---

### Paso 9: Actualizar app.module.ts

**Modificar `src/app.module.ts`:**

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

---

### Paso 10: Actualizar main.ts con CORS y Validación

**Modificar `src/main.ts`:**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost', 'http://localhost:80', 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🔮 Ouija Virtual Backend running on port ${port}`);
}

bootstrap();
```

---

### Paso 11: Verificar Compilación

```bash
# Compilar proyecto
npm run build

# Resultado esperado:
# ✔ Successfully compiled!
```

```bash
# Ejecutar en modo desarrollo
npm run start:dev

# Resultado esperado:
# [Nest] 12345  - 10/17/2024, 12:00:00 PM     LOG [NestFactory] Starting Nest application...
# [Nest] 12345  - 10/17/2024, 12:00:00 PM     LOG [InstanceLoader] PrismaModule dependencies initialized
# [Nest] 12345  - 10/17/2024, 12:00:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
# [Nest] 12345  - 10/17/2024, 12:00:00 PM     LOG [NestApplication] Nest application successfully started
# 🔮 Ouija Virtual Backend running on port 3001
```

**Probar servidor:**
```bash
curl http://localhost:3001
# Debe retornar: {"statusCode":404,"message":"Cannot GET /"}
# (Es normal, no hay rutas definidas todavía)
```

---

## Archivos Creados/Modificados

### Archivos Creados:
- ✏️ `backend-simple/` (directorio completo del proyecto)
- ✏️ `prisma/schema.prisma`
- ✏️ `prisma/migrations/XXXXXX_init/migration.sql`
- ✏️ `prisma/dev.db`
- ✏️ `.gitignore`
- ✏️ `.dockerignore`
- ✏️ `.eslintrc.js`
- ✏️ `.prettierrc`
- ✏️ `.env`
- ✏️ `.env.example`
- ✏️ `src/prisma/prisma.service.ts`
- ✏️ `src/prisma/prisma.module.ts`
- ✏️ `src/modules/ouija/` (estructura de carpetas)

### Archivos Modificados:
- 📝 `package.json` (scripts de Prisma)
- 📝 `src/app.module.ts` (importar PrismaModule)
- 📝 `src/main.ts` (CORS y validación)

---

## Validación del Setup

### Checklist de Verificación:

#### ✅ Requisitos Mínimos (Obligatorios)

- [ ] `node --version` muestra v20.x.x o superior
- [ ] `npm --version` muestra 10.x.x o superior
- [ ] `nest --version` funciona correctamente
- [ ] Proyecto `backend-simple/` creado
- [ ] `npm install` completado sin errores
- [ ] `npx prisma migrate dev --name init` ejecutado exitosamente
- [ ] `npx prisma generate` completado sin errores
- [ ] Archivo `prisma/dev.db` existe
- [ ] `.gitignore` contiene `*.db` y `.env`
- [ ] `.env.example` creado con todas las variables
- [ ] `npm run build` compila sin errores
- [ ] `npm run start:dev` inicia el servidor
- [ ] `curl http://localhost:3001` retorna respuesta (aunque sea 404)
- [ ] `npx prisma studio` abre la UI de Prisma
- [ ] Tabla `FallbackResponse` visible en Prisma Studio (vacía)

#### 📋 Opcionales (Recomendados pero no críticos)

- [ ] `.eslintrc.js` creado (si quieres linting personalizado)
- [ ] `.prettierrc` creado (si quieres formateo automático)
- [ ] `npm run lint` funciona (si creaste .eslintrc.js)
- [ ] `npm run format` funciona (si creaste .prettierrc)

---

## Testing del Setup

```bash
# Test 1: Verificar compilación
npm run build
# ✅ Debe completar sin errores

# Test 2: Verificar linter
npm run lint
# ✅ Debe completar sin errores

# Test 3: Verificar formato
npm run format
# ✅ Debe formatear archivos

# Test 4: Verificar Prisma
npx prisma studio
# ✅ Debe abrir navegador en http://localhost:5555

# Test 5: Verificar servidor
npm run start:dev
# ✅ Debe mostrar "🔮 Ouija Virtual Backend running on port 3001"
```

---

## Troubleshooting Común

### Error: "Cannot find module '@nestjs/cli'"
**Solución:**
```bash
npm install -g @nestjs/cli
```

### Error: "Prisma Client has not been generated yet"
**Solución:**
```bash
npx prisma generate
```

### Error: "Port 3001 is already in use"
**Solución (Linux/Mac):**
```bash
lsof -ti:3001 | xargs kill -9
```

**Solución (Windows):**
```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Error: "Cannot find module '@prisma/client'"
**Solución:**
```bash
npm install @prisma/client
npx prisma generate
```

### Error: "Migration failed"
**Solución:**
```bash
# Borrar base de datos y empezar de nuevo
rm prisma/dev.db
npx prisma migrate dev --name init
```

---

## Criterios de Aceptación

- [ ] Proyecto NestJS creado correctamente
- [ ] Todas las dependencias instaladas
- [ ] Prisma configurado con SQLite
- [ ] Migración inicial ejecutada
- [ ] Archivos de configuración creados (.eslintrc, .prettierrc, .gitignore)
- [ ] PrismaService implementado y funcional
- [ ] Estructura de módulos creada
- [ ] CORS y validación configurados
- [ ] Servidor compila sin errores
- [ ] Servidor inicia correctamente en puerto 3001
- [ ] Linter y formatter funcionan
- [ ] Prisma Studio accesible

---

## Estimación
**2 puntos** (~1-2 horas)

**Desglose:**
- 15 min: Instalar NestJS CLI y crear proyecto
- 15 min: Instalar dependencias adicionales
- 20 min: Configurar Prisma y crear migración
- 30 min: Crear archivos de configuración
- 20 min: Implementar PrismaService
- 10 min: Crear estructura de módulos
- 10 min: Testing y validación

---

## Dependencias
Ninguna (esta es la tarea inicial)

---

## Siguiente Tarea
[IT1-001: Crear Seed de Datos SQLite](./TAREAS.md#it1-001-crear-seed-de-datos-sqlite)

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
