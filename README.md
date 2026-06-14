# MoviCol Backend

API REST NestJS para el sistema de transporte MoviCol. Sirve datos reales del SITP/TransMilenio y hace proxy al servicio de AI.

## Stack
- **NestJS** + TypeScript
- **Redis** — cache de consultas
- **GeoJSON** — datos reales de infraestructura

## Endpoints Principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/graph/rutas-cercanas?lat=X&lng=Y&radius=500` | Rutas que pasan cerca de un punto |
| GET | `/graph/accesibilidad` | Métricas de infraestructura del sistema |
| GET | `/graph/sitp/rutas` | Las 689 rutas con paraderos |
| GET | `/graph/stations` | Estaciones del grafo |
| GET | `/graph/nearby?lat=X&lon=Y` | Estaciones cercanas |
| GET | `/graph/heatmap?hour=8` | Heatmap de congestión |
| POST | `/route-prediction` | Predicción de ruta (proxy AI) |

## Datos Reales
- `data/sitp_rutas_paraderos.geojson` — 42,601 paraderos, 689 rutas
- `data/sitp_paraderos.geojson` — paraderos SITP

## Endpoint `rutas-cercanas` (nuevo)
Dado un punto geográfico y un radio, encuentra todas las rutas SITP que tienen al menos un paradero dentro del radio.

**Request:** `GET /graph/rutas-cercanas?lat=4.6588&lng=-74.0938&radius=500`

**Response:**
```json
{
  "total": 44,
  "radio": 500,
  "rutas": [
    { "ruta": "576", "cenefa": "118C05", "paraderosCercanos": [...], "distanciaMinima": 464 }
  ]
}
```

**Uso para planificación:** El frontend llama para origen Y destino, luego intersecta las rutas comunes.

## Desarrollo

```bash
npm install
npm run start:dev   # Dev con hot reload
npm run build       # Compilar
npm run lint        # ESLint
npm run format      # Prettier
```

## Docker

```bash
docker build -t colombolabs/movicol-backend:latest .
docker run -d --name movicol-backend \
  --network movicol-infra_default \
  -p 3001:3001 \
  -e REDIS_HOST=movicol-redis \
  -e AI_SERVICE_URL=http://movicol-ai:8000 \
  colombolabs/movicol-backend:latest
```

## Variables de entorno
- `REDIS_HOST` — host de Redis (default: localhost)
- `AI_SERVICE_URL` — URL del servicio AI (default: http://localhost:8000)
- `PORT` — puerto del servidor (default: 3001)
