import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, X, Pencil, Trash2, Check, X as XIcon, MoreHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';
import { SkeletonCommentsList } from './Skeletons';
import { OptimisticHeart } from './ui/OptimisticHeart';
import { CommentInput } from './ui/CommentInput';
import { PendingButton } from './ui/PendingButton';

interface PostData {
  id: number;
  image: string;
  content: string | null;
  location?: string | null;
  createdAt: string;
  likedByUser?: boolean;
  favoritedByUser?: boolean;
  pet: {
    id: number;
    name: string;
    image: string | null;
  };
  _count: {
    likes: number;
    comments: number;
  };
}

interface CommentData {
  id: number;
  content: string;
  createdAt: string;
  pet: {
    id: number;
    name: string;
    image: string | null;
  };
}

interface PostModalProps {
  post: PostData;
  onClose: () => void;
  onLikeUpdate?: (postId: number, liked: boolean, likesCount: number) => void;
  onCommentUpdate?: (postId: number, commentsCount: number) => void;
  onEdit?: (post: PostData) => void;
  onDelete?: (postId: number) => void;
}

export default function PostModal({ post, onClose, onLikeUpdate, onCommentUpdate, onEdit, onDelete }: PostModalProps) {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(post.likedByUser || false);
  const [likesCount, setLikesCount] = useState(post._count.likes);
  const [favorited, setFavorited] = useState(post.favoritedByUser || false);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [favPending, setFavPending] = useState(false);
  const { currentPet, pets, isAuthenticated } = useAuthStore();
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [editingPending, setEditingPending] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [deletePostPending, setDeletePostPending] = useState(false);
  const isOwnPost = pets.some((p) => p.id === post.pet.id);

  const likedRef = useRef(liked);
  likedRef.current = liked;
  const likesCountRef = useRef(likesCount);
  likesCountRef.current = likesCount;
  const favoritedRef = useRef(favorited);
  favoritedRef.current = favorited;

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (!commentsLoading && comments.length > 0) {
      commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, commentsLoading]);

  const fetchComments = async () => {
    try {
      setCommentsLoading(true);
      const data = await api.get<CommentData[]>(`/comments/${post.id}`);
      setComments(data);
    } catch {
      toast.error('Error al cargar comentarios');
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para guardar favoritos');
      navigate('/login');
      return;
    }
    if (favPending) return;

    const wasFav = favoritedRef.current;
    setFavPending(true);
    setFavorited(!wasFav);

    try {
      await api.post(`/favorites/toggle/${post.id}`, { petId: currentPet?.id });
    } catch {
      setFavorited(wasFav);
      toast.error('Error al guardar favorito');
    } finally {
      setFavPending(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para dar like');
      navigate('/login');
      return;
    }
    if (likePending) return;

    const wasLiked = likedRef.current;
    const prevCount = likesCountRef.current;
    setLikePending(true);
    setLiked(!wasLiked);
    setLikesCount(wasLiked ? prevCount - 1 : prevCount + 1);
    onLikeUpdate?.(post.id, !wasLiked, wasLiked ? prevCount - 1 : prevCount + 1);

    try {
      await api.post(`/likes/toggle/${post.id}`);
    } catch {
      setLiked(wasLiked);
      setLikesCount(prevCount);
      onLikeUpdate?.(post.id, wasLiked, prevCount);
      toast.error('Error al dar like');
    } finally {
      setLikePending(false);
    }
  };

  const handleSendComment = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para comentar');
      navigate('/login');
      return;
    }
    const text = commentText.trim();
    if (!text) return;
    if (sendingComment) return;

    const tempComment: CommentData = {
      id: -Date.now(),
      content: text,
      createdAt: new Date().toISOString(),
      pet: currentPet
        ? { id: currentPet.id, name: currentPet.name, image: currentPet.image || null }
        : { id: 0, name: '', image: null },
    };

    setSendingComment(true);
    setComments((prev) => [...prev, tempComment]);
    setCommentText('');
    const prevCount = comments.length;
    const newCount = prevCount + 1;
    onCommentUpdate?.(post.id, newCount);

    try {
      const newComment = await api.post<CommentData>(`/comments/${post.id}`, { content: text });
      setComments((prev) => prev.map((c) => (c.id === tempComment.id ? newComment : c)));
    } catch {
      setComments((prev) => prev.filter((c) => c.id !== tempComment.id));
      onCommentUpdate?.(post.id, prevCount);
      toast.error('Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  };

  const handleEditComment = async (commentId: number) => {
    const text = editingCommentText.trim();
    if (!text) return;

    const originalContent = comments.find((c) => c.id === commentId)?.content || '';
    setEditingPending(commentId);
    setComments((prev) =>
      prev.map((c) => (c.id === commentId ? { ...c, content: text } : c)),
    );
    setEditingCommentId(null);

    try {
      await api.put(`/comments/${commentId}`, { content: text });
    } catch {
      setComments((prev) =>
        prev.map((c) => (c.id === commentId ? { ...c, content: originalContent } : c)),
      );
      toast.error('Error al editar comentario');
    } finally {
      setEditingPending(null);
    }
  };

  const handleDeleteClick = (commentId: number) => {
    setDeleteCommentId(commentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;

    const deletedComment = comments.find((c) => c.id === deleteCommentId);
    setComments((prev) => prev.filter((c) => c.id !== deleteCommentId));
    setShowDeleteModal(false);
    setDeleteCommentId(null);
    onCommentUpdate?.(post.id, Math.max(0, comments.length - 1));

    try {
      await api.delete(`/comments/${deleteCommentId}`);
    } catch {
      if (deletedComment) {
        setComments((prev) => [...prev, deletedComment]);
      }
      onCommentUpdate?.(post.id, comments.length);
      toast.error('Error al eliminar comentario');
    }
  };

  const handleEditPost = () => {
    setShowMenu(false);
    onClose();
    onEdit?.(post);
  };

  const handleDeletePost = () => {
    setShowMenu(false);
    setShowDeletePostModal(true);
  };

  const confirmDeletePost = async () => {
    setDeletePostPending(true);
    setShowDeletePostModal(false);
    onDelete?.(post.id);
    onClose();

    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Publicación eliminada');
    } catch {
      toast.error('Error al eliminar la publicación');
    } finally {
      setDeletePostPending(false);
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
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-primaryBlack/70 backdrop-blur-sm" />

      <div
        className="relative bg-primaryWhite rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] flex flex-col md:flex-row overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-9 h-9 bg-primaryBlack/50 hover:bg-primaryBlack/70 rounded-full flex items-center justify-center text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="md:w-[55%] bg-black flex items-center justify-center min-h-[300px] md:min-h-[550px] relative">
          {isOwnPost && (
            <div className="absolute top-3 right-3 z-20">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="w-9 h-9 bg-primaryBlack/50 hover:bg-primaryBlack/70 rounded-full flex items-center justify-center text-white transition-colors"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowMenu(false)}
                  />
                  <div className="absolute right-0 top-12 bg-primaryWhite rounded-xl shadow-2xl border border-formColorLight/20 py-2 min-w-[160px] z-20">
                    <button
                      onClick={handleEditPost}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-primaryBlack hover:bg-formColorLight/10 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar
                    </button>
                    <button
                      onClick={handleDeletePost}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-redPink hover:bg-formColorLight/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
          <img
            src={post.image}
            alt="Post"
            className="w-full h-full object-contain max-h-[55vh] md:max-h-[90vh]"
          />
        </div>

        <div className="md:w-[45%] flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-formColorLight/10">
            <Link
              to={`/pet/${post.pet.id}`}
              onClick={onClose}
              className="flex items-center gap-3 min-w-0"
            >
              {post.pet.image ? (
                <img
                  src={post.pet.image}
                  alt={post.pet.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center text-white text-sm font-bold">
                  {post.pet.name[0]}
                </div>
              )}
              <p className="font-semibold text-primaryBlack truncate">
                  {post.pet.name}
                </p>
                {post.location && (
                  <p className="text-xs text-primaryBlack/50 truncate">📍 {post.location}</p>
                )}
            </Link>
          </div>

          {post.content && (
            <div className="p-4 border-b border-formColorLight/10">
              <p className="text-primaryBlack text-sm">
                {post.content}
              </p>
            </div>
          )}

          <div className="flex items-center gap-4 px-4 py-3 border-b border-formColorLight/10">
            <OptimisticHeart
              liked={liked}
              count={likesCount}
              pending={likePending}
              onClick={handleLike}
              variant="like"
            />
            <div className="flex items-center gap-1.5 text-primaryBlack/60">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{comments.length}</span>
            </div>
            <OptimisticHeart
              liked={favorited}
              count={0}
              pending={favPending}
              onClick={handleToggleFavorite}
              variant="favorite"
              className="ml-auto"
            />
          </div>

          <div className="flex-1 overflow-y-auto min-h-0">
            {commentsLoading ? (
              <SkeletonCommentsList count={5} />
            ) : comments.length === 0 ? (
              <div className="p-4">
                <p className="text-center text-primaryBlack/40 text-sm py-8">
                  No hay comentarios todavía
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-3">
              <AnimatePresence>
              {comments.map((comment) => {
                const isOwn = comment.pet.id === currentPet?.id;
                const isSendingTemp = comment.id < 0;
                return (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`flex gap-2 group ${isSendingTemp ? 'opacity-60' : ''}`}
                  >
                    {comment.pet.image ? (
                      <img
                        src={comment.pet.image}
                        alt={comment.pet.name}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-formColorLight/40 to-formColorDark/40 flex items-center justify-center text-xs font-bold text-primaryBlack/60 flex-shrink-0 mt-0.5">
                        {comment.pet.name[0]}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {editingCommentId === comment.id ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="flex-1 text-sm px-2 py-1 border border-formColorLight/20 rounded-lg bg-primaryWhite outline-none focus:border-formColorDark"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEditComment(comment.id);
                              if (e.key === 'Escape') { setEditingCommentId(null); setEditingCommentText(''); }
                            }}
                          />
                          <button onClick={() => handleEditComment(comment.id)} className="text-green-500 hover:text-green-600 cursor-pointer">
                            <Check className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingCommentId(null); setEditingCommentText(''); }} className="text-primaryBlack/40 hover:text-primaryBlack cursor-pointer">
                            <XIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-primaryBlack break-words">
                            <span className="font-semibold">{comment.pet.name}</span>{' '}
                            {comment.content}
                            {isSendingTemp && (
                              <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="ml-2 text-xs text-formColorDark"
                              >
                                Enviando...
                              </motion.span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-primaryBlack/40">
                              {formatDate(comment.createdAt)}
                            </p>
                            {isOwn && !isSendingTemp && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                                  disabled={editingPending === comment.id}
                                  className="text-primaryBlack/30 hover:text-formColorDark cursor-pointer disabled:opacity-30"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteClick(comment.id)}
                                  className="text-primaryBlack/30 hover:text-redPink cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    {editingPending === comment.id && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-formColorDark animate-pulse"
                      >
                        Guardando...
                      </motion.span>
                    )}
                  </motion.div>
                );
              })}
              </AnimatePresence>
              <div ref={commentsEndRef} />
            </div>
            )}
          </div>

          <div className="border-t border-formColorLight/10 p-3">
            {currentPet ? (
              <CommentInput
                value={commentText}
                onChange={setCommentText}
                onSubmit={handleSendComment}
                pending={sendingComment}
                currentPetImage={currentPet.image}
                currentPetName={currentPet.name}
              />
            ) : !isAuthenticated ? (
              <p className="text-xs text-primaryBlack/40 text-center py-2">
                <Link to="/login" className="text-formColorDark hover:underline font-medium" onClick={onClose}>
                  Inicia sesión
                </Link>{' '}
                para comentar
              </p>
            ) : pets.length > 0 ? (
              <p className="text-xs text-primaryBlack/40 text-center py-2">
                Selecciona una mascota para comentar
              </p>
            ) : (
              <p className="text-xs text-primaryBlack/40 text-center py-2">
                Necesitas una mascota para comentar
              </p>
            )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setDeleteCommentId(null);
        }}
        onConfirm={confirmDeleteComment}
        type="delete"
        title="Eliminar comentario"
        message="¿Estás seguro de que quieres eliminar este comentario? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />

      <ConfirmModal
        isOpen={showDeletePostModal}
        onClose={() => setShowDeletePostModal(false)}
        onConfirm={confirmDeletePost}
        isLoading={deletePostPending}
        type="delete"
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}