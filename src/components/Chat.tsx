import { useState, useEffect, useRef } from 'react';
import { MessageCircle, Loader2, Send, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { api } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import Navbar from './Navbar';
import { connectSocket, disconnectSocket } from '../lib/socket';
import { SkeletonConversationList } from './Skeletons';

interface ParticipantPet {
  id: number;
  name: string;
  image?: string;
}

interface Conversation {
  id: number;
  participants: {
    petId: number;
    pet: ParticipantPet;
  }[];
  messages: {
    content: string;
    createdAt: string;
    senderPetId: number;
    isRead: boolean;
    sender: {
      id: number;
      name: string;
      image?: string;
    };
  }[];
  updatedAt: string;
  unreadCount: number;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderPetId: number;
  isRead: boolean;
}

export default function Chat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [onlinePetIds, setOnlinePetIds] = useState<Set<number>>(new Set());
  const { user, currentPet } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !currentPet) return;

    const socket = connectSocket(currentPet.id, user.id);

    socket.on('onlinePets', (data: { petIds: number[] }) => {
      setOnlinePetIds(new Set(data.petIds));
    });

    socket.on('petOnline', (data: { petId: number }) => {
      setOnlinePetIds((prev) => new Set(prev).add(data.petId));
    });

    socket.on('petOffline', (data: { petId: number }) => {
      setOnlinePetIds((prev) => {
        const next = new Set(prev);
        next.delete(data.petId);
        return next;
      });
    });

    return () => {
      socket.off('onlinePets');
      socket.off('petOnline');
      socket.off('petOffline');
    };
  }, [user?.id, currentPet?.id]);

  useEffect(() => {
    fetchConversations();
    window.dispatchEvent(new Event('refresh-unread'));
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages();
      api.put(`/conversations/${selectedConversation}/read`).then(() => {
        setConversations(prev =>
          prev.map(c =>
            c.id === selectedConversation ? { ...c, unreadCount: 0 } : c
          )
        );
        window.dispatchEvent(new Event('refresh-unread'));
      }).catch(() => {});
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<{ success: boolean; data: Conversation[] }>('/conversations');
      setConversations(response.data || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    if (!selectedConversation) return;

    try {
      const response = await api.get<{ success: boolean; data: Message[] }>(
        `/conversations/${selectedConversation}`
      );
      setMessages(response.data || []);
      window.dispatchEvent(new Event('refresh-unread'));
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    setIsSending(true);
    try {
      await api.post(`/conversations/${selectedConversation}/messages`, {
        content: newMessage,
      });
      setNewMessage('');
      fetchMessages();
      window.dispatchEvent(new Event('refresh-unread'));
    } catch (error: any) {
      toast.error('Error al enviar mensaje');
    } finally {
      setIsSending(false);
    }
  };

  const getOtherParticipant = (conv: Conversation) => {
    return conv.participants.find(p => p.petId !== currentPet?.id)?.pet;
  };

  const getLastMessage = (conv: Conversation) => {
    return conv.messages?.[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const formatMessageTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };

  const isOtherPetOnline = (otherPetId?: number) => {
    return otherPetId ? onlinePetIds.has(otherPetId) : false;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'ahora';
    if (diffMinutes < 60) return `hace ${diffMinutes}m`;
    if (diffHours < 24) return `hace ${diffHours}h`;
    return `hace ${diffDays}d`;
  };

  return (
    <div className="h-screen bg-bgWhite overflow-hidden flex flex-col">
      <Navbar />

      <div className="max-w-2xl mx-auto px-4 py-8 flex-1 min-h-0 w-full">
          <div className="bg-primaryWhite rounded-2xl shadow-lg overflow-hidden border border-formColorLight/20 h-full flex flex-col">
          <div className="p-4 border-b border-formColorLight/20 bg-gradient-to-r from-formColorLight/10 to-formColorDark/10">
            <h1 className="text-xl font-bold text-primaryBlack flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-redPink" />
              Mensajes
            </h1>
          </div>

          {selectedConversation ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center gap-3 p-3 border-b border-formColorLight/10 bg-primaryWhite/50">
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 hover:bg-formColorLight/20 rounded-full transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-redPink" />
                </button>
                {(() => {
                  const otherPet = getOtherParticipant(conversations.find(c => c.id === selectedConversation!)!);
                  const online = isOtherPetOnline(otherPet?.id);
                  return (
                    <div
                      onClick={() => otherPet && navigate(`/pet/${otherPet.id}`)}
                      className="flex items-center gap-3 flex-1 cursor-pointer"
                    >
                      <div className="relative">
                        {otherPet?.image ? (
                          <img
                            src={otherPet.image}
                            alt={otherPet.name}
                            className="w-10 h-10 rounded-full object-cover border-2 border-redPink/30"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center">
                            <span className="text-white font-bold">
                              {otherPet?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-primaryBlack text-sm hover:text-redPink transition-colors">
                          {otherPet?.name || 'Mascota'}
                        </p>
                        <p className="text-xs text-primaryBlack/50">
                          {online ? 'En linea' : 'Offline'}
                        </p>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-1 min-h-0">
                {messages.map((msg, idx) => {
                  const isMine = msg.senderPetId === currentPet?.id;
                  const nextMsg = messages[idx + 1];
                  const isLastInGroup = !nextMsg || nextMsg.senderPetId !== msg.senderPetId;
                  const otherPet = getOtherParticipant(conversations.find(c => c.id === selectedConversation!)!);
                  return (
                    <div
                      key={msg.id}
                      className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                    >
                      {!isMine && isLastInGroup && (
                        <div
                          onClick={() => otherPet && navigate(`/pet/${otherPet.id}`)}
                          className="flex-shrink-0 cursor-pointer self-end"
                        >
                          {otherPet?.image ? (
                            <img
                              src={otherPet.image}
                              alt={otherPet.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center text-white text-xs font-bold">
                              {otherPet?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                          )}
                        </div>
                      )}
                      {!isMine && !isLastInGroup && <div className="w-7 flex-shrink-0" />}
                      <div
                        className={`max-w-[75%] p-3 rounded-2xl ${
                          isMine
                            ? 'bg-gradient-to-r from-formColorDark to-redPink text-white rounded-br-md'
                            : 'bg-formColorLight/20 text-primaryBlack rounded-bl-md'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        <div className="flex items-center gap-1 mt-1 justify-end">
                          {isMine && (
                            <span className={`text-xs ${msg.isRead ? 'text-blue-200/80' : 'text-white/50'}`}>
                              {msg.isRead ? 'Visto' : 'Enviado'}
                            </span>
                          )}
                          <span className={`text-xs ${isMine ? 'text-white/60' : 'text-primaryBlack/50'}`}>
                            {formatTimeAgo(msg.createdAt)}
                          </span>
                        </div>
                      </div>
                      {isMine && isLastInGroup && currentPet && (
                        <div className="flex-shrink-0 self-end">
                          {currentPet.image ? (
                            <img
                              src={currentPet.image}
                              alt={currentPet.name}
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center text-white text-xs font-bold">
                              {currentPet.name[0]}
                            </div>
                          )}
                        </div>
                      )}
                      {isMine && !isLastInGroup && <div className="w-7 flex-shrink-0" />}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-formColorLight/20 flex gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  className="flex-1 px-4 py-3 border border-formColorLight/30 rounded-full bg-primaryWhite focus:border-formColorDark outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && !isSending && sendMessage()}
                />
                <button
                  onClick={sendMessage}
                  disabled={isSending || !newMessage.trim()}
                  className="w-12 h-12 rounded-full bg-gradient-to-r from-formColorDark to-redPink text-white flex items-center justify-center disabled:opacity-50 hover:opacity-90 transition-all shadow-lg shadow-formColorDark/30"
                >
                  {isSending ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Send className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto min-h-0">
              {isLoading ? (
                <SkeletonConversationList count={6} />
              ) : conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-gradient-to-br from-formColorLight/20 to-formColorDark/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-10 h-10 text-formColorLight" />
                  </div>
                  <p className="text-primaryBlack/60 text-lg">No tienes conversaciones aún</p>
                  <p className="text-primaryBlack/40 text-sm mt-2">¡Explora mascotas y comienza a chatear!</p>
                  <Link
                    to="/explore"
                    className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-formColorDark to-redPink text-white font-semibold rounded-full hover:opacity-90 transition-all"
                  >
                    Explorar
                  </Link>
                </div>
              ) : (
                conversations.map((conv) => {
                  const otherPet = getOtherParticipant(conv);
                  const lastMsg = getLastMessage(conv);
                  const online = isOtherPetOnline(otherPet?.id);
                  return (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedConversation(conv.id)}
                      className="w-full flex items-center gap-4 p-4 hover:bg-primaryWhite border-b border-formColorLight/10 transition-colors"
                    >
                      <div className="relative">
                        {otherPet?.image ? (
                          <img
                            src={otherPet.image}
                            alt={otherPet.name}
                            className="w-14 h-14 rounded-full object-cover border-2 border-redPink/30"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center">
                            <span className="text-white text-xl font-bold">
                              {otherPet?.name?.charAt(0).toUpperCase() || '?'}
                            </span>
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${online ? 'bg-green-500' : 'bg-gray-400'}`} />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-primaryBlack">{otherPet?.name || 'Mascota'}</p>
                        {lastMsg && (
                          <p className="text-sm text-primaryBlack/60 truncate mt-1">
                            {lastMsg.senderPetId === currentPet?.id ? 'Tú: ' : ''}
                            {lastMsg.content}
                          </p>
                        )}
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                        {conv.unreadCount > 0 && (
                          <span className="min-w-[20px] h-5 bg-redPink text-white text-xs font-bold rounded-full flex items-center justify-center px-1">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                        <p className="text-xs text-primaryBlack/40">
                          {conv.updatedAt ? formatTime(conv.updatedAt) : ''}
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>

        {currentPet && (
          <div className="mt-4 flex items-center gap-3 text-sm text-primaryBlack/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-formColorLight to-formColorDark flex items-center justify-center overflow-hidden">
              {currentPet.image ? (
                <img src={currentPet.image} alt={currentPet.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs">🐾</span>
              )}
            </div>
            <span>Chateando como <strong className="text-formColorDark">{currentPet.name}</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
