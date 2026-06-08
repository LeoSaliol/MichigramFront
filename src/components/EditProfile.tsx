import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import ImageCropper from './ImageCropper';

export default function EditProfile() {
  const { currentPet } = useAuthStore();
  const [name, setName] = useState(currentPet?.name || '');
  const [bio, setBio] = useState(currentPet?.bio || '');
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(currentPet?.image || null);
  const [isLoading, setIsLoading] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setTempImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropDone = (croppedFile: File) => {
    setImage(croppedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(croppedFile);
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setTempImageSrc(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPet) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('name', name);
      if (bio) formData.append('bio', bio);
      if (image) formData.append('image', image);

      await api.postFormData(`/pets/${currentPet.id}`, formData);
      toast.success('¡Perfil actualizado!');
      navigate('/profile');
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar el perfil');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgWhite">
      <Navbar />
      
      <div className="max-w-md mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 text-primaryBlack/60 hover:text-formColorDark mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver
        </button>

        <div className="bg-primaryWhite rounded-2xl shadow-xl p-8 border border-formColorLight/20">
          <h1 className="text-2xl font-bold text-primaryBlack mb-6">Editar Perfil</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center">
              <label className="cursor-pointer">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 border-2 border-dashed border-formColorLight/50 flex items-center justify-center overflow-hidden hover:border-formColorDark transition-colors">
                  {preview ? (
                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-4xl">🐾</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primaryBlack mb-1">
                Nombre
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-formColorLight/50 rounded-xl focus:ring-2 focus:ring-formColorDark focus:border-transparent transition-all outline-none bg-primaryWhite"
                required
              />
            </div>

            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-primaryBlack mb-1">
                Biografía
              </label>
              <textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full px-4 py-3 border border-formColorLight/50 rounded-xl focus:ring-2 focus:ring-formColorDark focus:border-transparent transition-all outline-none resize-none bg-primaryWhite"
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-formColorDark to-redPink text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-formColorDark/30"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar Cambios'
              )}
            </button>
          </form>
        </div>
      </div>

      {showCropper && tempImageSrc && (
        <ImageCropper
          imageSrc={tempImageSrc}
          onCropDone={handleCropDone}
          onCancel={handleCropCancel}
          cropShape="round"
        />
      )}
    </div>
  );
}