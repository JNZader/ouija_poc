# 🔮 Ouija Virtual - Frontend

Frontend de la aplicación **Ouija Virtual**, una experiencia mística interactiva para conversar con espíritus virtuales.

## 🎨 Stack Tecnológico

- **React 19** + **TypeScript**
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Estilos utility-first con tema místico personalizado
- **Framer Motion** - Animaciones fluidas y efectos visuales
- **Socket.io Client** - Comunicación en tiempo real
- **Zustand** - State management simple y eficiente
- **Axios** - Cliente HTTP
- **React Router** - Navegación SPA
- **Lucide React** - Iconos modernos

## ✨ Características

### Implementadas
- 🎭 **Interfaz de Tablero Ouija Interactivo** - Tablero visual con letras, números y controles
- 💬 **Chat en Tiempo Real** - Comunicación fluida con WebSockets
- 👻 **Selección de Espíritus** - 4 personalidades únicas (Morgana, Azazel, Lilith, Puck)
- 🌙 **Tema Oscuro Místico** - Paleta de colores púrpura/dorado con efectos de resplandor
- ⚡ **Animaciones y Efectos Visuales** - Transiciones suaves, partículas flotantes, efectos glow

### Por Implementar
- 🎮 **Modo Multijugador** - Salas públicas y privadas (próximamente)
- 🗳️ **Sistema de Votación** - Votación grupal de preguntas
- 📊 **Historial de Sesiones** - Revisar conversaciones pasadas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js 20+
- npm

### 1. Instalar Dependencias

```bash
cd frontend
npm install
```

### 2. Configurar Variables de Entorno

Crea un archivo `.env` en la raíz del directorio `frontend`:

```env
VITE_API_URL=http://localhost:3000
VITE_WS_URL=http://localhost:3000
```

### 3. Ejecutar en Modo Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

### 4. Build de Producción

```bash
npm run build
```

Los archivos optimizados se generarán en el directorio `dist/`.

## 📁 Estructura del Proyecto

```
frontend/
├── src/
│   ├── components/         # Componentes reutilizables
│   │   ├── ouija/          # Tablero Ouija
│   │   ├── spirit/         # Selector de espíritus
│   │   ├── chat/           # Interfaz de chat
│   │   └── ui/             # Componentes UI base
│   ├── pages/              # Páginas/rutas
│   │   ├── Home.tsx        # Pantalla de inicio
│   │   ├── Session.tsx     # Sesión individual
│   │   └── Multiplayer.tsx # Modo multijugador
│   ├── services/           # Servicios externos
│   │   ├── api/            # Llamadas a la API REST
│   │   └── socket/         # Cliente WebSocket
│   ├── store/              # Estado global (Zustand)
│   ├── types/              # Tipos TypeScript
│   ├── utils/              # Utilidades y constantes
│   └── App.tsx             # Componente raíz con routing
```

## 🎭 Espíritus Disponibles

1. **Morgana la Sabia** (`wise`) - Sereno, compasivo, sabio
2. **Azazel el Críptico** (`cryptic`) - Enigmático, filosófico
3. **Lilith la Sombra** (`dark`) - Sombrío, melancólico
4. **Puck el Travieso** (`playful`) - Juguetón, caprichoso

## 🔌 Integración con Backend

### API REST (Axios)
- `GET /api/spirits` - Obtener todos los espíritus
- `POST /api/ouija/sessions` - Crear sesión
- `POST /api/ouija/sessions/:id/messages` - Enviar mensaje

### WebSocket (Socket.io)
- `session:join` - Unirse a una sesión
- `message:send` - Enviar mensaje
- `message:receive` - Recibir respuesta del espíritu

## 🧪 Scripts Disponibles

```bash
npm run dev       # Servidor de desarrollo
npm run build     # Build de producción
npm run preview   # Preview del build
npm run lint      # Linter ESLint
```

---

✨ **Experimenta lo sobrenatural** ✨
