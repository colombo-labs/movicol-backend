# MoviCol Backend

API REST para MoviCol — NestJS + TypeORM + PostgreSQL/PostGIS + Redis.

## Stack

- NestJS 10 + TypeScript
- TypeORM + PostgreSQL + PostGIS
- Redis 7 (cache)
- Proxy al AI Service (FastAPI :8000)

## Setup

```bash
npm install
npm run start:dev   # http://localhost:3001
npm test            # Jest
npm run test:e2e    # Integration tests
```

## Módulos

| Módulo | Endpoints |
|--------|-----------|
| `graph/` | `/graph/stats`, `/graph/tm/*`, `/graph/sitp/*`, `/graph/heatmap`, `/graph/rutas-cercanas` |
| `route-prediction/` | `/route-prediction`, `/route-prediction/alternatives`, `/route-prediction/alerts` |
| `health/` | `/health` |

## Env

```env
DATABASE_URL=postgresql://movicol:movicol@localhost:5432/movicol
REDIS_URL=redis://localhost:6379
AI_SERVICE_URL=http://localhost:8000
```
