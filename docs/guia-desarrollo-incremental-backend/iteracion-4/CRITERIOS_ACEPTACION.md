# Criterios de Aceptación - Iteración 4: Deploy en Koyeb

## Resumen Ejecutivo

**Objetivo**: Sistema completo desplegado en producción con CI/CD automatizado.

**Criterios Críticos**:
- Deploy exitoso en Koyeb
- Health endpoint accesible públicamente
- Auto-deploy desde GitHub funciona
- Sistema nunca falla (fallback completo)

---

## Criterios por Tarea

### IT4-001: Dockerfile Multi-Stage

#### CA-001: Build Exitoso
- [ ] `docker build` completa sin errores
- [ ] Imagen final < 2GB
- [ ] Todas las capas cachean correctamente
- [ ] Logs no muestran warnings críticos

**Validación**:
```bash
docker build -t ouija-test backend/
docker images | grep ouija-test
# Debe mostrar tamaño < 2GB
```

#### CA-002: Multi-Stage Correcto
- [ ] 3 stages: builder, ollama, production
- [ ] Solo artifacts necesarios en stage final
- [ ] Prisma client generado correctamente
- [ ] Database seed ejecuta en build

**Validación**:
```bash
docker history ouija-test
# Verificar layers y tamaño
```

#### CA-003: Start Script
- [ ] Script existe y es ejecutable
- [ ] Ollama inicia en background
- [ ] Timeout de 30s implementado
- [ ] Continúa si Ollama falla
- [ ] Backend siempre inicia

**Validación**:
```bash
docker run ouija-test
# Ver logs de inicio
```

---

### IT4-002: Deploy en Koyeb

#### CA-004: Service Configurado
- [ ] Service creado en Koyeb
- [ ] Region seleccionada
- [ ] Instance Nano (free tier)
- [ ] Docker builder seleccionado
- [ ] Port 3000 configurado

**Validación**:
Verificar en Koyeb Dashboard

#### CA-005: Environment Variables
- [ ] NODE_ENV=production
- [ ] DATABASE_URL configurada
- [ ] OLLAMA_URL configurada
- [ ] GROQ_API_KEY como secret
- [ ] Todas las vars documentadas

**Validación**:
```bash
curl https://your-app.koyeb.app/health | jq '.environment'
# Debe retornar "production"
```

#### CA-006: Auto-Deploy
- [ ] Push a main triggerea deploy
- [ ] Deploy completa en < 10min
- [ ] Logs accesibles
- [ ] Health check pasa post-deploy

**Validación**:
```bash
git push origin main
# Monitorear en Koyeb Dashboard
```

#### CA-007: URL Pública
- [ ] URL HTTPS generada
- [ ] DNS resuelve correctamente
- [ ] SSL/TLS funciona
- [ ] Endpoints accesibles

**Validación**:
```bash
curl -I https://your-app.koyeb.app
# Debe retornar 200 OK
```

---

### IT4-003: Variables de Entorno Seguras

#### CA-008: Validación al Inicio
- [ ] validateEnv() implementado
- [ ] class-validator instalado
- [ ] Error claro si falta variable requerida
- [ ] No inicia si validación falla

**Validación**:
```bash
# Test local sin NODE_ENV
unset NODE_ENV
npm run start
# Debe fallar con mensaje claro
```

#### CA-009: Seguridad
- [ ] API keys no en logs
- [ ] Secrets en Koyeb Secrets
- [ ] .env no committeado
- [ ] .env.example actualizado

**Validación**:
```bash
curl https://your-app.koyeb.app/health
# Verificar que no expone API keys
```

---

### IT4-004: GitHub Actions CI/CD

#### CA-010: Workflow Funcional
- [ ] .github/workflows/ci.yml existe
- [ ] Triggers en push y PR
- [ ] Jobs: lint-and-test, docker-build, deploy-notification

**Validación**:
Verificar en GitHub Actions tab

#### CA-011: Tests en CI
- [ ] Lint ejecuta
- [ ] Tests unitarios ejecutan
- [ ] Coverage reportado
- [ ] Build de TypeScript ejecuta

**Validación**:
```bash
git push origin main
# Ver GitHub Actions pasar
```

#### CA-012: Docker Build en CI
- [ ] Docker build ejecuta
- [ ] Health check de container
- [ ] Solo en branch main
- [ ] Falla si tests no pasan

**Validación**:
Ver logs de GitHub Actions

#### CA-013: Badge de Status
- [ ] Badge en README
- [ ] Muestra status actual
- [ ] Link a workflow

**Validación**:
Verificar README en GitHub

---

### IT4-005: Health Checks en Producción

#### CA-014: Endpoint Robusto
- [ ] GET /health implementado
- [ ] Promise.allSettled usado
- [ ] No bloquea en errores
- [ ] Timeout de 5s

**Validación**:
```bash
curl https://your-app.koyeb.app/health | jq
```

#### CA-015: Checks Completos
- [ ] Database check
- [ ] Ollama check (degraded si falla)
- [ ] Groq check (degraded si falla)
- [ ] Version incluida
- [ ] Environment incluido

**Validación**:
```json
{
  "status": "ok",
  "checks": {
    "database": {"status": "ok"},
    "ollama": {"status": "degraded"},
    "groq": {"status": "ok"}
  }
}
```

---

### IT4-006: Documentación de Deploy

#### CA-016: README Completo
- [ ] Sección "Deployment Guide"
- [ ] Prerequisites listados
- [ ] Paso a paso detallado
- [ ] Comandos de verificación
- [ ] URLs de ejemplo

**Validación**:
Leer README

#### CA-017: Troubleshooting
- [ ] Sección de troubleshooting
- [ ] Problemas comunes documentados
- [ ] Soluciones claras
- [ ] Links a logs/docs

**Validación**:
Revisar sección en README

---

## Checklist Final de Producción

### Funcional (10 criterios)
- [ ] F-1: Deploy en Koyeb exitoso
- [ ] F-2: URL pública HTTPS accesible
- [ ] F-3: Health endpoint retorna 200
- [ ] F-4: POST /ouija/ask funciona
- [ ] F-5: Triple fallback funciona
- [ ] F-6: Auto-deploy desde main
- [ ] F-7: Secrets configurados
- [ ] F-8: Database seeded
- [ ] F-9: Logs accesibles
- [ ] F-10: Sistema estable (sin crashes)

### Técnico (8 criterios)
- [ ] T-1: Dockerfile multi-stage completo
- [ ] T-2: CI/CD pipeline funciona
- [ ] T-3: Variables validadas
- [ ] T-4: Tests pasan en CI
- [ ] T-5: Docker build en CI pasa
- [ ] T-6: Health checks robustos
- [ ] T-7: Ollama best-effort funciona
- [ ] T-8: No errores críticos en logs

### Performance (5 criterios)
- [ ] P-1: Build time < 10min
- [ ] P-2: Response time < 10s (p95)
- [ ] P-3: Health check < 1s
- [ ] P-4: Uptime > 99%
- [ ] P-5: First deploy exitoso

### Documentación (4 criterios)
- [ ] D-1: README con deployment guide
- [ ] D-2: Troubleshooting documentado
- [ ] D-3: Variables documentadas
- [ ] D-4: Badge de CI en README

### Seguridad (3 criterios)
- [ ] S-1: API keys en Koyeb Secrets
- [ ] S-2: No secrets en logs
- [ ] S-3: HTTPS habilitado

---

## Smoke Tests en Producción

### Test 1: Health Check
```bash
curl -f https://your-app.koyeb.app/health
```
**Esperado**: Status 200, JSON con status "ok"

### Test 2: API Request (Groq)
```bash
curl -X POST https://your-app.koyeb.app/api/ouija \
  -H "Content-Type: application/json" \
  -d '{"question": "¿Funciona en producción?"}'
```
**Esperado**: Respuesta válida, source="groq", latencia < 5s

### Test 3: Dashboard
```bash
curl https://your-app.koyeb.app/dashboard
```
**Esperado**: Métricas de todos los servicios

### Test 4: Swagger Docs
```bash
curl -I https://your-app.koyeb.app/api/docs
```
**Esperado**: Status 200

### Test 5: Fallback Automático
```bash
# 35 requests rápidos para agotar Groq rate limit
for i in {1..35}; do
  curl -X POST https://your-app.koyeb.app/api/ouija \
    -d '{"question": "test"}' -o /dev/null -s &
done
wait
```
**Esperado**: Primeros 30 usan Groq, resto usa fallback

---

## Script de Validación Automática

```bash
#!/bin/bash
# scripts/validate-production.sh

PROD_URL="https://your-app.koyeb.app"
PASSED=0
FAILED=0

test_endpoint() {
  local name=$1
  local url=$2
  local expected_status=$3

  echo -n "Testing $name... "

  status=$(curl -s -o /dev/null -w "%{http_code}" "$url")

  if [ "$status" -eq "$expected_status" ]; then
    echo "✅ PASS (status: $status)"
    ((PASSED++))
  else
    echo "❌ FAIL (status: $status, expected: $expected_status)"
    ((FAILED++))
  fi
}

echo "🔍 Validating Production Deployment..."
echo "URL: $PROD_URL"
echo "========================================"

test_endpoint "Health Check" "$PROD_URL/health" 200
test_endpoint "Dashboard" "$PROD_URL/dashboard" 200
test_endpoint "Swagger Docs" "$PROD_URL/api/docs" 200

echo ""
echo "Testing API..."
response=$(curl -s -X POST "$PROD_URL/api/ouija" \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}')

if echo "$response" | grep -q "response"; then
  echo "✅ API Request works"
  ((PASSED++))
else
  echo "❌ API Request failed"
  ((FAILED++))
fi

echo ""
echo "📊 Results: $PASSED passed, $FAILED failed"

if [ $FAILED -eq 0 ]; then
  echo "✅ Production deployment is VALID!"
  exit 0
else
  echo "❌ Production has FAILURES"
  exit 1
fi
```

---

## Definición de "Iteración 4 Completa"

### Criterios Obligatorios
1. ✅ Sistema desplegado en Koyeb con URL pública
2. ✅ Health endpoint accesible y retorna 200
3. ✅ CI/CD pipeline completo y funcional
4. ✅ Auto-deploy desde main branch funciona
5. ✅ Smoke tests pasan en producción
6. ✅ Variables de entorno validadas
7. ✅ Secrets configurados correctamente
8. ✅ Documentación de deploy completa

### Criterios de Calidad
9. ✅ Response time < 10s (p95)
10. ✅ No errores críticos en logs
11. ✅ Fallback funciona en producción
12. ✅ Badge de CI en README

### Criterios de Salida
- [ ] Checklist Final 100% completo
- [ ] Smoke tests ejecutados exitosamente
- [ ] Validación automática pasa
- [ ] Demo funcional en URL pública
- [ ] Documentación revisada
- [ ] KANBAN.md actualizado

---

## Monitoreo Continuo

### KPIs de Producción
- **Uptime Target**: > 99%
- **Response Time (p95)**: < 10s
- **Error Rate**: < 1%
- **Groq Usage**: ~70%
- **Fallback Usage**: < 30%

### Alertas Sugeridas
1. Health endpoint retorna error
2. Response time > 15s
3. Error rate > 5%
4. Groq API key inválida
5. Database inaccessible

---

**Total de Criterios**: 30
**Criterios Obligatorios**: 8
**Criterios de Calidad**: 4

## 🎉 ¡PROYECTO COMPLETO!

Al completar esta iteración, tendrás:

✅ **Sistema completamente funcional en producción**
✅ **Triple fallback**: Groq → Ollama → SQLite
✅ **CI/CD automatizado** con GitHub Actions
✅ **Monitoreo robusto** con health checks
✅ **Documentación completa** de deployment
✅ **Auto-deploy** desde GitHub
✅ **URL pública HTTPS**
✅ **Sistema resiliente** que nunca falla

**URL Producción**: `https://ouija-backend-yourapp.koyeb.app`

**Endpoints**:
- `GET /health` - Estado del sistema
- `POST /api/ouija/ask` - Consultar espíritu
- `GET /dashboard` - Métricas
- `GET /api/docs` - Documentación Swagger

---

**¡Felicitaciones! Has completado las 4 iteraciones del Backend Ouija Virtual!** 🚀🎉
