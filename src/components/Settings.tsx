import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Moon, Sun, Globe, Trash2 } from 'lucide-react';
import { useThemeStore } from '../store/themeStore';
import { useAuthStore } from '../store/authStore';
import { api } from '../lib/api';
import Navbar from './Navbar';
import ConfirmModal from './ConfirmModal';

export default function Settings() {
  const { isDark, toggleTheme } = useThemeStore();
  const { currentPet, pets, logout, fetchMyPets } = useAuthStore();
  const navigate = useNavigate();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [showDeletePetModal, setShowDeletePetModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/users/me');
      await logout();
      navigate('/');
    } catch {
      setIsDeleting(false);
      setShowDeleteAccountModal(false);
    }
  };

  const handleDeletePet = async () => {
    if (!currentPet) return;
    setIsDeleting(true);
    try {
      await api.delete(`/pets/${currentPet.id}`);
      await fetchMyPets();
      setIsDeleting(false);
      setShowDeletePetModal(false);
      if (pets.length <= 1) {
        navigate('/create-pet');
      }
    } catch {
      setIsDeleting(false);
      setShowDeletePetModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgWhite">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/home"
            className="w-9 h-9 rounded-full bg-formColorLight/20 flex items-center justify-center text-primaryBlack hover:bg-formColorLight/30 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-primaryBlack">Configuración</h1>
        </div>

        <div className="bg-primaryWhite rounded-2xl shadow-lg border border-formColorLight/20 overflow-hidden">
          <div className="px-6 py-4 border-b border-formColorLight/10">
            <h2 className="text-sm font-semibold text-primaryBlack/50 uppercase tracking-wider">Apariencia</h2>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDark ? (
                <Moon className="w-5 h-5 text-formColorDark" />
              ) : (
                <Sun className="w-5 h-5 text-formColorDark" />
              )}
              <div>
                <p className="text-sm font-medium text-primaryBlack">Modo oscuro</p>
                <p className="text-xs text-primaryBlack/50">
                  {isDark ? 'Oscuro' : 'Claro'}
                </p>
              </div>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-12 h-6 rounded-full transition-colors cursor-pointer ${
                isDark ? 'bg-formColorDark' : 'bg-formColorLight'
              }`}
            >
              <div
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  isDark ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="bg-primaryWhite rounded-2xl shadow-lg border border-formColorLight/20 overflow-hidden mt-4">
          <div className="px-6 py-4 border-b border-formColorLight/10">
            <h2 className="text-sm font-semibold text-primaryBlack/50 uppercase tracking-wider">Idioma</h2>
          </div>

          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-formColorDark" />
              <div>
                <p className="text-sm font-medium text-primaryBlack">Idioma de la app</p>
                <p className="text-xs text-primaryBlack/50">Español</p>
              </div>
            </div>
            <span className="text-sm text-primaryBlack/50">Español</span>
          </div>
        </div>

        <div className="bg-primaryWhite rounded-2xl shadow-lg border border-formColorLight/20 overflow-hidden mt-4">
          <div className="px-6 py-4 border-b border-formColorLight/10">
            <h2 className="text-sm font-semibold text-primaryBlack/50 uppercase tracking-wider">Cuenta</h2>
          </div>

          {currentPet && (
            <button
              onClick={() => setShowDeletePetModal(true)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-formColorLight/5 transition-colors cursor-pointer border-b border-formColorLight/10"
            >
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-redPink" />
                <div className="text-left">
                  <p className="text-sm font-medium text-primaryBlack">Eliminar {currentPet.name}</p>
                  <p className="text-xs text-primaryBlack/50">Eliminar esta mascota y sus publicaciones</p>
                </div>
              </div>
            </button>
          )}

          <button
            onClick={() => setShowDeleteAccountModal(true)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-formColorLight/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <Trash2 className="w-5 h-5 text-redPink" />
              <div className="text-left">
                <p className="text-sm font-medium text-primaryBlack">Eliminar cuenta</p>
                <p className="text-xs text-primaryBlack/50">Eliminar permanentemente tu cuenta y todas las mascotas</p>
              </div>
            </div>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-primaryBlack/40">Michigram v1.0.0</p>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeletePetModal}
        onClose={() => !isDeleting && setShowDeletePetModal(false)}
        onConfirm={handleDeletePet}
        type="delete"
        isLoading={isDeleting}
        title={`Eliminar ${currentPet?.name}`}
        message={`¿Estás seguro de que quieres eliminar a ${currentPet?.name}? Se eliminarán todas sus publicaciones y no se puede deshacer.`}
        confirmText="Eliminar mascota"
      />

      <ConfirmModal
        isOpen={showDeleteAccountModal}
        onClose={() => !isDeleting && setShowDeleteAccountModal(false)}
        onConfirm={handleDeleteAccount}
        type="delete"
        isLoading={isDeleting}
        title="Eliminar cuenta"
        message="¿Estás seguro de que quieres eliminar tu cuenta? Esta acción eliminará todos tus datos, mascotas, publicaciones y no se puede deshacer."
        confirmText="Eliminar cuenta"
      />
    </div>
  );
}