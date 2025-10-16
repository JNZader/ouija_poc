/**
 * Eventos que el cliente envía al servidor
 */
export interface ClientToServerEvents {
  // Gestión de salas
  'create-room': (data: CreateRoomData) => void;
  'join-room': (data: JoinRoomData) => void;
  'leave-room': (data: LeaveRoomData) => void;

  // Mensajes
  'send-message': (data: SendMessageData) => void;

  // Heartbeat
  ping: () => void;
}

/**
 * Eventos que el servidor envía al cliente
 */
export interface ServerToClientEvents {
  // Respuestas de sala
  'room-created': (data: RoomCreatedData) => void;
  'room-joined': (data: RoomJoinedData) => void;
  'user-joined': (data: UserJoinedData) => void;
  'user-left': (data: UserLeftData) => void;

  // Mensajes
  'new-message': (data: NewMessageData) => void;

  // Errores
  error: (data: ErrorData) => void;

  // Estado de sala
  'room-ended': (data: RoomEndedData) => void;

  // Heartbeat
  pong: () => void;
}

/**
 * Data types para eventos
 */
export interface CreateRoomData {
  spiritId: string;
  userId: string;
  username: string;
}

export interface JoinRoomData {
  roomCode: string;
  userId: string;
  username: string;
}

export interface LeaveRoomData {
  roomCode: string;
  userId: string;
}

export interface SendMessageData {
  roomCode: string;
  userId: string;
  username: string;
  message: string;
}

export interface RoomCreatedData {
  roomCode: string;
  spirit: {
    id: string;
    name: string;
    personality: string;
  };
  participants: ParticipantData[];
  maxParticipants: number;
}

export interface RoomJoinedData {
  roomCode: string;
  participants: ParticipantData[];
  spirit: {
    id: string;
    name: string;
    personality: string;
  };
}

export interface UserJoinedData {
  username: string;
  userId: string;
  participants: ParticipantData[];
}

export interface UserLeftData {
  username: string;
  userId: string;
  participants: ParticipantData[];
}

export interface NewMessageData {
  messageId: string;
  role: 'user' | 'spirit';
  username?: string;
  content: string;
  timestamp: Date;
}

export interface ErrorData {
  code: string;
  message: string;
}

export interface RoomEndedData {
  roomCode: string;
  reason: string;
  farewellMessage?: string;
}

export interface ParticipantData {
  userId: string;
  username: string;
  joinedAt: Date;
  isHost: boolean;
}
