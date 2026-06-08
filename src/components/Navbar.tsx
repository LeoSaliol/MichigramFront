import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    Home,
    Search,
    PlusSquare,
    Heart,
    User,
    Menu,
    X,
    PawPrint,
    LogOut,
    MessageCircle,
    Settings,
    Bookmark,
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { api } from '../lib/api';

interface NavbarProps {
    onCreatePost?: () => void;
}

export default function Navbar({ onCreatePost }: NavbarProps) {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const location = useLocation();
    const { user, currentPet, logout, pets, setCurrentPet, hasPet, isAuthenticated } =
        useAuthStore();
    const { isDark } = useThemeStore();
    const [showPetSelector, setShowPetSelector] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState<number | null>(null);
    const [unreadNotifications, setUnreadNotifications] = useState<
        number | null
    >(null);

    useEffect(() => {
        if (!isAuthenticated) return;

        const fetchUnreadCounts = async () => {
            try {
                const messagesRes = await api.get<{
                    success: boolean;
                    data: number;
                }>('/conversations/unread/count');
                setUnreadMessages(messagesRes.data || null);
            } catch (e) {
                console.error('Error fetching unread messages:', e);
            }

            if (currentPet) {
                try {
                    const notifRes = await api.get<{
                        success: boolean;
                        data: number;
                    }>(`/notifications/${currentPet.id}/unread/count`);
                    setUnreadNotifications(notifRes.data || null);
                } catch (e) {
                    console.error('Error fetching unread notifications:', e);
                }
            }
        };

        fetchUnreadCounts();
        const interval = setInterval(fetchUnreadCounts, 30000);
        window.addEventListener('refresh-unread', fetchUnreadCounts);
        return () => {
            clearInterval(interval);
            window.removeEventListener('refresh-unread', fetchUnreadCounts);
        };
    }, [currentPet, isAuthenticated]);

    const showCreateButton = hasPet && pets.length > 0;

    const handleLogout = async () => {
        await logout();
        window.location.href = '/';
    };

    const handlePetChange = async (pet: (typeof pets)[0]) => {
        setCurrentPet(pet);
        setShowPetSelector(false);
        try {
            await api.post(`/pets/select/${pet.id}`);
        } catch (e) {
            console.error('Error updating pet cookie:', e);
        }
    };

    const navLinks = [
        { to: '/home', icon: Home, label: 'Inicio' },
        { to: '/explore', icon: Search, label: 'Explorar' },
        {
            to: '/notifications',
            icon: Heart,
            label: 'Notificaciones',
            badge: unreadNotifications,
        },
        {
            to: '/chat',
            icon: MessageCircle,
            label: 'Chat',
            badge: unreadMessages,
        },
    ];

    const isActive = (path: string) => location.pathname === path;

    if (!isAuthenticated) {
        return (
            <nav className="bg-primaryWhite border-b border-formColorLight/20 sticky top-0 z-50">
                <div className="w-4/5 mx-auto px-4">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/home" className="flex items-center gap-2">
                            <img
                                src={isDark ? '/assets/MLogoWhite.png' : '/assets/MLogoBlack.png'}
                                alt="Michigram"
                                className="h-8"
                            />
                        </Link>

                        <div className="hidden md:flex items-center gap-4">
                            <Link
                                to="/home"
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                    isActive('/home')
                                        ? 'text-redPink bg-formColorLight/10'
                                        : 'text-primaryBlack/60 hover:text-primaryBlack'
                                }`}
                            >
                                Explorar
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            <Link
                                to="/login"
                                className="px-4 py-2 text-sm font-medium text-primaryBlack/60 hover:text-primaryBlack transition-colors"
                            >
                                Iniciar sesión
                            </Link>
                            <Link
                                to="/register"
                                className="px-5 py-2 text-sm font-medium bg-linear-to-r from-formColorLight to-formColorDark text-white rounded-xl hover:opacity-90 transition-all"
                            >
                                Registrarse
                            </Link>
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-full hover:bg-primaryWhite transition-colors"
                            >
                                {mobileMenuOpen ? (
                                    <X className="w-6 h-6 text-primaryBlack" />
                                ) : (
                                    <Menu className="w-6 h-6 text-primaryBlack" />
                                )}
                            </button>
                        </div>
                    </div>

                    {mobileMenuOpen && (
                        <div className="md:hidden py-4 border-t border-formColorLight/20">
                            <div className="flex flex-col gap-2">
                                <Link
                                    to="/home"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-primaryBlack/70 hover:bg-primaryWhite"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <Home className="w-5 h-5" />
                                    Explorar
                                </Link>
                                <Link
                                    to="/login"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-primaryBlack/70 hover:bg-primaryWhite"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Iniciar sesión
                                </Link>
                                <Link
                                    to="/register"
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-primaryBlack/70 hover:bg-primaryWhite"
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    Registrarse
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </nav>
        );
    }

    return (
        <nav className="bg-primaryWhite border-b border-formColorLight/20 sticky top-0 z-50">
            <div className="w-4/5 mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <Link
                        to="/home"
                        className="flex items-center gap-2"
                    >
                        <img
                            src={
                                isDark
                                    ? '/assets/MLogoWhite.png'
                                    : '/assets/MLogoBlack.png'
                            }
                            alt="Michigram"
                            className="h-8"
                        />
                        <span className="text-xl font-bold text-primaryBlack hidden sm:block"></span>
                    </Link>

                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.to}
                                to={link.to}
                                className={`relative flex flex-col items-center gap-1 text-xs transition-colors ${
                                    isActive(link.to)
                                        ? 'text-redPink'
                                        : 'text-primaryBlack/60 hover:text-formColorDark'
                                }`}
                            >
                                <link.icon className="w-6 h-6" />
                                <span>{link.label}</span>
                                {link.badge && link.badge > 0 && (
                                    <span
                                        className={
                                            'absolute -top-1  min-w-[18px] h-[18px] bg-redPink text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ' +
                                            (link.label === 'Notificaciones'
                                                ? 'right-5'
                                                : '-right-1')
                                        }
                                    >
                                        {link.badge > 99 ? '99+' : link.badge}
                                    </span>
                                )}
                            </Link>
                        ))}

                        {showCreateButton && (
                            <button
                                onClick={onCreatePost}
                                className="flex flex-col items-center gap-1 text-xs text-primaryBlack/60 hover:text-formColorDark transition-colors cursor-pointer"
                            >
                                <PlusSquare className="w-6 h-6" />
                                <span>Crear</span>
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4">
                        {currentPet && (
                            <div className="relative">
                                <button
                                    onClick={() =>
                                        setShowPetSelector(!showPetSelector)
                                    }
                                    className="flex items-center gap-2 p-1 rounded-full hover:bg-primaryWhite transition-colors"
                                >
                                    <div className="relative">
                                        {currentPet.image ? (
                                            <img
                                                src={currentPet.image}
                                                alt={currentPet.name}
                                                className="w-9 h-9 rounded-full object-cover border-2 border-formColorLight/30"
                                            />
                                        ) : (
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center">
                                                <PawPrint className="w-4 h-4 text-white" />
                                            </div>
                                        )}
                                        <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-green-500 border-2 border-white rounded-full" />
                                    </div>
                                </button>

                                {showPetSelector && (
                                    <div className="absolute right-0 top-full mt-2 bg-primaryWhite rounded-xl shadow-xl border border-formColorLight/20 py-2 min-w-60 z-50">
                                        <div className="px-4 py-3 border-b border-formColorLight/20">
                                            <p className="text-sm font-semibold text-primaryBlack">
                                                {user?.name}
                                            </p>
                                            <p className="text-xs text-primaryBlack/50">
                                                {user?.email}
                                            </p>
                                        </div>

                                        {pets.length > 0 && (
                                            <>
                                                <div className="px-4 py-2 text-xs text-primaryBlack/50 font-medium">
                                                    Cambiar de mascota
                                                </div>
                                                {pets.map((pet) => (
                                                    <button
                                                        key={pet.id}
                                                        onClick={() =>
                                                            handlePetChange(pet)
                                                        }
                                                        className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-formColorLight/10 transition-colors ${
                                                            currentPet.id ===
                                                            pet.id
                                                                ? 'bg-formColorLight/10'
                                                                : ''
                                                        }`}
                                                    >
                                                        {pet.image ? (
                                                            <img
                                                                src={pet.image}
                                                                alt={pet.name}
                                                                className="w-10 h-10 rounded-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center">
                                                                <PawPrint className="w-5 h-5 text-white" />
                                                            </div>
                                                        )}
                                                        <div className="text-left flex-1">
                                                            <span className="text-sm font-medium text-primaryBlack block">
                                                                {pet.name}
                                                            </span>
                                                            {currentPet.id ===
                                                                pet.id && (
                                                                <span className="text-xs text-green-500 font-medium">
                                                                    Activa
                                                                </span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                                <div className="border-t border-formColorLight/20 mt-1 pt-1">
                                                    <Link
                                                        to="/create-pet"
                                                        className="flex items-center gap-3 px-4 py-2 hover:bg-formColorLight/10 text-redPink text-sm font-medium"
                                                        onClick={() =>
                                                            setShowPetSelector(
                                                                false,
                                                            )
                                                        }
                                                    >
                                                        <PlusSquare className="w-4 h-4" />
                                                        Agregar mascota
                                                    </Link>
                                                </div>
                                            </>
                                        )}

                                        <div className="border-t border-formColorLight/20 mt-1 pt-1">
                                            <Link
                                                to="/profile"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-formColorLight/10 text-primaryBlack hover:text-formColorDark"
                                                onClick={() =>
                                                    setShowPetSelector(false)
                                                }
                                            >
                                                <User className="w-4 h-4 text-formColorDark" />
                                                Perfil
                                            </Link>
                                            <Link
                                                to="/favorites"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-formColorLight/10 text-primaryBlack hover:text-formColorDark"
                                                onClick={() =>
                                                    setShowPetSelector(false)
                                                }
                                            >
                                                <Bookmark className="w-4 h-4 text-formColorDark" />
                                                Favoritos
                                            </Link>
                                            <Link
                                                to="/settings"
                                                className="flex items-center gap-3 px-4 py-3 hover:bg-formColorLight/10 text-primaryBlack hover:text-formColorDark"
                                                onClick={() =>
                                                    setShowPetSelector(false)
                                                }
                                            >
                                                <Settings className="w-4 h-4 text-formColorDark" />
                                                Ajustes
                                            </Link>
                                        </div>

                                        <div className="border-t border-formColorLight/20 mt-1 pt-1">
                                            <button
                                                onClick={handleLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-redPink/5 text-redPink"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                Cerrar sesión
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                            className="md:hidden p-2 rounded-full hover:bg-primaryWhite transition-colors"
                        >
                            {mobileMenuOpen ? (
                                <X className="w-6 h-6 text-primaryBlack" />
                            ) : (
                                <Menu className="w-6 h-6 text-primaryBlack" />
                            )}
                        </button>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-formColorLight/20">
                        <div className="flex flex-col gap-2">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    className={`relative flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                                        isActive(link.to)
                                            ? 'bg-formColorLight/10 text-redPink'
                                            : 'text-primaryBlack/70 hover:bg-primaryWhite'
                                    }`}
                                    onClick={() => setMobileMenuOpen(false)}
                                >
                                    <link.icon className="w-5 h-5" />
                                    {link.label}
                                    {link.badge && link.badge > 0 && (
                                        <span className="ml-auto min-w-[20px] h-5 bg-redPink text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                                            {link.badge > 99
                                                ? '99+'
                                                : link.badge}
                                        </span>
                                    )}
                                </Link>
                            ))}
                            {showCreateButton && (
                                <button
                                    onClick={() => {
                                        onCreatePost?.();
                                        setMobileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-primaryBlack/70 hover:bg-primaryWhite"
                                >
                                    <PlusSquare className="w-5 h-5" />
                                    Crear publicación
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
