# Criterios de Aceptación - Iteración 2: Integración Ollama Local

## Índice
1. [Criterios Generales](#criterios-generales)
2. [Criterios por Tarea](#criterios-por-tarea)
3. [Validación de Criterios](#validación-de-criterios)
4. [Checklist Final](#checklist-final)
5. [Definición de "Iteración 2 Completa"](#definición-de-iteración-2-completa)

---

## Criterios Generales

### CG-1: Calidad de Código
- [ ] Código TypeScript sin errores de compilación
- [ ] ESLint pasa sin warnings
- [ ] Prettier formatea correctamente
- [ ] Nombres de variables/funciones descriptivos
- [ ] Código comentado donde sea necesario
- [ ] No hay código comentado sin usar

### CG-2: Tests
- [ ] Coverage general > 80%
- [ ] Tests unitarios para lógica de negocio
- [ ] Tests de integración para Ollama
- [ ] Tests de fallback funcionan
- [ ] Todos los tests pasan en CI/CD
- [ ] No hay tests skip/only

### CG-3: Documentación
- [ ] README actualizado con instrucciones Docker
- [ ] .env.example completo y actualizado
- [ ] Swagger actualizado con nuevos endpoints
- [ ] Scripts documentados en package.json
- [ ] Comentarios JSDoc en funciones públicas

---

## Criterios por Tarea

### IT2-001: Docker Compose con Ollama

#### CA-001: Configuración Docker Compose
- [ ] docker-compose.yml existe en raíz del proyecto
- [ ] Servicio `ollama` configurado correctamente
- [ ] Servicio `backend` configurado correctamente
- [ ] Red `ouija-network` creada
- [ ] Volumen `ollama-models` persistente configurado

**Validación**:
```bash
docker-compose config
# Debe mostrar configuración válida sin errores
```

#### CA-002: Health Checks
- [ ] Ollama tiene health check configurado
- [ ] Backend tiene health check configurado
- [ ] Health checks usan intervalos apropiados (30s)
- [ ] Health checks tienen timeout (10s)
- [ ] Health checks tienen start_period (40s)

**Validación**:
```bash
docker-compose ps
# Debe mostrar "healthy" para ambos servicios
```

#### CA-003: Variables de Entorno
- [ ] .env.example existe y está completo
- [ ] OLLAMA_URL configurada correctamente
- [ ] OLLAMA_MODEL especificado
- [ ] OLLAMA_TIMEOUT definido
- [ ] Documentación de cada variable

**Validación**:
```bash
cat .env.example
# Debe contener todas las variables necesarias
```

#### CA-004: Scripts de Inicialización
- [ ] init-ollama.sh existe
- [ ] Script tiene permisos de ejecución
- [ ] Script verifica salud de Ollama
- [ ] Script descarga modelo si no existe
- [ ] Script muestra mensajes informativos

**Validación**:
```bash
./scripts/init-ollama.sh
# Debe completar sin errores
```

#### CA-005: Servicios Levantan Correctamente
- [ ] `docker-compose up -d` funciona sin errores
- [ ] Ollama inicia en puerto 11434
- [ ] Backend inicia en puerto 3000
- [ ] Logs no muestran errores críticos
- [ ] Servicios se reinician automáticamente

**Validación**:
```bash
docker-compose up -d
docker-compose ps
docker-compose logs --tail=50
# Todos los servicios deben estar "Up" y "healthy"
```

---

### IT2-002: Mejorar OllamaService con Retry

#### CA-006: Retry Logic
- [ ] Máximo 3 reintentos por request
- [ ] Backoff exponencial implementado (2s, 4s, 8s)
- [ ] Timeout de 30s por intento
- [ ] Logs claros en cada intento
- [ ] Falla correctamente después del 3er intento

**Validación**:
```bash
# Detener Ollama
docker-compose stop ollama

# Hacer request
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'

# Ver logs
docker-compose logs backend | grep "Attempt"
# Debe mostrar 3 intentos con delays incrementales
```

#### CA-007: Circuit Breaker
- [ ] Circuit breaker se abre tras 3 fallos consecutivos
- [ ] Estado "open" visible en logs
- [ ] Auto-reset después de 60 segundos
- [ ] Falla rápido cuando circuit está abierto
- [ ] Método getCircuitBreakerStatus() funciona

**Validación**:
```typescript
// En test
const status = ollamaService.getCircuitBreakerStatus();
expect(status.open).toBe(true);
expect(status.failureCount).toBe(3);
```

#### CA-008: Manejo de Errores
- [ ] ECONNREFUSED manejado correctamente
- [ ] ETIMEDOUT manejado correctamente
- [ ] Respuestas inválidas de Ollama detectadas
- [ ] Stack traces incluidos en logs de error
- [ ] Errores no exponen información sensible

**Validación**:
```bash
# Ver logs de error
docker-compose logs backend | grep "ERROR"
# Debe mostrar errores descriptivos sin API keys
```

---

### IT2-003: Health Check de Ollama

#### CA-009: Health Check Básico
- [ ] Método healthCheck() implementado
- [ ] Timeout de 5s en health check
- [ ] Retorna true cuando Ollama está disponible
- [ ] Retorna false cuando Ollama está caído
- [ ] No lanza excepciones

**Validación**:
```typescript
// En test
const healthy = await ollamaService.healthCheck();
expect(typeof healthy).toBe('boolean');
```

#### CA-010: Cache de Health Check
- [ ] Resultado cacheado por 1 minuto
- [ ] Cache funciona correctamente
- [ ] Llamadas consecutivas usan cache
- [ ] Cache expira después de 1 minuto
- [ ] Logs indican cuando usa cache

**Validación**:
```bash
# Primera llamada
curl http://localhost:3000/health

# Segunda llamada (debería usar cache)
curl http://localhost:3000/health

# Ver logs
docker-compose logs backend | grep "health check"
# Segunda llamada debe decir "Using cached health check result"
```

#### CA-011: Endpoint /health Actualizado
- [ ] Endpoint retorna status correcto
- [ ] Incluye información de Ollama
- [ ] Muestra estado de circuit breaker
- [ ] Incluye timestamp del último check
- [ ] Status "degraded" cuando Ollama está caído
- [ ] Swagger actualizado

**Validación**:
```bash
curl http://localhost:3000/health | jq
# Debe incluir sección "ollama" con toda la info
```

---

### IT2-004: Tests de Integración

#### CA-012: Tests de Health Check
- [ ] Test de conexión a Ollama
- [ ] Test de cache de health check
- [ ] Test de getHealthInfo()
- [ ] Todos los tests pasan
- [ ] Tests documentados

**Validación**:
```bash
npm run test:integration -- --testNamePattern="Health Check"
# Todos los tests deben pasar
```

#### CA-013: Tests de Generación
- [ ] Test de generación exitosa
- [ ] Test de timeout handling
- [ ] Test con prompt largo
- [ ] Timeout de test apropiado (60s)
- [ ] Assertions completas

**Validación**:
```bash
npm run test:integration -- --testNamePattern="Generate"
# Todos los tests deben pasar
```

#### CA-014: Tests de Circuit Breaker
- [ ] Test de apertura de circuit
- [ ] Test con múltiples fallos
- [ ] Test de estado de circuit breaker
- [ ] Mocks correctamente implementados
- [ ] Tests no afectan estado global

**Validación**:
```bash
npm run test:integration -- --testNamePattern="Circuit Breaker"
# Todos los tests deben pasar
```

#### CA-015: Tests de Fallback
- [ ] Test de fallback cuando Ollama falla
- [ ] Test de fallback cuando health check falla
- [ ] Test de latencia de fallback
- [ ] Assertions de source y model
- [ ] Tests independientes (no se afectan entre sí)

**Validación**:
```bash
npm run test:integration -- --testNamePattern="Fallback"
# Todos los tests deben pasar
```

#### CA-016: Coverage
- [ ] Coverage > 80% en OllamaService
- [ ] Coverage > 80% en OuijaService
- [ ] Reporte de coverage generado
- [ ] Líneas críticas cubiertas

**Validación**:
```bash
npm run test:cov
# Coverage debe ser > 80%
```

---

### IT2-005: Logging Estructurado

#### CA-017: Configuración Winston
- [ ] Winston instalado correctamente
- [ ] Logger configurado en logger.config.ts
- [ ] Formato diferente por entorno (dev/prod)
- [ ] Niveles de log configurables
- [ ] Transports apropiados

**Validación**:
```bash
# Verificar instalación
npm list winston nest-winston

# Verificar configuración
cat backend/src/common/config/logger.config.ts
```

#### CA-018: Logs Estructurados
- [ ] Logs incluyen timestamp
- [ ] Logs incluyen nivel
- [ ] Logs incluyen contexto
- [ ] Logs incluyen metadata relevante
- [ ] Logs coloridos en desarrollo
- [ ] Logs JSON en producción

**Validación**:
```bash
# Desarrollo
NODE_ENV=development npm run start:dev
# Logs deben ser coloridos y legibles

# Producción
NODE_ENV=production npm run start
# Logs deben ser JSON
```

#### CA-019: Seguridad de Logs
- [ ] No hay API keys en logs
- [ ] No hay tokens en logs
- [ ] No hay información de usuario sensible
- [ ] Stack traces no exponen rutas absolutas
- [ ] Errores sanitizados

**Validación**:
```bash
docker-compose logs backend | grep -i "api"
docker-compose logs backend | grep -i "key"
docker-compose logs backend | grep -i "token"
# No debe haber valores de API keys
```

---

### IT2-006: Script de Descarga de Modelos

#### CA-020: Script Funcional
- [ ] Script existe en scripts/download-ollama-models.sh
- [ ] Tiene permisos de ejecución
- [ ] Descarga modelos especificados
- [ ] Verifica si modelo ya existe
- [ ] Muestra progreso de descarga

**Validación**:
```bash
./scripts/download-ollama-models.sh
# Debe completar exitosamente
```

#### CA-021: Manejo de Errores en Script
- [ ] Verifica que Ollama esté corriendo
- [ ] Espera a que Ollama esté healthy
- [ ] Maneja errores de red
- [ ] Muestra mensajes de error claros
- [ ] Exit code apropiado en error

**Validación**:
```bash
# Detener Ollama
docker-compose stop ollama

# Ejecutar script
./scripts/download-ollama-models.sh
# Debe fallar con mensaje claro
```

#### CA-022: Documentación del Script
- [ ] Script agregado a package.json
- [ ] Documentado en README
- [ ] Comentarios en el script
- [ ] Ejemplo de uso incluido

**Validación**:
```bash
npm run docker:ollama:models
# Debe ejecutar el script correctamente
```

---

## Validación de Criterios

### Validación Automática

#### Script: `scripts/validate-iteration-2.sh`

```bash
#!/bin/bash

echo "🔍 Validating Iteration 2..."

# Contadores
PASSED=0
FAILED=0

# Función de test
test_criterion() {
  local name=$1
  local command=$2

  echo -n "Testing $name... "

  if eval "$command" > /dev/null 2>&1; then
    echo "✅ PASS"
    ((PASSED++))
  else
    echo "❌ FAIL"
    ((FAILED++))
  fi
}

# Tests
test_criterion "Docker Compose config" "docker-compose config"
test_criterion "Ollama service healthy" "docker-compose ps | grep ollama | grep healthy"
test_criterion "Backend service healthy" "docker-compose ps | grep backend | grep healthy"
test_criterion "Health endpoint" "curl -f http://localhost:3000/health"
test_criterion "Ollama API" "curl -f http://localhost:11434/api/tags"
test_criterion "Integration tests" "cd backend && npm run test:integration"
test_criterion "Coverage > 80%" "cd backend && npm run test:cov | grep 'All files' | grep -E '[8-9][0-9]|100'"

echo ""
echo "📊 Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo "✅ Iteration 2 is VALID!"
  exit 0
else
  echo "❌ Iteration 2 has FAILURES"
  exit 1
fi
```

### Validación Manual

#### Checklist de Validación Manual

1. **Levantar servicios**
   ```bash
   docker-compose up -d
   ```
   - [ ] Servicios levantan sin errores
   - [ ] Logs no muestran errores críticos

2. **Verificar Ollama**
   ```bash
   curl http://localhost:11434/api/tags
   ```
   - [ ] Responde con lista de modelos
   - [ ] Incluye qwen2.5:0.5b

3. **Verificar Health**
   ```bash
   curl http://localhost:3000/health | jq
   ```
   - [ ] Status: "ok"
   - [ ] Ollama healthy: true
   - [ ] Circuit breaker open: false

4. **Test de Request**
   ```bash
   curl -X POST http://localhost:3000/api/ouija \
     -H "Content-Type: application/json" \
     -d '{"question": "¿Tendré suerte?", "tone": "wise", "language": "es"}' | jq
   ```
   - [ ] Responde correctamente
   - [ ] Source: "ollama"
   - [ ] Latencia < 30s

5. **Test de Fallback**
   ```bash
   # Detener Ollama
   docker-compose stop ollama

   # Hacer request
   curl -X POST http://localhost:3000/api/ouija \
     -H "Content-Type: application/json" \
     -d '{"question": "¿Amor?", "tone": "wise", "language": "es"}' | jq
   ```
   - [ ] Responde correctamente
   - [ ] Source: "database"
   - [ ] Latencia < 500ms

6. **Test de Circuit Breaker**
   ```bash
   # Hacer 3 requests con Ollama detenido
   for i in {1..3}; do
     curl -X POST http://localhost:3000/api/ouija \
       -H "Content-Type: application/json" \
       -d '{"question": "test '$i'"}' | jq
   done

   # Ver estado del circuit
   curl http://localhost:3000/health | jq '.ollama.circuitBreaker'
   ```
   - [ ] Circuit breaker se abre
   - [ ] Logs muestran apertura

7. **Test de Auto-Reset**
   ```bash
   # Esperar 60 segundos
   sleep 60

   # Levantar Ollama
   docker-compose start ollama

   # Hacer request
   curl -X POST http://localhost:3000/api/ouija \
     -H "Content-Type: application/json" \
     -d '{"question": "test"}' | jq
   ```
   - [ ] Circuit breaker se resetea
   - [ ] Request funciona

---

## Checklist Final

### Funcional (8 criterios)
- [ ] F-1: docker-compose up levanta todo el stack
- [ ] F-2: Ollama responde en < 30s (p95)
- [ ] F-3: Fallback a SQLite funciona
- [ ] F-4: Health endpoint muestra estado correcto
- [ ] F-5: Retry logic funciona (3 intentos)
- [ ] F-6: Circuit breaker funciona
- [ ] F-7: Auto-reset de circuit funciona
- [ ] F-8: Logs son útiles y estructurados

### Técnico (14 criterios)
- [ ] T-1: IT2-001 completado (Docker Compose)
- [ ] T-2: IT2-002 completado (Retry + Circuit Breaker)
- [ ] T-3: IT2-003 completado (Health Check)
- [ ] T-4: IT2-004 completado (Tests de Integración)
- [ ] T-5: IT2-005 completado (Logging)
- [ ] T-6: IT2-006 completado (Script de modelos)
- [ ] T-7: 8+ tests de integración creados
- [ ] T-8: Todos los tests pasan
- [ ] T-9: Coverage > 80%
- [ ] T-10: No hay errores de TypeScript
- [ ] T-11: ESLint pasa
- [ ] T-12: Prettier formatea correctamente
- [ ] T-13: No hay warnings en build
- [ ] T-14: No hay código muerto

### Performance (3 criterios)
- [ ] P-1: Ollama latency < 30s
- [ ] P-2: Fallback latency < 500ms
- [ ] P-3: Health check cacheado (< 10ms)

### Documentación (5 criterios)
- [ ] D-1: README actualizado
- [ ] D-2: .env.example completo
- [ ] D-3: Scripts documentados
- [ ] D-4: Swagger actualizado
- [ ] D-5: Comentarios JSDoc agregados

### Seguridad (3 criterios)
- [ ] S-1: No hay API keys en logs
- [ ] S-2: No hay información sensible expuesta
- [ ] S-3: Variables de entorno validadas

---

## Definición de "Iteración 2 Completa"

La Iteración 2 se considera **COMPLETA** cuando:

### Criterios Obligatorios (Must Have)
1. ✅ **Todas las tareas (IT2-001 a IT2-006) implementadas**
2. ✅ **Todos los tests (unitarios + integración) pasan**
3. ✅ **docker-compose up levanta todo sin errores**
4. ✅ **Ollama genera respuestas correctamente**
5. ✅ **Fallback a SQLite funciona cuando Ollama falla**
6. ✅ **Health endpoint refleja estado real**
7. ✅ **Circuit breaker funciona correctamente**
8. ✅ **Coverage > 80%**

### Criterios Importantes (Should Have)
9. ✅ **Logs estructurados implementados**
10. ✅ **Script de modelos funcional**
11. ✅ **README actualizado**
12. ✅ **Validación manual completa**

### Criterios Opcionales (Nice to Have)
13. ⭕ **Logs en archivo (producción)**
14. ⭕ **Métricas de performance**
15. ⭕ **Dashboard de monitoreo**

### Criterios de Salida (Exit Criteria)
- [ ] **Checklist Final** completado al 100%
- [ ] **Validación automática** pasa
- [ ] **Validación manual** pasa
- [ ] **Demo funcional** realizada
- [ ] **Documentación** revisada
- [ ] **KANBAN.md** actualizado (tareas en "Done")

---

## Próxima Iteración

Cuando todos los criterios estén cumplidos, procede con:
- **Iteración 3: Integración Groq Cloud**

---

**Total de Criterios**: 33
**Criterios Obligatorios**: 12
**Criterios Importantes**: 4
**Criterios Opcionales**: 3
**Criterios de Salida**: 6

**¡Éxito con la validación!** ✅
