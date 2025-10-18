# Plan de Desarrollo Incremental - Backend Simple Ouija Virtual

## Metodología: Kanban Light + XP Adaptado para Freelance

Este plan utiliza una metodología híbrida optimizada para desarrollo individual:

- **Kanban Light**: WIP limitado (máx 2 tareas), flujo continuo, priorización dinámica
- **XP Selectivo**: TDD en áreas críticas, refactorización continua, integración continua
- **Entrega Incremental**: Cada iteración produce valor funcional inmediato

## Estructura del Plan

```
guia-desarrollo-incremental-backend/
├── README.md (este archivo)
├── ROADMAP.md (cronograma visual completo)
├── KANBAN.md (tablero Kanban interactivo)
├── iteracion-1/ (Fallback SQLite funcional)
│   ├── PLAN.md
│   ├── USER_STORIES.md
│   ├── TAREAS.md
│   └── CRITERIOS_ACEPTACION.md
├── iteracion-2/ (Integración Ollama local)
│   ├── PLAN.md
│   ├── USER_STORIES.md
│   ├── TAREAS.md
│   └── CRITERIOS_ACEPTACION.md
├── iteracion-3/ (Integración Groq)
│   ├── PLAN.md
│   ├── USER_STORIES.md
│   ├── TAREAS.md
│   └── CRITERIOS_ACEPTACION.md
├── iteracion-4/ (Deploy en Koyeb)
│   ├── PLAN.md
│   ├── USER_STORIES.md
│   ├── TAREAS.md
│   └── CRITERIOS_ACEPTACION.md
└── APRENDIZAJE.md (conceptos técnicos explicados)
```

## Principios de Diseño del Plan

### 1. Desarrollo Incremental Real
Cada iteración produce un sistema **completamente funcional** que puede desplegarse:
- Iteración 1: Sistema básico funcional (sin IA, solo SQLite)
- Iteración 2: + Ollama local (mejora con IA)
- Iteración 3: + Groq cloud (alta disponibilidad)
- Iteración 4: + Producción (sistema completo)

### 2. Fallback Strategy Progresivo
```
Iteración 1: Solo SQLite
Iteración 2: Ollama → SQLite
Iteración 3: Groq → Ollama → SQLite
Iteración 4: [Prod] Groq → Ollama → SQLite
```

### 3. Aprendizaje Didáctico
Cada decisión técnica incluye:
- **¿Qué?**: Descripción de la tarea
- **¿Por qué?**: Razón técnica/negocio
- **¿Cómo?**: Implementación específica
- **Tradeoffs**: Pros/contras de alternativas

## Estimaciones de Complejidad

Usamos puntos de complejidad (1-13 Fibonacci):

- **1 punto**: Tarea trivial (~30 min)
- **2 puntos**: Tarea simple (~1 hora)
- **3 puntos**: Tarea moderada (~2 horas)
- **5 puntos**: Tarea compleja (~4 horas)
- **8 puntos**: Tarea muy compleja (~1 día)
- **13 puntos**: Épica que debe dividirse

## Cómo Usar Este Plan

### Para Desarrollo Individual
1. Lee el ROADMAP.md para visión general
2. Empieza con iteracion-1/PLAN.md
3. Mueve tareas en KANBAN.md (máximo 2 WIP)
4. Sigue las USER_STORIES.md en orden
5. Valida con CRITERIOS_ACEPTACION.md
6. Lee APRENDIZAJE.md para entender conceptos

### Para Cliente/Product Owner
1. Revisa ROADMAP.md para cronograma
2. Lee USER_STORIES.md de cada iteración
3. Prioriza features en KANBAN.md
4. Valida entregas con criterios de aceptación

## Estado Actual del Proyecto

### Código Existente
El proyecto ya tiene implementado:
- ✅ NestJS configurado
- ✅ Prisma con schema SQLite
- ✅ OllamaService funcional
- ✅ GroqService funcional
- ✅ PromptsService con categorización
- ✅ Sistema de cache de preguntas
- ✅ Respuestas repetidas con "espíritu molesto"

### Problemas Detectados
- ⚠️ No hay datos en SQLite (tabla FallbackResponse vacía)
- ⚠️ No hay configuración Docker para Ollama
- ⚠️ Falta manejo de errores robusto
- ⚠️ No hay tests unitarios
- ⚠️ No hay documentación de API
- ⚠️ Falta configuración para Koyeb

## Próximos Pasos

### AHORA MISMO (Iteración 1)
1. Crear seed de datos para SQLite
2. Implementar servicio fallback puro
3. Validar que funciona sin Ollama/Groq

### Semana 1-2 (Iteración 2)
1. Configurar Ollama en Docker
2. Integrar con backend
3. Sistema de fallback dual

### Semana 3-4 (Iteración 3)
1. Configurar Groq API
2. Sistema de fallback triple
3. Logging y monitoreo

### Semana 5 (Iteración 4)
1. Dockerfile para Koyeb
2. Variables de entorno
3. Deploy en producción

## Métricas de Éxito

### Por Iteración
- **Funcionalidad**: Sistema desplegable al 100%
- **Calidad**: Tests pasan al 100%
- **Documentación**: API documentada
- **Aprendizaje**: Conceptos explicados en APRENDIZAJE.md

### Globales
- **Tiempo Total**: 3-5 semanas
- **Velocidad**: 8-13 puntos/semana
- **Cobertura Tests**: > 70%
- **Uptime Producción**: > 99%

## Recursos Adicionales

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Ollama Documentation](https://github.com/ollama/ollama)
- [Groq API Documentation](https://console.groq.com/docs)
- [Koyeb Documentation](https://www.koyeb.com/docs)

---

**Última actualización**: 2025-10-17
**Versión**: 1.0.0
**Autor**: Claude Code - Freelance Project Planner
