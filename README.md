# Michigram

Red social para mascotas. Los usuarios crean perfiles para sus mascotas, comparten fotos, siguen a otras mascotas, chatean y más.

## Stack

| Capa | Tecnología |
|---|---|
| Meta-framework | [Astro](https://astro.build) 6 |
| UI | [React](https://react.dev) 19 |
| Routing (cliente) | [React Router](https://reactrouter.com) 7 |
| Estado global | [Zustand](https://zustand-demo.pmnd.rs) 5 |
| Server state | [TanStack Query](https://tanstack.com/query) 5 |
| Estilos | [Tailwind CSS](https://tailwindcss.com) 4 |
| Tiempo real | [Socket.IO](https://socket.io) (cliente) |
| Notificaciones | [react-hot-toast](https://react-hot-toast.com) |
| Deploy | [Vercel](https://vercel.com) (`@astrojs/vercel`) |

## Rutas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | — | Redirige a `/home` |
| `/login` | `Login` | Inicio de sesión |
| `/register` | `Register` | Registro |
| `/home` | `Home` | Feed de publicaciones |
| `/explore` | `Explore` | Explorar y buscar mascotas |
| `/pet/:petId` | `Profile` | Perfil de una mascota |
| `/profile` | `Profile` | Mi perfil (protegido) |
| `/create-pet` | `CreatePet` | Crear mascota (protegido) |
| `/edit-profile` | `EditProfile` | Editar perfil (protegido) |
| `/chat` | `Chat` | Mensajes (protegido) |
| `/notifications` | `Notifications` | Notificaciones (protegido) |
| `/favorites` | `Favorites` | Favoritos (protegido) |
| `/settings` | `Settings` | Ajustes (protegido) |

## Desarrollo

```bash
npm install
npm run dev
```

El servidor de desarrollo arranca en `http://localhost:4321`. La API se configura con la variable `PUBLIC_API_URL` en el archivo `.env` (por defecto apunta a `http://localhost:3000`).

## Build

```bash
npm run build
npm run preview
```

Genera los archivos en `./dist/` con el adaptador de Vercel en modo SSR.

## Arquitectura

Astro sirve las páginas shell (cada ruta tiene su archivo `.astro` en `src/pages/`). Dentro de cada shell se monta la SPA de React mediante `<App client:only="react" />`. La SPA usa React Router para la navegación del lado del cliente.

El estado de autenticación se maneja con Zustand (`authStore`), y las peticiones a la API se hacen con un cliente HTTP propio (`src/lib/api.ts`) que envuelve `fetch` con `credentials: 'include'`.
