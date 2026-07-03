# Michigram

**Michigram** es una red social para mascotas construida con **Astro** y **React**. Los usuarios pueden crear perfiles para sus animales, compartir fotos, seguir a otras mascotas, dar me gusta, comentar, chatear en tiempo real y recibir notificaciones al instante.

> Stack: Astro · React 19 · TypeScript · Tailwind CSS 4 · Zustand · TanStack Query · Socket.IO · Framer Motion

---

## ✨ Funcionalidades

### Autenticación
- Inicio de sesión con email/contraseña y Google OAuth
- Sesión persistente mediante cookies HttpOnly
- Registro con validación de formularios
- Recuperación y restablecimiento de contraseña
- Redirección inteligente según el estado de autenticación

### Perfiles de Mascota
- Creación de múltiples perfiles con nombre, biografía y avatar
- Edición de perfil con recorte de imagen integrado (react-easy-crop)
- Vista de perfil público con publicaciones, seguidores y seguidos
- Selección de mascota activa persistente en localStorage

### Feed de Publicaciones
- Scroll infinito con imágenes subidas a Cloudinary
- Like animado con toggle optimista
- Comentarios en modal con edición y eliminación
- Guardado de publicaciones como favoritas (bookmarks)
- Asignación de ubicación a las publicaciones

### Explorar y Buscar
- Búsqueda de mascotas por nombre con debounce
- Exploración de publicaciones recientes de toda la comunidad

### Sistema de Seguimiento
- Follow/unfollow con actualización optimista de la interfaz
- Contadores de seguidores y seguidos en tiempo real

### Chat en Tiempo Real
- Mensajería instantánea via Socket.IO
- Lista de conversaciones con indicador de mensajes no leídos
- Estado de conexión de mascotas (online/offline)
- Indicadores de lectura de mensajes

### Notificaciones
- Notificaciones en tiempo real por likes, comentarios y nuevos seguidores
- Agrupación de notificaciones por tipo
- Marcado individual y masivo como leídas

### Tema Oscuro
- Modo oscuro/claro con persistencia en localStorage
- Detección de preferencia del sistema
- Transiciones suaves con variables CSS

### Experiencia de Usuario
- Estados de carga con skeletons en todas las vistas
- Mutaciones optimistas con cola offline y reintento exponencial
- Toast notifications para feedback de acciones
- Animaciones suaves con Framer Motion

---

## 🏗️ Arquitectura

El proyecto utiliza un patrón **híbrido Astro + React SPA**:

```
Astro Shell (SSR en Vercel)
    │
    ▼
src/pages/[ruta].astro
    │
    ▼
<App client:only="react" />
    │
    ▼
React SPA (BrowserRouter + QueryClientProvider)
    │
    ├── /home, /explore, /pet/:id     → Rutas públicas
    ├── /profile, /chat, /settings    → Rutas protegidas
    └── /login, /register             → Rutas de autenticación
```

- **Astro** genera el shell HTML inicial (head, meta, fuentes, script de tema oscuro) y monta la SPA de React con `client:only="react"`.
- **React** toma el control completo del lado del cliente con React Router para la navegación SPA.
- **Zustand** maneja tres stores pequeños y enfocados: autenticación, tema y estado de la UI.
- **TanStack Query** (React Query) gestiona el estado del servidor con caché y sincronización.
- **Socket.IO** proporciona comunicación bidireccional para chat y notificaciones en tiempo real.

```
petsocial-frontend/
├── src/
│   ├── components/
│   │   ├── App.tsx                   # Punto de entrada SPA (rutas y providers)
│   │   ├── AuthCallback.tsx          # Callback de OAuth
│   │   ├── Chat.tsx                  # Mensajería en tiempo real
│   │   ├── ConfirmModal.tsx          # Modal de confirmación reutilizable
│   │   ├── CreatePet.tsx             # Creación de mascota
│   │   ├── EditProfile.tsx           # Edición de perfil
│   │   ├── Explore.tsx               # Explorar y buscar
│   │   ├── Favorites.tsx             # Publicaciones guardadas
│   │   ├── Footer.tsx                # Pie de página
│   │   ├── ForgotPassword.tsx        # Recuperación de contraseña
│   │   ├── Home.tsx                  # Feed principal
│   │   ├── ImageCropper.tsx          # Recorte de imágenes
│   │   ├── LocationPicker.tsx        # Selector de ubicación
│   │   ├── Login.tsx                 # Inicio de sesión
│   │   ├── Navbar.tsx                # Barra de navegación
│   │   ├── Notifications.tsx         # Centro de notificaciones
│   │   ├── PostModal.tsx             # Modal de detalle de publicación
│   │   ├── Profile.tsx               # Perfil de mascota
│   │   ├── Register.tsx              # Registro de usuario
│   │   ├── ResetPassword.tsx         # Restablecimiento de contraseña
│   │   ├── Settings.tsx              # Configuración de la cuenta
│   │   ├── Skeletons.tsx             # Componentes de carga skeleton
│   │   └── ui/                       # Componentes de UI reutilizables
│   │       ├── CommentInput.tsx
│   │       ├── OptimisticHeart.tsx
│   │       ├── OptimisticPostCard.tsx
│   │       └── PendingButton.tsx
│   ├── layouts/
│   │   └── Layout.astro              # Shell HTML (head, fuentes, tema)
│   ├── lib/
│   │   ├── api.ts                    # Cliente HTTP (fetch + cookies)
│   │   ├── optimistic.ts             # Cola de mutaciones offline con reintentos
│   │   ├── socket.ts                 # Cliente Socket.IO singleton
│   │   └── utils.ts                  # Utilidades (cn con clsx)
│   ├── pages/
│   │   ├── auth/callback.astro       # Página de callback OAuth
│   │   ├── [...slug].astro           # Catch-all para SPA routing
│   │   ├── chat.astro
│   │   ├── create-pet.astro
│   │   ├── edit-profile.astro
│   │   ├── explore.astro
│   │   ├── forgot-password.astro
│   │   ├── home.astro
│   │   ├── index.astro               # Redirección a /home
│   │   ├── notifications.astro
│   │   ├── profile.astro
│   │   ├── register.astro
│   │   └── reset-password.astro
│   ├── store/
│   │   ├── appStore.ts               # Estado de la UI (sidebar, modales)
│   │   ├── authStore.ts              # Estado de autenticación
│   │   └── themeStore.ts             # Tema oscuro/claro
│   ├── styles/
│   │   └── global.css                # Tailwind CSS, variables de tema, scrollbar
│   └── types/
│       └── index.ts                  # Interfaces TypeScript (User, Pet, Post, etc.)
├── public/assets/                    # Recursos estáticos (logos)
├── assets/                           # Assets fuente (logos PNG)
├── astro.config.mjs                  # Configuración de Astro
├── tsconfig.json
├── tailwind.config.js
└── package.json
```

---

## 🛠️ Stack Tecnológico

### Meta-framework y UI
| Tecnología | Versión | Propósito |
|---|---|---|
| [Astro](https://astro.build) | ^6.3 | Framework web con SSR, páginas shell |
| [React](https://react.dev) | ^19.2 | UI interactiva del lado del cliente |
| [React Router DOM](https://reactrouter.com) | ^7.15 | Enrutamiento SPA del lado del cliente |
| [TypeScript](https://www.typescriptlang.org) | ^5.7 | Tipado estático |

### Estado y Datos
| Tecnología | Versión | Propósito |
|---|---|---|
| [Zustand](https://zustand-demo.pmnd.rs) | ^5.0 | Estado global ligero |
| [TanStack Query](https://tanstack.com/query) | ^5.100 | Caché y sincronización de datos del servidor |

### Estilos y Animaciones
| Tecnología | Versión | Propósito |
|---|---|---|
| [Tailwind CSS](https://tailwindcss.com) | ^4.3 | Estilos utilitarios con variables de tema |
| [Framer Motion](https://www.framer.com/motion) | ^12.40 | Animaciones y transiciones |
| [Lucide React](https://lucide.dev) | ^1.16 | Sistema de iconos |

### Tiempo Real
| Tecnología | Versión | Propósito |
|---|---|---|
| [Socket.IO Client](https://socket.io) | ^4.8 | Mensajería y notificaciones en tiempo real |

### Utilidades
| Tecnología | Versión | Propósito |
|---|---|---|
| [react-hot-toast](https://react-hot-toast.com) | ^2.6 | Notificaciones toast |
| [react-easy-crop](https://github.com/ricardo-ch/react-easy-crop) | ^5.5 | Recorte de imágenes en el navegador |

### Despliegue
| Tecnología | Versión | Propósito |
|---|---|---|
| [@astrojs/vercel](https://docs.astro.build/en/guides/deploy/vercel/) | ^10.0 | Adaptador SSR para Vercel |
| [Vite](https://vitejs.dev) | (interno) | Bundler y dev server |

---

## 🚀 Desarrollo

### Requisitos Previos
- Node.js >= 22.12.0
- La API backend en ejecución (ver petsocial-backend)

### Configuración

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variable de entorno
# Crear/editar .env con la URL de la API
PUBLIC_API_URL=http://localhost:3000

# 3. Iniciar servidor de desarrollo
npm run dev
```

El servidor de desarrollo arranca en `http://localhost:4321`.

### Comandos Disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Iniciar servidor de desarrollo |
| `npm run build` | Build de producción para Vercel |
| `npm run preview` | Vista previa del build de producción |

---

## 🧠 Decisiones Técnicas

- **Astro + React híbrido**: Astro proporciona SSR optimizado y entrega un shell HTML mínimo; React se hidrata completamente del lado del cliente para una experiencia SPA nativa.
- **Cookies sobre localStorage**: La autenticación usa cookies HttpOnly para proteger los tokens contra XSS.
- **Mutaciones optimistas con cola offline**: Las operaciones de like, follow y favoritos actualizan la UI inmediatamente; si el usuario está offline, las mutaciones se encolan en localStorage y se reintentan al recuperar conexión con backoff exponencial (máx. 3 intentos).
- **Zustand sobre Redux**: Tres stores pequeños y sin boilerplate mantienen el estado global simple y mantenible.
- **Tema oscuro con CSS nativo**: Variables CSS personalizadas + `@custom-variant dark` de Tailwind v4 para transiciones suaves sin JavaScript bloqueante.
- **Skeletons en todas las vistas**: Cada pantalla tiene su propio componente skeleton para evitar Cumulative Layout Shift y mejorar la percepción de rendimiento.

---

## 📦 Variables de Entorno

| Variable | Descripción | Valor por Defecto |
|---|---|---|
| `PUBLIC_API_URL` | URL base de la API backend | `http://localhost:3000` |

---

## 🤝 Contribuir

1. Fork del repositorio
2. Crear una rama (`git checkout -b feature/nueva-funcionalidad`)
3. Commit de cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir un Pull Request

---

## 👤 Autor

**Leonel M Saliol**

---

## 📄 Licencia

MIT
