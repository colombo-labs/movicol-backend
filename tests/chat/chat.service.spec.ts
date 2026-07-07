import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from '../src/modules/chat/services/chat.service';
import { HttpClientService } from '../src/common/services/http-client.service';

describe('ChatService', () => {
  let service: ChatService;
  let httpClient: jest.Mocked<HttpClientService>;

  beforeEach(async () => {
    const mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: HttpClientService, useValue: mockHttpClient },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    httpClient = module.get(HttpClientService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should send message to AI service and return response', async () => {
    httpClient.post.mockResolvedValue({
      response: 'Hola, soy MoviBot',
      sources: ['rule_based'],
      session_id: 'test-session',
      actions: [],
    });

    const result = await service.chat({
      message: 'hola',
      sessionId: 'test-session',
    });

    expect(result.response).toBe('Hola, soy MoviBot');
    expect(result.sessionId).toBe('test-session');
    expect(result.sources).toEqual(['rule_based']);
    expect(result.actions).toEqual([]);
  });

  it('should pass context to AI service', async () => {
    httpClient.post.mockResolvedValue({
      response: 'ok',
      sources: [],
      session_id: 's1',
      actions: [],
    });

    await service.chat({
      message: 'ir al centro',
      sessionId: 's1',
      context: {
        module: 'planificar',
        origin: 'Suba',
        language: 'es',
      },
    });

    expect(httpClient.post).toHaveBeenCalledWith('/agent/chat', {
      message: 'ir al centro',
      session_id: 's1',
      context: expect.objectContaining({
        module: 'planificar',
        origin: 'Suba',
      }),
    });
  });

  it('should forward actions from AI service', async () => {
    httpClient.post.mockResolvedValue({
      response: 'Listo',
      sources: ['agent_tools'],
      session_id: 's2',
      actions: [
        { type: 'plan_route', data: { origin: 'suba', destination: 'centro' } },
      ],
    });

    const result = await service.chat({
      message: 'si',
      sessionId: 's2',
    });

    expect(result.actions).toHaveLength(1);
    expect(result.actions![0].type).toBe('plan_route');
  });

  it('should handle missing context gracefully', async () => {
    httpClient.post.mockResolvedValue({
      response: 'ok',
      sources: [],
      session_id: 's3',
    });

    const result = await service.chat({
      message: 'hola',
      sessionId: 's3',
    });

    expect(result.response).toBe('ok');
    expect(result.actions).toEqual([]);
  });
});
