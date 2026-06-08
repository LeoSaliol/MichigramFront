import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useThemeStore } from '../store/themeStore';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { isDark } = useThemeStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      toast.success('Revisá tu correo para restablecer tu contraseña');
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar el correo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgWhite px-4">
      <div className="w-full max-w-md">
        <div className="bg-primaryWhite rounded-2xl shadow-xl p-8 border border-formColorLight/20">
          <div className="text-center mb-8">
            <img src={isDark ? '/assets/MLogoWhite.png' : '/assets/MLogoBlack.png'} alt="Michigram" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-primaryBlack">Recuperar contraseña</h1>
            <p className="text-primaryBlack/60 mt-2">
              {sent
                ? 'Si el correo está registrado, recibirás un enlace para restablecer tu contraseña'
                : 'Ingresá tu correo electrónico y te enviaremos un enlace de recuperación'}
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-primaryBlack mb-1">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-formColorLight/50 rounded-lg focus:ring-2 focus:ring-formColorDark focus:border-transparent transition-all outline-none bg-primaryWhite"
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-formColorDark to-redPink text-white font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-formColorDark/30"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Enviar enlace
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-primaryBlack/60 text-sm">
                Revisá tu bandeja de entrada y seguí las instrucciones.
              </p>
            </div>
          )}

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm text-primaryBlack/60 hover:text-redPink transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
