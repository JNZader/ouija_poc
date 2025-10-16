# 👻 Ouija Virtual API

API REST y WebSocket para comunicarse con "espíritus" virtuales impulsados por IA. Permite crear sesiones individuales o salas multiplayer con 4 personalidades de espíritus diferentes.

[![Build Status](https://github.com/JNZader/ouija_poc/workflows/CI/badge.svg)](https://github.com/JNZader/ouija_poc/actions)
[![Test Coverage](https://img.shields.io/badge/coverage-58%25-yellow)](https://github.com/JNZader/ouija_poc)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 🚀 Características

- ✅ **Sesiones Individuales**: Conversación 1-a-1 con espíritus via API REST
- ✅ **Salas Multiplayer**: Interacción en grupo via WebSocket (hasta 10 usuarios)
- ✅ **4 Personalidades**: Wise, Cryptic, Dark, Playful
- ✅ **IA Multi-Motor**: Ollama (local) + DeepSeek (cloud) con fallback automático
- ✅ **Persistencia**: PostgreSQL + Redis para caché
- ✅ **Documentación**: Swagger/OpenAPI automática
- ✅ **Testing**: >58% cobertura con 65 tests (unitarios y E2E)
- ✅ **Error Handling**: Manejo robusto con códigos personalizados
- ✅ **Performance**: Compression HTTP, connection pooling
- ✅ **Security**: Helmet, CORS, Rate limiting, Validation

## 📋 Prerequisitos

- **Node.js** 18+
- **Docker & Docker Compose**
- **PostgreSQL** 15+
- **Redis** 7+
- **Ollama** (opcional, para IA local)

## 🛠️ Instalación Rápida

```bash
# 1. Clonar repositorio
git clone https://github.com/JNZader/ouija_poc.git
cd ouija_poc

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu configuración

# 4. Levantar servicios (PostgreSQL + Redis)
docker-compose up -d

# 5. Ejecutar migraciones y seeders
npx prisma generate
npx prisma migrate dev
npm run prisma:seed

# 6. Iniciar servidor
npm run start:dev
```

## ✅ Verificar Instalación

```bash
# Health check
curl http://localhost:3000/api/health

# Swagger docs
open http://localhost:3000/api/docs
```

## 📚 Documentación

### Docs Técnicas Completas

- [Plan de Desarrollo Completo](./docs/PLAN_BACKEND_COMPLETO.md)
- [Iteración 0 - Setup](./docs/ITERACION_0_BACKEND.md)
- [Iteración 1 - Core Services](./docs/ITERACION_1_BACKEND.md)
- [Iteración 2 - REST API](./docs/ITERACION_2_BACKEND.md)
- [Iteración 3 - WebSockets Multiplayer](./docs/ITERACION_3_BACKEND.md)
- [Iteración 4 - Testing & Polish](./docs/ITERACION_4_BACKEND.md)
- [Códigos de Error](./docs/ERROR_CODES.md)
- [Changelog](./CHANGELOG.md)

### API REST

Swagger UI disponible en: **http://localhost:3000/api/docs**

Endpoints principales:
- `GET /api/health` - Health check
- `GET /api/ouija/spirits` - Listar espíritus
- `POST /api/ouija/session/create` - Crear sesión
- `POST /api/ouija/session/ask` - Enviar mensaje
- `GET /api/ouija/session/:token/history` - Historial
- `POST /api/multiplayer/room/create` - Crear sala multiplayer

### WebSocket API

Namespace: `/multiplayer`

**Eventos Cliente → Servidor:**
- `create-room`, `join-room`, `leave-room`, `send-message`

**Eventos Servidor → Cliente:**
- `room-created`, `room-joined`, `user-joined`, `user-left`, `new-message`

Ver [docs/ITERACION_3_BACKEND.md](./docs/ITERACION_3_BACKEND.md) para detalles.

## 🏗️ Arquitectura

```
Frontend → REST API / WebSocket → NestJS Backend
                                   ├─ AIService (Ollama/DeepSeek)
                                   ├─ ConversationService
                                   ├─ SpiritSessionService
                                   ├─ MultiplayerRoomService
                                   └─ PrismaService → PostgreSQL + Redis
```

### Stack Tecnológico

**Backend:**
- NestJS 10.x + TypeScript 5.x
- Prisma 6.x (ORM)
- Socket.io 4.x (WebSocket)
- PostgreSQL 15+ + Redis 7+

**IA:**
- Ollama (local): qwen2.5:3b
- DeepSeek (cloud): deepseek-chat

**Testing:**
- Jest + Supertest + Socket.io-client

## 🗂️ Estructura del Proyecto

```
ouija_poc/
├── docs/                       # Documentación del proyecto
│   ├── PLAN_BACKEND_COMPLETO.md
│   ├── ITERACION_*.md
│   └── ERROR_CODES.md
├── src/
│   ├── common/                # Módulos comunes
│   │   ├── prisma/           # Prisma service
│   │   ├── filters/          # Exception filters
│   │   └── exceptions/       # Custom exceptions
│   ├── modules/
│   │   ├── health/           # Health checks
│   │   ├── ouija/            # REST API sesiones individuales
│   │   │   ├── controllers/
│   │   │   ├── services/
│   │   │   ├── dto/
│   │   │   └── interfaces/
│   │   └── multiplayer/      # WebSocket multiplayer
│   │       ├── gateways/
│   │       ├── services/
│   │       ├── dto/
│   │       ├── filters/
│   │       └── interfaces/
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
├── test/                      # Tests E2E
└── .github/workflows/         # CI/CD
```

## 📦 Scripts Disponibles

```bash
# Desarrollo
npm run start:dev          # Desarrollo con hot-reload
npm run start:debug        # Modo debug

# Producción
npm run build              # Compilar TypeScript
npm run start:prod         # Producción

# Testing
npm run test               # Tests unitarios
npm run test:watch         # Watch mode
npm run test:cov           # Tests con cobertura
npm run test:e2e           # Tests E2E

# Code Quality
npm run lint               # Linting
npm run lint:fix           # Auto-fix linting
npm run format             # Formatear código

# Database
npm run prisma:studio      # Abrir Prisma Studio
npm run prisma:seed        # Ejecutar seeders
npm run prisma:reset       # Reset BD (⚠️ BORRA DATOS)
```

## 🧪 Testing

### Cobertura Actual: 58.01%

| Módulo | Cobertura |
|--------|-----------|
| AIService | 88.63% |
| **ConversationService** | **100%** |
| SpiritSessionService | 87.93% |
| MultiplayerRoomService | 81.52% |
| **HealthController** | **100%** |
| **OuijaController** | **100%** |

**65 tests** (todos pasando)

```bash
# Ejecutar todos los tests con cobertura
npm run test:cov
```

## 🌿 Estrategia de Branches

- `main` - Rama principal (producción)
- `develop` - Rama de desarrollo
- `feature/*` - Nuevas funcionalidades
- `bugfix/*` - Corrección de bugs
- `hotfix/*` - Fixes urgentes

## 🔧 Configuración

### Variables de Entorno Críticas

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/ouija_db"

# Redis
REDIS_HOST="localhost"
REDIS_PORT=6379

# IA - Ollama
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:3b"

# IA - DeepSeek (opcional)
DEEPSEEK_API_KEY="your-api-key"

# Server
NODE_ENV="development"
PORT=3000
ALLOWED_ORIGINS="http://localhost:3001"
```

## 🚢 Deployment

Ver guías detalladas en [docs/ITERACION_5_BACKEND.md](./docs/ITERACION_5_BACKEND.md)

## 🐛 Troubleshooting

**PostgreSQL no inicia:**
```bash
docker-compose restart postgres
docker-compose logs postgres
```

**Ollama no responde:**
```bash
curl http://localhost:11434/api/tags
ollama list
ollama pull qwen2.5:3b
```

Ver guía completa en [docs/TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre Pull Request

### Code Style
- ESLint + Prettier configurados
- Conventional Commits
- Tests requeridos (>80% coverage objetivo)

## 📄 Licencia

MIT License

## 👥 Autores

- **@JNZader** - [GitHub](https://github.com/JNZader)

---

**Versión:** 1.0.0
**Última actualización:** 2025-10-16
**Hecho con ❤️ usando NestJS y TypeScript**
