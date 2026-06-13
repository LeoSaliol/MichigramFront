import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Bell, Heart, MessageCircle, UserPlus, CheckCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import PostModal from './PostModal';
import { SkeletonNotificationList } from './Skeletons';
import type { Notification } from '../types';

export default function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const { currentPet } = useAuthStore();
  const navigate = useNavigate();
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (currentPet) {
      fetchNotifications();
    }
  }, [currentPet]);

  const fetchNotifications = async () => {
    if (!currentPet) return;

    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: Notification[] }>(
        `/notifications/${currentPet.id}`
      );
      setNotifications(response.data);
      window.dispatchEvent(new Event('refresh-unread'));
    } catch (error: any) {
      toast.error('Error al cargar notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
    window.dispatchEvent(new Event('refresh-unread'));
    try {
      await api.patch(`/notifications/${id}/read`);
    } catch {}
  };

  const handleMouseEnter = (notification: Notification) => {
    if (notification.isRead) return;
    hoverTimerRef.current = setTimeout(() => {
      markAsRead(notification.id);
      hoverTimerRef.current = null;
    }, 2000);
  };

  const handleMouseLeave = () => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    window.dispatchEvent(new Event('refresh-unread'));
    try {
      await api.patch(`/notifications/${currentPet!.id}/read-all`);
      toast.success('Todas las notificaciones marcadas como leídas');
    } catch {
      const unread = notifications.filter(n => !n.isRead);
      for (const n of unread) {
        try {
          await api.patch(`/notifications/${n.id}/read`);
        } catch {}
      }
      const stillUnread = notifications.filter(n => !n.isRead).length;
      const marked = unread.length - stillUnread;
      if (marked > 0) {
        toast.success(`${marked} notificaciones marcadas como leídas`);
      }
    } finally {
      setIsMarkingAll(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  const handleNotificationClick = async (notification: Notification) => {
    handleMouseLeave();
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.type === 'follow') {
      if (notification.actor) {
        navigate(`/pet/${notification.actor.id}`);
      }
      return;
    }

    if (notification.type === 'like' || notification.type === 'comment') {
      const postId = notification.postId;
      if (!postId) return;

      try {
        const post = await api.get<any>(`/posts/${postId}`);
        setSelectedPost({
          id: post.id,
          image: post.image,
          content: post.content,
          createdAt: post.createdAt,
          likedByUser: post.likes?.some((l: any) => l.petId === currentPet?.id) || false,
          pet: { id: post.pet.id, name: post.pet.name, image: post.pet.image },
          _count: post._count,
        });
      } catch {
        toast.error('Error al cargar la publicación');
      }
    }
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-4 h-4 text-likeColor" />;
      case 'comment': return <MessageCircle className="w-4 h-4 text-formColorDark" />;
      case 'follow': return <UserPlus className="w-4 h-4 text-green-500" />;
      default: return null;
    }
  };

  if (!currentPet) {
    return (
      <div className="min-h-screen bg-bgWhite">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8 text-center">
          <p className="text-primaryBlack/60">Primero crea una mascota</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bgWhite">
      <Navbar />
      
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-primaryBlack">Notificaciones</h1>
          <button
            onClick={markAllAsRead}
            disabled={isMarkingAll}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-redPink hover:bg-redPink/5 rounded-full transition-colors disabled:opacity-50"
          >
            {isMarkingAll ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Marcar todas como leídas
          </button>
        </div>

        {isLoading ? (
          <SkeletonNotificationList count={5} />
        ) : notifications.length === 0 ? (
          <div className="bg-primaryWhite rounded-2xl shadow-lg p-8 text-center border border-formColorLight/20">
            <div className="w-16 h-16 bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-8 h-8 text-formColorLight" />
            </div>
            <p className="text-primaryBlack/60">No hay notificaciones</p>
          </div>
        ) : (
          <div className="bg-primaryWhite rounded-2xl shadow-lg overflow-hidden border border-formColorLight/20">
            {notifications.map((notification) => {
              const allActors = notification.actors?.length
                ? notification.actors
                : notification.actor
                  ? [notification.actor]
                  : [];
              const isPlural = allActors.length > 1;
              const maxShow = 5;
              const visible = allActors.slice(0, maxShow);
              const remaining = allActors.length - maxShow;
              const firstActorImg = allActors[0]?.image;

              return (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  onMouseEnter={() => handleMouseEnter(notification)}
                  onMouseLeave={handleMouseLeave}
                  className={`p-4 border-b border-formColorLight/10 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-pinkNotify/5 hover:bg-pinkNotify/10' : 'hover:bg-primaryWhite'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {firstActorImg ? (
                      <img
                        src={firstActorImg}
                        alt={allActors[0]?.name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-formColorLight/30 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">🐾</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-primaryBlack text-sm leading-relaxed">
                        {allActors.length > 0 ? (
                          <>
                            {visible.map((a, i) => (
                              <React.Fragment key={a.id}>
                                {i > 0 && (remaining > 0
                                  ? ', '
                                  : i === visible.length - 1
                                    ? ' y '
                                    : ', '
                                )}
                                <span
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/pet/${a.id}`);
                                  }}
                                  className="font-semibold hover:text-redPink transition-colors cursor-pointer"
                                >
                                  {a.name}
                                </span>
                              </React.Fragment>
                            ))}
                            {remaining > 0 && (
                              <span className="font-semibold"> y {remaining} más</span>
                            )}
                          </>
                        ) : (
                          <span className="font-semibold">Una mascota</span>
                        )}{' '}
                        {notification.type === 'like' && (isPlural ? 'le dieron like a tu publicación' : 'le dio like a tu publicación')}
                        {notification.type === 'comment' && (isPlural ? 'comentaron tu publicación' : 'comentó tu publicación')}
                        {notification.type === 'follow' && (isPlural ? 'empezaron a seguirte' : 'empezó a seguirte')}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-primaryBlack/50">{formatTime(notification.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                      {!notification.isRead && (
                        <div className="w-3 h-3 rounded-full bg-pinkNotify animate-pulse" />
                      )}
                      <div className="mt-1">
                        {typeIcon(notification.type)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedPost && (
        <PostModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
}
