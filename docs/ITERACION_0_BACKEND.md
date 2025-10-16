# Iteración 0: Setup Backend - Ouija Virtual API

## Duración: 2-3 días
## Objetivo: Configurar infraestructura backend completa
## Story Points: 12-15
## Equipo: Todos los devs backend

---

# 🎯 OBJETIVOS DE LA ITERACIÓN

Al finalizar esta iteración, el equipo tendrá:

✅ Repositorio Git configurado con estructura backend
✅ NestJS funcionando con endpoint de health check
✅ PostgreSQL + Redis corriendo en Docker
✅ Prisma configurado con schema optimizado
✅ Seed con 4 espíritus en base de datos
✅ CI/CD pipeline básico (linting + tests)
✅ Documentación de setup completa

---

# 📋 BACKLOG DE LA ITERACIÓN

## Épica 1: Setup de Repositorio y Proyecto

### US-0.1: Crear Repositorio Backend
**Como** desarrollador backend
**Quiero** un repositorio Git con estructura NestJS
**Para** comenzar el desarrollo de la API

**Story Points**: 2
**Asignado a**: Backend Lead
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Repositorio Git creado
- [ ] Estructura de carpetas definida
- [ ] .gitignore configurado
- [ ] README.md con descripción
- [ ] Licencia definida (MIT recomendada)

#### Tareas Técnicas

**T-0.1.1: Crear repositorio Git** (0.5h)
```bash
# En GitHub/GitLab crear nuevo repositorio
# Nombre: ouija-virtual-api
# Descripción: API REST y WebSocket para comunicación con espíritus virtuales usando IA

# Clonar localmente
git clone <repo-url>
cd ouija-virtual-api
```

**T-0.1.2: Crear estructura de directorios** (0.5h)
```bash
# Estructura backend:
# ouija-virtual-api/
# ├── src/
# ├── test/
# ├── prisma/
# ├── docker/
# ├── docs/
# ├── .github/workflows/
# ├── docker-compose.yml
# ├── .gitignore
# ├── README.md
# └── LICENSE
```

**T-0.1.3: Configurar .gitignore** (0.25h)
```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Production
dist/
build/

# Environment variables
.env
.env*.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*

# Database
*.db
*.sqlite
postgres-data/
redis-data/

# Prisma
migrations/

# Docker
docker-compose.override.yml
EOF
```

**T-0.1.4: Crear README.md** (0.75h)
```markdown
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

\`\`\`bash
# 1. Clonar repositorio
git clone <repo-url>
cd ouija-virtual-api

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
\`\`\`

## 📚 Documentación

- [Plan Completo](./docs/PLAN_BACKEND_COMPLETO.md)
- [Setup Detallado](./docs/ITERACION_0_BACKEND.md)
- [API Docs (Swagger)](http://localhost:3000/api/docs)

## 📄 Licencia

MIT License
```

---

## Épica 2: Setup de NestJS

### US-0.2: Inicializar Proyecto NestJS
**Como** backend developer
**Quiero** un proyecto NestJS configurado con estructura modular
**Para** desarrollar la API REST y WebSocket

**Story Points**: 3
**Asignado a**: Backend Lead
**Prioridad**: CRÍTICA

#### Criterios de Aceptación
- [ ] Proyecto NestJS creado
- [ ] TypeScript configurado
- [ ] Estructura de módulos definida
- [ ] Variables de entorno configuradas
- [ ] Endpoint `/api/health` funcionando
- [ ] Server corriendo en `http://localhost:3000`

#### Tareas Técnicas

**T-0.2.1: Instalar NestJS CLI y crear proyecto** (0.5h)
```bash
# Instalar CLI globalmente
npm install -g @nestjs/cli

# Crear proyecto
nest new ouija-virtual-api --package-manager npm

cd ouija-virtual-api
```

**T-0.2.2: Configurar TypeScript** (0.25h)
```json
// tsconfig.json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

**T-0.2.3: Instalar dependencias core** (0.5h)
```bash
# Dependencies
npm install --save \
  @nestjs/config \
  @nestjs/swagger \
  @nestjs/platform-socket.io \
  @nestjs/websockets \
  class-validator \
  class-transformer \
  @prisma/client \
  prisma \
  redis \
  winston

# Dev dependencies
npm install --save-dev \
  @types/node \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint \
  prettier \
  eslint-config-prettier
```

**T-0.2.4: Configurar ESLint y Prettier** (0.5h)
```javascript
// .eslintrc.js
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
    '@typescript-eslint/no-explicit-any': 'warn',
  },
};
```

```json
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

**T-0.2.5: Configurar variables de entorno** (0.5h)
```bash
cat > .env.example << 'EOF'
# Database
DATABASE_URL="postgresql://ouija_user:ouija_pass@localhost:5432/ouija_db"

# Server
PORT=3000
NODE_ENV=development

# IA: Ollama
OLLAMA_URL="http://localhost:11434"
OLLAMA_MODEL="qwen2.5:3b"
OLLAMA_TIMEOUT=60000

# IA: DeepSeek (opcional)
DEEPSEEK_API_KEY=""
DEEPSEEK_BASE_URL="https://api.deepseek.com"
DEEPSEEK_TIMEOUT=30000

# Motor de IA por defecto
DEFAULT_AI_ENGINE="ollama"

# CORS
ALLOWED_ORIGINS="http://localhost:3001,http://localhost:5173"

# Redis (para Multiplayer)
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""
EOF

# Copiar a .env
cp .env.example .env
```

**T-0.2.6: Crear estructura modular** (0.75h)
```bash
cd src

# Crear módulos
nest generate module common/prisma --flat
nest generate service common/prisma --flat --no-spec

nest generate module modules/ouija
nest generate controller modules/ouija
nest generate service modules/ouija

nest generate module modules/multiplayer
nest generate gateway modules/multiplayer/multiplayer --no-spec

# Estructura resultante:
# src/
# ├── common/
# │   └── prisma/
# │       ├── prisma.module.ts
# │       └── prisma.service.ts
# ├── modules/
# │   ├── ouija/
# │   │   ├── controllers/
# │   │   ├── services/
# │   │   ├── dto/
# │   │   └── ouija.module.ts
# │   └── multiplayer/
# │       ├── services/
# │       ├── dto/
# │       ├── multiplayer.gateway.ts
# │       └── multiplayer.module.ts
# ├── app.module.ts
# └── main.ts
```

**T-0.2.7: Configurar ConfigModule global** (0.5h)
```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './common/prisma/prisma.module';
import { OuijaModule } from './modules/ouija/ouija.module';
import { MultiplayerModule } from './modules/multiplayer/multiplayer.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    OuijaModule,
    MultiplayerModule,
  ],
})
export class AppModule {}
```

**T-0.2.8: Crear endpoint /health** (0.5h)
```typescript
// src/modules/ouija/ouija.controller.ts
import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class OuijaController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'ouija-virtual-api',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
```

**T-0.2.9: Configurar main.ts** (0.5h)
```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  });

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Ouija Virtual API')
    .setDescription('API REST y WebSocket para comunicarse con espíritus virtuales')
    .setVersion('1.0')
    .addTag('ouija')
    .addTag('multiplayer')
    .addTag('health')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Server running on http://localhost:${port}`);
  console.log(`📚 Swagger docs on http://localhost:${port}/api/docs`);
}
bootstrap();
```

**T-0.2.10: Testing inicial** (0.25h)
```bash
# Iniciar servidor
npm run start:dev

# En otra terminal, verificar health check
curl http://localhost:3000/api/health

# Debe retornar:
# {
#   "status": "ok",
#   "timestamp": "2025-10-16T...",
#   "service": "ouija-virtual-api",
#   "version": "1.0.0",
#   "environment": "development"
# }

# Verificar Swagger
open http://localhost:3000/api/docs
```

---

## Épica 3: Setup de Base de Datos

### US-0.3: Configurar PostgreSQL + Prisma
**Como** backend developer
**Quiero** una base de datos PostgreSQL con Prisma ORM
**Para** persistir datos de sesiones y espíritus

**Story Points**: 3
**Asignado a**: Backend Lead
**Prioridad**: CRÍTICA

#### Tareas Técnicas

**T-0.3.1: Configurar Docker Compose** (0.5h)
```yaml
# docker-compose.yml (en raíz del proyecto)
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: ouija-postgres
    environment:
      POSTGRES_USER: ouija_user
      POSTGRES_PASSWORD: ouija_pass
      POSTGRES_DB: ouija_db
    ports:
      - '5432:5432'
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U ouija_user -d ouija_db']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: ouija-redis
    ports:
      - '6379:6379'
    volumes:
      - redis-data:/data
    healthcheck:
      test: ['CMD', 'redis-cli', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  # Ollama (opcional - comentar si se usa instalación local)
  # ollama:
  #   image: ollama/ollama:latest
  #   container_name: ouija-ollama
  #   ports:
  #     - '11434:11434'
  #   volumes:
  #     - ollama-data:/root/.ollama

volumes:
  postgres-data:
  redis-data:
  # ollama-data:
```

**T-0.3.2: Inicializar Prisma** (0.25h)
```bash
# Inicializar Prisma
npx prisma init

# Esto crea:
# - prisma/schema.prisma
# - .env (actualizar DATABASE_URL si es necesario)
```

**T-0.3.3: Configurar schema optimizado** (1h)

Copiar el contenido del `schema_optimizado.prisma` existente al `prisma/schema.prisma`

**T-0.3.4: Crear archivo de seed** (1h)
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Limpiar datos existentes (solo en desarrollo)
  if (process.env.NODE_ENV === 'development') {
    await prisma.sessionMessage.deleteMany();
    await prisma.roomParticipant.deleteMany();
    await prisma.ouijaSession.deleteMany();
    await prisma.multiplayerRoom.deleteMany();
    await prisma.spirit.deleteMany();
  }

  // Crear espíritus
  const spirits = await Promise.all([
    prisma.spirit.create({
      data: {
        name: 'Morgana la Sabia',
        personality: 'wise',
        backstory: `Morgana fue una curandera y vidente en la Europa medieval del siglo XII.
        Vivió en un pequeño pueblo donde era respetada por su conocimiento de hierbas medicinales
        y su capacidad para interpretar sueños. Murió pacíficamente a los 87 años en 1189.
        Su temperamento es sereno y compasivo, siempre buscando guiar a las almas perdidas
        hacia la sabiduría interior.`,
        isActive: true,
      },
    }),
    prisma.spirit.create({
      data: {
        name: 'Azazel el Críptico',
        personality: 'cryptic',
        backstory: `Azazel fue un estudioso de textos antiguos en el Imperio Bizantino del siglo X.
        Dedicó su vida al estudio de manuscritos prohibidos y profecías oscuras.
        Murió en circunstancias misteriosas en 967 d.C., rodeado de símbolos enigmáticos.
        Su temperamento es enigmático y filosófico, comunicándose a través de acertijos
        y metáforas que desafían la comprensión mortal.`,
        isActive: true,
      },
    }),
    prisma.spirit.create({
      data: {
        name: 'Lilith la Sombra',
        personality: 'dark',
        backstory: `Lilith fue una noble en la Francia del siglo XVII, acusada de brujería
        y ejecutada en la hoguera en 1673. Su espíritu quedó atormentado, lleno de resentimiento
        hacia los vivos. Murió a los 34 años tras meses de tortura. Su temperamento es sombrío
        y vengativo, advirtiendo constantemente sobre los horrores que acechan en las sombras
        y la inevitabilidad del destino oscuro.`,
        isActive: true,
      },
    }),
    prisma.spirit.create({
      data: {
        name: 'Puck el Travieso',
        personality: 'playful',
        backstory: `Puck fue un bufón de la corte en Inglaterra durante el reinado isabelino
        del siglo XVI. Conocido por sus bromas ingeniosas y su humor ácido,
        entretenía a nobles y plebeyos por igual. Murió en 1598 en un accidente cómico
        que involucró una tarta y una escalera. Su temperamento es juguetón y caprichoso,
        encontrando diversión en el caos y las ironías del destino.`,
        isActive: true,
      },
    }),
  ]);

  console.log(`✅ Created ${spirits.length} spirits`);
  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Agregar script en `package.json`:
```json
{
  "scripts": {
    "prisma:seed": "ts-node prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Instalar ts-node:
```bash
npm install --save-dev ts-node
```

**T-0.3.5: Ejecutar migraciones y seed** (0.25h)
```bash
# Levantar PostgreSQL
docker-compose up -d postgres

# Esperar a que esté listo
docker-compose ps

# Crear migración inicial
npx prisma migrate dev --name init

# Generar cliente Prisma
npx prisma generate

# Ejecutar seed
npm run prisma:seed

# Verificar datos
npx prisma studio
# Abrir http://localhost:5555 y verificar 4 espíritus
```

**T-0.3.6: Implementar PrismaService** (0.5h)
```typescript
// src/common/prisma/prisma.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
    console.log('✅ Connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    console.log('👋 Disconnected from database');
  }
}
```

```typescript
// src/common/prisma/prisma.module.ts
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

## Épica 4: CI/CD y Testing

### US-0.4: Configurar Pipeline de CI/CD
**Como** DevOps/Backend Lead
**Quiero** un pipeline de CI/CD automatizado
**Para** validar código automáticamente

**Story Points**: 2
**Asignado a**: Backend Lead
**Prioridad**: ALTA

#### Tareas Técnicas

**T-0.4.1: Configurar workflow de CI** (1h)
```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-lint-test:
    name: Backend - Lint & Test
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: test_db
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npx tsc --noEmit

      - name: Run tests
        run: npm run test
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/test_db
          REDIS_HOST: localhost
          REDIS_PORT: 6379

      - name: Build
        run: npm run build
```

**T-0.4.2: Agregar scripts de testing** (0.5h)
```json
// package.json
{
  "scripts": {
    "build": "nest build",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  }
}
```

---

## Checklist de Cierre de Iteración 0

### Validación Técnica
- [ ] Backend corriendo en `http://localhost:3000`
- [ ] Endpoint `/api/health` respondiendo correctamente
- [ ] Swagger docs accesible en `/api/docs`
- [ ] PostgreSQL corriendo en Docker
- [ ] Redis corriendo en Docker
- [ ] Prisma migraciones aplicadas
- [ ] 4 espíritus en base de datos
- [ ] Prisma Studio funcionando
- [ ] GitHub Actions pipeline ejecutándose
- [ ] Tests básicos pasando

### Documentación
- [ ] README.md completo
- [ ] .env.example documentado
- [ ] Setup instructions claras

### Code Quality
- [ ] Linting configurado (ESLint + Prettier)
- [ ] TypeScript configurado correctamente
- [ ] Estructura modular implementada

### Team Sync
- [ ] Todos los devs pueden levantar el proyecto localmente
- [ ] Review de código y convenciones
- [ ] Planning de iteración 1 realizado

---

## Siguientes Pasos

Una vez completada la iteración 0, proceder a:

📖 **Iteración 1** - Implementar servicios core (AIService, ConversationService)

**Estado**: ✅ COMPLETADO | Siguiente: 🚀 ITERACIÓN 1
