import { io, Socket } from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL || '';

let socket: Socket | null = null;

export function connectWebSocket(token?: string): Socket {
  if (socket?.connected) return socket;

  socket = io(WS_URL, {
    auth: token ? { token } : undefined,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
  });

  socket.on('connect', () => {
    console.log('WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('WebSocket disconnected');
  });

  return socket;
}

export function subscribeToInbox(inboxId: string, token?: string) {
  if (!socket) return;
  socket.emit('subscribe_inbox', { inbox_id: inboxId, token });
}

export function unsubscribeFromInbox(inboxId: string) {
  if (!socket) return;
  socket.emit('unsubscribe_inbox', { inbox_id: inboxId });
}

export function onNewEmail(callback: (data: any) => void) {
  if (!socket) return;
  socket.on('email:new', callback);
}

export function onAiUpdate(callback: (data: any) => void) {
  if (!socket) return;
  socket.on('email:ai_update', callback);
}

export function getSocket(): Socket | null {
  return socket;
}
