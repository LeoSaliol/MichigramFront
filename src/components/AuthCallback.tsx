import React, { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

export default function AuthCallback() {
  const { fetchMe, hasPet } = useAuthStore();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      window.location.href = '/?error=' + error;
      return;
    }

    fetchMe()
      .then(() => {
        window.location.href = hasPet ? '/home' : '/create-pet';
      })
      .catch(() => {
        window.location.href = '/?error=auth_failed';
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgWhite">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-amber-500 border-t-transparent mx-auto mb-4" />
        <p className="text-primaryBlack/60">Iniciando sesión...</p>
      </div>
    </div>
  );
}