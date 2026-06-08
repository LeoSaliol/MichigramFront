import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
    Heart,
    MessageCircle,
    Bookmark,
    MoreHorizontal,
    Loader2,
    Pencil,
    Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import ImageCropper from './ImageCropper';
import ConfirmModal from './ConfirmModal';
import PostModal from './PostModal';
import LocationPicker from './LocationPicker';

export default function Home() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const { currentPet, fetchMyPets, pets, hasPet, isAuthenticated } = useAuthStore();
    const [showCreatePost, setShowCreatePost] = useState(false);
    const [newPostImage, setNewPostImage] = useState<File | null>(null);
    const [newPostDescription, setNewPostDescription] = useState('');
    const [newPostLocation, setNewPostLocation] = useState('');
    const [showCropper, setShowCropper] = useState(false);
    const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [activeMenu, setActiveMenu] = useState<number | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPostId, setEditingPostId] = useState<number | null>(null);
    const [editContent, setEditContent] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePostId, setDeletePostId] = useState<number | null>(null);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportPostId, setReportPostId] = useState<number | null>(null);
    const [selectedPost, setSelectedPost] = useState<any>(null);
    const [favoritedPosts, setFavoritedPosts] = useState<Set<number>>(new Set());

    useEffect(() => {
        fetchMyPets();
    }, []);

    useEffect(() => {
        fetchPosts();
    }, [currentPet?.id]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (activeMenu && !(e.target as Element).closest('.post-menu')) {
                setActiveMenu(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [activeMenu]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (showCreatePost) setShowCreatePost(false);
                if (isEditing) handleCancelEdit();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showCreatePost, isEditing]);

    const fetchPosts = async () => {
        try {
            setIsLoading(true);
            const { currentPet: pet } = useAuthStore.getState();
            const petId = pet?.id;
            const url = `/posts/feed${petId ? `?petId=${petId}` : ''}`;
            const response = await api.get<{ success: boolean; data: any[] }>(
                url,
            );
            setPosts(response.data);
            setFavoritedPosts(new Set(response.data.filter((p: any) => p.favoritedByUser).map((p: any) => p.id)));
        } catch (error: any) {
            console.error('Error fetching posts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLike = async (postId: number) => {
        if (!isAuthenticated) {
            toast.error('Inicia sesión para dar like');
            navigate('/login');
            return;
        }
        try {
            await api.post(`/likes/toggle/${postId}`);
            setPosts(
                posts.map((post) =>
                    post.id === postId
                        ? {
                              ...post,
                              likedByUser: !post.likedByUser,
                              likesCount: post.likedByUser
                                  ? post.likesCount - 1
                                  : post.likesCount + 1,
                              _count: {
                                  ...post._count,
                                  likes: post.likedByUser
                                      ? post._count.likes - 1
                                      : post._count.likes + 1,
                              },
                          }
                        : post,
                ),
            );
        } catch (error: any) {
            toast.error('Error al dar like');
        }
    };

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
        setNewPostImage(croppedFile);
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(croppedFile);
        setShowCropper(false);
        setTempImageSrc(null);
    };

    const handleCropCancel = () => {
        setShowCropper(false);
        setTempImageSrc(null);
        setNewPostImage(null);
        setImagePreview(null);
    };

    const isOwnPost = (postPetId: number) => {
        return pets.some((pet) => pet.id === postPetId);
    };

    const handleEditPost = (post: any) => {
        setEditingPostId(post.id);
        setEditContent(post.content || '');
        setActiveMenu(null);
        setIsEditing(true);
    };

    const handleSaveEdit = async (postId: number) => {
        if (!editContent.trim()) {
            toast.error('La descripción no puede estar vacía');
            return;
        }

        setIsEditing(true);
        try {
            await api.put(`/posts/${postId}`, { content: editContent });
            toast.success('Publicación actualizada');
            setPosts(
                posts.map((p) =>
                    p.id === postId ? { ...p, content: editContent } : p,
                ),
            );
            setIsEditing(false);
            setEditingPostId(null);
            setEditContent('');
        } catch (error: any) {
            toast.error(error.message || 'Error al actualizar');
        } finally {
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingPostId(null);
        setEditContent('');
    };

    const handleDeletePost = (postId: number) => {
        setDeletePostId(postId);
        setActiveMenu(null);
        setShowDeleteModal(true);
    };

    const confirmDeletePost = async () => {
        if (!deletePostId) return;

        try {
            await api.delete(`/posts/${deletePostId}`);
            toast.success('Publicación eliminada');
            setPosts(posts.filter((p) => p.id !== deletePostId));
            setShowDeleteModal(false);
            setDeletePostId(null);
        } catch (error: any) {
            toast.error(error.message || 'Error al eliminar');
        }
    };

    const handleReportPost = (postId: number) => {
        setReportPostId(postId);
        setActiveMenu(null);
        setShowReportModal(true);
    };

    const confirmReportPost = async () => {
        if (!reportPostId) return;

        try {
            await api.post(`/reports/${reportPostId}`);
            toast.success('Publicación reportada');
            setShowReportModal(false);
            setReportPostId(null);
        } catch (error: any) {
            toast.error(error.message || 'Ya reportaste esta publicación');
        }
    };

    const handleModalCommentUpdate = (postId: number, commentsCount: number) => {
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? { ...p, _count: { ...p._count, comments: commentsCount } }
                    : p,
            ),
        );
    };

    const handleToggleFavorite = async (postId: number) => {
        if (!isAuthenticated) {
            toast.error('Inicia sesión para guardar favoritos');
            navigate('/login');
            return;
        }
        try {
            await api.post(`/favorites/toggle/${postId}`, { petId: currentPet?.id });
            setFavoritedPosts((prev) => {
                const next = new Set(prev);
                if (next.has(postId)) {
                    next.delete(postId);
                } else {
                    next.add(postId);
                }
                return next;
            });
        } catch {
            toast.error('Error al guardar favorito');
        }
    };

    const handleModalLikeUpdate = (postId: number, liked: boolean, likesCount: number) => {
        setPosts((prev) =>
            prev.map((p) =>
                p.id === postId
                    ? {
                          ...p,
                          likedByUser: liked,
                          likesCount,
                          _count: { ...p._count, likes: likesCount },
                      }
                    : p,
            ),
        );
    };

    const handleCreatePost = async () => {
        if (!newPostImage) {
            toast.error('Selecciona una imagen');
            return;
        }

        if (!currentPet?.id) {
            toast.error('Selecciona una mascota');
            return;
        }

        setIsCreatingPost(true);
        try {
            const formData = new FormData();
            formData.append('image', newPostImage);
            formData.append('petId', currentPet.id.toString());
            if (newPostDescription) {
                formData.append('content', newPostDescription);
            }
            if (newPostLocation) {
                formData.append('location', newPostLocation);
            }

            await api.postFormData('/posts', formData);
            toast.success('¡Publicación creada!');
            setShowCreatePost(false);
            setNewPostImage(null);
            setNewPostDescription('');
            setNewPostLocation('');
            fetchPosts();
        } catch (error: any) {
            toast.error(error.message || 'Error al crear la publicación');
        } finally {
            setIsCreatingPost(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        if (hours < 24) return `Hace ${hours}h`;
        if (days < 7) return `Hace ${days}d`;
        return date.toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'short',
        });
    };

    if (isAuthenticated && (!hasPet || pets.length === 0)) {
        return (
            <div className="min-h-screen bg-bgWhite">
                <Navbar />
                <div className="max-w-5xl mx-auto px-4 py-8">
                    <div className="bg-primaryWhite rounded-2xl shadow-lg p-8 text-center border border-formColorLight/20">
                        <div className="w-20 h-20 bg-linear-to-br from-formColorLight to-formColorDark rounded-full flex items-center justify-center mx-auto mb-6">
                            <span className="text-4xl">🐾</span>
                        </div>
                        <h2 className="text-2xl font-bold text-primaryBlack mb-4">
                            ¡Crea tu primera mascota!
                        </h2>
                        <p className="text-primaryBlack/60 mb-6">
                            Para poder publicar y ver el feed, primero necesitas
                            crear una mascota.
                        </p>
                        <Link
                            to="/create-pet"
                            className="inline-block px-6 py-3 bg-linear-to-r from-formColorLight to-formColorDark text-white font-semibold rounded-lg hover:opacity-90 transition-all shadow-lg shadow-formColor/30"
                        >
                            Crear Mascota
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-bgWhite">
            <Navbar onCreatePost={() => setShowCreatePost(true)} />

            {showCreatePost && (
                <div className="fixed inset-0 bg-primaryBlack/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowCreatePost(false)}>
                    <div className="bg-primaryWhite rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-formColorLight/20" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-primaryBlack">
                                Nueva Publicación
                            </h2>
                            <button
                                onClick={() => setShowCreatePost(false)}
                                className="w-8 h-8 rounded-full bg-formColorLight/20 flex items-center justify-center text-formColorDark hover:bg-formColorLight/30 transition-colors"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-3 px-4 py-3 bg-formColorLight/10 rounded-xl">
                                <span className="text-sm text-primaryBlack/70">
                                    Publicando como
                                </span>
                                <span className="text-sm font-semibold text-primaryBlack">
                                    {currentPet?.name}
                                </span>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primaryBlack mb-2">
                                    Imagen de la publicación
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageChange}
                                    className="w-full border-2 border-dashed border-formColorLight/30 rounded-xl p-4 text-sm text-primaryBlack/60 hover:border-formColorDark transition-colors cursor-pointer"
                                />
                                {imagePreview && (
                                    <div className="mt-4 relative flex justify-center">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-1/2 rounded-xl"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setNewPostImage(null);
                                                setImagePreview(null);
                                            }}
                                            className="absolute top-2 right-2 w-8 h-8 bg-primaryWhite rounded-full shadow-lg flex items-center justify-center text-primaryBlack hover:bg-formColorLight/20"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primaryBlack mb-2">
                                    Descripción (opcional)
                                </label>
                                <textarea
                                    value={newPostDescription}
                                    onChange={(e) =>
                                        setNewPostDescription(e.target.value)
                                    }
                                    placeholder="¿Qué está haciendo tu mascota?"
                                    className="w-full border border-formColorLight/20 rounded-xl p-4 resize-none h-24 bg-primaryWhite focus:border-formColorDark focus:ring-2 focus:ring-formColorDark/20 outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-primaryBlack mb-2">
                                    Ubicación (opcional)
                                </label>
                                <LocationPicker
                                    value={newPostLocation}
                                    onChange={setNewPostLocation}
                                />
                            </div>

                            <button
                                onClick={handleCreatePost}
                                disabled={isCreatingPost}
                                className="w-full py-3 bg-linear-to-r from-formColorLight to-formColorDark text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-formColor/30"
                            >
                                {isCreatingPost ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Publicando...
                                    </>
                                ) : (
                                    'Publicar'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isEditing && editingPostId && (
                <div className="fixed inset-0 bg-primaryBlack/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={handleCancelEdit}>
                    <div className="bg-primaryWhite rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-formColorLight/20" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-primaryBlack">
                                Editar Publicación
                            </h2>
                            <button
                                onClick={handleCancelEdit}
                                className="w-8 h-8 rounded-full bg-formColorLight/20 flex items-center justify-center text-formColorDark hover:bg-formColorLight/30 transition-colors"
                            >
                                ✕
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-primaryBlack] mb-2">
                                Descripción
                            </label>
                            <textarea
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                className="w-full border border-formColorLight/20 rounded-xl p-4 resize-none h-32 bg-primaryWhite focus:border-formColorDark focus:ring-2 focus:ring-formColorDark/20 outline-none transition-all"
                            />
                        </div>
                        <button
                            onClick={() => handleSaveEdit(editingPostId)}
                            disabled={isEditing}
                            className="w-full mt-4 py-3 bg-linear-to-r from-formColorLight to-formColorDark text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-formColor/30"
                        >
                            {isEditing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                'Guardar Cambios'
                            )}
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-5xl mx-auto px-4 py-8">
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-formColorLight/30 border-t-formColorDark rounded-full animate-spin" />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="bg-primaryWhite rounded-2xl shadow-lg p-8 text-center border border-formColorLight/20">
                        <div className="w-16 h-16 bg-linear-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <span className="text-3xl">📷</span>
                        </div>
                        <p className="text-primaryBlack/70 text-lg">
                            No hay publicaciones todavía.
                        </p>
                        <p className="text-primaryBlack/40 mt-2">
                            ¡Sé el primero en publicar algo!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {posts.map((post) => (
                            <div
                                key={post.id}
                                className="bg-primaryWhite dark:bg-transparent rounded-2xl shadow-lg dark:shadow-none overflow-hidden border border-formColorLight/20 dark:border-0"
                            >
                                <div className="flex items-center justify-between p-4 border-b border-formColorLight/10 dark:border-b-0">
                                    <Link
                                        to={`/pet/${post.pet.id}`}
                                        className="flex items-center gap-3"
                                    >
                                        {post.pet.image ? (
                                            <img
                                                src={post.pet.image}
                                                alt={post.pet.name}
                                                className="w-11 h-11 rounded-full object-cover border-2 border-formColorLight/30"
                                            />
                                        ) : (
                                            <div className="w-11 h-11 rounded-full bg-linear-to-br from-formColorLight to-formColorDark flex items-center justify-center">
                                                <span className="text-white text-lg">
                                                    🐾
                                                </span>
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-semibold text-primaryBlack">
                                                {post.pet.name}
                                            </p>
                                            {post.location && (
                                                <p className="text-xs text-primaryBlack/40">📍 {post.location}</p>
                                            )}
                                        </div>
                                    </Link>
                                    <div className="flex items-center gap-3">
                                        <p className="text-xs text-primaryBlack/50 whitespace-nowrap">
                                            {formatDate(post.createdAt)}
                                        </p>
                                        <div className="relative post-menu">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setActiveMenu(
                                                    activeMenu === post.id
                                                        ? null
                                                        : post.id,
                                                );
                                            }}
                                            className="w-8 h-8 rounded-full hover:bg-formColorLight/10 flex items-center justify-center text-primaryBlack/40 hover:text-primaryBlack transition-colors cursor-pointer"
                                        >
                                            <MoreHorizontal className="w-5 h-5" />
                                        </button>
                                        {activeMenu === post.id && (
                                            <div
                                                className="absolute  right-0 top-10 bg-primaryWhite rounded-xl shadow-xl border border-formColorLight/20 py-2 z-10 min-w-36"
                                                onClick={(e) =>
                                                    e.stopPropagation()
                                                }
                                            >
                                                {isOwnPost(post.pet.id) ? (
                                                    <>
                                                        <button
                                                            onClick={() =>
                                                                handleEditPost(
                                                                    post,
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 text-left text-sm text-primaryBlack cursor-pointer hover:bg-formColorLight/10 flex items-center gap-2"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDeletePost(
                                                                    post.id,
                                                                )
                                                            }
                                                            className="w-full px-4 py-2 text-left text-sm text-redPink cursor-pointer hover:bg-red-50 flex items-center gap-2"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Eliminar
                                                        </button>
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() =>
                                                            handleReportPost(
                                                                post.id,
                                                            )
                                                        }
                                                        className="w-full px-4 py-2 text-left text-sm text-primaryBlack cursor-pointer hover:bg-formColorLight/10 flex items-center gap-2"
                                                    >
                                                        🚩 Reportar
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    </div>
                                </div>

                                <div className="relative cursor-pointer" onClick={() => setSelectedPost(post)}>
                                    <img
                                        src={post.image}
                                        alt="Post"
                                        className="w-[60%] mx-auto max-h-[280px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[480px] xl:max-h-[550px] object-cover"
                                    />
                                </div>

                                <div className="p-4">
                                    <div className="flex items-center gap-4 mb-4">
                                        <button
                                            onClick={() => handleLike(post.id)}
                                            className={`flex items-center gap-2 transition-all ${
                                                post.likedByUser
                                                    ? 'text-likeColor'
                                                    : 'text-primaryBlack/60 hover:text-likeColor'
                                            }`}
                                        >
                                            <Heart
                                                className={`w-7 h-7 ${post.likedByUser ? 'fill-current' : ''} transition-transform hover:scale-110`}
                                            />
                                            <span className="text-sm font-medium">
                                                {post._count?.likes || 0}
                                            </span>
                                        </button>
                                        <button onClick={() => setSelectedPost(post)} className="flex items-center gap-2 text-primaryBlack/60 hover:text-formColorDark transition-colors">
                                            <MessageCircle className="w-7 h-7" />
                                            <span className="text-sm font-medium">
                                                {post._count?.comments || 0}
                                            </span>
                                        </button>
                                        <button
                                            onClick={() => handleToggleFavorite(post.id)}
                                            className={`ml-auto transition-colors ${
                                                favoritedPosts.has(post.id)
                                                    ? 'text-likeColor'
                                                    : 'text-primaryBlack/60 hover:text-likeColor'
                                            }`}
                                        >
                                            <Bookmark className={`w-7 h-7 ${favoritedPosts.has(post.id) ? 'fill-current' : ''}`} />
                                        </button>
                                    </div>

                                    {post.content && (
                                        <div className="mb-3">
                                            <p className="text-primaryBlack">
                                                <span className="font-semibold">
                                                    {post.pet?.name}
                                                </span>{' '}
                                                {post.content}
                                            </p>
                                        </div>
                                    )}

                                    {(post._count?.comments || 0) > 0 && (
                                        <button onClick={() => setSelectedPost(post)} className="text-primaryBlack/50 text-sm hover:text-formColorDark transition-colors">
                                            Ver los {post._count.comments}{' '}
                                            comentarios
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selectedPost && (
                <PostModal
                    post={selectedPost}
                    onClose={() => setSelectedPost(null)}
                    onLikeUpdate={handleModalLikeUpdate}
                    onCommentUpdate={handleModalCommentUpdate}
                    onEdit={(post) => {
                        setSelectedPost(null);
                        handleEditPost(post);
                    }}
                    onDelete={(postId) => {
                        setPosts((prev) => prev.filter((p) => p.id !== postId));
                    }}
                />
            )}

            {showCropper && tempImageSrc && (
                <ImageCropper
                    imageSrc={tempImageSrc}
                    onCropDone={handleCropDone}
                    onCancel={handleCropCancel}
                    cropShape="rect"
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setDeletePostId(null);
                }}
                onConfirm={confirmDeletePost}
                type="delete"
            />

            <ConfirmModal
                isOpen={showReportModal}
                onClose={() => {
                    setShowReportModal(false);
                    setReportPostId(null);
                }}
                onConfirm={confirmReportPost}
                type="report"
            />
        </div>
    );
}
