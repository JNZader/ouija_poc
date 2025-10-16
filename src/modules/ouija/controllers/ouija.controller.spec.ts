import { Test, TestingModule } from '@nestjs/testing';
import { OuijaController } from './ouija.controller';

describe('OuijaController', () => {
  let controller: OuijaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OuijaController],
    }).compile();

    controller = module.get<OuijaController>(OuijaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('healthCheck', () => {
    it('should return health status', () => {
      const result = controller.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('service', 'ouija-virtual-api');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment');
    });

    it('should return current timestamp', () => {
      const result = controller.healthCheck();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });
});
