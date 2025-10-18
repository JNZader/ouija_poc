# Historias de Usuario - Iteración 2: Integración Ollama Local

## Índice
1. [US-2.1: Docker Compose con Ollama](#us-21-docker-compose-con-ollama)
2. [US-2.2: OllamaService con Retry Logic](#us-22-ollamaservice-con-retry-logic)
3. [US-2.3: Circuit Breaker Pattern](#us-23-circuit-breaker-pattern)
4. [US-2.4: Health Check de Ollama](#us-24-health-check-de-ollama)
5. [US-2.5: Logging Estructurado](#us-25-logging-estructurado)
6. [US-2.6: Tests de Integración](#us-26-tests-de-integración)
7. [US-2.7: Script de Descarga de Modelos](#us-27-script-de-descarga-de-modelos)
8. [US-2.8: Fallback Automático](#us-28-fallback-automático)
9. [Matriz de Trazabilidad](#matriz-de-trazabilidad)
10. [Orden de Implementación](#orden-de-implementación-recomendado)

---

## US-2.1: Docker Compose con Ollama

**Como** desarrollador
**Quiero** levantar Ollama y el backend con un solo comando
**Para** tener un entorno de desarrollo consistente y reproducible

### Criterios de Aceptación
- [ ] `docker-compose up` levanta backend + Ollama
- [ ] Ollama se inicializa en el puerto 11434
- [ ] Backend se conecta automáticamente a Ollama
- [ ] Volúmenes persistentes para modelos de Ollama
- [ ] Health checks configurados para ambos servicios
- [ ] Variables de entorno documentadas en `.env.example`

### Tareas Relacionadas
- IT2-001: Docker Compose con Ollama (8 pts)

### Valor de Negocio
**Alto** - Infraestructura base para IA local

### Riesgos
- Ollama puede tardar en descargar modelos (primera vez)
- Consumo alto de recursos (RAM: 2GB+)

### Definición de "Done"
- Servicios levantados sin errores
- Ollama responde en `/api/tags`
- Backend conecta con Ollama
- Documentación actualizada

---

## US-2.2: OllamaService con Retry Logic

**Como** sistema
**Quiero** reintentar requests fallidos a Ollama automáticamente
**Para** mejorar la resiliencia ante errores temporales

### Criterios de Aceptación
- [ ] 3 reintentos automáticos por request
- [ ] Backoff exponencial entre reintentos (2s, 4s, 8s)
- [ ] Timeout de 30s por intento
- [ ] Logs claros de cada intento
- [ ] Falla después del 3er intento
- [ ] Métricas de reintentos disponibles

### Tareas Relacionadas
- IT2-002: Mejorar OllamaService con Retry (5 pts)

### Valor de Negocio
**Alto** - Reduce fallos percibidos por el usuario

### Riesgos
- Latencia aumentada si Ollama es lento
- Puede enmascarar problemas reales

### Definición de "Done"
- Tests unitarios para retry logic
- Logs muestran reintentos
- Métricas de reintentos en logs
- Documentación del comportamiento

---

## US-2.3: Circuit Breaker Pattern

**Como** sistema
**Quiero** abrir un circuit breaker cuando Ollama falla repetidamente
**Para** evitar saturar el servicio y fallar rápido

### Criterios de Aceptación
- [ ] Circuit breaker se abre tras 3 fallos consecutivos
- [ ] Estado "open" dura 60 segundos
- [ ] Auto-reset después del timeout
- [ ] Logs claros del estado del circuit breaker
- [ ] Health endpoint refleja estado del circuit
- [ ] Fallback inmediato cuando circuit está abierto

### Tareas Relacionadas
- IT2-002: Mejorar OllamaService con Retry (5 pts)

### Valor de Negocio
**Medio** - Protege el sistema de cascading failures

### Riesgos
- Puede cerrar prematuramente si el timeout es muy corto
- Usuarios ven respuestas de fallback durante el periodo

### Definición de "Done"
- Tests simulan apertura de circuit
- Logs muestran apertura/cierre
- Auto-reset funciona correctamente
- Documentación del patrón

---

## US-2.4: Health Check de Ollama

**Como** sistema
**Quiero** verificar que Ollama está disponible antes de usarlo
**Para** fallar rápido y usar fallback sin demoras

### Criterios de Aceptación
- [ ] Health check cachea resultado por 1 minuto
- [ ] Endpoint `/health` muestra estado de Ollama
- [ ] Timeout de 5s para health check
- [ ] No bloquea requests de usuario
- [ ] Incluye URL y modelo en la respuesta
- [ ] Estado "degraded" cuando Ollama está caído

### Tareas Relacionadas
- IT2-003: Health Check de Ollama (3 pts)

### Valor de Negocio
**Medio** - Mejora observabilidad y debugging

### Riesgos
- Cache puede mostrar estado desactualizado
- Health check agrega latencia si no se cachea

### Definición de "Done"
- Health endpoint actualizado
- Cache funciona correctamente
- Tests de health check
- Documentación Swagger actualizada

---

## US-2.5: Logging Estructurado

**Como** desarrollador
**Quiero** logs estructurados con contexto relevante
**Para** debuggear problemas fácilmente

### Criterios de Aceptación
- [ ] Logs incluyen timestamp, nivel, contexto
- [ ] Logs de Ollama incluyen modelo, prompt length, intento
- [ ] Errores incluyen stack trace y context
- [ ] Colores en desarrollo, JSON en producción
- [ ] Niveles: DEBUG, INFO, WARN, ERROR
- [ ] Logs no exponen información sensible

### Tareas Relacionadas
- IT2-005: Logging Estructurado (2 pts)

### Valor de Negocio
**Bajo** - Mejora experiencia de desarrollo

### Riesgos
- Logs muy verbosos pueden afectar performance
- Información sensible puede filtrarse

### Definición de "Done"
- Winston configurado
- Logs estructurados en todos los servicios
- Tests verifican formato de logs
- Documentación de niveles de log

---

## US-2.6: Tests de Integración

**Como** desarrollador
**Quiero** tests que verifiquen integración real con Ollama
**Para** detectar problemas antes de deploy

### Criterios de Aceptación
- [ ] Test de conexión a Ollama
- [ ] Test de generación de respuesta
- [ ] Test de timeout handling
- [ ] Test de fallback cuando Ollama falla
- [ ] Tests requieren `docker-compose up ollama`
- [ ] Coverage > 80% en OllamaService
- [ ] Tests pasan en CI/CD

### Tareas Relacionadas
- IT2-004: Tests de Integración (5 pts)

### Valor de Negocio
**Alto** - Previene regresiones

### Riesgos
- Tests lentos (requieren Ollama real)
- Flakiness si Ollama es inestable

### Definición de "Done"
- 8+ tests de integración
- Tests pasan localmente
- Tests documentados
- CI/CD ejecuta tests

---

## US-2.7: Script de Descarga de Modelos

**Como** desarrollador
**Quiero** un script que descargue modelos de Ollama automáticamente
**Para** no tener que hacerlo manualmente

### Criterios de Aceptación
- [ ] Script descarga `qwen2.5:0.5b` y `llama3.2:1b`
- [ ] Muestra progreso de descarga
- [ ] Verifica si modelo ya existe
- [ ] Lista modelos disponibles al finalizar
- [ ] Maneja errores de red
- [ ] Documentado en README

### Tareas Relacionadas
- IT2-006: Script de Descarga de Modelos (2 pts)

### Valor de Negocio
**Bajo** - Mejora experiencia de setup

### Riesgos
- Modelos grandes tardan mucho en descargar
- Puede fallar sin conexión a internet

### Definición de "Done"
- Script funciona correctamente
- Modelos descargados
- Documentación en README
- Script en `package.json` scripts

---

## US-2.8: Fallback Automático

**Como** usuario
**Quiero** recibir siempre una respuesta, incluso si Ollama falla
**Para** tener una experiencia consistente

### Criterios de Aceptación
- [ ] Si Ollama falla, usa SQLite automáticamente
- [ ] Respuesta incluye campo `source: "database"` cuando usa fallback
- [ ] Latencia < 500ms para fallback
- [ ] Logs indican claramente el fallback
- [ ] Frontend puede mostrar indicador de fallback
- [ ] Métricas de uso de fallback disponibles

### Tareas Relacionadas
- IT2-002: Mejorar OllamaService con Retry (5 pts)
- IT2-003: Health Check de Ollama (3 pts)

### Valor de Negocio
**Alto** - Garantiza disponibilidad del servicio

### Riesgos
- Usuarios no notan cuando Ollama está caído
- Calidad de respuestas menor en fallback

### Definición de "Done"
- Fallback funciona correctamente
- Tests verifican fallback
- Métricas de uso
- Documentación del flujo

---

## Matriz de Trazabilidad

| Historia | Tareas | Prioridad | Complejidad | Dependencias |
|----------|--------|-----------|-------------|--------------|
| US-2.1 | IT2-001 | P0 | 8 pts | Ninguna |
| US-2.2 | IT2-002 | P0 | 5 pts | US-2.1 |
| US-2.3 | IT2-002 | P1 | (incluido) | US-2.2 |
| US-2.4 | IT2-003 | P0 | 3 pts | US-2.1 |
| US-2.5 | IT2-005 | P2 | 2 pts | Ninguna |
| US-2.6 | IT2-004 | P0 | 5 pts | US-2.1, US-2.2 |
| US-2.7 | IT2-006 | P3 | 2 pts | US-2.1 |
| US-2.8 | IT2-002, IT2-003 | P0 | (incluido) | US-2.2, US-2.4 |

**Total**: 18 puntos de complejidad

---

## Orden de Implementación Recomendado

### Fase 1: Infraestructura (Días 1-3)
1. **US-2.1**: Docker Compose con Ollama
   - Configura docker-compose.yml
   - Crea .env.example
   - Verifica conectividad

2. **US-2.7**: Script de Descarga de Modelos
   - Crea scripts/download-models.sh
   - Descarga modelos
   - Documenta en README

### Fase 2: Lógica de Negocio (Días 4-6)
3. **US-2.4**: Health Check de Ollama
   - Implementa health check
   - Actualiza /health endpoint
   - Tests unitarios

4. **US-2.2**: OllamaService con Retry Logic
   - Implementa retry logic
   - Backoff exponencial
   - Tests unitarios

5. **US-2.3**: Circuit Breaker Pattern
   - Implementa circuit breaker
   - Auto-reset logic
   - Tests unitarios

6. **US-2.8**: Fallback Automático
   - Integra OllamaService con FallbackService
   - Tests de fallback
   - Métricas

### Fase 3: Calidad y Observabilidad (Días 7-10)
7. **US-2.5**: Logging Estructurado
   - Configura Winston
   - Actualiza logs en servicios
   - Verifica no hay info sensible

8. **US-2.6**: Tests de Integración
   - Tests de conexión
   - Tests de generación
   - Tests de fallback
   - CI/CD integration

---

## Métricas de Éxito

### Funcionales
- ✅ Ollama responde en < 30s (p95)
- ✅ Fallback funciona en < 500ms
- ✅ Circuit breaker previene cascading failures
- ✅ 0 downtime para usuarios (gracias a fallback)

### Técnicas
- ✅ 8+ tests de integración
- ✅ Coverage > 80%
- ✅ 0 errores no manejados
- ✅ Logs estructurados en todos los servicios

### Negocio
- ✅ Sistema completamente funcional con IA local
- ✅ Resiliencia ante fallos de Ollama
- ✅ Experiencia de desarrollo mejorada
- ✅ Base sólida para Iteración 3 (Groq)

---

## Notas Técnicas

### ¿Por qué 3 reintentos?
- Balance entre resiliencia y latencia
- Ollama puede fallar temporalmente por carga
- 3 intentos = probabilidad > 95% de éxito

### ¿Por qué Circuit Breaker?
- Evita saturar Ollama cuando está caído
- Falla rápido sin esperar timeouts
- Protege recursos del sistema

### ¿Por qué Health Check cacheado?
- Reduce overhead en cada request
- Ollama no cambia de estado tan frecuentemente
- 1 minuto es suficiente para detección

### ¿Por qué Logging Estructurado?
- Facilita debugging en producción
- Permite agregación de logs
- Integración con herramientas de monitoreo

---

## Riesgos Globales de la Iteración

### Alto Riesgo
- **Ollama muy lento**: Modelo muy grande o CPU insuficiente
  - *Mitigación*: Usar modelo pequeño (qwen2.5:0.5b)

- **Ollama se cae frecuentemente**: Inestabilidad del servicio
  - *Mitigación*: Fallback a SQLite siempre disponible

### Medio Riesgo
- **Consumo excesivo de RAM**: Ollama + Backend + Frontend
  - *Mitigación*: Documentar requisitos mínimos (8GB RAM)

- **Tests lentos**: Tests de integración requieren Ollama real
  - *Mitigación*: Ejecutar solo en CI/CD, no en watch mode

### Bajo Riesgo
- **Logs muy verbosos**: Demasiada información en logs
  - *Mitigación*: Configurar niveles de log por entorno

---

## Definición de "Iteración 2 Completa"

La iteración 2 está completa cuando:

1. ✅ Todas las historias de usuario (US-2.1 a US-2.8) están implementadas
2. ✅ Todas las tareas (IT2-001 a IT2-006) están completadas
3. ✅ `docker-compose up` levanta todo el stack sin errores
4. ✅ Tests de integración pasan (8+ tests)
5. ✅ Ollama genera respuestas correctamente
6. ✅ Fallback a SQLite funciona cuando Ollama falla
7. ✅ Health endpoint refleja estado de Ollama
8. ✅ Logs estructurados y útiles
9. ✅ Documentación actualizada (README, .env.example)
10. ✅ Sistema probado manualmente con éxito

---

**Siguiente**: [Iteración 3 - Integración Groq Cloud](../iteracion-3/PLAN.md)
