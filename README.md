# MoviCol Backend

NestJS REST API for MoviCol transport system. Serves real SITP/TM data and proxies AI service.

## Stack
- NestJS + TypeScript
- Redis (query cache)
- GeoJSON (real infrastructure data)

## Key Endpoints (v0.2.0)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/graph/rutas-cercanas?lat=X&lng=Y&radius=500` | Routes near a point |
| GET | `/graph/accesibilidad` | Infrastructure metrics |
| GET | `/graph/sitp/rutas` | All 689 routes with stops |
| GET | `/graph/stations` | Graph stations |
| GET | `/graph/heatmap?hour=8` | Congestion heatmap |
| POST | `/route-prediction` | Route prediction (AI proxy) |

## Data
- `data/sitp_rutas_paraderos.geojson` — 42,601 stops, 689 routes
- `data/sitp_paraderos.geojson` — SITP bus stops

## Run
```bash
npm install && npm run dev     # Dev with watch
npm run build                  # Compile
npm run lint                   # ESLint
npm run format                 # Prettier
```

## Docker
```bash
docker build -t colombolabs/movicol-backend:latest .
docker run -d -p 3001:3001 -e REDIS_HOST=movicol-redis \
  -e AI_SERVICE_URL=http://movicol-ai:8000 \
  --network movicol-infra_default colombolabs/movicol-backend:latest
```

## Env
- `REDIS_HOST` — Redis host (default: localhost)
- `AI_SERVICE_URL` — AI service (default: http://localhost:8000)
- `PORT` — Server port (default: 3001)
