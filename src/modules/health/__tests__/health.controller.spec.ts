import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from '../health.controller';
import { PrismaService } from '../../../common/prisma/prisma.service';
import { AIService } from '../../ouija/services/ai.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;
  let aiService: AIService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn(),
          },
        },
        {
          provide: AIService,
          useValue: {
            healthCheck: jest.fn(),
            getEnginesInfo: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
    aiService = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return basic health status', () => {
      const result = controller.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'ouija-virtual-api');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment');
    });

    it('should include current timestamp', () => {
      const before = new Date();
      const result = controller.healthCheck();
      const after = new Date();

      const resultTime = new Date(result.timestamp);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should include environment from process.env', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';

      const result = controller.healthCheck();
      expect(result.environment).toBe('test');

      process.env.NODE_ENV = originalEnv;
    });

    it('should default to development if NODE_ENV is not set', () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;

      const result = controller.healthCheck();
      expect(result.environment).toBe('development');

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('detailedHealthCheck', () => {
    it('should return detailed health status with all components ok', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      jest.spyOn(aiService, 'healthCheck').mockResolvedValue({
        ollama: true,
        deepseek: true,
      });
      jest.spyOn(aiService, 'getEnginesInfo').mockReturnValue([
        { name: 'ollama', type: 'ollama', enabled: true, isDefault: true },
        { name: 'deepseek', type: 'deepseek', enabled: true, isDefault: false },
      ]);

      const result = await controller.detailedHealthCheck();

      expect(result.status).toBe('ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'ouija-virtual-api');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result.components.database.status).toBe('ok');
      expect(result.components.database.message).toBe('Connected');
      expect(result.components.aiEngines).toHaveProperty('configured');
      expect(result.components.aiEngines).toHaveProperty('health');
    });

    it('should return degraded status when database is down', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockRejectedValue(new Error('Connection refused'));
      jest.spyOn(aiService, 'healthCheck').mockResolvedValue({
        ollama: true,
      });
      jest
        .spyOn(aiService, 'getEnginesInfo')
        .mockReturnValue([{ name: 'ollama', type: 'ollama', enabled: true, isDefault: true }]);

      const result = await controller.detailedHealthCheck();

      expect(result.status).toBe('degraded');
      expect(result.components.database.status).toBe('error');
      expect(result.components.database.message).toBe('Connection refused');
    });

    it('should include AI engines health status', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      const mockHealthCheck = {
        ollama: true,
        deepseek: false,
      };
      const mockEnginesInfo = [
        { name: 'ollama', type: 'ollama', enabled: true, isDefault: true },
        { name: 'deepseek', type: 'deepseek', enabled: true, isDefault: false },
      ];

      jest.spyOn(aiService, 'healthCheck').mockResolvedValue(mockHealthCheck);
      jest.spyOn(aiService, 'getEnginesInfo').mockReturnValue(mockEnginesInfo);

      const result = await controller.detailedHealthCheck();

      expect(result.components.aiEngines.health).toEqual(mockHealthCheck);
      expect(result.components.aiEngines.configured).toEqual(mockEnginesInfo);
    });

    it('should handle multiple concurrent health checks', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      jest.spyOn(aiService, 'healthCheck').mockResolvedValue({
        ollama: true,
      });
      jest
        .spyOn(aiService, 'getEnginesInfo')
        .mockReturnValue([{ name: 'ollama', type: 'ollama', enabled: true, isDefault: true }]);

      const results = await Promise.all([
        controller.detailedHealthCheck(),
        controller.detailedHealthCheck(),
        controller.detailedHealthCheck(),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result) => {
        expect(result.status).toBe('ok');
        expect(result.components.database.status).toBe('ok');
      });
    });

    it('should include timestamp in detailed check', async () => {
      jest.spyOn(prismaService, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
      jest.spyOn(aiService, 'healthCheck').mockResolvedValue({});
      jest.spyOn(aiService, 'getEnginesInfo').mockReturnValue([]);

      const before = new Date();
      const result = await controller.detailedHealthCheck();
      const after = new Date();

      const resultTime = new Date(result.timestamp);
      expect(resultTime.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(resultTime.getTime()).toBeLessThanOrEqual(after.getTime());
    });
  });
});
