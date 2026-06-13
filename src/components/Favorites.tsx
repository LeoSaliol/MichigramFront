import { useState, useEffect } from 'react';
import { Bookmark, Heart, MessageCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import PostModal from './PostModal';
import { SkeletonPostGrid } from './Skeletons';

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

export default function Favorites() {
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<PostData | null>(null);
  const { currentPet } = useAuthStore();

  useEffect(() => {
    if (currentPet) fetchFavorites();
  }, [currentPet]);

  const fetchFavorites = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: PostData[] }>('/favorites');
      setPosts(response.data);
    } catch {
      toast.error('Error al cargar favoritos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFavorite = async (postId: number) => {
    const removedPost = posts.find(p => p.id === postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));

    try {
      await api.post(`/favorites/toggle/${postId}`, { petId: currentPet?.id });
      toast.success('Eliminado de favoritos');
    } catch {
      if (removedPost) {
        setPosts((prev) => [...prev, removedPost]);
      }
      toast.error('Error al eliminar de favoritos');
    }
  };

  return (
    <div className="min-h-screen bg-bgWhite">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Bookmark className="w-6 h-6 text-formColorDark" />
          <h1 className="text-2xl font-bold text-primaryBlack">Favoritos</h1>
        </div>

        {isLoading ? (
          <SkeletonPostGrid count={9} />
        ) : posts.length === 0 ? (
          <div className="bg-primaryWhite rounded-2xl shadow-lg p-8 text-center border border-formColorLight/20">
            <div className="w-16 h-16 bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bookmark className="w-6 h-6 text-primaryBlack/40" />
            </div>
            <p className="text-primaryBlack/60">No tienes publicaciones guardadas</p>
            <p className="text-primaryBlack/40 mt-2">
              Guarda publicaciones para verlas después
            </p>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-3 gap-1 md:gap-2">
            <AnimatePresence>
            {posts.map((post) => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="relative aspect-square group overflow-hidden bg-formColorLight/20 rounded-sm cursor-pointer"
              >
                <button
                  onClick={() => setSelectedPost(post)}
                  className="w-full h-full"
                >
                  <img
                    src={post.image}
                    alt="Post"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center gap-4">
                    <div className="flex items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <Heart className="w-5 h-5 fill-white" />
                      <span className="font-semibold">{post._count.likes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <MessageCircle className="w-5 h-5" />
                      <span className="font-semibold">{post._count.comments}</span>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => handleRemoveFavorite(post.id)}
                  className="absolute top-2 right-2 w-8 h-8 bg-primaryBlack/50 hover:bg-primaryBlack/70 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Bookmark className="w-4 h-4 fill-white" />
                </button>
              </motion.div>
            ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
          onLikeUpdate={(postId, liked, likesCount) => {
            setPosts((prev) =>
              prev.map((p) =>
                p.id === postId
                  ? { ...p, likedByUser: liked, _count: { ...p._count, likes: likesCount } }
                  : p,
              ),
            );
          }}
        />
      )}
    </div>
  );
}