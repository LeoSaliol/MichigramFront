import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useThemeStore } from '../store/themeStore';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { isDark } = useThemeStore();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/reset-password', { token, password });
      setSuccess(true);
      toast.success('Contraseña restablecida correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al restablecer la contraseña');
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bgWhite px-4">
        <div className="w-full max-w-md text-center">
          <p className="text-primaryBlack/60">Enlace inválido o expirado.</p>
          <Link to="/forgot-password" className="text-redPink hover:text-formColorDark font-medium transition-colors mt-2 inline-block">
            Solicitar nuevo enlace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgWhite px-4">
      <div className="w-full max-w-md">
        <div className="bg-primaryWhite rounded-2xl shadow-xl p-8 border border-formColorLight/20">
          <div className="text-center mb-8">
            <img src={isDark ? '/assets/MLogoWhite.png' : '/assets/MLogoBlack.png'} alt="Michigram" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primaryBlack">
              {success ? 'Contraseña actualizada' : 'Nueva contraseña'}
            </h1>
            <p className="text-primaryBlack/60 mt-2">
              {success ? 'Tu contraseña se restableció correctamente' : 'Ingresá tu nueva contraseña'}
            </p>
          </div>

          {success ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 bg-gradient-to-r from-formColorDark to-redPink text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-formColorDark/30"
              >
                Iniciar Sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-primaryBlack mb-1">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-formColorLight/50 rounded-lg focus:ring-2 focus:ring-formColorDark focus:border-transparent transition-all outline-none pr-12 bg-primaryWhite"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-primaryBlack/40 hover:text-formColorDark transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-primaryBlack mb-1">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-formColorLight/50 rounded-lg focus:ring-2 focus:ring-formColorDark focus:border-transparent transition-all outline-none pr-12 bg-primaryWhite"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-formColorDark to-redPink text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-formColorDark/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Restableciendo...
                  </>
                ) : (
                  'Restablecer contraseña'
                )}
              </button>
            </form>
          )}

          {!success && (
            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-primaryBlack/60 hover:text-redPink transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
