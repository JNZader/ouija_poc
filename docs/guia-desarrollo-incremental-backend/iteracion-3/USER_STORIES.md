# Historias de Usuario - Iteración 3: Integración Groq Cloud

## Índice
1. [US-3.1: GroqService Mejorado](#us-31-groqservice-mejorado)
2. [US-3.2: Triple Fallback System](#us-32-triple-fallback-system)
3. [US-3.3: Rate Limiting](#us-33-rate-limiting)
4. [US-3.4: Dashboard de Métricas](#us-34-dashboard-de-métricas)
5. [US-3.5: Tests End-to-End](#us-35-tests-end-to-end)
6. [US-3.6: Monitoreo de Fallbacks](#us-36-monitoreo-de-fallbacks)
7. [Matriz de Trazabilidad](#matriz-de-trazabilidad)
8. [Orden de Implementación](#orden-de-implementación-recomendado)

---

## US-3.1: GroqService Mejorado

**Como** sistema
**Quiero** un servicio robusto de Groq con retry y timeout
**Para** tener respuestas ultra-rápidas (< 5s) con manejo de errores

### Criterios de Aceptación
- [ ] GroqService valida API key al iniciar
- [ ] Retry logic con 2 intentos por request
- [ ] Timeout de 10s por request
- [ ] Maneja errores 429 (rate limit) correctamente
- [ ] Maneja errores 401 (auth) correctamente
- [ ] Logs estructurados de cada intento
- [ ] Método isAvailable() retorna estado correcto

### Tareas Relacionadas
- IT3-001: Mejorar GroqService (5 pts)

### Valor de Negocio
**Alto** - Base para respuestas rápidas

### Riesgos
- API key puede expirar
- Groq API puede estar caída
- Rate limits pueden alcanzarse rápidamente

### Definición de "Done"
- Tests unitarios para todos los casos
- Logs muestran intentos y errores
- Documentación del servicio
- API key validada al inicio

---

## US-3.2: Triple Fallback System

**Como** usuario
**Quiero** siempre recibir una respuesta, sin importar qué servicios fallen
**Para** tener una experiencia confiable y consistente

### Criterios de Aceptación
- [ ] Sistema intenta Groq primero
- [ ] Si Groq falla, intenta Ollama
- [ ] Si Ollama falla, usa SQLite
- [ ] Respuesta incluye campo `source` (groq/ollama/database)
- [ ] Respuesta incluye `responseTime` en ms
- [ ] Logs muestran claramente qué servicio respondió
- [ ] Latencia total < 35s en el peor caso

### Tareas Relacionadas
- IT3-002: Sistema de Fallback Completo (5 pts)

### Valor de Negocio
**Crítico** - Garantiza 100% de disponibilidad

### Riesgos
- Cascading failures pueden aumentar latencia
- Logs pueden ser confusos con múltiples intentos

### Definición de "Done"
- Tests E2E de todos los escenarios
- Métricas de uso por fuente
- Logs claros del flujo
- Documentación del algoritmo

---

## US-3.3: Rate Limiting

**Como** sistema
**Quiero** respetar los límites de rate de Groq
**Para** no ser bloqueado y usar Ollama como fallback automático

### Criterios de Aceptación
- [ ] Token bucket implementado (30 req/min)
- [ ] Rechaza requests cuando se excede el límite
- [ ] Refill automático cada minuto
- [ ] Logs cuando se rechaza por rate limit
- [ ] Fallback a Ollama cuando rate limit alcanzado
- [ ] Método getRemainingTokens() disponible
- [ ] Método getTimeUntilRefill() disponible

### Tareas Relacionadas
- IT3-003: Rate Limiting (3 pts)

### Valor de Negocio
**Alto** - Protege de bloqueos de API

### Riesgos
- Cálculo incorrecto puede bloquear prematuramente
- No considera rate limits por usuario

### Definición de "Done"
- Tests unitarios de token bucket
- Simulación de 30+ requests/minuto
- Logs de refill automático
- Documentación del algoritmo

---

## US-3.4: Dashboard de Métricas

**Como** desarrollador
**Quiero** un endpoint con métricas del sistema
**Para** monitorear salud y uso de servicios

### Criterios de Aceptación
- [ ] Endpoint GET /dashboard implementado
- [ ] Muestra estado de Groq (healthy/rate limit info)
- [ ] Muestra estado de Ollama (healthy/model)
- [ ] Muestra estadísticas de SQLite (total respuestas)
- [ ] Incluye timestamp de la consulta
- [ ] Respuesta en formato JSON estructurado
- [ ] Documentación Swagger

### Tareas Relacionadas
- IT3-004: Dashboard de Métricas (3 pts)

### Valor de Negocio
**Medio** - Mejora observabilidad

### Riesgos
- Endpoint puede ser lento si hace muchas consultas
- Información sensible puede exponerse

### Definición de "Done"
- Endpoint responde < 500ms
- Tests de formato de respuesta
- Swagger documentation
- No expone API keys

---

## US-3.5: Tests End-to-End

**Como** desarrollador
**Quiero** tests que verifiquen el flujo completo de fallback
**Para** garantizar que el sistema funciona en todos los escenarios

### Criterios de Aceptación
- [ ] Test: Groq responde correctamente
- [ ] Test: Fallback a Ollama cuando Groq falla
- [ ] Test: Fallback a SQLite cuando ambos AI fallan
- [ ] Test: Rate limit activa fallback
- [ ] Test: Response time < 35s en peor caso
- [ ] Test: Campo `source` correcto en cada caso
- [ ] Coverage > 85%

### Tareas Relacionadas
- IT3-005: Tests E2E (5 pts)

### Valor de Negocio
**Alto** - Previene regresiones críticas

### Riesgos
- Tests lentos (requieren servicios reales)
- Flakiness por dependencias externas

### Definición de "Done"
- 6+ tests E2E implementados
- Todos los tests pasan
- Tests documentados
- CI/CD ejecuta tests

---

## US-3.6: Monitoreo de Fallbacks

**Como** administrador
**Quiero** ver métricas de uso de cada fuente (Groq/Ollama/SQLite)
**Para** entender patrones de fallo y optimizar

### Criterios de Aceptación
- [ ] Logs incluyen fuente de cada respuesta
- [ ] Métricas de % de uso por fuente disponibles
- [ ] Dashboard muestra distribución de fuentes
- [ ] Alertas cuando > 50% usa fallback
- [ ] Histórico de fallbacks disponible en logs

### Tareas Relacionadas
- IT3-004: Dashboard de Métricas (3 pts)

### Valor de Negocio
**Medio** - Insights para optimización

### Riesgos
- Métricas pueden consumir recursos
- Logs muy verbosos

### Definición de "Done"
- Métricas disponibles en dashboard
- Logs estructurados con source
- Documentación de métricas
- Tests de tracking

---

## Matriz de Trazabilidad

| Historia | Tareas | Prioridad | Complejidad | Dependencias |
|----------|--------|-----------|-------------|--------------|
| US-3.1 | IT3-001 | P0 | 5 pts | Ninguna |
| US-3.2 | IT3-002 | P0 | 5 pts | US-3.1 |
| US-3.3 | IT3-003 | P0 | 3 pts | US-3.1 |
| US-3.4 | IT3-004 | P1 | 3 pts | US-3.1, US-3.3 |
| US-3.5 | IT3-005 | P0 | 5 pts | US-3.2 |
| US-3.6 | IT3-004 | P2 | (incluido) | US-3.4 |

**Total**: 13 puntos de complejidad

---

## Orden de Implementación Recomendado

### Fase 1: Servicios Base (Días 1-3)
1. **US-3.1**: GroqService Mejorado
   - Implementar servicio con retry
   - Validación de API key
   - Timeout de 10s
   - Tests unitarios

2. **US-3.3**: Rate Limiting
   - Implementar token bucket
   - Integrar con GroqService
   - Tests de rate limiting

### Fase 2: Integración (Días 4-5)
3. **US-3.2**: Triple Fallback System
   - Actualizar OuijaService
   - Implementar lógica de fallback
   - Tests de integración

4. **US-3.6**: Monitoreo de Fallbacks
   - Agregar métricas
   - Logs estructurados
   - Tracking de uso

### Fase 3: Observabilidad y Testing (Días 6-7)
5. **US-3.4**: Dashboard de Métricas
   - Crear endpoint /dashboard
   - Agregar estadísticas
   - Swagger documentation

6. **US-3.5**: Tests End-to-End
   - Tests de todos los escenarios
   - Tests de performance
   - CI/CD integration

---

## Métricas de Éxito

### Funcionales
- ✅ Triple fallback funciona en 100% de casos
- ✅ Groq responde en < 5s (p95)
- ✅ Rate limiting previene bloqueos
- ✅ Dashboard muestra estado en tiempo real

### Técnicas
- ✅ 6+ tests E2E
- ✅ Coverage > 85%
- ✅ 0 errores no controlados
- ✅ Logs estructurados completos

### Negocio
- ✅ 70% requests usa Groq (rápido)
- ✅ 25% requests usa Ollama (backup)
- ✅ 5% requests usa SQLite (fallback final)
- ✅ Latencia promedio < 5s

---

## Notas Técnicas

### ¿Por qué Groq primero?
1. **Velocidad**: 10x más rápido que Ollama
2. **Costo**: Free tier generoso (30 req/min)
3. **UX**: Usuario prefiere respuesta rápida
4. **Ollama como backup**: Solo usa recursos cuando necesario

### ¿Por qué 30 requests/minuto?
- Límite del free tier de Groq
- Suficiente para uso de desarrollo
- Ollama cubre overflow

### ¿Por qué timeout de 10s para Groq?
- Groq normalmente responde en 1-3s
- 10s es generoso para casos lentos
- Falla rápido para intentar Ollama

### ¿Por qué solo 2 retries en Groq?
- Groq es muy rápido, si falla probablemente esté caído
- Evita latencia innecesaria
- Ollama es mejor backup que reintentar Groq

---

## Riesgos Globales de la Iteración

### Alto Riesgo
- **Groq API key inválida**: Sistema no puede usar Groq
  - *Mitigación*: Validar API key al inicio + fallback automático

- **Rate limits alcanzados frecuentemente**: Mala UX por latencia
  - *Mitigación*: Token bucket + fallback a Ollama

### Medio Riesgo
- **Groq API intermitente**: Fluctuaciones en disponibilidad
  - *Mitigación*: Retry logic + fallback rápido

- **Triple fallback aumenta complejidad**: Difícil debugging
  - *Mitigación*: Logs muy claros de cada paso

### Bajo Riesgo
- **Dashboard consume recursos**: Overhead de métricas
  - *Mitigación*: Cache de métricas + lazy loading

---

## Definición de "Iteración 3 Completa"

La iteración 3 está completa cuando:

1. ✅ Todas las historias de usuario (US-3.1 a US-3.6) están implementadas
2. ✅ Todas las tareas (IT3-001 a IT3-005) están completadas
3. ✅ Triple fallback funciona correctamente
4. ✅ Rate limiting de Groq implementado
5. ✅ Dashboard de métricas disponible
6. ✅ Tests E2E pasan (6+ tests)
7. ✅ Logs muestran claramente qué servicio respondió
8. ✅ Documentación actualizada
9. ✅ Coverage > 85%
10. ✅ Sistema probado manualmente con éxito

---

## Escenarios de Prueba Manual

### Escenario 1: Groq Funciona
```bash
# Con Groq API key válida
curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Tendré suerte?", "tone": "wise", "language": "es"}'
```
**Esperado**: `source: "groq"`, latencia < 5s

### Escenario 2: Groq Falla, Ollama Funciona
```bash
# Sin GROQ_API_KEY
unset GROQ_API_KEY
npm run start:dev

curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Amor?", "tone": "wise", "language": "es"}'
```
**Esperado**: `source: "ollama"`, latencia < 30s

### Escenario 3: Todo AI Falla, SQLite Funciona
```bash
# Detener Ollama y sin Groq
docker-compose stop ollama
unset GROQ_API_KEY
npm run start:dev

curl -X POST http://localhost:3000/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Dinero?", "tone": "wise", "language": "es"}'
```
**Esperado**: `source: "database"`, latencia < 500ms

### Escenario 4: Rate Limit
```bash
# Hacer 31+ requests en 1 minuto
for i in {1..35}; do
  curl -X POST http://localhost:3000/api/ouija \
    -H "Content-Type: application/json" \
    -d '{"question": "test '$i'"}' &
done
wait
```
**Esperado**: Primeros 30 usan Groq, resto usa Ollama

### Escenario 5: Dashboard
```bash
curl http://localhost:3000/dashboard | jq
```
**Esperado**: JSON con estado de todos los servicios

---

**Siguiente**: [Iteración 4 - Deploy en Koyeb](../iteracion-4/PLAN.md)
