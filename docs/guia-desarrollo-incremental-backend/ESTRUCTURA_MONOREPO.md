# Estructura del Monorepo - Ouija Virtual

## 📋 Índice

1. [¿Qué es un Monorepo?](#qué-es-un-monorepo)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Diferencias: backend vs backend-simple](#diferencias-backend-vs-backend-simple)
4. [Ubicación de Archivos de Configuración](#ubicación-de-archivos-de-configuración)
5. [Docker Compose: ¿Dónde va?](#docker-compose-dónde-va)
6. [Workflows de Desarrollo](#workflows-de-desarrollo)
7. [Best Practices](#best-practices)

---

## ¿Qué es un Monorepo?

Un **monorepo** (monolithic repository) es un único repositorio Git que contiene múltiples proyectos relacionados.

### Ventajas

✅ **Código compartido**: Fácil compartir código entre frontend y backend
✅ **Versionado unificado**: Una sola fuente de verdad
✅ **Refactoring sencillo**: Cambios que afectan múltiples proyectos
✅ **CI/CD simplificado**: Un pipeline para todo

### Desventajas

⚠️ **Complejidad**: Más difícil de navegar para nuevos desarrolladores
⚠️ **Build times**: Puede ser lento si no se optimiza
⚠️ **Permisos**: Todos tienen acceso a todo el código

---

## Arquitectura del Proyecto

### Estructura Completa

```
ouija-virtual/                          ← RAÍZ DEL MONOREPO
│
├── .git/                               ← Git repository
├── .github/                            ← GitHub configuration
│   └── workflows/
│       └── deploy.yml                  ← CI/CD pipeline (deployea backend-simple)
│
├── frontend/                           ← Frontend React + TypeScript
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── nginx.conf
│
├── backend/                            ← Backend COMPLETO (NestJS modular)
│   ├── src/
│   │   ├── modules/
│   │   │   ├── ouija/
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   └── ...
│   │   ├── prisma/
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma               ← Schema COMPLETO (PostgreSQL)
│   │   └── migrations/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
│
├── backend-simple/                     ← Backend SIMPLIFICADO (esta guía)
│   ├── src/
│   │   ├── modules/
│   │   │   └── ouija/                  ← SOLO módulo Ouija
│   │   ├── prisma/
│   │   └── main.ts
│   ├── prisma/
│   │   ├── schema.prisma               ← Schema SIMPLE (SQLite)
│   │   └── migrations/
│   ├── package.json
│   ├── Dockerfile
│   ├── docker-entrypoint.sh            ← Script de inicio
│   ├── koyeb.yaml                      ← Config de deployment
│   └── .env.example
│
├── docs/                               ← Documentación general
│   ├── architecture.md
│   ├── api-docs.md
│   └── ...
│
├── guia-desarrollo-incremental-backend/ ← ESTA GUÍA
│   ├── LEEME_PRIMERO.md
│   ├── ESTRUCTURA_PROYECTO.md
│   ├── ESTRUCTURA_MONOREPO.md          ← Este archivo
│   ├── iteracion-1/
│   ├── iteracion-2/
│   ├── iteracion-3/
│   └── iteracion-4/
│
├── docker-compose.yml                  ← Docker Compose GLOBAL
├── .gitignore                          ← Gitignore GLOBAL
├── package.json                        ← (Opcional) Root package.json
└── README.md                           ← README principal del monorepo
```

---

## Diferencias: backend vs backend-simple

### backend/ (Completo)

**Propósito**: Backend completo con todas las features

**Características**:
- 🔐 Autenticación y autorización
- 👥 Gestión de usuarios
- 💾 PostgreSQL como base de datos
- 📊 Dashboard avanzado
- 🔄 Múltiples módulos
- 🧪 Tests completos
- 📝 Documentación extensa

**Ideal para**:
- Aplicación en producción a largo plazo
- Equipos grandes
- Features complejas

**Estructura**:
```
backend/src/modules/
├── auth/           ← Autenticación JWT
├── users/          ← CRUD de usuarios
├── ouija/          ← Lógica de Ouija
├── dashboard/      ← Métricas y analytics
└── ...
```

---

### backend-simple/ (Simplificado)

**Propósito**: Versión minimalista para aprender y MVPs

**Características**:
- ✅ SOLO lógica de Ouija
- ✅ SQLite como base de datos
- ✅ Sin autenticación
- ✅ Sin usuarios
- ✅ Deployment simple
- ✅ Ideal para aprender

**Ideal para**:
- Aprendizaje de NestJS
- Prototipos rápidos
- MVPs
- **Esta guía incremental**

**Estructura**:
```
backend-simple/src/modules/
└── ouija/          ← SOLO Ouija (triple fallback)
```

---

## Comparación Lado a Lado

| Aspecto | backend/ | backend-simple/ |
|---------|----------|-----------------|
| **Base de datos** | PostgreSQL | SQLite |
| **Autenticación** | ✅ JWT | ❌ No |
| **Usuarios** | ✅ CRUD completo | ❌ No |
| **Módulos** | Múltiples | Solo Ouija |
| **Complejidad** | Alta | Baja |
| **Ideal para** | Producción | Aprendizaje/MVP |
| **Deployment** | Complejo | Simple (Koyeb) |
| **Esta guía** | ❌ No | ✅ **SÍ** |

---

## Ubicación de Archivos de Configuración

### Archivos GLOBALES (raíz del monorepo)

Estos archivos afectan a TODO el monorepo:

```
ouija-virtual/
├── .gitignore                          ← Ignora node_modules, .env, etc. de TODO
├── .github/workflows/deploy.yml        ← CI/CD que deployea backend-simple
├── docker-compose.yml                  ← Levanta frontend + backend + Ollama
├── README.md                           ← Documentación general
└── package.json                        ← (Opcional) Scripts globales
```

**¿Por qué en la raíz?**
- `.gitignore`: Evita duplicar reglas en cada proyecto
- `.github/workflows/`: GitHub Actions busca aquí por defecto
- `docker-compose.yml`: Orquesta TODOS los servicios
- `README.md`: Primera impresión del repo

---

### Archivos ESPECÍFICOS (backend-simple/)

Estos archivos son SOLO para `backend-simple`:

```
backend-simple/
├── .env.example                        ← Variables de entorno específicas
├── .env.development                    ← Desarrollo local
├── .env.production                     ← Producción
├── Dockerfile                          ← Build de este backend
├── docker-entrypoint.sh                ← Script de inicio
├── koyeb.yaml                          ← Config de Koyeb
├── package.json                        ← Dependencias específicas
├── tsconfig.json                       ← Config TypeScript
└── nest-cli.json                       ← Config NestJS CLI
```

**¿Por qué en backend-simple/?**
- Son específicos de este proyecto
- No afectan al `backend/` completo
- Permiten configuraciones independientes

---

### Archivos ESPECÍFICOS (backend/)

Igual estructura que `backend-simple/` pero con configuraciones diferentes:

```
backend/
├── .env.example                        ← Diferentes variables (PostgreSQL, etc.)
├── Dockerfile                          ← Build diferente
├── package.json                        ← Diferentes dependencias
└── ...
```

---

## Docker Compose: ¿Dónde va?

### Opción 1: docker-compose.yml en la RAÍZ (Recomendado)

**Ubicación**: `ouija-virtual/docker-compose.yml`

**Propósito**: Orquestar TODOS los servicios del monorepo

**Ejemplo**:

```yaml
# ouija-virtual/docker-compose.yml
version: '3.8'

services:
  # Frontend
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
    depends_on:
      - backend-simple

  # Backend Simple
  backend-simple:
    build:
      context: ./backend-simple
      dockerfile: Dockerfile
    ports:
      - "3001:3000"
    environment:
      - OLLAMA_URL=http://ollama:11434
    depends_on:
      - ollama

  # Ollama (IA local)
  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama-data:/root/.ollama

volumes:
  ollama-data:
```

**Ventajas**:
- ✅ Levantar todo el stack con un solo comando
- ✅ Networking automático entre servicios
- ✅ Fácil para desarrollo local

**Comandos**:
```bash
# Desde la raíz del monorepo
docker-compose up

# Acceder
http://localhost         ← Frontend
http://localhost:3001    ← Backend Simple
http://localhost:11434   ← Ollama
```

---

### Opción 2: docker-compose.yml en backend-simple/

**Ubicación**: `backend-simple/docker-compose.yml`

**Propósito**: Solo para desarrollo de backend-simple aislado

**Ejemplo**:

```yaml
# backend-simple/docker-compose.yml
version: '3.8'

services:
  # Solo Backend + Ollama
  backend:
    build: .
    ports:
      - "3000:3000"
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
```

**Ventajas**:
- ✅ Desarrollo aislado del resto del monorepo
- ✅ Más rápido (solo levanta lo necesario)

**Comandos**:
```bash
# Desde backend-simple/
docker-compose up
```

---

### ¿Cuál usar?

| Escenario | Recomendación |
|-----------|---------------|
| **Desarrollo full-stack** | `ouija-virtual/docker-compose.yml` (raíz) |
| **Solo backend** | `backend-simple/docker-compose.yml` |
| **Producción** | Ni uno ni otro (usar Koyeb/Vercel separados) |
| **Esta guía** | Ambos (explicar las dos opciones) |

---

## Workflows de Desarrollo

### Workflow 1: Desarrollo Full-Stack

```bash
# 1. Clonar monorepo
git clone https://github.com/tu-usuario/ouija-virtual.git
cd ouija-virtual

# 2. Levantar todo con Docker Compose
docker-compose up

# 3. Acceder a los servicios
# Frontend: http://localhost
# Backend: http://localhost:3001
# Ollama: http://localhost:11434
```

---

### Workflow 2: Desarrollo Solo Backend Simple

```bash
# 1. Clonar monorepo
git clone https://github.com/tu-usuario/ouija-virtual.git
cd ouija-virtual/backend-simple

# 2. Instalar dependencias
npm install

# 3. Setup base de datos
npx prisma generate
npm run prisma:seed

# 4. Levantar en desarrollo
npm run start:dev

# O con Docker Compose local
docker-compose up  # Si existe backend-simple/docker-compose.yml
```

---

### Workflow 3: Deployment (CI/CD)

```bash
# 1. Push a main
git push origin main

# 2. GitHub Actions se activa automáticamente
# .github/workflows/deploy.yml

# 3. Deployea backend-simple a Koyeb
# Ver: https://github.com/tu-usuario/ouija-virtual/actions
```

---

## Best Practices

### 1. Separación de Concerns

✅ **BIEN**:
```
ouija-virtual/
├── frontend/          ← Solo código de frontend
├── backend-simple/    ← Solo código de backend simple
└── docs/              ← Solo documentación
```

❌ **MAL**:
```
ouija-virtual/
├── src/               ← Mezclado frontend + backend
├── components/        ← ¿Frontend o backend?
└── utils/             ← Compartido pero sin estructura
```

---

### 2. Gitignore Jerárquico

**Global** (`ouija-virtual/.gitignore`):
```gitignore
# Ignorar node_modules en TODO el monorepo
node_modules/
dist/
.env
```

**Específico** (`backend-simple/.gitignore`):
```gitignore
# Específico de backend-simple
*.db
*.db-journal
```

---

### 3. Variables de Entorno

**NO** compartir `.env` entre proyectos:

```
ouija-virtual/
├── frontend/.env.example           ← Variables de frontend
├── backend/.env.example            ← Variables de backend completo
└── backend-simple/.env.example     ← Variables de backend simple
```

**Cada `.env.example` debe documentar SUS variables**:

```bash
# frontend/.env.example
VITE_API_URL=http://localhost:3001
VITE_APP_NAME=Ouija Virtual

# backend-simple/.env.example
DATABASE_URL=file:./dev.db
GROQ_API_KEY=your_key_here
OLLAMA_URL=http://localhost:11434
```

---

### 4. Scripts en package.json

**Root** `ouija-virtual/package.json`:
```json
{
  "scripts": {
    "install:all": "npm install && cd frontend && npm install && cd ../backend-simple && npm install",
    "dev:all": "docker-compose up",
    "build:all": "cd frontend && npm run build && cd ../backend-simple && npm run build"
  }
}
```

**Específico** `backend-simple/package.json`:
```json
{
  "scripts": {
    "start:dev": "nest start --watch",
    "build": "nest build",
    "prisma:seed": "ts-node prisma/seed.ts"
  }
}
```

---

### 5. Documentación Clara

Cada proyecto debe tener su propio README:

```
ouija-virtual/
├── README.md                          ← Overview del monorepo
├── frontend/README.md                 ← Cómo correr frontend
├── backend/README.md                  ← Cómo correr backend completo
└── backend-simple/README.md           ← Cómo correr backend simple
```

---

## Navegación Rápida

### Desde la Raíz

```bash
# Ir a frontend
cd frontend

# Ir a backend simple
cd backend-simple

# Ir a documentación
cd guia-desarrollo-incremental-backend

# Volver a raíz
cd ..  # O: cd ~/ouija-virtual
```

---

### Comandos Útiles

```bash
# Ver estructura completa
tree -L 2 -I 'node_modules|dist'

# Buscar archivo en todo el monorepo
find . -name "package.json" -not -path "*/node_modules/*"

# Ver tamaño de cada proyecto
du -sh frontend backend backend-simple

# Contar líneas de código por proyecto
find frontend -name "*.tsx" | xargs wc -l
find backend-simple -name "*.ts" | xargs wc -l
```

---

## Resumen Visual

```
┌──────────────────────────────────────────────────────────┐
│                    OUIJA VIRTUAL                         │
│                     (Monorepo)                           │
└──────────────────────────────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
  ┌──────────┐      ┌──────────┐      ┌─────────────┐
  │ Frontend │      │ Backend  │      │   Backend   │
  │  React   │      │ Completo │      │   Simple    │
  │          │      │          │      │ (Esta guía) │
  └──────────┘      └──────────┘      └─────────────┘
       │                 │                    │
       │                 │                    │
       ▼                 ▼                    ▼
  Vercel/          PostgreSQL           SQLite
  Netlify          + Auth               + Triple
                   + Users               Fallback
```

---

## Preguntas Frecuentes

### ¿Por qué dos backends?

**R**: `backend/` es el proyecto completo con todas las features. `backend-simple/` es una versión educativa y minimalista creada para esta guía incremental.

---

### ¿Puedo usar solo backend-simple en producción?

**R**: Sí, si:
- No necesitas autenticación
- No necesitas gestión de usuarios
- SQLite es suficiente para tu escala
- Solo necesitas la lógica de Ouija

Para aplicaciones a largo plazo, considera migrar a `backend/`.

---

### ¿Dónde pongo docker-compose.yml?

**R**: Depende:
- **Raíz**: Si quieres orquestar frontend + backend + servicios
- **backend-simple/**: Si solo desarrollas el backend aislado
- **Ambos**: Puedes tener los dos (uno para cada propósito)

---

### ¿Cómo manejo migraciones en ambos backends?

**R**: Son independientes:
- `backend/prisma/migrations/` - PostgreSQL
- `backend-simple/prisma/migrations/` - SQLite

No se comparten migraciones.

---

### ¿Puedo convertir backend-simple en backend completo?

**R**: Sí, siguiendo estos pasos:
1. Migrar de SQLite a PostgreSQL
2. Agregar módulos de auth y users
3. Actualizar schema.prisma
4. Ejecutar migraciones
5. Actualizar tests

(Hay una guía para esto en `docs/migration-guide.md`)

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
**Estado**: ✅ COMPLETO
