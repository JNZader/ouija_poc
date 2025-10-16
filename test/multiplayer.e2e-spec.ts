import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { io, Socket } from 'socket.io-client';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';

describe('Multiplayer WebSocket Gateway (e2e)', () => {
  let app: INestApplication;
  let prismaService: PrismaService;
  let clientSocket1: Socket;
  let clientSocket2: Socket;
  let spiritId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.listen(0); // Puerto aleatorio

    prismaService = app.get<PrismaService>(PrismaService);

    // Crear un espíritu para las pruebas
    const spirit = await prismaService.spirit.findFirst({
      where: { isActive: true },
    });

    if (spirit) {
      spiritId = spirit.id;
    } else {
      const newSpirit = await prismaService.spirit.create({
        data: {
          name: 'Test Spirit',
          personality: 'wise',
          backstory: 'A test spirit for E2E tests',
          isActive: true,
        },
      });
      spiritId = newSpirit.id;
    }
  });

  afterAll(async () => {
    // Limpiar espíritus de prueba
    await prismaService.spirit.deleteMany({
      where: { name: 'Test Spirit' },
    });

    await app.close();
  });

  beforeEach(() => {
    const address = app.getHttpServer().listen().address();
    const port = typeof address === 'object' ? address.port : 3000;

    clientSocket1 = io(`http://localhost:${port}/multiplayer`, {
      transports: ['websocket'],
      reconnection: false,
    });

    clientSocket2 = io(`http://localhost:${port}/multiplayer`, {
      transports: ['websocket'],
      reconnection: false,
    });
  });

  afterEach(() => {
    if (clientSocket1.connected) {
      clientSocket1.disconnect();
    }
    if (clientSocket2.connected) {
      clientSocket2.disconnect();
    }
  });

  it('should connect to the WebSocket gateway', (done) => {
    clientSocket1.on('connect', () => {
      expect(clientSocket1.connected).toBe(true);
      done();
    });
  });

  it('should respond to ping with pong', (done) => {
    clientSocket1.on('connect', () => {
      clientSocket1.emit('ping');
      clientSocket1.on('pong', () => {
        expect(true).toBe(true);
        done();
      });
    });
  });

  it('should create a room successfully', (done) => {
    clientSocket1.on('connect', () => {
      clientSocket1.emit('create-room', {
        spiritId: spiritId.toString(),
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('room-created', (data) => {
        expect(data).toHaveProperty('roomCode');
        expect(data.roomCode).toHaveLength(8);
        expect(data).toHaveProperty('spirit');
        expect(data).toHaveProperty('participants');
        expect(data.participants).toHaveLength(1);
        expect(data.participants[0].username).toBe('TestUser1');
        done();
      });
    });
  });

  it('should allow a second user to join a room', (done) => {
    let roomCode: string;

    // Cliente 1 crea la sala
    clientSocket1.on('connect', () => {
      clientSocket1.emit('create-room', {
        spiritId: spiritId.toString(),
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('room-created', (data) => {
        roomCode = data.roomCode;

        // Cliente 2 se conecta y se une
        clientSocket2.on('connect', () => {
          clientSocket2.emit('join-room', {
            roomCode,
            userId: 'user456',
            username: 'TestUser2',
          });

          clientSocket2.on('room-joined', (joinData) => {
            expect(joinData.roomCode).toBe(roomCode);
            expect(joinData.participants.length).toBeGreaterThanOrEqual(2);
            done();
          });
        });
      });
    });
  });

  it('should broadcast user-joined event to existing participants', (done) => {
    let roomCode: string;

    // Cliente 1 crea la sala
    clientSocket1.on('connect', () => {
      clientSocket1.emit('create-room', {
        spiritId: spiritId.toString(),
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('room-created', (data) => {
        roomCode = data.roomCode;

        // Escuchar evento user-joined
        clientSocket1.on('user-joined', (joinData) => {
          expect(joinData.username).toBe('TestUser2');
          expect(joinData.userId).toBe('user456');
          done();
        });

        // Cliente 2 se une
        clientSocket2.on('connect', () => {
          clientSocket2.emit('join-room', {
            roomCode,
            userId: 'user456',
            username: 'TestUser2',
          });
        });
      });
    });
  });

  it('should handle sending and receiving messages', (done) => {
    let roomCode: string;
    let messagesReceived = 0;

    // Cliente 1 crea la sala
    clientSocket1.on('connect', () => {
      clientSocket1.emit('create-room', {
        spiritId: spiritId.toString(),
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('room-created', (data) => {
        roomCode = data.roomCode;

        // Escuchar mensajes
        clientSocket1.on('new-message', (msgData) => {
          messagesReceived++;

          // Primer mensaje: del usuario
          if (messagesReceived === 1) {
            expect(msgData.role).toBe('user');
            expect(msgData.content).toBe('Hello spirit!');
            expect(msgData.username).toBe('TestUser1');
          }

          // Segundo mensaje: del espíritu (respuesta IA)
          if (messagesReceived === 2) {
            expect(msgData.role).toBe('spirit');
            expect(msgData.content).toBeTruthy();
            done();
          }
        });

        // Enviar mensaje
        clientSocket1.emit('send-message', {
          roomCode,
          userId: 'user123',
          username: 'TestUser1',
          message: 'Hello spirit!',
        });
      });
    });
  }, 30000); // Timeout mayor para esperar respuesta de IA

  it('should handle user leaving a room', (done) => {
    let roomCode: string;

    // Cliente 1 crea la sala
    clientSocket1.on('connect', () => {
      clientSocket1.emit('create-room', {
        spiritId: spiritId.toString(),
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('room-created', (data) => {
        roomCode = data.roomCode;

        // Cliente 2 se une
        clientSocket2.on('connect', () => {
          clientSocket2.emit('join-room', {
            roomCode,
            userId: 'user456',
            username: 'TestUser2',
          });

          clientSocket2.on('room-joined', () => {
            // Cliente 1 escucha cuando alguien se va
            clientSocket1.on('user-left', (leftData) => {
              expect(leftData.userId).toBe('user456');
              done();
            });

            // Cliente 2 se va
            clientSocket2.emit('leave-room', {
              roomCode,
              userId: 'user456',
            });
          });
        });
      });
    });
  });

  it('should return error when joining non-existent room', (done) => {
    clientSocket1.on('connect', () => {
      clientSocket1.emit('join-room', {
        roomCode: 'INVALID1',
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('error', (errorData) => {
        expect(errorData.code).toBe('JOIN_ROOM_ERROR');
        expect(errorData.message).toContain('not found');
        done();
      });
    });
  });

  it('should return error when creating room with invalid spirit', (done) => {
    clientSocket1.on('connect', () => {
      clientSocket1.emit('create-room', {
        spiritId: '99999',
        userId: 'user123',
        username: 'TestUser1',
      });

      clientSocket1.on('error', (errorData) => {
        expect(errorData.code).toBe('CREATE_ROOM_ERROR');
        expect(errorData.message).toContain('not found');
        done();
      });
    });
  });
});
