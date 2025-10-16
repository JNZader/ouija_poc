import { Test, TestingModule } from '@nestjs/testing';
import { OuijaController } from './ouija.controller';
import { SpiritSessionService } from '../services/spirit-session.service';

describe('OuijaController', () => {
  let controller: OuijaController;
  let sessionService: SpiritSessionService;

  beforeEach(async () => {
    // Mock de SpiritSessionService
    const mockSessionService = {
      getAvailableSpirits: jest.fn(),
      getSpiritById: jest.fn(),
      createSession: jest.fn(),
      sendMessage: jest.fn(),
      endSession: jest.fn(),
      getSessionHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [OuijaController],
      providers: [
        {
          provide: SpiritSessionService,
          useValue: mockSessionService,
        },
      ],
    }).compile();

    controller = module.get<OuijaController>(OuijaController);
    sessionService = module.get<SpiritSessionService>(SpiritSessionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getAvailableSpirits', () => {
    it('should call sessionService.getAvailableSpirits', async () => {
      await controller.getAvailableSpirits();
      expect(sessionService.getAvailableSpirits).toHaveBeenCalled();
    });
  });

  describe('getSpiritById', () => {
    it('should call sessionService.getSpiritById with correct id', async () => {
      await controller.getSpiritById('1');
      expect(sessionService.getSpiritById).toHaveBeenCalledWith(1);
    });
  });

  describe('createSession', () => {
    it('should call sessionService.createSession', async () => {
      const dto = { spiritId: 1 };
      await controller.createSession(dto);
      expect(sessionService.createSession).toHaveBeenCalledWith(dto);
    });
  });

  describe('sendMessage', () => {
    it('should call sessionService.sendMessage', async () => {
      const dto = { sessionToken: 'test-token', message: 'test message' };
      await controller.sendMessage(dto);
      expect(sessionService.sendMessage).toHaveBeenCalledWith(dto);
    });
  });

  describe('endSession', () => {
    it('should call sessionService.endSession', async () => {
      const token = 'test-token';
      await controller.endSession(token);
      expect(sessionService.endSession).toHaveBeenCalledWith(token);
    });
  });

  describe('getSessionHistory', () => {
    it('should call sessionService.getSessionHistory', async () => {
      const token = 'test-token';
      await controller.getSessionHistory(token);
      expect(sessionService.getSessionHistory).toHaveBeenCalledWith(token);
    });
  });

  describe('getSessionStatus', () => {
    it('should call sessionService.getSessionHistory and return status info', async () => {
      const mockHistory = {
        sessionToken: 'test-token',
        status: 'active',
        spirit: { id: 1, name: 'Test Spirit', personality: 'wise' },
        messages: [{ id: 1 }, { id: 2 }],
        startedAt: new Date(),
        endedAt: null,
      };

      (sessionService.getSessionHistory as jest.Mock).mockResolvedValue(
        mockHistory,
      );

      const result = await controller.getSessionStatus('test-token');

      expect(sessionService.getSessionHistory).toHaveBeenCalledWith(
        'test-token',
      );
      expect(result).toEqual({
        sessionToken: 'test-token',
        status: 'active',
        spiritName: 'Test Spirit',
        messageCount: 2,
        startedAt: mockHistory.startedAt,
        endedAt: null,
      });
    });
  });
});
