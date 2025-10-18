#!/bin/bash
# Docker Entrypoint Script for Ouija Virtual Backend
# Ubicación: backend-simple/docker-entrypoint.sh
#
# Este script se ejecuta al iniciar el contenedor Docker y:
# 1. Valida variables de entorno
# 2. Ejecuta migraciones de Prisma
# 3. Ejecuta seed (opcional)
# 4. Inicia la aplicación

set -e  # Salir si cualquier comando falla

# ========================================
# Colores para output
# ========================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ========================================
# Funciones de utilidad
# ========================================
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# ========================================
# Banner de inicio
# ========================================
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║           🔮 OUIJA VIRTUAL BACKEND 🔮                ║"
echo "║                                                       ║"
echo "║              Initializing container...               ║"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ========================================
# Validar variables de entorno críticas
# ========================================
log_info "Validating environment variables..."

required_vars=(
    "NODE_ENV"
    "DATABASE_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    else
        log_success "$var is set"
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    log_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

# Validar variables opcionales pero importantes
optional_vars=(
    "GROQ_API_KEY"
    "OLLAMA_URL"
)

for var in "${optional_vars[@]}"; do
    if [ -z "${!var}" ]; then
        log_warning "$var is not set (fallback mode will be used)"
    else
        log_success "$var is set"
    fi
done

# ========================================
# Mostrar información del entorno
# ========================================
log_info "Environment Information:"
echo "  - Node Environment: $NODE_ENV"
echo "  - Node Version: $(node --version)"
echo "  - NPM Version: $(npm --version)"
echo "  - Working Directory: $(pwd)"
echo ""

# ========================================
# Verificar archivos de Prisma
# ========================================
log_info "Checking Prisma files..."

if [ ! -f "prisma/schema.prisma" ]; then
    log_error "prisma/schema.prisma not found!"
    exit 1
fi

log_success "Prisma schema found"

# ========================================
# Generar Prisma Client
# ========================================
log_info "Generating Prisma Client..."

if npx prisma generate; then
    log_success "Prisma Client generated successfully"
else
    log_error "Failed to generate Prisma Client"
    exit 1
fi

# ========================================
# Ejecutar migraciones de base de datos
# ========================================
log_info "Running database migrations..."

if [ "$NODE_ENV" = "production" ]; then
    # En producción, usar migrate deploy (no interactivo)
    log_info "Production mode: Running 'prisma migrate deploy'"

    if npx prisma migrate deploy; then
        log_success "Database migrations completed successfully"
    else
        log_error "Database migrations failed"
        exit 1
    fi
else
    # En desarrollo, usar migrate dev
    log_info "Development mode: Running 'prisma migrate dev'"

    if npx prisma migrate dev --skip-generate; then
        log_success "Database migrations completed successfully"
    else
        log_warning "Database migrations had issues (continuing anyway for development)"
    fi
fi

# ========================================
# Verificar estado de la base de datos
# ========================================
log_info "Checking database connection..."

if npx prisma db execute --stdin <<< "SELECT 1;" 2>/dev/null; then
    log_success "Database connection successful"
else
    log_warning "Database connection check failed (this might be normal for some setups)"
fi

# ========================================
# Ejecutar seed (opcional)
# ========================================
if [ "$RUN_SEED" = "true" ] || [ "$NODE_ENV" = "development" ]; then
    log_info "Checking if database needs seeding..."

    # Verificar si la tabla FallbackResponse tiene datos
    RECORD_COUNT=$(npx prisma db execute --stdin <<< "SELECT COUNT(*) as count FROM FallbackResponse;" 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

    if [ "$RECORD_COUNT" = "0" ] || [ "$FORCE_SEED" = "true" ]; then
        log_info "Running database seed..."

        if npm run prisma:seed; then
            log_success "Database seeded successfully"
        else
            log_warning "Database seed failed (continuing anyway)"
        fi
    else
        log_info "Database already has $RECORD_COUNT records, skipping seed"
    fi
fi

# ========================================
# Verificar puerto
# ========================================
PORT=${PORT:-3000}
log_info "Application will run on port: $PORT"

# ========================================
# Verificar que dist/ existe (para producción)
# ========================================
if [ "$NODE_ENV" = "production" ]; then
    if [ ! -d "dist" ] || [ ! -f "dist/main.js" ]; then
        log_error "Production build not found! Did you run 'npm run build'?"
        exit 1
    fi
    log_success "Production build found"
fi

# ========================================
# Health check (opcional)
# ========================================
if [ "$SKIP_HEALTHCHECK" != "true" ]; then
    log_info "Container is ready to accept connections"
fi

# ========================================
# Mensaje final
# ========================================
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║                                                       ║"
echo "║         🚀 Starting Ouija Virtual Backend 🚀         ║"
echo "║                                                       ║"
echo "║              Environment: $NODE_ENV"
echo "║              Port: $PORT"
echo "║                                                       ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# ========================================
# Ejecutar comando proporcionado o comando por defecto
# ========================================
if [ $# -eq 0 ]; then
    # No se proporcionó comando, usar el comando por defecto
    if [ "$NODE_ENV" = "production" ]; then
        log_info "Starting application in production mode..."
        exec node dist/main
    else
        log_info "Starting application in development mode..."
        exec npm run start:dev
    fi
else
    # Ejecutar el comando proporcionado
    log_info "Executing custom command: $@"
    exec "$@"
fi
