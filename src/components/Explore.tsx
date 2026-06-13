import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Search, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import PostModal from './PostModal';
import { SkeletonPostGrid } from './Skeletons';

interface Post {
  id: number;
  image: string;
  content: string | null;
  location?: string | null;
  createdAt: string;
  likedByUser?: boolean;
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

interface SearchPet {
  id: number;
  name: string;
  image: string | null;
  _count: {
    followers: number;
  };
}

export default function Explore() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchPet[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const { currentPet } = useAuthStore();

  useEffect(() => {
    if (currentPet) fetchPosts();
  }, [currentPet]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const pets = await api.get<SearchPet[]>(`/pets/search?q=${encodeURIComponent(searchQuery)}`);
        setSearchResults(pets);
      } catch {
        toast.error('Error al buscar mascotas');
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: Post[] }>(`/posts/all?petId=${currentPet!.id}`);
      setPosts(response.data);
    } catch (error: any) {
      toast.error('Error al cargar publicaciones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bgWhite">
      <Navbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-primaryBlack mb-6">Explorar</h2>

        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primaryBlack/40" />
          <input
            type="text"
            placeholder="Buscar mascotas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-primaryWhite rounded-xl border border-formColorLight/20 text-primaryBlack placeholder-primaryBlack/40 focus:outline-none focus:border-redPink focus:ring-1 focus:ring-redPink transition-all"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-5 h-5 border-2 border-formColorLight/30 border-t-redPink rounded-full animate-spin" />
            </div>
          )}
        </div>

        {searchQuery.trim() ? (
          <>
            {searchResults.length > 0 ? (
              <div className="space-y-3">
                {searchResults.map((pet) => (
                  <Link
                    key={pet.id}
                    to={`/pet/${pet.id}`}
                    className="flex items-center gap-4 bg-primaryWhite rounded-xl p-4 border border-formColorLight/20 hover:border-redPink/30 hover:shadow-md transition-all"
                  >
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-formColorLight/30 to-formColorDark/30 flex-shrink-0">
                      {pet.image ? (
                        <img src={pet.image} alt={pet.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-xl font-bold text-primaryBlack/40">{pet.name[0]}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-primaryBlack truncate">{pet.name}</p>
                      <div className="flex items-center gap-1 text-sm text-primaryBlack/50">
                        <Users className="w-3.5 h-3.5" />
                        <span>{pet._count.followers} seguidores</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : !isSearching ? (
              <div className="bg-primaryWhite rounded-2xl shadow-lg p-8 text-center border border-formColorLight/20">
                <div className="w-16 h-16 bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-6 h-6 text-primaryBlack/40" />
                </div>
                <p className="text-primaryBlack/60">No se encontraron mascotas</p>
              </div>
            ) : null}
          </>
        ) : (
          <>
            {isLoading ? (
              <SkeletonPostGrid count={12} />
            ) : posts.length === 0 ? (
              <div className="bg-primaryWhite rounded-2xl shadow-lg p-8 text-center border border-formColorLight/20">
                <div className="w-16 h-16 bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-3xl">📷</span>
                </div>
                <p className="text-primaryBlack/60">No hay publicaciones todavía</p>
              </div>
            ) : (
              <motion.div layout className="grid grid-cols-3 gap-1 md:gap-2">
                {posts.map((post) => (
                  <motion.button
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setSelectedPost(post)}
                    className="relative aspect-square group overflow-hidden bg-formColorLight/20 cursor-pointer"
                  >
                    <img
                      src={post.image}
                      alt={`Post de ${post.pet.name}`}
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
                  </motion.button>
                ))}
              </motion.div>
            )}
          </>
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