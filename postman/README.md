# Postman Collection - Ouija Virtual API

## Instalación

1. Abre Postman
2. Click en "Import"
3. Arrastra los archivos:
   - `Ouija-Virtual-API.postman_collection.json`
   - `Ouija-Virtual-API.postman_environment.json`

## Uso

### 1. Configurar Environment
- Selecciona el environment "Ouija Virtual - Local"
- Verifica que `baseUrl` apunte a `http://localhost:3000/api`

### 2. Flujo de Prueba Completo

**Paso 1: Health Check**
```
GET /health
```
Verifica que la API esté funcionando.

**Paso 2: Obtener Espíritus**
```
GET /ouija/spirits
```
Obtiene la lista de espíritus disponibles. Guarda automáticamente el ID del primer espíritu.

**Paso 3: Crear Sesión**
```
POST /ouija/session/create
Body: { "spiritId": {{spiritId}}, "userId": "user_test_123" }
```
Crea una nueva sesión. Guarda automáticamente el `sessionToken`.

**Paso 4: Enviar Mensajes**
```
POST /ouija/session/ask
Body: { "sessionToken": "{{sessionToken}}", "message": "¿Cuál es mi destino?" }
```
Envía mensajes al espíritu y recibe respuestas.

**Paso 5: Ver Historial**
```
GET /ouija/session/{{sessionToken}}/history
```
Obtiene todo el historial de conversación.

**Paso 6: Finalizar Sesión**
```
POST /ouija/session/{{sessionToken}}/end
```
Termina la sesión con un mensaje de despedida del espíritu.

## Tests Automáticos

La colección incluye tests automáticos que:
- Verifican status codes
- Validan estructura de respuestas
- Guardan variables automáticamente
- Verifican propiedades requeridas

## Variables de Colección

- `baseUrl`: URL base de la API
- `sessionToken`: Token de sesión actual (se guarda automáticamente)
- `spiritId`: ID del espíritu seleccionado (se guarda automáticamente)

## Ejemplos de Mensajes

### Para Morgana (Wise)
- "¿Cuál es mi propósito en la vida?"
- "¿Cómo puedo encontrar la paz interior?"
- "¿Qué me depara el futuro?"

### Para Azazel (Cryptic)
- "¿Qué secretos oculta el universo?"
- "¿Cuál es el significado del número 7?"
- "Descifra mi destino"

### Para Lilith (Dark)
- "¿Qué oscuridad me espera?"
- "¿Cuál es mi mayor miedo?"
- "Háblame de las sombras"

### Para Puck (Playful)
- "Cuéntame un chiste del más allá"
- "¿Qué travesura recomiendas?"
- "Sorpréndeme con algo divertido"
