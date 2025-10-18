# ⚠️ ATENCIÓN - Lee Esto Primero

## 🛑 Esta NO Es la Forma Recomendada de Usar la Guía

Si estás aquí buscando copiar archivos rápidamente, **DETENTE**.

Esta guía está diseñada para que **DESARROLLES TÚ MISMO** el código, **NO para copiar archivos**.

---

## ✅ Forma CORRECTA de Usar Esta Guía

1. **Lee** [COMO_USAR_ESTA_GUIA.md](../COMO_USAR_ESTA_GUIA.md)
2. **Empieza** con [IT1-000_SETUP_INICIAL.md](../iteracion-1/IT1-000_SETUP_INICIAL.md)
3. **Desarrolla** siguiendo [iteracion-1/TAREAS.md](../iteracion-1/TAREAS.md)
4. **Consulta** codigo-completo/ SOLO cuando te atasques

---

## ⚠️ Si AÚN Así Quieres Copiar (No Recomendado)

Esta sección existe **SOLO** para casos donde necesites copiar código por razones válidas:
- Ya completaste las iteraciones y quieres resetear
- Necesitas un proyecto base rápido para experimentar
- Estás usando esto como template para otro proyecto

**Si es tu primera vez:** Por favor, sigue la guía paso a paso.

---

# 🚀 Quick Copy - Copiar Archivos en 5 Minutos

⚠️ **Recuerda:** Esto anula todo el aprendizaje de la guía.

---

## ⚡ Instalación Rápida

### Prerequisitos

```bash
# Verificar que estés en la raíz del monorepo
pwd
# Debería mostrar: .../ouija-virtual

# Verificar que backend-simple existe
ls backend-simple/
```

---

## 📋 Opción 1: Script Automático (Recomendado)

```bash
# Crear y ejecutar este script
cat > copy-codigo-completo.sh << 'EOF'
#!/bin/bash

echo "🚀 Copiando archivos desde codigo-completo..."

# Ir a backend-simple
cd backend-simple

# 1. Copiar servicios
echo "📦 Copiando servicios..."
mkdir -p src/modules/ouija/services
cp ../guia-desarrollo-incremental-backend/codigo-completo/services/ollama.service.ts src/modules/ouija/services/
cp ../guia-desarrollo-incremental-backend/codigo-completo/services/groq.service.ts src/modules/ouija/services/
cp ../guia-desarrollo-incremental-backend/codigo-completo/services/fallback.service.ts src/modules/ouija/services/

# 2. Copiar tests
echo "🧪 Copiando tests..."
cp ../guia-desarrollo-incremental-backend/codigo-completo/tests/fallback.service.spec.ts src/modules/ouija/services/
cp ../guia-desarrollo-incremental-backend/codigo-completo/tests/ouija.service.spec.ts src/modules/ouija/

# 3. Copiar configuraciones
echo "⚙️ Copiando configuraciones..."
mkdir -p src/config
cp ../guia-desarrollo-incremental-backend/codigo-completo/config/swagger-setup.ts src/config/
cp ../guia-desarrollo-incremental-backend/codigo-completo/config/docker-compose.yml .

# 4. Opcional: Usar main.ts con Swagger
read -p "¿Quieres usar main.ts con Swagger? (s/n): " respuesta
if [ "$respuesta" = "s" ]; then
  echo "📝 Copiando main.ts con Swagger..."
  cp src/main.ts src/main.ts.backup
  cp ../guia-desarrollo-incremental-backend/codigo-completo/config/main-with-swagger.ts src/main.ts
  echo "✅ Backup creado en src/main.ts.backup"
fi

# 5. Instalar dependencias de Swagger
read -p "¿Instalar dependencias de Swagger? (s/n): " respuesta
if [ "$respuesta" = "s" ]; then
  echo "📥 Instalando @nestjs/swagger..."
  npm install @nestjs/swagger swagger-ui-express
fi

echo ""
echo "✅ ¡Todos los archivos copiados!"
echo ""
echo "📋 Próximos pasos:"
echo "1. npm run build"
echo "2. npm run test"
echo "3. npm run start:dev"
echo ""
EOF

chmod +x copy-codigo-completo.sh
./copy-codigo-completo.sh
```

---

## 📋 Opción 2: Copiar Manualmente (Paso a Paso)

### Paso 1: Servicios

```bash
cd backend-simple

# Crear carpeta si no existe
mkdir -p src/modules/ouija/services

# Copiar servicios
cp ../guia-desarrollo-incremental-backend/codigo-completo/services/ollama.service.ts \
   src/modules/ouija/services/

cp ../guia-desarrollo-incremental-backend/codigo-completo/services/groq.service.ts \
   src/modules/ouija/services/

cp ../guia-desarrollo-incremental-backend/codigo-completo/services/fallback.service.ts \
   src/modules/ouija/services/
```

### Paso 2: Tests

```bash
# Copiar tests
cp ../guia-desarrollo-incremental-backend/codigo-completo/tests/fallback.service.spec.ts \
   src/modules/ouija/services/

cp ../guia-desarrollo-incremental-backend/codigo-completo/tests/ouija.service.spec.ts \
   src/modules/ouija/
```

### Paso 3: Configuraciones

```bash
# Crear carpeta de config
mkdir -p src/config

# Copiar Swagger
cp ../guia-desarrollo-incremental-backend/codigo-completo/config/swagger-setup.ts \
   src/config/

# Copiar Docker Compose
cp ../guia-desarrollo-incremental-backend/codigo-completo/config/docker-compose.yml \
   .
```

### Paso 4: main.ts con Swagger (Opcional)

```bash
# Hacer backup del main.ts actual
cp src/main.ts src/main.ts.backup

# Copiar nuevo main.ts con Swagger
cp ../guia-desarrollo-incremental-backend/codigo-completo/config/main-with-swagger.ts \
   src/main.ts
```

### Paso 5: Instalar Dependencias

```bash
# Instalar dependencias de Swagger
npm install @nestjs/swagger swagger-ui-express
```

---

## ✅ Validación

```bash
# 1. Verificar que los archivos fueron copiados
ls -la src/modules/ouija/services/
# Debería mostrar: ollama.service.ts, groq.service.ts, fallback.service.ts

# 2. Compilar
npm run build

# 3. Ejecutar tests
npm run test

# 4. Iniciar servidor
npm run start:dev

# 5. Verificar Swagger (si instalaste)
# Abrir en navegador: http://localhost:3001/api
```

---

## 🎯 Qué Hace Cada Archivo

### Servicios (services/)

| Archivo | Propósito | Cuando Usar |
|---------|-----------|-------------|
| `ollama.service.ts` | IA local en Docker | Iteración 2 |
| `groq.service.ts` | IA cloud (rápida) | Iteración 3 |
| `fallback.service.ts` | SQLite fallback | Iteración 1 |

### Tests (tests/)

| Archivo | Propósito | Coverage |
|---------|-----------|----------|
| `fallback.service.spec.ts` | Tests del FallbackService | 10+ tests |
| `ouija.service.spec.ts` | Tests del servicio principal | 15+ tests |

### Config (config/)

| Archivo | Propósito |
|---------|-----------|
| `swagger-setup.ts` | Configuración de Swagger/OpenAPI |
| `main-with-swagger.ts` | main.ts con Swagger integrado |
| `docker-compose.yml` | Backend + Ollama en Docker |

---

## 🔧 Troubleshooting Rápido

### Error: "Cannot find module '@nestjs/swagger'"

```bash
npm install @nestjs/swagger swagger-ui-express
```

### Error: "File not found"

```bash
# Verificar que estás en la raíz correcta
pwd
# Debe mostrar: .../ouija-virtual

# Verificar que codigo-completo existe
ls guia-desarrollo-incremental-backend/codigo-completo/
```

### Error al compilar: "PrismaService not found"

```bash
npx prisma generate
npm run build
```

### Tests fallan: "Cannot find module"

```bash
npm install
npx prisma generate
npm run test
```

---

## 📊 Checklist Post-Instalación

Después de copiar los archivos:

- [ ] ✅ Archivos copiados (9 archivos)
- [ ] ✅ Compilación exitosa (`npm run build`)
- [ ] ✅ Tests pasan (`npm run test`)
- [ ] ✅ Servidor inicia (`npm run start:dev`)
- [ ] ✅ Swagger accesible (http://localhost:3001/api)
- [ ] ✅ Docker Compose funciona (`docker-compose up`)

---

## 🎓 Siguientes Pasos

1. **Lee el código**
   - Todos los archivos están extensamente comentados
   - Entiende qué hace cada servicio

2. **Ejecuta los tests**
   - `npm run test:cov` para ver coverage
   - Los tests son documentación ejecutable

3. **Prueba Swagger**
   - Abre http://localhost:3001/api
   - Prueba el endpoint `/ouija/ask`

4. **Levanta Docker**
   - `docker-compose up`
   - Descarga modelo: `docker-compose exec ollama ollama pull qwen2.5:0.5b`

5. **Continúa con la guía**
   - Sigue las iteraciones en orden
   - Valida con CRITERIOS_ACEPTACION.md

---

## 💡 Tips

1. **Usa Git**
   ```bash
   git add .
   git commit -m "feat: Agregar servicios completos desde codigo-completo"
   ```

2. **Compara con el original**
   - Si backend-simple ya tiene los servicios, compara diferencias
   - Los archivos de codigo-completo son la versión "limpia"

3. **Personaliza**
   - Los archivos están listos para usar
   - Pero puedes modificarlos según tus necesidades

---

## 📚 Más Información

- **Documentación completa:** [codigo-completo/README.md](./README.md)
- **Guía de uso:** [COMPLETADO.md](../COMPLETADO.md)
- **Índice general:** [INDICE.md](../INDICE.md)

---

**¡Listo! En 5 minutos ya tienes todo el código necesario.** 🚀
