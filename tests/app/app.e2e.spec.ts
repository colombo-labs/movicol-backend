import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app/app.module';

describe('GraphController (e2e-like unit)', () => {
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

  it('/health (GET) should return ok', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
      });
  });

  it('/graph/tm/estaciones (GET) should return stations', () => {
    return request(app.getHttpServer())
      .get('/graph/tm/estaciones')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('/graph/tm/troncales (GET) should return troncales', () => {
    return request(app.getHttpServer())
      .get('/graph/tm/troncales')
      .expect(200)
      .expect((res) => {
        expect(res.body).toBeDefined();
      });
  });

  it('/chat (POST) should accept message', () => {
    return request(app.getHttpServer())
      .post('/chat')
      .send({ message: 'hola', sessionId: 'test' })
      .expect(201)
      .expect((res) => {
        expect(res.body.response).toBeDefined();
        expect(res.body.sessionId).toBe('test');
      });
  });

  it('/chat (POST) should reject empty message', () => {
    return request(app.getHttpServer())
      .post('/chat')
      .send({ message: '', sessionId: 'test' })
      .expect(400);
  });
});
