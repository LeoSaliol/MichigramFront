import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(petId: number, userId: number): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(API_URL, {
    auth: { userId, petId },
    transports: ['websocket', 'polling'],
  });

  socket.on('connect', () => {
    console.log('Socket connected');
    socket?.emit('getOnlinePets');
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected');
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getOnlinePets(): Promise<number[]> {
  return new Promise((resolve) => {
    if (!socket?.connected) {
      resolve([]);
      return;
    }
    socket.emit('getOnlinePets');
    socket.once('onlinePets', (data: { petIds: number[] }) => {
      resolve(data.petIds);
    });
    setTimeout(() => resolve([]), 3000);
  });
}
