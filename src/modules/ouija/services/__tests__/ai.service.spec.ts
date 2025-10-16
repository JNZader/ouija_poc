import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AIService } from '../ai.service';
import axios from 'axios';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AIService', () => {
  let service: AIService;

  const mockConfigService = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get: jest.fn((key: string, defaultValue?: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const config: Record<string, any> = {
        OLLAMA_URL: 'http://localhost:11434',
        OLLAMA_MODEL: 'qwen2.5:3b',
        OLLAMA_TIMEOUT: 60000,
        DEEPSEEK_API_KEY: 'test-key',
        DEEPSEEK_BASE_URL: 'https://api.deepseek.com',
        DEEPSEEK_TIMEOUT: 30000,
        DEFAULT_AI_ENGINE: 'ollama',
      };
      return config[key] || defaultValue;
    }),
  };

  const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedAxios.create = jest.fn(() => mockAxiosInstance as any);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AIService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AIService>(AIService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generate', () => {
    it('should generate response with Ollama', async () => {
      const mockResponse = {
        data: {
          message: {
            content: 'Respuesta mística del espíritu',
          },
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const options = {
        messages: [
          { role: 'system' as const, content: 'Eres un espíritu sabio' },
          { role: 'user' as const, content: '¿Cuál es mi destino?' },
        ],
        temperature: 0.9,
        maxTokens: 300,
      };

      const result = await service.generate(options, 'ollama');

      expect(result.content).toBe('Respuesta mística del espíritu');
      expect(result.engine).toBe('ollama');
      expect(result.model).toBe('qwen2.5:3b');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/chat', expect.any(Object));
    });

    it('should fallback to DeepSeek when Ollama fails', async () => {
      mockAxiosInstance.post
        .mockRejectedValueOnce(new Error('Ollama connection failed'))
        .mockResolvedValueOnce({
          data: {
            choices: [
              {
                message: {
                  content: 'DeepSeek fallback response',
                },
              },
            ],
          },
        });

      const options = {
        messages: [
          { role: 'system' as const, content: 'Eres un espíritu sabio' },
          { role: 'user' as const, content: '¿Cuál es mi destino?' },
        ],
      };

      const result = await service.generate(options, 'ollama');

      expect(result.content).toBe('DeepSeek fallback response');
      expect(result.engine).toBe('deepseek');
    });

    it('should use emergency fallback when all engines fail', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('All engines failed'));

      const options = {
        messages: [
          { role: 'system' as const, content: 'Eres un espíritu sabio' },
          { role: 'user' as const, content: '¿Cuál es mi destino?' },
        ],
      };

      const result = await service.generate(options, 'ollama');

      expect(result.engine).toBe('fallback');
      // El fallback usa templates aleatorios, solo verificamos que tenga contenido
      expect(result.content.length).toBeGreaterThan(0);
    });
  });

  describe('healthCheck', () => {
    it('should return health status for all engines', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });

      const health = await service.healthCheck();

      expect(health).toHaveProperty('ollama');
      expect(health).toHaveProperty('deepseek');
    });
  });

  describe('getEnginesInfo', () => {
    it('should return info about configured engines', () => {
      const info = service.getEnginesInfo();

      expect(info).toBeInstanceOf(Array);
      expect(info.length).toBeGreaterThan(0);
      expect(info[0]).toHaveProperty('name');
      expect(info[0]).toHaveProperty('type');
      expect(info[0]).toHaveProperty('enabled');
      expect(info[0]).toHaveProperty('isDefault');
    });
  });
});
