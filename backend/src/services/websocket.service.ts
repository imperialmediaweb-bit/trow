import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { logger } from '../config/logger.js';
import { redis } from '../config/redis.js';

export function setupWebSocket(io: SocketServer): void {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (token) {
      try {
        const payload = jwt.verify(token, config.jwtSecret) as { userId: string };
        (socket as any).userId = payload.userId;
      } catch {
        // Allow unauthenticated connections for public inboxes
      }
    }
    next();
  });

  io.on('connection', (socket: Socket) => {
    logger.debug('WebSocket connected', { id: socket.id });

    socket.on('subscribe_inbox', async (data: { inbox_id: string; token?: string }) => {
      const room = `inbox:${data.inbox_id}`;
      await socket.join(room);
      await redis.sadd(`ws:inbox:${data.inbox_id}:subscribers`, socket.id);
      logger.debug('Subscribed to inbox', { socket: socket.id, inbox: data.inbox_id });
    });

    socket.on('unsubscribe_inbox', async (data: { inbox_id: string }) => {
      const room = `inbox:${data.inbox_id}`;
      await socket.leave(room);
      await redis.srem(`ws:inbox:${data.inbox_id}:subscribers`, socket.id);
    });

    socket.on('disconnect', async () => {
      logger.debug('WebSocket disconnected', { id: socket.id });
    });
  });
}

export function emitToInbox(io: SocketServer, inboxId: string, event: string, data: any): void {
  io.to(`inbox:${inboxId}`).emit(event, data);
}
