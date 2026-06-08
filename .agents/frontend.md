# Michigram Frontend

## Stack
- Astro + React + TypeScript + Tailwind CSS v4

## Estructura
```
src/
├── components/    # Componentes React
├── layouts/       # Layouts Astro
├── lib/           # Utilidades (api.ts)
├── pages/         # Rutas Astro (cada .astro renderiza App.jsx)
│   ├── index.astro      # Login (/)
│   ├── home.astro       # Home (/home)
│   ├── register.astro   # Registro (/register)
│   ├── create-pet.astro # Crear mascota (/create-pet)
│   ├── profile.astro    # Perfil (/profile)
│   ├── explore.astro    # Explorar (/explore)
│   ├── notifications.astro # Notificaciones (/notifications)
│   └── edit-profile.astro  # Editar perfil (/edit-profile)
├── store/         # Zustand stores
├── styles/        # CSS global
└── types/         # TypeScript types
```

## Rutas del Frontend
- `/` - Login
- `/register` - Registro
- `/home` - Feed (requiere auth)
- `/create-pet` - Crear mascota (requiere auth)
- `/profile` - Perfil propio (requiere auth)
- `/pet/:petId` - Perfil de mascota (requiere auth)
- `/explore` - Explorar mascotas (requiere auth)
- `/notifications` - Notificaciones (requiere auth)
- `/edit-profile` - Editar perfil (requiere auth)

## Variables de Color (usar en todos los componentes)
```css
--color-primaryBlack: #0b090a;   /* Textos principales, fondos oscuros */
--color-primaryWhite: #fff9fa;   /* Fondos claros, inputs */
--color-likeColor: #ed6b86;      /* Likes, corazones activos */
--color-pinkNotify: #f54669;     /* Notificaciones no leídas */
--color-formColorLight: #fab3a9; /* Bordes claros, gradientes */
--color-formColorDark: #ed6b90;  /* Acentos, hover states */
--color-redPink: #da1b41;        /* Botones principales, CTAs */
--color-bgBlack: #1b1a1a;        /* Fondos oscuros */
--color-bgWhite: #f8f8f8;        /* Fondo principal de página */
```

## Clases Tailwind recomendadas
- Fondos: `bg-[#f8f8f8]`, `bg-[#fff9fa]`, `bg-[#1b1a1a]`
- Textos: `text-[#0b090a]`, `text-[#0b090a]/60`, `text-[#0b090a]/40`
- Acentos: `text-[#da1b41]`, `text-[#ed6b90]`, `text-[#ed6b86]`
- Bordes: `border-[#fab3a9]/30`, `border-[#ed6b90]`
- Gradientes: `from-[#fab3a9] to-[#ed6b90]`, `from-[#ed6b90] to-[#da1b41]`
- Sombras: `shadow-lg shadow-[#ed6b90]/30`

## API Backend
- URL: `http://localhost:3000`
- Archivo: `src/lib/api.ts`

## Rutas del Backend
- Auth: `/auth/login`, `/auth/register`, `/auth/logout`
- Pets: `/pets`, `/pets/me`, `/pets/:id`
- Posts: `/posts`, `/posts/feed`, `/posts/pet/:petId`
- Follow: `/follow/:petId`
- Likes: `/likes/toggle/:postId`
- Comments: `/comments/:postId`
- Notifications: `/notifications/:petId`