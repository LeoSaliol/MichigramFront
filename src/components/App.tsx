import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import Home from './Home';
import Explore from './Explore';
import CreatePet from './CreatePet';
import Profile from './Profile';
import Notifications from './Notifications';
import EditProfile from './EditProfile';
import Chat from './Chat';
import AuthCallback from './AuthCallback';
import Settings from './Settings';
import Favorites from './Favorites';
import Footer from './Footer';
import { useThemeStore } from '../store/themeStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

function TitleUpdater() {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Inicio',
      '/login': 'Login',
      '/register': 'Registro',
      '/home': 'Inicio',
      '/explore': 'Explorar',
      '/create-pet': 'Crear Mascota',
      '/profile': 'Perfil',

      '/notifications': 'Notificaciones',
      '/edit-profile': 'Editar Perfil',
      '/chat': 'Chat',
      '/settings': 'Configuración',
      '/favorites': 'Favoritos',
      '/forgot-password': 'Recuperar Contraseña',
      '/reset-password': 'Nueva Contraseña',
      '/auth/callback': 'Auth Callback',
    };

    const title = titles[location.pathname]
      ?? (location.pathname.startsWith('/pet/') ? 'Perfil' : null)
      ?? 'Michigram';

    document.title = `${title} | Michigram`;
  }, [location]);

  return null;
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppContent() {
  const { fetchMe, isLoading, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();
  const [initialized, setInitialized] = React.useState(false);

  React.useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  React.useEffect(() => {
    if (!initialized) {
      fetchMe().finally(() => setInitialized(true));
    }
  }, [initialized]);

  if (!initialized || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgWhite">
        <div className="w-12 h-12 border-4 border-formColorLight/30 border-t-redPink rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <TitleUpdater />
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/home" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/home" replace /> : <Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/home" element={<Home />} />
        <Route
          path="/create-pet"
          element={
            <ProtectedRoute>
              <CreatePet />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/pet/:petId" element={<Profile />} />
        <Route path="/explore" element={<Explore />} />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-profile"
          element={
            <ProtectedRoute>
              <EditProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/favorites"
          element={
            <ProtectedRoute>
              <Favorites />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--color-primaryWhite)',
            color: 'var(--color-primaryBlack)',
            borderRadius: '0.75rem',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            border: '1px solid var(--color-formColorLight)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: { primary: 'var(--color-formColorDark)', secondary: 'var(--color-primaryWhite)' },
          },
          error: {
            iconTheme: { primary: 'var(--color-redPink)', secondary: 'var(--color-primaryWhite)' },
          },
        }}
      />
    </QueryClientProvider>
  );
}
