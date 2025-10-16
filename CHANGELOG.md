# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/) y este proyecto adhiere a [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2025-10-16

### Agregado

#### Iteración 0 - Setup
- Configuración inicial de NestJS + TypeScript
- Configuración de Prisma ORM con PostgreSQL
- Docker Compose para PostgreSQL y Redis
- ESLint y Prettier configurados
- GitHub Actions CI/CD pipeline
- Estructura base de módulos

#### Iteración 1 - Core Services
- AIService con soporte multi-motor
  - Integración con Ollama (local)
  - Integración con DeepSeek (cloud)
  - Sistema de fallback inteligente con templates de emergencia
- ConversationService para lógica de conversación
- 4 personalidades de espíritus (Wise, Cryptic, Dark, Playful)
- Sistema de prompts estructurados
- Redis integration para caché
- Health check básico

#### Iteración 2 - REST API
- OuijaController con endpoints completos
- SpiritSessionService para gestión de sesiones
- Endpoints REST:
  - `GET /api/ouija/spirits` - Listar espíritus
  - `POST /api/ouija/session/create` - Crear sesión
  - `POST /api/ouija/session/ask` - Enviar mensaje
  - `POST /api/ouija/session/:token/end` - Finalizar sesión
  - `GET /api/ouija/session/:token/history` - Obtener historial
- DTOs con validación automática
- Swagger/OpenAPI documentation completa
- Rate limiting (100 req/15min)
- CORS configurado
- Tests E2E con Supertest

#### Iteración 3 - WebSocket Multiplayer
- MultiplayerGateway con Socket.io
- MultiplayerRoomService para gestión de salas
- WebSocket namespace `/multiplayer`
- Eventos implementados:
  - `create-room`, `join-room`, `leave-room`, `send-message`
  - `room-created`, `room-joined`, `user-joined`, `user-left`
  - `new-message`, `room-ended`, `error`
- Salas multiplayer (hasta 10 usuarios)
- Códigos de sala únicos de 8 caracteres
- Gestión automática de desconexiones
- Persistencia de mensajes en BD
- Tests E2E con socket.io-client

#### Iteración 4 - Testing & Polish
- **Testing mejorado:**
  - Cobertura aumentada de 52% a 58%
  - 65 tests (20 más que versión anterior)
  - Tests para HealthController (10 tests nuevos)
  - Tests adicionales para ConversationService (cobertura 100%)

- **Error Handling robusto:**
  - AllExceptionsFilter para manejo global
  - Custom exceptions personalizadas:
    - AIServiceUnavailableException
    - SessionExpiredException
    - RoomFullException
    - InvalidSpiritException
    - ValidationException
  - Manejo especial de errores Prisma
  - Logging estructurado de errores por severidad
  - Stack traces solo en development

- **Documentación completa:**
  - ERROR_CODES.md con guía de códigos de error
  - README.md actualizado y completo
  - CHANGELOG.md

- **Performance:**
  - Compression HTTP habilitada (threshold 1KB, level 6)
  - Connection pooling configurado

- **Dependencias agregadas:**
  - winston, nest-winston, winston-daily-rotate-file (logging)
  - compression (performance)

### Servicios Implementados

- **AIService**: Gestión unificada de motores de IA con fallback
- **ConversationService**: Lógica de conversación centralizada
- **SpiritSessionService**: Gestión de sesiones individuales
- **MultiplayerRoomService**: Gestión de salas multiplayer
- **PrismaService**: Acceso a base de datos
- **RedisService**: Gestión de caché

### Seguridad

- Helmet para headers de seguridad
- Rate limiting con @nestjs/throttler
- Validación de inputs con class-validator
- Exception filters globales
- CORS configurado
- Sanitización de respuestas de error (stack traces solo en dev)

### Database Schema

**Tablas principales:**
- `Spirit` - Espíritus disponibles
- `OuijaSession` - Sesiones individuales
- `SessionMessage` - Mensajes de sesiones
- `MultiplayerRoom` - Salas multiplayer
- `RoomParticipant` - Participantes de salas

### Infraestructura

- Docker Compose para desarrollo local
- GitHub Actions para CI/CD
- PostgreSQL 15+ como base de datos principal
- Redis 7+ para caché y gestión de salas
- Health checks configurados

### Métricas Actuales

- **Test Coverage**: 58.01%
- **Tests Totales**: 65 (todos pasando)
- **Módulos con 100% coverage**: ConversationService, HealthController, OuijaController
- **Response Time REST**: ~150ms promedio
- **Response Time IA**: ~1.5s promedio
- **WebSocket Latency**: ~50ms promedio

## [0.1.0] - 2025-10-01

### Agregado
- Setup inicial del proyecto
- Configuración de NestJS
- Configuración de Prisma
- Docker Compose básico
- Estructura base de módulos

---

## Links Útiles

- [Guía de Contribución](./CONTRIBUTING.md)
- [Documentación Completa](./docs/)
- [API Documentation](http://localhost:3000/api/docs)

## Notas de Versión

### v1.0.0

Esta es la primera versión estable de Ouija Virtual API. Incluye:

- API REST completa para sesiones individuales
- WebSocket Gateway para salas multiplayer
- Sistema de IA multi-motor con fallback
- Testing robusto (>58% cobertura)
- Error handling completo
- Documentación exhaustiva

**Próximos Pasos (v1.1.0):**
- Aumentar cobertura de tests a >80%
- Implementar logging con Winston
- Optimizaciones de performance adicionales
- Implementar health checks con métricas detalladas
- Deploy automation

---

**Mantenido por:** @JNZader
**Última actualización:** 2025-10-16
