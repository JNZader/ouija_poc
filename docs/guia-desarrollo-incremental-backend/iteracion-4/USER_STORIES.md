# Historias de Usuario - Iteración 4: Deploy en Koyeb

## Índice
1. [US-4.1: Dockerfile Multi-Stage](#us-41-dockerfile-multi-stage)
2. [US-4.2: Deploy Automático en Koyeb](#us-42-deploy-automático-en-koyeb)
3. [US-4.3: Variables de Entorno Seguras](#us-43-variables-de-entorno-seguras)
4. [US-4.4: CI/CD con GitHub Actions](#us-44-cicd-con-github-actions)
5. [US-4.5: Health Checks en Producción](#us-45-health-checks-en-producción)
6. [US-4.6: Documentación de Deploy](#us-46-documentación-de-deploy)
7. [US-4.7: Smoke Tests en Producción](#us-47-smoke-tests-en-producción)
8. [Matriz de Trazabilidad](#matriz-de-trazabilidad)
9. [Orden de Implementación](#orden-de-implementación-recomendado)

---

## US-4.1: Dockerfile Multi-Stage

**Como** DevOps engineer
**Quiero** un Dockerfile optimizado multi-stage
**Para** reducir tamaño de imagen y mejorar seguridad

### Criterios de Aceptación
- [ ] Dockerfile con 3 stages (builder, ollama, production)
- [ ] Stage builder compila NestJS
- [ ] Stage ollama descarga modelo
- [ ] Stage production solo contiene artifacts necesarios
- [ ] Imagen final < 500MB (sin Ollama) o < 2GB (con Ollama)
- [ ] Health check configurado en Dockerfile
- [ ] Script de inicio para Ollama best-effort

### Tareas Relacionadas
- IT4-001: Dockerfile Multi-Stage (8 pts)

### Valor de Negocio
**Alto** - Reduce tiempo de deploy y costos

### Riesgos
- Ollama puede fallar por falta de RAM
- Build puede ser lento en primera vez

### Definición de "Done"
- Docker build exitoso
- Imagen ejecuta localmente
- Health check funciona
- Documentación del Dockerfile

---

## US-4.2: Deploy Automático en Koyeb

**Como** desarrollador
**Quiero** deploy automático desde GitHub
**Para** no tener que hacer deploy manual

### Criterios de Aceptación
- [ ] Cuenta Koyeb configurada
- [ ] Repositorio GitHub conectado
- [ ] Service configurado (koyeb.yaml)
- [ ] Auto-deploy en push a main
- [ ] Health checks configurados
- [ ] URL pública accesible
- [ ] Logs accesibles en dashboard

### Tareas Relacionadas
- IT4-002: Deploy en Koyeb (5 pts)

### Valor de Negocio
**Crítico** - Sistema en producción

### Riesgos
- Free tier limitado (512MB RAM)
- Ollama puede no funcionar
- Costos si se excede free tier

### Definición de "Done"
- Deploy exitoso
- Health endpoint retorna 200
- API responde correctamente
- Logs no muestran errores críticos

---

## US-4.3: Variables de Entorno Seguras

**Como** administrador
**Quiero** gestionar secrets de forma segura
**Para** no exponer API keys en código

### Criterios de Aceptación
- [ ] GROQ_API_KEY en Koyeb Secrets
- [ ] Variables de entorno validadas al inicio
- [ ] Error claro si falta variable requerida
- [ ] .env.example actualizado
- [ ] Secrets no aparecen en logs
- [ ] Validación con class-validator

### Tareas Relacionadas
- IT4-003: Variables de Entorno Seguras (3 pts)

### Valor de Negocio
**Alto** - Seguridad crítica

### Riesgos
- API keys pueden filtrarse en logs
- Variables mal configuradas rompen app

### Definición de "Done"
- Validación funciona
- Tests de validación
- Documentación de variables
- No hay secrets en código

---

## US-4.4: CI/CD con GitHub Actions

**Como** desarrollador
**Quiero** tests automáticos antes de deploy
**Para** detectar bugs antes de producción

### Criterios de Aceptación
- [ ] GitHub Actions configurado
- [ ] Tests unitarios ejecutan en CI
- [ ] Lint ejecuta en CI
- [ ] Build ejecuta en CI
- [ ] Coverage reportado
- [ ] Docker build en CI
- [ ] Deploy solo si tests pasan

### Tareas Relacionadas
- IT4-004: GitHub Actions CI/CD (5 pts)

### Valor de Negocio
**Alto** - Previene bugs en producción

### Riesgos
- CI puede ser lento
- Costos de GitHub Actions

### Definición de "Done"
- Pipeline completo funciona
- Badge de CI en README
- Tests pasan en CI
- Deploy automático funciona

---

## US-4.5: Health Checks en Producción

**Como** administrador
**Quiero** health checks robustos
**Para** monitorear estado del sistema

### Criterios de Aceptación
- [ ] Health endpoint retorna status detallado
- [ ] Verifica database
- [ ] Verifica Ollama (degraded si falla)
- [ ] Verifica Groq (degraded si falla)
- [ ] Incluye version y environment
- [ ] Promise.allSettled para no bloquear
- [ ] Timeout de 5s en health check

### Tareas Relacionadas
- IT4-005: Health Checks en Producción (2 pts)

### Valor de Negocio
**Medio** - Mejora observabilidad

### Riesgos
- Health check puede ser lento
- Puede dar falsos positivos

### Definición de "Done"
- Health endpoint completo
- Tests de health check
- Koyeb usa health check
- Documentación Swagger

---

## US-4.6: Documentación de Deploy

**Como** nuevo desarrollador
**Quiero** documentación clara de deployment
**Para** poder hacer deploy yo mismo

### Criterios de Aceptación
- [ ] README con instrucciones de deploy
- [ ] Prerequisitos listados
- [ ] Paso a paso detallado
- [ ] Troubleshooting común
- [ ] Screenshots del proceso
- [ ] Variables de entorno documentadas
- [ ] Limitaciones conocidas explicadas

### Tareas Relacionadas
- IT4-006: Documentación de Deploy (3 pts)

### Valor de Negocio
**Medio** - Facilita onboarding

### Riesgos
- Documentación desactualizada rápido
- Demasiado detalle puede confundir

### Definición de "Done"
- README completo
- Sección de deployment
- Troubleshooting section
- Revisado por otro dev

---

## US-4.7: Smoke Tests en Producción

**Como** QA engineer
**Quiero** smoke tests después de deploy
**Para** verificar que todo funciona

### Criterios de Aceptación
- [ ] Test: Health endpoint retorna 200
- [ ] Test: POST /ouija/ask funciona
- [ ] Test: Dashboard accesible
- [ ] Test: Swagger docs accesible
- [ ] Test: Response time < 10s
- [ ] Scripts automatizados
- [ ] Ejecutan post-deploy

### Tareas Relacionadas
- IT4-005: Health Checks en Producción (2 pts)

### Valor de Negocio
**Alto** - Confianza en deploys

### Riesgos
- Tests pueden fallar por latencia
- Pueden generar costos en Groq

### Definición de "Done"
- 5+ smoke tests
- Scripts en package.json
- Documentación de tests
- Tests pasan post-deploy

---

## Matriz de Trazabilidad

| Historia | Tareas | Prioridad | Complejidad | Dependencias |
|----------|--------|-----------|-------------|--------------|
| US-4.1 | IT4-001 | P0 | 8 pts | Ninguna |
| US-4.2 | IT4-002 | P0 | 5 pts | US-4.1 |
| US-4.3 | IT4-003 | P0 | 3 pts | Ninguna |
| US-4.4 | IT4-004 | P0 | 5 pts | US-4.1 |
| US-4.5 | IT4-005 | P1 | 2 pts | US-4.2 |
| US-4.6 | IT4-006 | P2 | 3 pts | US-4.2 |
| US-4.7 | IT4-005 | P1 | (incluido) | US-4.2 |

**Total**: 21 puntos de complejidad

---

## Orden de Implementación Recomendado

### Fase 1: Preparación Local (Días 1-2)
1. **US-4.1**: Dockerfile Multi-Stage
   - Crear Dockerfile optimizado
   - Crear script de inicio
   - Test build local
   - Optimizar tamaño

2. **US-4.3**: Variables de Entorno Seguras
   - Crear validación de env
   - Actualizar .env.example
   - Tests de validación

### Fase 2: CI/CD (Días 3-4)
3. **US-4.4**: CI/CD con GitHub Actions
   - Configurar workflow
   - Tests en CI
   - Build de Docker en CI
   - Badge de status

### Fase 3: Deploy (Días 5-6)
4. **US-4.2**: Deploy Automático en Koyeb
   - Crear cuenta Koyeb
   - Configurar service
   - Configurar secrets
   - Primer deploy

5. **US-4.5**: Health Checks en Producción
   - Actualizar health endpoint
   - Tests de health check
   - Configurar en Koyeb

### Fase 4: Validación y Docs (Día 7)
6. **US-4.7**: Smoke Tests en Producción
   - Crear smoke tests
   - Ejecutar post-deploy
   - Validar todo funciona

7. **US-4.6**: Documentación de Deploy
   - Escribir README de deploy
   - Troubleshooting
   - Screenshots

---

## Métricas de Éxito

### Funcionales
- ✅ Sistema desplegado en Koyeb
- ✅ Health endpoint retorna 200
- ✅ API responde correctamente
- ✅ Fallback funciona en prod
- ✅ Auto-deploy desde GitHub

### Técnicas
- ✅ CI/CD pipeline completo
- ✅ Dockerfile optimizado
- ✅ Variables validadas
- ✅ Logs accesibles
- ✅ Smoke tests pasan

### Performance
- ✅ Build time < 10min
- ✅ Response time < 10s (p95)
- ✅ Uptime > 99%
- ✅ Health check < 1s

### Documentación
- ✅ README completo
- ✅ Troubleshooting guide
- ✅ Variables documentadas
- ✅ Limitaciones explicadas

---

## Notas Técnicas

### ¿Por qué Multi-Stage?
1. **Tamaño reducido**: Solo artifacts necesarios en prod
2. **Seguridad**: Sin código fuente en imagen final
3. **Cache**: Layers independientes para builds rápidos
4. **Limpieza**: No queda basura de build

### ¿Por qué Koyeb?
1. **Free tier generoso**: 512MB RAM gratis
2. **Docker nativo**: No requiere Procfile
3. **Auto-deploy**: Push to deploy
4. **Global CDN**: Baja latencia

### Limitaciones en Koyeb Free Tier
1. **RAM limitada**: 512MB (Ollama puede fallar)
2. **1 instancia**: No auto-scaling
3. **Sleep después de inactividad**: 60 min sin requests
4. **Solución**: Groq como primario, SQLite como fallback

### Alternativas a Koyeb
- **Railway**: 2GB RAM (mejor para Ollama)
- **Render**: 750h/mes gratis
- **Fly.io**: 3GB RAM pero más complejo

---

## Riesgos Globales de la Iteración

### Alto Riesgo
- **Ollama no funciona en Koyeb**: RAM insuficiente
  - *Mitigación*: Best-effort start, Groq como primario

- **Secrets filtrados**: API keys en logs/código
  - *Mitigación*: Validación estricta, review de logs

### Medio Riesgo
- **Deploy falla**: Configuración incorrecta
  - *Mitigación*: Test local primero, documentación detallada

- **Costos inesperados**: Exceder free tier
  - *Mitigación*: Monitoreo de uso, alertas

### Bajo Riesgo
- **Build lento**: Primera vez descarga modelos
  - *Mitigación*: Cache de layers, paciencia

---

## Definición de "Iteración 4 Completa"

La iteración 4 está completa cuando:

1. ✅ Todas las historias de usuario (US-4.1 a US-4.7) están implementadas
2. ✅ Sistema desplegado en Koyeb con URL pública
3. ✅ CI/CD pipeline funciona correctamente
4. ✅ Health endpoint retorna 200
5. ✅ Smoke tests pasan en producción
6. ✅ Documentación completa de deployment
7. ✅ Auto-deploy desde main branch funciona
8. ✅ Variables de entorno validadas
9. ✅ Logs accesibles y útiles
10. ✅ Sistema probado end-to-end en producción

---

## Escenarios de Validación en Producción

### Escenario 1: Deploy Exitoso
```bash
# Push to main
git push origin main

# Monitor deploy en Koyeb
# https://app.koyeb.com/deployments

# Verificar health
curl https://ouija-backend.koyeb.app/health
```
**Esperado**: Deploy completa en < 10min, health retorna 200

### Escenario 2: Groq en Producción
```bash
curl -X POST https://ouija-backend.koyeb.app/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Tendré suerte en producción?"}'
```
**Esperado**: source = "groq", latencia < 5s

### Escenario 3: Fallback en Producción
```bash
# Hacer > 30 requests para agotar rate limit
for i in {1..35}; do
  curl -X POST https://ouija-backend.koyeb.app/api/ouija \
    -d '{"question": "test"}' &
done
```
**Esperado**: Fallback a Ollama o SQLite después de 30 requests

### Escenario 4: Dashboard en Producción
```bash
curl https://ouija-backend.koyeb.app/dashboard | jq
```
**Esperado**: Métricas de todos los servicios

---

**Siguiente**: ¡Proyecto Completo! 🎉

**Próximos Pasos**:
- Monitorear producción
- Optimizar basado en métricas
- Agregar features adicionales
- Escalar si es necesario
