# 📖 Cómo Usar Esta Guía - IMPORTANTE

## 🎯 Filosofía de la Guía

Esta guía está diseñada para que **DESARROLLES TÚ MISMO** el proyecto paso a paso, **NO para copiar archivos y listo**.

---

## ✅ Forma CORRECTA de Usar la Guía

### 1️⃣ Sigue las Iteraciones en Orden

```
Iteración 1 → Iteración 2 → Iteración 3 → Iteración 4
```

**NO saltes pasos**. Cada iteración construye sobre la anterior.

---

### 2️⃣ Lee y Desarrolla Cada Tarea

**Proceso recomendado por tarea:**

```
1. Lee PLAN.md de la iteración
   ↓
2. Lee la tarea en TAREAS.md (ej: IT1-001)
   ↓
3. ESCRIBE TÚ el código siguiendo los pasos
   ↓
4. Ejecuta los tests/validaciones
   ↓
5. Valida con CRITERIOS_ACEPTACION.md
   ↓
6. Si te atascas → Consulta codigo-completo/ SOLO como referencia
   ↓
7. Marca tarea como completada en KANBAN.md
   ↓
8. Siguiente tarea
```

---

### 3️⃣ Usa codigo-completo/ SOLO Como Referencia

**La carpeta `codigo-completo/` NO es para copiar**, es para:

✅ **Cuando te atascas**: "¿Cómo se implementa este algoritmo?"
✅ **Para validar**: "¿Mi código es similar al de referencia?"
✅ **Para comparar**: "¿Qué diferencias hay con mi implementación?"
✅ **Para entender**: "¿Cómo funciona esto que no entiendo?"

❌ **NO es para**:
- Copiar todo sin entender
- Saltarse el proceso de aprendizaje
- Evitar pensar en las soluciones

---

## 🚫 Forma INCORRECTA de Usar la Guía

### ❌ Copiar y Pegar sin Pensar

```bash
# MAL ❌
cp codigo-completo/services/*.ts backend-simple/src/modules/ouija/services/
npm run build
# "¡Listo! Proyecto terminado"
```

**Problema:** No aprendes nada, no entiendes el código, no puedes modificarlo.

---

### ❌ Saltar Directamente a codigo-completo/

```
1. Abrir codigo-completo/
2. Copiar todo
3. ???
4. Profit
```

**Problema:** Te saltas todo el proceso de aprendizaje incremental.

---

## ✅ Flujo de Trabajo Recomendado

### Ejemplo: Iteración 1, Tarea IT1-002 (FallbackService)

#### Paso 1: Leer la Tarea
```bash
# Leer TAREAS.md
cat guia-desarrollo-incremental-backend/iteracion-1/TAREAS.md | less
# Buscar: "IT1-002"
```

#### Paso 2: Entender QUÉ Hacer
```
IT1-002: Implementar FallbackService
- ¿Qué? → Servicio que consulta SQLite
- ¿Por qué? → Separar lógica de fallback
- ¿Cómo? → Keyword matching + filtrado
```

#### Paso 3: Desarrollar TÚ el Código

```bash
cd backend-simple/src/modules/ouija/services
touch fallback.service.ts
code fallback.service.ts  # Abre tu editor
```

**Escribe el código siguiendo los pasos de TAREAS.md:**

```typescript
// TÚ escribes esto, no lo copias
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class FallbackService {
  constructor(private prisma: PrismaService) {}

  async getFallbackResponse(question: string, ...) {
    // Implementa el algoritmo paso a paso
    // 1. Extraer keywords
    // 2. Buscar en DB
    // 3. Calcular score
    // 4. Seleccionar mejor match
  }
}
```

#### Paso 4: Si Te Atascas

```bash
# Consultar código de referencia
cat guia-desarrollo-incremental-backend/codigo-completo/services/fallback.service.ts

# Ver cómo se implementa el algoritmo de keyword matching
# ENTENDER la solución
# Cerrar el archivo
# Intentar implementarlo TÚ de nuevo
```

#### Paso 5: Validar

```bash
# Ejecutar tests
npm run test fallback.service

# Verificar criterios de aceptación
cat guia-desarrollo-incremental-backend/iteracion-1/CRITERIOS_ACEPTACION.md
```

---

## 📚 Estructura de Aprendizaje

### Nivel 1: Entender el Contexto
- Lee **README.md** - Overview del proyecto
- Lee **ROADMAP.md** - Big picture
- Lee **APRENDIZAJE.md** - Conceptos técnicos

### Nivel 2: Planificar
- Lee **PLAN.md** de la iteración actual
- Lee **USER_STORIES.md** - Qué vas a construir
- Revisa **KANBAN.md** - Qué sigue

### Nivel 3: Desarrollar (AQUÍ ES DONDE PASAS MÁS TIEMPO)
- Lee **TAREAS.md** - Instrucciones paso a paso
- **ESCRIBE EL CÓDIGO TÚ MISMO**
- Ejecuta tests/validaciones
- Itera hasta que funcione

### Nivel 4: Validar
- Revisa **CRITERIOS_ACEPTACION.md**
- Compara tu código con `codigo-completo/` (opcional)
- Marca como completado en KANBAN.md

### Nivel 5: Continuar
- Siguiente tarea de la misma iteración
- O siguiente iteración si terminaste

---

## 🎓 Ejemplos de Uso Correcto

### Ejemplo 1: Keyword Matching Algorithm

**Situación:** Llegaste a IT1-002 y no entiendes cómo implementar el keyword matching.

**❌ Incorrecto:**
```bash
cp codigo-completo/services/fallback.service.ts src/modules/ouija/services/
```

**✅ Correcto:**
```bash
# 1. Leer la explicación en TAREAS.md
cat iteracion-1/TAREAS.md | grep -A 50 "Keyword matching"

# 2. Leer el concepto en APRENDIZAJE.md
cat APRENDIZAJE.md | grep -A 30 "keyword matching"

# 3. Intentar implementarlo tú
# (escribir código)

# 4. Si TODAVÍA no entiendes, consultar referencia
cat codigo-completo/services/fallback.service.ts | less
# Buscar la función extractKeywords()
# ENTENDER el algoritmo
# Cerrar archivo

# 5. Implementar tu propia versión
# Puede ser diferente, ¡eso está bien!
```

---

### Ejemplo 2: Tests Unitarios

**Situación:** Llegaste a IT1-004 y nunca has escrito tests en NestJS.

**❌ Incorrecto:**
```bash
cp codigo-completo/tests/*.spec.ts src/modules/ouija/
npm run test
# "Tests pasan, siguiente tarea"
```

**✅ Correcto:**
```bash
# 1. Leer sobre testing en TAREAS.md
cat iteracion-1/TAREAS.md | grep -A 100 "IT1-004"

# 2. Leer conceptos de testing en APRENDIZAJE.md
cat APRENDIZAJE.md | grep -A 50 "Testing"

# 3. Crear tu primer test simple
touch src/modules/ouija/services/fallback.service.spec.ts

# 4. Escribir test básico
describe('FallbackService', () => {
  it('should be defined', () => {
    // Tu código aquí
  });
});

# 5. Ejecutar y ver que pasa
npm run test

# 6. Si no entiendes cómo mockear Prisma, consultar referencia
cat codigo-completo/tests/fallback.service.spec.ts
# Ver cómo se hace el mock
# Cerrar archivo

# 7. Implementar tu versión del mock
# Agregar más tests gradualmente
```

---

## 🛠️ Herramientas de Apoyo

### TAREAS.md
- **Qué es:** Guía paso a paso de implementación
- **Cuándo usar:** SIEMPRE, es tu guía principal
- **Cómo usar:** Lee completo, implementa paso a paso

### codigo-completo/
- **Qué es:** Código de referencia completo
- **Cuándo usar:** Cuando te atascas o quieres validar
- **Cómo usar:** Consulta, entiende, cierra, implementa

### APRENDIZAJE.md
- **Qué es:** Conceptos técnicos explicados
- **Cuándo usar:** Cuando no entiendes un concepto
- **Cómo usar:** Lee el concepto antes de implementar

### TROUBLESHOOTING.md
- **Qué es:** Soluciones a problemas comunes
- **Cuándo usar:** Cuando algo no funciona
- **Cómo usar:** Busca tu error, aplica solución

### CRITERIOS_ACEPTACION.md
- **Qué es:** Checklist de validación
- **Cuándo usar:** Al terminar cada tarea
- **Cómo usar:** Marca cada criterio cumplido

---

## ⏱️ Tiempo Estimado por Iteración

### Si Desarrollas Tú Mismo (Recomendado)
- **Iteración 1:** 8-12 horas (1-2 semanas part-time)
- **Iteración 2:** 6-10 horas
- **Iteración 3:** 4-6 horas
- **Iteración 4:** 4-6 horas
- **Total:** 22-34 horas (3-5 semanas)

**Aprendizaje:** Alto ⭐⭐⭐⭐⭐

### Si Copias de codigo-completo/ (No Recomendado)
- **Todo:** 1-2 horas

**Aprendizaje:** Bajo ⭐ (casi nulo)

---

## 🎯 Objetivos de Aprendizaje

Al seguir esta guía CORRECTAMENTE, aprenderás:

1. ✅ Arquitectura de NestJS (módulos, servicios, inyección)
2. ✅ Prisma ORM y bases de datos
3. ✅ Algoritmos de matching (keyword matching)
4. ✅ Testing con Jest y mocks
5. ✅ Docker y Docker Compose
6. ✅ Integración de APIs (Groq, Ollama)
7. ✅ Sistemas de fallback en cascada
8. ✅ Documentación con Swagger
9. ✅ Deployment en producción (Koyeb)
10. ✅ Debugging y troubleshooting

**Si solo copias código:** Aprenderás 0-10% de esto.

---

## 💡 Consejos

### 1. No Te Frustres
Es **NORMAL** atascarse. Cuando pasa:
1. Releer TAREAS.md
2. Buscar en TROUBLESHOOTING.md
3. Leer APRENDIZAJE.md
4. Consultar codigo-completo/ (como último recurso)
5. Tomar un descanso
6. Intentar de nuevo

### 2. Experimenta
Tu código **NO tiene que ser idéntico** a codigo-completo/.
- Usa nombres de variables diferentes
- Implementa algoritmos alternativos
- Agrega features propias
- **¡Esto es bueno!** Significa que estás pensando

### 3. Comenta Tu Código
Aunque codigo-completo/ tenga comentarios, **TÚ escribe los tuyos**.
Esto te fuerza a entender qué hace cada línea.

### 4. Commitea Frecuentemente
```bash
git add .
git commit -m "feat: Implementar FallbackService con keyword matching"
```

Esto te permite deshacer cambios si algo sale mal.

### 5. Pide Ayuda
Si después de:
- Leer TAREAS.md
- Consultar TROUBLESHOOTING.md
- Ver codigo-completo/
- Buscar en Google

...sigues atascado → Pide ayuda (GitHub issues, Discord, etc.)

---

## 🚀 Empezando

### ¿Por Dónde Empiezo?

1. **Lee esto** (COMO_USAR_ESTA_GUIA.md) ✅ Ya estás aquí
2. **Lee** [INDICE.md](./INDICE.md) - Navegación completa
3. **Lee** [README.md](./README.md) - Overview del proyecto
4. **Lee** [ROADMAP.md](./ROADMAP.md) - Big picture
5. **Empieza** [IT1-000_SETUP_INICIAL.md](./iteracion-1/IT1-000_SETUP_INICIAL.md)
6. **Continúa** con [iteracion-1/TAREAS.md](./iteracion-1/TAREAS.md)

### Ruta Completa de Aprendizaje

```
📖 Documentación General
├─ INDICE.md
├─ README.md
├─ ROADMAP.md
└─ APRENDIZAJE.md

🛠️ Iteración 1 (Semanas 1-2)
├─ IT1-000: Setup Inicial
├─ IT1-001: Seed de Datos
├─ IT1-002: FallbackService  ← codigo-completo/ disponible como referencia
├─ IT1-003: Categorización
├─ IT1-004: Tests Unitarios  ← codigo-completo/ disponible como referencia
├─ IT1-005: Swagger          ← codigo-completo/ disponible como referencia
├─ IT1-006: Docker Compose   ← codigo-completo/ disponible como referencia
└─ IT1-007: Health Endpoint

🛠️ Iteración 2 (Semana 3)
├─ IT2-001: Docker Compose con Ollama
├─ IT2-002: OllamaService    ← codigo-completo/ disponible como referencia
└─ ...

🛠️ Iteración 3 (Semana 4)
├─ IT3-001: GroqService       ← codigo-completo/ disponible como referencia
└─ ...

🛠️ Iteración 4 (Semana 5)
└─ Deploy a producción
```

---

## 📊 Autoevaluación

Después de cada iteración, pregúntate:

- [ ] ¿Entiendo TODOS los archivos que creé?
- [ ] ¿Puedo explicar cómo funciona el código?
- [ ] ¿Podría modificarlo sin romper nada?
- [ ] ¿Podría implementarlo de nuevo desde cero?
- [ ] ¿Sé por qué tomé cada decisión de diseño?

**Si respondiste "Sí" a todo:** ✅ Estás aprendiendo correctamente
**Si respondiste "No" a alguno:** ⚠️ Vuelve atrás y entiende mejor

---

## 🎓 Palabras Finales

Esta guía está diseñada para **enseñarte a pescar, no para darte el pescado**.

`codigo-completo/` es tu **red de seguridad**, no tu **solución automática**.

**Usa la guía como fue diseñada, y aprenderás muchísimo.**
**Copia código sin pensar, y no aprenderás nada.**

La decisión es tuya. 🚀

---

**¡Ahora sí, empieza con IT1-000_SETUP_INICIAL.md!**
