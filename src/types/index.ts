export interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
}

export interface Pet {
  id: number;
  name: string;
  bio?: string;
  image?: string;
  ownerId: number;
  createdAt: string;
  followersCount?: number;
  followingCount?: number;
  postsCount?: number;
  isFollowing?: boolean;
}

export interface Post {
  id: number;
  image: string;
  description?: string;
  content?: string;
  location?: string | null;
  createdAt: string;
  petId: number;
  pet: Pet;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  petId: number;
  postId: number;
  pet: Pet;
}

export interface Notification {
  id: string;
  type: string;
  message: string;
  createdAt: string;
  isRead: boolean;
  actor: {
    id: number;
    name: string;
    image: string | null;
  } | null;
  actors: {
    id: number;
    name: string;
    image: string | null;
  }[];
  postId?: number;
  post?: {
    id: number;
    image: string;
  };
  count?: number;
}

export interface Conversation {
  id: number;
  participants: {
    userId: number;
    user: User;
  }[];
  lastMessage?: Message;
  createdAt: string;
}

export interface Message {
  id: number;
  content: string;
  createdAt: string;
  senderId: number;
  isRead: boolean;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    petId?: number;
  };
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}