import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Settings, Loader2, Grid, UserPlus, UserMinus, MessageCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import PostModal from './PostModal';
import ConfirmModal from './ConfirmModal';
import { SkeletonProfileHeader, SkeletonPostGrid } from './Skeletons';
import { PendingButton } from './ui/PendingButton';
import type { Pet, Post } from '../types';

export default function Profile() {
    const { petId } = useParams<{ petId?: string }>();
    const [pet, setPet] = useState<Pet | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);
    const [selectedPost, setSelectedPost] = useState<{
        id: number;
        image: string;
        content: string | null;
        location?: string | null;
        createdAt: string;
        likedByUser?: boolean;
        favoritedByUser?: boolean;
        pet: { id: number; name: string; image: string | null };
        _count: { likes: number; comments: number };
    } | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [followPending, setFollowPending] = useState(false);
    const navigate = useNavigate();
    const { currentPet, user, pets, setCurrentPet, fetchMyPets, isAuthenticated } = useAuthStore();

    useEffect(() => {
        fetchProfile();
    }, [petId]);

    const fetchProfile = async () => {
        try {
            setIsLoading(true);
            const id = petId || currentPet?.id;

            if (!id) {
                navigate('/home');
                return;
            }

            const [petResponse, postsResponse] = await Promise.all([
                api.get<Pet>(`/pets/${id}`),
                api.get<Post[]>(`/posts/pet/${id}`),
            ]);

            setPet(petResponse);
            setPosts(postsResponse);
            setIsFollowing(petResponse.isFollowing || false);
        } catch (error: any) {
            toast.error('Error al cargar el perfil');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollow = async () => {
        if (!pet) return;

        if (!isAuthenticated) {
            toast.error('Inicia sesión para seguir mascotas');
            navigate('/login');
            return;
        }

        if (followPending) return;

        const wasFollowing = isFollowing;
        const prevCount = pet.followersCount || 0;

        setIsFollowing(!isFollowing);
        setFollowPending(true);
        setPet({
            ...pet,
            followersCount: wasFollowing
                ? prevCount - 1
                : prevCount + 1,
        });

        try {
            await api.post(`/follow/${pet.id}`);
            toast.success(
                wasFollowing
                    ? 'Dejaste de seguir'
                    : 'Ahora sigues a esta mascota',
            );
        } catch (error: any) {
            setIsFollowing(wasFollowing);
            setPet({
                ...pet,
                followersCount: prevCount,
            });
            toast.error('Error al seguir/dejar de seguir');
        } finally {
            setFollowPending(false);
        }
    };

    const handleMessage = async () => {
        if (!pet) return;
        if (!isAuthenticated) {
            toast.error('Inicia sesión para enviar mensajes');
            navigate('/login');
            return;
        }
        if (!user) return;

        try {
            const response = await api.post<{ id: number }>('/conversations', {
                petId: pet.id,
            });
            navigate(`/chat?conversation=${response.id}`);
        } catch (error: any) {
            toast.error('Error al iniciar conversación');
        }
    };

    const handleDeletePet = async () => {
        if (!pet) return;
        setIsDeleting(true);
        try {
            await api.delete(`/pets/${pet.id}`);
            toast.success('Mascota eliminada');
            await fetchMyPets();
            const currentPets = useAuthStore.getState().pets;
            if (currentPets.length > 0) {
                setCurrentPet(currentPets[0]);
                navigate('/profile');
            } else {
                navigate('/create-pet');
            }
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar la mascota');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handlePostClick = (post: Post) => {
        setSelectedPost({
            id: post.id,
            image: post.image,
            content: post.content || null,
            location: post.location,
            createdAt: post.createdAt,
            likedByUser: post.isLiked,
            favoritedByUser: (post as any).isFavorited || false,
            pet: post.pet ? {
                id: post.pet.id,
                name: post.pet.name,
                image: post.pet.image || null,
            } : {
                id: pet!.id,
                name: pet!.name,
                image: pet!.image || null,
            },
            _count: {
                likes: post.likesCount,
                comments: post.commentsCount,
            },
        });
    };

    const handleModalCommentUpdate = (postId: number, commentsCount: number) => {
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, commentsCount }
                    : p,
            ),
        );
    };

    const handleModalLikeUpdate = (postId: number, liked: boolean, likesCount: number) => {
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, isLiked: liked, likesCount }
                    : p,
            ),
        );
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-bgWhite">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <SkeletonProfileHeader />
                    <div className="mt-8">
                        <SkeletonPostGrid count={9} />
                    </div>
                </div>
            </div>
        );
    }

    if (!pet) {
        return (
            <div className="min-h-screen bg-bgWhite">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                    <p className="text-primaryBlack/60">
                        No se encontró el perfil
                    </p>
                </div>
            </div>
        );
    }

    const isOwnProfile = currentPet?.id === pet.id;

    return (
        <div className="min-h-screen bg-bgWhite">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className=" rounded-2xl overflow-hidden  ">
                    <div className=" pb-8">
                        <div className="flex flex-col sm:flex-row items-center mt-8 gap-6">
                            <div className="relative">
                                {pet.image ? (
                                    <img
                                        src={pet.image}
                                        alt={pet.name}
                                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                                    />
                                ) : (
                                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-formColorDark to-formColorLight flex items-center justify-center border-4 border-white shadow-lg">
                                        <span className="text-4xl text-white">
                                            🐾
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 text-center sm:text-left ">
                                <div className="flex  flex-col sm:flex-row items-center gap-4">
                                    <h1 className="text-2xl font-bold text-primaryBlack">
                                        {pet.name}
                                    </h1>

                                    <div className="ml-auto flex gap-2">
                                        {isOwnProfile ? (
                                            <>
                                            <button
                                                onClick={() =>
                                                    navigate('/edit-profile')
                                                }
                                                className="flex items-center gap-2 px-4 py-2 border border-formColorLight/30 rounded-lg hover:bg-formColorLight/20 cursor-pointer transition-colors text-primaryBlack"
                                            >
                                                <Settings className="w-4 h-4 text-formColorDark" />
                                                Editar perfil
                                            </button>
                                            <button
                                                onClick={() => setShowDeleteModal(true)}
                                                className="flex items-center gap-2 px-4 py-2 border border-redPink/30 text-redPink rounded-lg hover:bg-red-50 cursor-pointer transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                            </>
                                        ) : currentPet ? (
                                            <>
                                                <PendingButton
                                                    onClick={handleFollow}
                                                    pending={followPending}
                                                    variant={isFollowing ? 'danger' : 'primary'}
                                                    size="md"
                                                    leftIcon={isFollowing ? <UserMinus className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                                                    className="shadow-md shadow-formColorDark/30"
                                                >
                                                    {isFollowing ? 'Dejar de seguir' : 'Seguir'}
                                                </PendingButton>
                                                <button
                                                    onClick={handleMessage}
                                                    className="flex items-center gap-2 px-4 py-2 border border-formColorLight/30 rounded-lg hover:bg-formColorLight/20 cursor-pointer transition-colors text-primaryBlack"
                                                >
                                                    <MessageCircle className="w-4 h-4 text-formColorDark" />
                                                    Mensaje
                                                </button>
                                            </>
                                        ) : null}
                                    </div>
                                </div>

                                {pet.bio && (
                                    <p className="mt-2 text-primaryBlack/70 text-center sm:text-left">
                                        {pet.bio}
                                    </p>
                                )}

                                <div className="flex items-center justify-center sm:justify-start gap-8 mt-3">
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-primaryBlack">
                                            {posts.length}
                                        </p>
                                        <p className="text-sm text-primaryBlack/50">
                                            Publicaciones
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-primaryBlack">
                                            {pet.followersCount || 0}
                                        </p>
                                        <p className="text-sm text-primaryBlack/50">
                                            Seguidores
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-xl font-bold text-primaryBlack">
                                            {pet.followingCount || 0}
                                        </p>
                                        <p className="text-sm text-primaryBlack/50">
                                            Siguiendo
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="">
                        <div className="flex  mb-4">
                            <button className="flex-1 py-3 text-center text-primaryBlack font-medium  flex items-center justify-center gap-2">
                                <Grid className="w-5 h-5 text-formColorDark" />
                                Publicaciones
                            </button>
                        </div>

                        {posts.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl">📷</span>
                                </div>
                                <p className="text-primaryBlack/60">
                                    No hay publicaciones todavía
                                </p>
                                {isOwnProfile && (
                                    <p className="text-primaryBlack/40 mt-2">
                                        ¡Crea tu primera publicación!
                                    </p>
                                )}
                            </div>
                        ) : (
                            <motion.div layout className="grid grid-cols-3 gap-1 p-1">
                                {posts.map((post) => (
                                    <motion.div
                                        key={post.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ duration: 0.2 }}
                                        onClick={() => handlePostClick(post)}
                                        className="aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                                    >
                                        <img
                                            src={post.image}
                                            alt="Post"
                                            className="w-full h-full object-cover rounded-sm"
                                        />
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </div>
                </div>
            </div>
            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onLikeUpdate={handleModalLikeUpdate}
                    onCommentUpdate={handleModalCommentUpdate}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => !isDeleting && setShowDeleteModal(false)}
                onConfirm={handleDeletePet}
                type="delete"
                isLoading={isDeleting}
                title="Eliminar mascota"
                message={`¿Estás seguro de que quieres eliminar a ${pet?.name}? Esta acción eliminará todas sus publicaciones, seguidores y datos asociados. No se puede deshacer.`}
                confirmText="Eliminar mascota"
            />
        </div>
    );
}