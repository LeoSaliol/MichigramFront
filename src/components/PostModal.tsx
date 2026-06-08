import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Bookmark, X, Loader2, Send, Pencil, Trash2, Check, X as XIcon, MoreHorizontal } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import ConfirmModal from './ConfirmModal';

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
  const { currentPet, pets, isAuthenticated } = useAuthStore();
  const commentsEndRef = useRef<HTMLDivElement>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const isOwnPost = pets.some((p) => p.id === post.pet.id);

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
    try {
      await api.post(`/favorites/toggle/${post.id}`, { petId: currentPet?.id });
      setFavorited(!favorited);
    } catch {
      toast.error('Error al guardar favorito');
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Inicia sesión para dar like');
      navigate('/login');
      return;
    }
    try {
      await api.post(`/likes/toggle/${post.id}`);
      const newLiked = !liked;
      const newCount = liked ? likesCount - 1 : likesCount + 1;
      setLiked(newLiked);
      setLikesCount(newCount);
      onLikeUpdate?.(post.id, newLiked, newCount);
    } catch {
      toast.error('Error al dar like');
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

    try {
      setSendingComment(true);
      const newComment = await api.post<CommentData>(`/comments/${post.id}`, { content: text });
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
      const newCount = post._count.comments + 1;
      post._count.comments = newCount;
      onCommentUpdate?.(post.id, newCount);
    } catch {
      toast.error('Error al enviar comentario');
    } finally {
      setSendingComment(false);
    }
  };

  const handleCommentKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendComment();
    }
  };

  const handleEditComment = async (commentId: number) => {
    const text = editingCommentText.trim();
    if (!text) return;
    try {
      await api.put(`/comments/${commentId}`, { content: text });
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: text } : c,
        ),
      );
      setEditingCommentId(null);
      setEditingCommentText('');
    } catch {
      toast.error('Error al editar comentario');
    }
  };

  const handleDeleteClick = (commentId: number) => {
    setDeleteCommentId(commentId);
    setShowDeleteModal(true);
  };

  const confirmDeleteComment = async () => {
    if (!deleteCommentId) return;
    try {
      await api.delete(`/comments/${deleteCommentId}`);
      setComments((prev) => prev.filter((c) => c.id !== deleteCommentId));
      const newCount = post._count.comments - 1;
      post._count.comments = newCount;
      onCommentUpdate?.(post.id, newCount);
      setShowDeleteModal(false);
      setDeleteCommentId(null);
    } catch {
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
    try {
      await api.delete(`/posts/${post.id}`);
      toast.success('Publicación eliminada');
      setShowDeletePostModal(false);
      onDelete?.(post.id);
      onClose();
    } catch {
      toast.error('Error al eliminar la publicación');
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
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 transition-all ${
                liked ? 'text-likeColor' : 'text-primaryBlack/60 hover:text-likeColor'
              }`}
            >
              <Heart className={`w-6 h-6 ${liked ? 'fill-current' : ''} transition-transform hover:scale-110`} />
              <span className="text-sm font-medium">{likesCount}</span>
            </button>
            <div className="flex items-center gap-1.5 text-primaryBlack/60">
              <MessageCircle className="w-6 h-6" />
              <span className="text-sm font-medium">{post._count.comments}</span>
            </div>
            <button
              onClick={handleToggleFavorite}
              className={`ml-auto transition-all ${
                favorited ? 'text-likeColor' : 'text-primaryBlack/60 hover:text-likeColor'
              }`}
            >
              <Bookmark className={`w-6 h-6 ${favorited ? 'fill-current' : ''} transition-transform hover:scale-110`} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-formColorDark animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-center text-primaryBlack/40 text-sm py-8">
                No hay comentarios todavía
              </p>
            ) : (
              comments.map((comment) => {
                const isOwn = comment.pet.id === currentPet?.id;
                return (
                  <div key={comment.id} className="flex gap-2 group">
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
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-primaryBlack/40">
                              {formatDate(comment.createdAt)}
                            </p>
                            {isOwn && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => { setEditingCommentId(comment.id); setEditingCommentText(comment.content); }}
                                  className="text-primaryBlack/30 hover:text-formColorDark cursor-pointer"
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
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          <div className="border-t border-formColorLight/10 p-3">
            {currentPet ? (
              <div className="flex items-center gap-2">
                {currentPet.image ? (
                  <img
                    src={currentPet.image}
                    alt={currentPet.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                    {currentPet.name[0]}
                  </div>
                )}
                <div className="flex-1 flex items-center gap-2 bg-formColorLight/10 rounded-xl px-3 py-1.5">
                  <input
                    type="text"
                    placeholder="Agrega un comentario..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyDown={handleCommentKey}
                    className="flex-1 bg-transparent text-sm text-primaryBlack placeholder-primaryBlack/40 outline-none"
                  />
                  <button
                    onClick={handleSendComment}
                    disabled={!commentText.trim() || sendingComment}
                    className="text-formColorDark hover:text-redPink transition-colors disabled:text-primaryBlack/20 cursor-pointer"
                  >
                    {sendingComment ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
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
        type="delete"
        title="Eliminar publicación"
        message="¿Estás seguro de que quieres eliminar esta publicación? Esta acción no se puede deshacer."
        confirmText="Eliminar"
      />
    </div>
  );
}
