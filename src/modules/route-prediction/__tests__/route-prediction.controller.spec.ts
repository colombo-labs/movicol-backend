import { Test, TestingModule } from '@nestjs/testing';
import { RoutePredictionController } from '../controllers/route-prediction.controller';
import { RoutePredictionService } from '../services/route-prediction.service';
import { HttpClientService } from '../../../common/services/http-client.service';
import { ConfigService } from '@nestjs/config';

describe('RoutePredictionController', () => {
  let controller: RoutePredictionController;
  let httpClient: jest.Mocked<HttpClientService>;

  beforeEach(async () => {
    const mockHttpClient = {
      post: jest.fn(),
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutePredictionController],
      providers: [
        RoutePredictionService,
        { provide: HttpClientService, useValue: mockHttpClient },
        { provide: ConfigService, useValue: { get: () => 'http://localhost:8000' } },
      ],
    }).compile();

    controller = module.get(RoutePredictionController);
    httpClient = module.get(HttpClientService);
  });

  describe('POST /route-prediction', () => {
    it('should predict a vehicle route', async () => {
      const mockResponse = {
        route_id: 'test-id',
        total_time_minutes: 15,
        total_distance_km: 10,
        cost: '$20.000',
        mode: 'vehiculo',
        risk_segments: [],
        overall_risk: 'low',
        safety_score: 80,
        explanation: '',
        stations: ['Calle 72', 'Calle 80'],
        departure_time: '2026-06-21T15:00:00',
        route_code: '',
        navigation_steps: [],
      };
      httpClient.post.mockResolvedValue(mockResponse);

      const result = await controller.predictRoute({
        origin: { lat: 4.65, lng: -74.11 },
        destination: { lat: 4.72, lng: -74.06 },
        departure_time: '2026-06-21T15:00:00',
        mode: 'vehiculo',
      });

      expect(result).toEqual(mockResponse);
      expect(httpClient.post).toHaveBeenCalledWith('/api/v1/predict-route', expect.any(Object));
    });

    it('should predict a transmilenio route', async () => {
      const mockResponse = {
        route_id: 'tm-id',
        total_time_minutes: 25,
        total_distance_km: 12,
        cost: '$3,550',
        mode: 'transmilenio',
        risk_segments: [{ from_station: 'A', to_station: 'B', congestion_level: 0.5, risk_label: 'medium', coordinates: [[4.65, -74.11]] }],
        overall_risk: 'medium',
        safety_score: 70,
        explanation: '',
        stations: ['Portal Norte', 'Calle 72', 'Av. Chile'],
        departure_time: '2026-06-21T15:00:00',
        route_code: 'B5',
        navigation_steps: [],
      };
      httpClient.post.mockResolvedValue(mockResponse);

      const result = await controller.predictRoute({
        origin: { lat: 4.65, lng: -74.11 },
        destination: { lat: 4.72, lng: -74.06 },
        departure_time: '2026-06-21T15:00:00',
        mode: 'transmilenio',
      });

      expect(result.mode).toBe('transmilenio');
      expect(result.cost).toBe('$3,550');
      expect(result.stations.length).toBeGreaterThan(0);
    });
  });

  describe('POST /route-prediction/alternatives', () => {
    it('should return array of alternatives', async () => {
      const mockResponse = [
        { route_id: 'alt-1', total_time_minutes: 15, total_distance_km: 10, cost: '$20.000', mode: 'vehiculo', risk_segments: [], overall_risk: 'low', safety_score: 80, explanation: '', stations: [], departure_time: '', route_code: '', navigation_steps: [] },
        { route_id: 'alt-2', total_time_minutes: 18, total_distance_km: 12, cost: '$24.000', mode: 'vehiculo', risk_segments: [], overall_risk: 'medium', safety_score: 70, explanation: '', stations: [], departure_time: '', route_code: '', navigation_steps: [] },
      ];
      httpClient.post.mockResolvedValue(mockResponse);

      const result = await controller.predictAlternatives({
        origin: { lat: 4.65, lng: -74.11 },
        destination: { lat: 4.72, lng: -74.06 },
        departure_time: '2026-06-21T15:00:00',
        mode: 'vehiculo',
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });
  });

  describe('GET /route-prediction/alerts', () => {
    it('should return system alerts', async () => {
      const mockResponse = { operating: 123, delayed: 2, suspended: 0, alerts: [{ title: 'Test alert', url: 'https://example.com', route_codes: ['2-3'] }] };
      httpClient.get.mockResolvedValue(mockResponse);

      const result = await controller.getAlerts();

      expect(result.operating).toBeGreaterThan(0);
      expect(result).toHaveProperty('delayed');
      expect(result).toHaveProperty('suspended');
      expect(result).toHaveProperty('alerts');
    });
  });
});
