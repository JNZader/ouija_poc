# Quick Start - Migracion al Schema Optimizado

## Comandos Rapidos

### 1. Backup (OBLIGATORIO)
```bash
# PostgreSQL
pg_dump ouija_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Windows PowerShell
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
pg_dump ouija_db > "backup_$timestamp.sql"

# Verificar backup
ls -lh backup_*.sql
```

### 2. Ejecutar Migracion
```bash
# Ejecutar script SQL
psql -d ouija_db -f migration_script.sql

# O dentro de psql:
psql ouija_db
\i migration_script.sql
```

### 3. Actualizar Prisma
```bash
# Reemplazar schema
cp schema_optimizado.prisma prisma/schema.prisma

# Regenerar cliente
npx prisma generate

# Ver cambios en Prisma Studio
npx prisma studio
```

### 4. Actualizar Codigo

#### SessionService
```typescript
// ANTES
const count = session.messageCount;

// DESPUES
const session = await prisma.ouijaSession.findUnique({
  where: { id },
  include: { _count: { select: { messages: true } } }
});
const count = session._count.messages;
```

#### MultiplayerService
```typescript
// ANTES
const players = room.currentPlayers;

// DESPUES
const room = await prisma.multiplayerRoom.findUnique({
  where: { id },
  include: { _count: { select: { participants: true } } }
});
const players = room._count.participants;
```

### 5. Testing
```bash
# Tests unitarios
npm run test

# Tests e2e
npm run test:e2e

# Verificar manualmente
curl http://localhost:3000/health
```

### 6. Deploy
```bash
# Build
npm run build

# Production
npm run start:prod
```

---

## Checklist Pre-Migracion

- [ ] **Backup realizado** y verificado
- [ ] **Tests pasando** en schema actual
- [ ] **Codigo revisado** para cambios necesarios
- [ ] **Downtime planificado** (si es produccion)
- [ ] **Rollback plan** documentado

---

## Verificacion Post-Migracion

### 1. Verificar Tablas
```sql
-- Tablas existentes (debe ser 5 o 6)
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Debe mostrar:
-- - spirits
-- - ouija_sessions
-- - session_messages
-- - multiplayer_rooms
-- - room_participants
-- (query_history si se mantuvo)
```

### 2. Verificar Foreign Keys
```sql
-- FK existentes
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Debe mostrar:
-- ouija_sessions → spirits
-- ouija_sessions → multiplayer_rooms
-- session_messages → ouija_sessions
-- multiplayer_rooms → spirits
-- room_participants → multiplayer_rooms
```

### 3. Verificar Datos
```sql
-- Conteo de registros
SELECT 'spirits' as table, COUNT(*) as count FROM spirits
UNION ALL
SELECT 'ouija_sessions', COUNT(*) FROM ouija_sessions
UNION ALL
SELECT 'session_messages', COUNT(*) FROM session_messages
UNION ALL
SELECT 'multiplayer_rooms', COUNT(*) FROM multiplayer_rooms
UNION ALL
SELECT 'room_participants', COUNT(*) FROM room_participants;
```

### 4. Verificar Indices
```sql
-- Indices existentes
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verificar indices compuestos:
-- - idx_spirits_personality_active
-- - idx_sessions_spirit_status
-- - idx_participants_room_active
-- - idx_rooms_status_spirit
```

---

## Rollback (Si algo sale mal)

### Opcion 1: Rollback Transaction
```sql
-- Si la migracion fallo antes del COMMIT
ROLLBACK;
```

### Opcion 2: Restaurar Backup
```bash
# Eliminar DB actual
dropdb ouija_db

# Crear DB nueva
createdb ouija_db

# Restaurar backup
psql ouija_db < backup_TIMESTAMP.sql

# Verificar
psql ouija_db -c "SELECT COUNT(*) FROM spirits;"
```

### Opcion 3: Rollback Selectivo
```sql
-- Recrear campos eliminados
ALTER TABLE spirits
  ADD COLUMN era VARCHAR(100),
  ADD COLUMN "deathYear" INT,
  ADD COLUMN occupation VARCHAR(100),
  ADD COLUMN temperament VARCHAR(50);

ALTER TABLE ouija_sessions
  ADD COLUMN message_count INT DEFAULT 0;

ALTER TABLE multiplayer_rooms
  ADD COLUMN current_players INT DEFAULT 1;

-- Recrear tabla Response
CREATE TABLE responses (
  -- ... schema original
);
```

---

## Problemas Comunes

### Error: FK violation
```
ERROR: update or delete on table "spirits" violates foreign key constraint
```

**Solucion**: Agregar CASCADE a FK
```sql
ALTER TABLE ouija_sessions
DROP CONSTRAINT IF EXISTS ouija_sessions_spirit_id_fkey,
ADD CONSTRAINT ouija_sessions_spirit_id_fkey
  FOREIGN KEY (spirit_id)
  REFERENCES spirits(id)
  ON DELETE CASCADE;
```

### Error: Column does not exist
```
ERROR: column "message_count" does not exist
```

**Solucion**: Actualizar codigo para usar `_count`
```typescript
// codigo_actualizado_ejemplos.ts tiene los ejemplos
```

### Error: Table already exists
```
ERROR: relation "idx_spirits_personality_active" already exists
```

**Solucion**: Drop index primero
```sql
DROP INDEX IF EXISTS idx_spirits_personality_active;
CREATE INDEX idx_spirits_personality_active ON spirits(personality, is_active);
```

---

## Performance Tips

### 1. Analizar Tablas Despues de Migracion
```sql
ANALYZE spirits;
ANALYZE ouija_sessions;
ANALYZE session_messages;
ANALYZE multiplayer_rooms;
ANALYZE room_participants;
```

### 2. Vacuum si Hay Muchos Deletes
```sql
VACUUM FULL spirits;
VACUUM FULL ouija_sessions;
-- ... otras tablas
```

### 3. Reindex si es Necesario
```sql
REINDEX TABLE spirits;
REINDEX TABLE ouija_sessions;
-- ... otras tablas
```

---

## Monitoreo Post-Migracion

### 1. Query Performance
```sql
-- Queries mas lentas
SELECT
    query,
    calls,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%spirits%'
   OR query LIKE '%ouija_sessions%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 2. Table Sizes
```sql
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Index Usage
```sql
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

---

## Contacto y Soporte

**Documentacion Completa**: Ver `ANALISIS_SCHEMA_PRISMA.md`

**Ejemplos de Codigo**: Ver `codigo_actualizado_ejemplos.ts`

**Script de Migracion**: Ver `migration_script.sql`

**Schema Optimizado**: Ver `schema_optimizado.prisma`

---

## Resumen

```
1. Backup      ✓  pg_dump ouija_db > backup.sql
2. Migracion   ✓  psql -d ouija_db -f migration_script.sql
3. Prisma      ✓  npx prisma generate
4. Codigo      ✓  Actualizar segun ejemplos
5. Testing     ✓  npm run test
6. Deploy      ✓  npm run start:prod
```

**Tiempo estimado**: 1 hora

**Downtime**: ~5-10 minutos (durante migracion SQL)

**Impacto**: Funcionalidad core intacta, performance mejorada
