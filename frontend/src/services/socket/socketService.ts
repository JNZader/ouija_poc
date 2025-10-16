import { io, Socket } from 'socket.io-client';
import { WS_URL } from '../api/config';
import type { SessionMessage, RoomMessage, SocketResponse } from '../../types';

class SocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = io(WS_URL, {
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
        });

        this.socket.on('connect', () => {
          console.log('[Socket] Connected');
          this.reconnectAttempts = 0;
          resolve();
        });

        this.socket.on('disconnect', (reason) => {
          console.log('[Socket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
          console.error('[Socket] Connection error:', error);
          this.reconnectAttempts++;

          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            reject(new Error('Max reconnection attempts reached'));
          }
        });

        this.socket.on('error', (error) => {
          console.error('[Socket] Error:', error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  // Session Events
  joinSession(sessionId: string): Promise<SocketResponse> {
    return this.emit('session:join', { sessionId });
  }

  leaveSession(sessionId: string): Promise<SocketResponse> {
    return this.emit('session:leave', { sessionId });
  }

  sendMessage(sessionId: string, content: string): Promise<SessionMessage> {
    return this.emit('message:send', { sessionId, content });
  }

  onMessageReceived(callback: (message: SessionMessage) => void): void {
    this.on('message:receive', callback);
  }

  // Multiplayer Room Events
  joinRoom(roomId: string, username: string): Promise<SocketResponse> {
    return this.emit('room:join', { roomId, username });
  }

  leaveRoom(roomId: string): Promise<SocketResponse> {
    return this.emit('room:leave', { roomId });
  }

  sendRoomMessage(roomId: string, content: string): Promise<RoomMessage> {
    return this.emit('room:message', { roomId, content });
  }

  onRoomMessage(callback: (message: RoomMessage) => void): void {
    this.on('room:message', callback);
  }

  onRoomUpdate(callback: (data: unknown) => void): void {
    this.on('room:update', callback);
  }

  // Generic emit with Promise
  private emit<T = unknown>(event: string, data?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(event, data, (response: SocketResponse<T>) => {
        if (response.success && response.data) {
          resolve(response.data);
        } else {
          reject(new Error(response.error || 'Socket error'));
        }
      });
    });
  }

  // Generic listener
  private on<T = unknown>(event: string, callback: (data: T) => void): void {
    if (!this.socket) {
      console.warn('[Socket] Cannot listen to event, socket not connected');
      return;
    }

    this.socket.on(event, callback);
  }

  // Remove listener
  off(event: string, callback?: (...args: unknown[]) => void): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }
}

export const socketService = new SocketService();
