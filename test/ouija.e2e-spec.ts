import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';

describe('Ouija API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let spiritId: number;
  let sessionToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();

    prisma = app.get<PrismaService>(PrismaService);

    // Asegurar que hay al menos un espíritu activo
    const spirits = await prisma.spirit.findMany({
      where: { isActive: true },
      take: 1,
    });

    if (spirits.length === 0) {
      throw new Error('No spirits found in database. Run seed first.');
    }

    spiritId = spirits[0].id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Endpoints', () => {
    it('/api/health (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('service');
        });
    });

    it('/api/health/detailed (GET)', () => {
      return request(app.getHttpServer())
        .get('/api/health/detailed')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('components');
          expect(res.body.components).toHaveProperty('database');
          expect(res.body.components).toHaveProperty('aiEngines');
        });
    });
  });

  describe('Spirit Endpoints', () => {
    it('/api/ouija/spirits (GET) - should return list of spirits', () => {
      return request(app.getHttpServer())
        .get('/api/ouija/spirits')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeInstanceOf(Array);
          expect(res.body.length).toBeGreaterThan(0);
          expect(res.body[0]).toHaveProperty('id');
          expect(res.body[0]).toHaveProperty('name');
          expect(res.body[0]).toHaveProperty('personality');
        });
    });

    it('/api/ouija/spirits/:id (GET) - should return specific spirit', () => {
      return request(app.getHttpServer())
        .get(`/api/ouija/spirits/${spiritId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', spiritId);
          expect(res.body).toHaveProperty('name');
          expect(res.body).toHaveProperty('personality');
          expect(res.body).toHaveProperty('backstory');
        });
    });

    it('/api/ouija/spirits/:id (GET) - should return 404 for invalid spirit', () => {
      return request(app.getHttpServer())
        .get('/api/ouija/spirits/999999')
        .expect(404);
    });
  });

  describe('Session Endpoints', () => {
    it('/api/ouija/session/create (POST) - should create new session', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId, userId: 'e2e_test_user' })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionToken');
          expect(res.body).toHaveProperty('welcomeMessage');
          expect(res.body).toHaveProperty('spirit');
          expect(res.body.spirit).toHaveProperty('id', spiritId);

          // Save token for next tests
          sessionToken = res.body.sessionToken;
        });
    });

    it('/api/ouija/session/create (POST) - should validate spiritId', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId: 'invalid' })
        .expect(400);
    });

    it('/api/ouija/session/create (POST) - should return 404 for non-existent spirit', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId: 999999 })
        .expect(404);
    });

    it('/api/ouija/session/:token/status (GET) - should return session status', () => {
      return request(app.getHttpServer())
        .get(`/api/ouija/session/${sessionToken}/status`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionToken', sessionToken);
          expect(res.body).toHaveProperty('status', 'active');
          expect(res.body).toHaveProperty('spiritName');
          expect(res.body).toHaveProperty('messageCount');
        });
    });

    it('/api/ouija/session/ask (POST) - should send message and get response', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: '¿Cuál es mi destino?',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('userMessage');
          expect(res.body).toHaveProperty('spiritResponse');
          expect(res.body.userMessage).toHaveProperty(
            'content',
            '¿Cuál es mi destino?',
          );
          expect(res.body.spiritResponse).toHaveProperty('content');
          expect(res.body.spiritResponse.content).toBeTruthy();
        });
    }, 30000); // Timeout de 30s para esperar respuesta de IA

    it('/api/ouija/session/ask (POST) - should validate message length', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: '', // Empty message
        })
        .expect(400);
    });

    it('/api/ouija/session/ask (POST) - should reject message too long', () => {
      const longMessage = 'a'.repeat(501);
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: longMessage,
        })
        .expect(400);
    });

    it('/api/ouija/session/:token/history (GET) - should return session history', () => {
      return request(app.getHttpServer())
        .get(`/api/ouija/session/${sessionToken}/history`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('sessionToken', sessionToken);
          expect(res.body).toHaveProperty('messages');
          expect(res.body.messages).toBeInstanceOf(Array);
          expect(res.body.messages.length).toBeGreaterThan(1);

          // Should have welcome message and user message
          const welcomeMsg = res.body.messages.find(
            (m: any) => m.role === 'spirit',
          );
          const userMsg = res.body.messages.find((m: any) => m.role === 'user');
          expect(welcomeMsg).toBeDefined();
          expect(userMsg).toBeDefined();
        });
    });

    it('/api/ouija/session/:token/end (POST) - should end session', () => {
      return request(app.getHttpServer())
        .post(`/api/ouija/session/${sessionToken}/end`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message');
          expect(res.body).toHaveProperty('endedAt');
        });
    });

    it('/api/ouija/session/:token/end (POST) - should not end already ended session', () => {
      return request(app.getHttpServer())
        .post(`/api/ouija/session/${sessionToken}/end`)
        .expect(400);
    });

    it('/api/ouija/session/ask (POST) - should not send message to ended session', () => {
      return request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({
          sessionToken,
          message: 'Test message',
        })
        .expect(400);
    });
  });

  describe('Complete Session Flow', () => {
    it('should handle complete session lifecycle', async () => {
      // 1. Create session
      const createRes = await request(app.getHttpServer())
        .post('/api/ouija/session/create')
        .send({ spiritId, userId: 'e2e_flow_test' })
        .expect(201);

      const token = createRes.body.sessionToken;

      // 2. Send multiple messages
      await request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({ sessionToken: token, message: '¿Quién eres?' })
        .expect(200);

      await request(app.getHttpServer())
        .post('/api/ouija/session/ask')
        .send({ sessionToken: token, message: '¿Puedes ayudarme?' })
        .expect(200);

      // 3. Check history
      const historyRes = await request(app.getHttpServer())
        .get(`/api/ouija/session/${token}/history`)
        .expect(200);

      expect(historyRes.body.messages.length).toBeGreaterThanOrEqual(5);
      // welcome + user1 + spirit1 + user2 + spirit2

      // 4. End session
      await request(app.getHttpServer())
        .post(`/api/ouija/session/${token}/end`)
        .expect(200);

      // 5. Verify session is ended
      const statusRes = await request(app.getHttpServer())
        .get(`/api/ouija/session/${token}/status`)
        .expect(200);

      expect(statusRes.body.status).toBe('ended');
    }, 60000);
  });
});
