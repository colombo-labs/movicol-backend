import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../../app/app.module';

describe('GraphController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /graph/stats', () => {
    it('should return nodes and edges count', async () => {
      const res = await request(app.getHttpServer()).get('/graph/stats');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('nodes');
      expect(res.body).toHaveProperty('edges');
      expect(res.body.nodes).toBeGreaterThan(0);
    });
  });

  describe('GET /graph/tm/troncales', () => {
    it('should return GeoJSON features', async () => {
      const res = await request(app.getHttpServer()).get('/graph/tm/troncales');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('features');
      expect(res.body.features.length).toBeGreaterThan(0);
    });
  });

  describe('GET /graph/tm/estaciones', () => {
    it('should return GeoJSON features', async () => {
      const res = await request(app.getHttpServer()).get('/graph/tm/estaciones');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('features');
    });
  });

  describe('GET /graph/tm/rutas', () => {
    it('should return rutas array', async () => {
      const res = await request(app.getHttpServer()).get('/graph/tm/rutas');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rutas');
      expect(res.body.rutas.length).toBeGreaterThan(0);
      expect(res.body.rutas[0]).toHaveProperty('codigo');
      expect(res.body.rutas[0]).toHaveProperty('origen');
    });
  });

  describe('GET /graph/sitp/rutas', () => {
    it('should return rutas with cenefa', async () => {
      const res = await request(app.getHttpServer()).get('/graph/sitp/rutas');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('rutas');
      expect(res.body.rutas[0]).toHaveProperty('ruta');
      expect(res.body.rutas[0]).toHaveProperty('cenefa');
    });
  });

  describe('GET /graph/sitp/paraderos', () => {
    it('should return paraderos', async () => {
      const res = await request(app.getHttpServer()).get('/graph/sitp/paraderos');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('features');
    });
  });

  describe('GET /graph/rutas-cercanas', () => {
    it('should return nearby routes with distance', async () => {
      const res = await request(app.getHttpServer())
        .get('/graph/rutas-cercanas?lat=4.69&lng=-74.11&radius=500');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('rutas');
    });
  });

  describe('GET /graph/heatmap', () => {
    it('should return array of stations with congestion', async () => {
      const res = await request(app.getHttpServer()).get('/graph/heatmap');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /graph/accesibilidad', () => {
    it('should return accessibility stats', async () => {
      const res = await request(app.getHttpServer()).get('/graph/accesibilidad');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('totalParaderos');
      expect(res.body).toHaveProperty('totalRutas');
    });
  });
});
