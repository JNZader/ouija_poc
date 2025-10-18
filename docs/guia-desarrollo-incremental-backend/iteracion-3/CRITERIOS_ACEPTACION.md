# Criterios de Aceptación - Iteración 3: Integración Groq Cloud

## Índice
1. [Criterios Generales](#criterios-generales)
2. [Criterios por Tarea](#criterios-por-tarea)
3. [Validación de Criterios](#validación-de-criterios)
4. [Checklist Final](#checklist-final)
5. [Definición de "Iteración 3 Completa"](#definición-de-iteración-3-completa)

---

## Criterios Generales

### CG-1: Triple Fallback Funcional
- [ ] Sistema intenta Groq primero
- [ ] Si Groq falla, intenta Ollama automáticamente
- [ ] Si Ollama falla, usa SQLite automáticamente
- [ ] Nunca falla (siempre retorna respuesta)
- [ ] Campo `source` correcto en cada caso
- [ ] Logs muestran claramente el flujo

### CG-2: Performance
- [ ] Groq responde en < 5s (p95)
- [ ] Ollama responde en < 30s (p95)
- [ ] SQLite responde en < 500ms (p95)
- [ ] Latencia total máxima < 35s
- [ ] Dashboard responde en < 500ms

### CG-3: Observabilidad
- [ ] Logs estructurados con source
- [ ] Métricas disponibles en /dashboard
- [ ] Rate limit info disponible
- [ ] Health checks funcionan
- [ ] Errors descriptivos y útiles

---

## Criterios por Tarea

### IT3-001: Mejorar GroqService

#### CA-001: Validación de API Key
- [ ] Valida API key al iniciar (onModuleInit)
- [ ] Log de advertencia si no está configurada
- [ ] Log de éxito si está configurada
- [ ] Test call para validar key
- [ ] isAvailable() retorna false si no hay key

**Validación**:
```bash
# Sin API key
unset GROQ_API_KEY
npm run start:dev
# Debe mostrar warning
```

#### CA-002: Retry Logic
- [ ] 2 intentos máximos por request
- [ ] Delay de 2s entre intentos
- [ ] Logs de cada intento
- [ ] Falla después del 2do intento
- [ ] No reintentar en errores 401

**Validación**:
```typescript
// Test con servicio caído
jest.spyOn(fetch, 'fetch').mockRejectedValue(new Error());
// Debe mostrar 2 intentos en logs
```

#### CA-003: Timeout
- [ ] Timeout de 10s por request
- [ ] AbortController implementado
- [ ] Error claro cuando timeout
- [ ] Timeout configurable vía env
- [ ] Cleanup correcto del timeout

**Validación**:
```bash
GROQ_TIMEOUT=1000 npm run start:dev
# Requests lentas deben timeout
```

#### CA-004: Manejo de Errores
- [ ] Error 429 (rate limit) manejado
- [ ] Error 401 (auth) manejado
- [ ] Error de timeout manejado
- [ ] Respuesta inválida detectada
- [ ] Logs estructurados de errores

**Validación**:
```bash
# Ver logs de errores
docker-compose logs backend | grep "Groq"
```

---

### IT3-002: Sistema de Fallback Completo

#### CA-005: Orden de Fallback
- [ ] Groq es primario
- [ ] Ollama es secundario
- [ ] SQLite es terciario (último)
- [ ] Skip Groq si no disponible
- [ ] Skip Ollama si no healthy

**Validación**:
```bash
# Test con Groq disponible
curl -X POST http://localhost:3000/api/ouija \
  -d '{"question": "test"}' | jq '.data.source'
# Debe retornar "groq"
```

#### CA-006: Logs del Flujo
- [ ] Log [1/3] Trying Groq
- [ ] Log [2/3] Trying Ollama
- [ ] Log [3/3] Using SQLite
- [ ] Logs de éxito con elapsed time
- [ ] Logs de error con mensaje claro

**Validación**:
```bash
docker-compose logs backend --tail=50
# Debe mostrar flujo completo
```

#### CA-007: Respuesta Completa
- [ ] Incluye question
- [ ] Incluye response
- [ ] Incluye source (groq/ollama/database)
- [ ] Incluye model
- [ ] Incluye responseTime en ms
- [ ] Incluye personality y language

**Validación**:
```json
{
  "question": "¿Amor?",
  "response": "...",
  "source": "groq",
  "model": "llama-3.1-8b-instant",
  "responseTime": 2345
}
```

---

### IT3-003: Rate Limiting

#### CA-008: Token Bucket
- [ ] 30 tokens iniciales
- [ ] Decrementa 1 token por request
- [ ] Refill a 30 cada 60s
- [ ] checkLimit() retorna false cuando 0
- [ ] Logs de refill

**Validación**:
```typescript
const limiter = new RateLimiter(30, 60000);
for (let i = 0; i < 31; i++) {
  const allowed = await limiter.checkLimit();
  if (i < 30) expect(allowed).toBe(true);
  else expect(allowed).toBe(false);
}
```

#### CA-009: Integración con Groq
- [ ] GroqService usa rate limiter
- [ ] Lanza error cuando limit excedido
- [ ] Fallback automático cuando limit
- [ ] getRateLimitInfo() disponible
- [ ] Info incluye remaining y nextRefill

**Validación**:
```bash
# 35 requests rápidos
for i in {1..35}; do
  curl -X POST http://localhost:3000/api/ouija \
    -d '{"question": "test"}' &
done
wait

# Verificar sources
# Primeros 30: groq
# Resto: ollama o database
```

#### CA-010: Métricas de Rate Limit
- [ ] Remaining tokens disponible
- [ ] Total tokens disponible
- [ ] Next refill time disponible
- [ ] Dashboard muestra rate limit
- [ ] Logs cuando limit alcanzado

**Validación**:
```bash
curl http://localhost:3000/dashboard | jq '.services.groq.rateLimit'
```

---

### IT3-004: Dashboard de Métricas

#### CA-011: Endpoint Funcional
- [ ] GET /dashboard existe
- [ ] Retorna 200
- [ ] Formato JSON válido
- [ ] Responde en < 500ms
- [ ] Documentado en Swagger

**Validación**:
```bash
time curl http://localhost:3000/dashboard
# Debe responder < 500ms
```

#### CA-012: Información de Groq
- [ ] available (boolean)
- [ ] model (string)
- [ ] rateLimit.remaining
- [ ] rateLimit.total
- [ ] rateLimit.nextRefillMs

**Validación**:
```json
{
  "services": {
    "groq": {
      "available": true,
      "model": "llama-3.1-8b-instant",
      "rateLimit": {
        "remaining": 25,
        "total": 30,
        "nextRefillMs": 45000
      }
    }
  }
}
```

#### CA-013: Información de Ollama
- [ ] healthy (boolean)
- [ ] model (string)
- [ ] circuitBreaker.open
- [ ] circuitBreaker.failureCount

**Validación**:
```bash
curl http://localhost:3000/dashboard | jq '.services.ollama'
```

#### CA-014: Información de Database
- [ ] totalResponses (number)
- [ ] byCategory (array)
- [ ] Cuenta correcta
- [ ] Categorías correctas

**Validación**:
```bash
curl http://localhost:3000/dashboard | jq '.services.database'
```

---

### IT3-005: Tests End-to-End

#### CA-015: Tests de Groq
- [ ] Test: Groq responde correctamente
- [ ] Test: Response time < 10s
- [ ] Test: Structure correcta
- [ ] Test: Different personalities
- [ ] Test: Different languages

**Validación**:
```bash
npm run test:e2e -- --testNamePattern="Groq"
```

#### CA-016: Tests de Fallback
- [ ] Test: Fallback a Ollama funciona
- [ ] Test: Fallback a SQLite funciona
- [ ] Test: Siempre retorna respuesta
- [ ] Test: Source correcto
- [ ] Test: Rate limit activa fallback

**Validación**:
```bash
npm run test:e2e -- --testNamePattern="fallback"
```

#### CA-017: Tests de Dashboard
- [ ] Test: Dashboard retorna métricas
- [ ] Test: Estructura correcta
- [ ] Test: Incluye todos los servicios
- [ ] Test: Response time < 500ms

**Validación**:
```bash
npm run test:e2e -- --testNamePattern="dashboard"
```

#### CA-018: Coverage
- [ ] Coverage > 85% total
- [ ] GroqService > 90%
- [ ] OuijaService > 85%
- [ ] RateLimiter > 95%
- [ ] Dashboard > 80%

**Validación**:
```bash
npm run test:cov
```

---

## Validación de Criterios

### Script de Validación Automática

```bash
#!/bin/bash
# scripts/validate-iteration-3.sh

echo "🔍 Validating Iteration 3..."

PASSED=0
FAILED=0

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

# Functional Tests
test_criterion "Groq service available" "curl -f http://localhost:3000/dashboard | jq -e '.services.groq.available'"
test_criterion "Dashboard responds" "curl -f http://localhost:3000/dashboard"
test_criterion "Triple fallback works" "curl -f -X POST http://localhost:3000/api/ouija -d '{\"question\":\"test\"}'"

# Technical Tests
test_criterion "E2E tests pass" "cd backend && npm run test:e2e"
test_criterion "Coverage > 85%" "cd backend && npm run test:cov | grep -E 'All files.*8[5-9]|9[0-9]|100'"

# Performance Tests
test_criterion "Dashboard < 500ms" "timeout 1 curl http://localhost:3000/dashboard"

echo ""
echo "📊 Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo "✅ Iteration 3 is VALID!"
  exit 0
else
  echo "❌ Iteration 3 has FAILURES"
  exit 1
fi
```

### Validación Manual

#### 1. Test Triple Fallback

**Escenario A: Groq funciona**
```bash
# Con GROQ_API_KEY válida
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Tendré suerte?"}' | jq
```
- [ ] source = "groq"
- [ ] responseTime < 5000ms
- [ ] response válido

**Escenario B: Groq falla → Ollama**
```bash
# Sin GROQ_API_KEY
unset GROQ_API_KEY
npm run start:dev

curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Amor?"}' | jq
```
- [ ] source = "ollama"
- [ ] responseTime < 30000ms
- [ ] logs muestran skip de Groq

**Escenario C: Todo AI falla → SQLite**
```bash
# Sin Groq ni Ollama
docker-compose stop ollama
unset GROQ_API_KEY
npm run start:dev

curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Dinero?"}' | jq
```
- [ ] source = "database"
- [ ] responseTime < 500ms
- [ ] logs muestran skip de Groq y Ollama

#### 2. Test Rate Limiting

```bash
# 35 requests rápidos
for i in {1..35}; do
  curl -X POST http://localhost:3000/api/ouija \
    -H "Content-Type: application/json" \
    -d '{"question": "test '$i'"}' \
    -o response_$i.json &
done
wait

# Contar sources
cat response_*.json | jq -r '.data.source' | sort | uniq -c
```
- [ ] ~30 con "groq"
- [ ] ~5 con "ollama" o "database"
- [ ] Logs muestran rate limit

#### 3. Test Dashboard

```bash
curl http://localhost:3000/dashboard | jq
```
- [ ] services.groq existe
- [ ] services.ollama existe
- [ ] services.database existe
- [ ] rateLimit info presente
- [ ] timestamp reciente

---

## Checklist Final

### Funcional (8 criterios)
- [ ] F-1: Triple fallback Groq → Ollama → SQLite funciona
- [ ] F-2: Groq responde en < 5s cuando disponible
- [ ] F-3: Rate limiting 30 req/min implementado
- [ ] F-4: Fallback automático cuando rate limit
- [ ] F-5: Dashboard muestra métricas correctas
- [ ] F-6: Logs muestran flujo claramente
- [ ] F-7: Campo source correcto
- [ ] F-8: Nunca falla (100% uptime)

### Técnico (10 criterios)
- [ ] T-1: IT3-001 completado (GroqService)
- [ ] T-2: IT3-002 completado (Triple Fallback)
- [ ] T-3: IT3-003 completado (Rate Limiting)
- [ ] T-4: IT3-004 completado (Dashboard)
- [ ] T-5: IT3-005 completado (Tests E2E)
- [ ] T-6: 6+ tests E2E implementados
- [ ] T-7: Todos los tests pasan
- [ ] T-8: Coverage > 85%
- [ ] T-9: No hay errores TypeScript
- [ ] T-10: ESLint pasa

### Performance (5 criterios)
- [ ] P-1: Groq < 5s (p95)
- [ ] P-2: Ollama < 30s (p95)
- [ ] P-3: SQLite < 500ms (p95)
- [ ] P-4: Dashboard < 500ms
- [ ] P-5: Latencia total máxima < 35s

### Documentación (4 criterios)
- [ ] D-1: README actualizado con Groq setup
- [ ] D-2: .env.example con GROQ_API_KEY
- [ ] D-3: Swagger con /dashboard
- [ ] D-4: Comentarios JSDoc agregados

### Seguridad (2 criterios)
- [ ] S-1: API key no aparece en logs
- [ ] S-2: Dashboard no expone información sensible

---

## Definición de "Iteración 3 Completa"

La Iteración 3 se considera **COMPLETA** cuando:

### Criterios Obligatorios
1. ✅ Todas las tareas (IT3-001 a IT3-005) implementadas
2. ✅ Triple fallback funciona en todos los escenarios
3. ✅ Rate limiting de Groq implementado
4. ✅ Dashboard disponible y funcional
5. ✅ Tests E2E pasan (6+ tests)
6. ✅ Coverage > 85%
7. ✅ Groq responde en < 5s
8. ✅ Sistema nunca falla (100% uptime)

### Criterios Importantes
9. ✅ Logs estructurados y claros
10. ✅ Documentación actualizada
11. ✅ Validación manual completa
12. ✅ Performance dentro de targets

### Criterios de Salida
- [ ] Checklist Final completado al 100%
- [ ] Validación automática pasa
- [ ] Validación manual pasa
- [ ] Demo funcional realizada
- [ ] KANBAN.md actualizado
- [ ] Listo para deploy (Iteración 4)

---

**Total de Criterios**: 29
**Criterios Obligatorios**: 8
**Criterios Importantes**: 4

**Próximo**: [Iteración 4 - Deploy en Koyeb](../iteracion-4/PLAN.md)

**¡Éxito con la validación!** ✅
