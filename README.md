# 👻 Ouija Virtual API

API REST y WebSocket para comunicarse con "espíritus" virtuales impulsados por IA.

## 🚀 Características

- API RESTful completa (Swagger documentado)
- WebSocket para multiplayer en tiempo real
- 4 personalidades de espíritus (sabio, críptico, oscuro, juguetón)
- Integración con DeepSeek y Ollama
- Sistema de fallback inteligente
- Tests >80% coverage

## 🛠️ Stack Tecnológico

**Backend**: NestJS + PostgreSQL + Prisma + Socket.io + Redis
**IA**: Ollama (qwen2.5:3b) + DeepSeek API

## 📦 Setup Rápido

```bash
# 1. Clonar repositorio
git clone https://github.com/JNZader/ouija_poc.git
cd ouija_poc

# 2. Instalar dependencias
npm install

# 3. Configurar .env
cp .env.example .env

# 4. Levantar infraestructura
docker-compose up -d

# 5. Ejecutar migraciones
npx prisma migrate dev
npx prisma db seed

# 6. Iniciar servidor
npm run start:dev
```

## 📚 Documentación

- [Plan Completo](./PLAN_BACKEND_COMPLETO.md)
- [Iteración 0 - Setup](./ITERACION_0_BACKEND.md)
- [API Docs (Swagger)](http://localhost:3000/api/docs)

## 🗂️ Estructura del Proyecto

```
ouija_poc/
├── docs/                  # Documentación del proyecto
├── src/                   # Código fuente
│   ├── common/           # Módulos comunes (Prisma, etc)
│   ├── modules/          # Módulos de la aplicación
│   │   ├── ouija/       # Módulo principal REST API
│   │   └── multiplayer/ # Módulo WebSocket
│   └── main.ts          # Entry point
├── prisma/               # Schema y migraciones
├── test/                 # Tests E2E
├── docker/               # Archivos Docker
└── .github/              # CI/CD workflows
```

## 🌿 Estrategia de Branches

- `main` - Rama principal (producción)
- `develop` - Rama de desarrollo
- `feature/*` - Nuevas funcionalidades
- `bugfix/*` - Corrección de bugs
- `hotfix/*` - Fixes urgentes

## 📄 Licencia

MIT License
