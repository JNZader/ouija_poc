export type SpiritPersonality = 'wise' | 'cryptic' | 'dark' | 'playful';

export interface Spirit {
  id: string;
  name: string;
  personality: SpiritPersonality;
  description: string;
  avatarUrl?: string;
}

export interface OuijaSession {
  id: string;
  spiritId: string;
  userId: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SessionMessage {
  id: string;
  sessionId: string;
  sender: 'user' | 'spirit';
  content: string;
  timestamp: string;
}

export interface MultiplayerRoom {
  id: string;
  name: string;
  spiritId: string;
  hostUserId: string;
  maxPlayers: number;
  currentPlayers: number;
  isActive: boolean;
  createdAt: string;
}

export interface RoomParticipant {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  joinedAt: string;
}

export interface RoomMessage {
  id: string;
  roomId: string;
  sender: 'user' | 'spirit';
  userId?: string;
  username?: string;
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
}

// Socket Events
export type SocketEvent =
  | 'session:start'
  | 'session:end'
  | 'message:send'
  | 'message:receive'
  | 'room:join'
  | 'room:leave'
  | 'room:message'
  | 'room:update'
  | 'error';

export interface SocketResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
