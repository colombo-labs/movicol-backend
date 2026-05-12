# 🚀 MoviCol Backend

API Gateway para la plataforma de movilidad inteligente MoviCol.

## Stack

- **NestJS** 10.4 + **TypeScript** 5.5
- **TypeORM** 0.3 + **PostgreSQL** 16 + **PostGIS** 3.4
- **Socket.io** 4.7 (WebSocket híbrido)
- **Swagger** 7.4 (documentación API)
- **Jest** 29 (testing)
- **ESLint** 8 + **Prettier** 3

## Arquitectura

Modular SOLID — cada módulo autocontenido con controller, service, DTOs, entities y gateway WS.

```
src/
├── main.ts                          # Bootstrap + Swagger + global pipes
├── app/app.module.ts                # Root module
├── common/                          # @Global — shared layer
│   ├── common.module.ts
│   ├── filters/                     # Exception filters
│   ├── interceptors/                # Response transform
│   ├── interfaces/                  # Pagination, WS events
│   ├── pipes/                       # Custom pipes
│   ├── gateways/base.gateway.ts     # Base WS (heartbeat, rooms)
│   └── services/http-client.service.ts  # Proxy a AI service
├── config/configuration.ts
├── database/database.module.ts
└── modules/
    ├── health/                      # GET /health
    ├── stations/                    # CRUD /stations (PostGIS)
    │   ├── controllers/ services/ entities/ dtos/
    ├── routes/                      # CRUD /routes
    │   ├── controllers/ services/ entities/ dtos/
    ├── predictions/                 # POST /predictions (proxy → AI)
    │   ├── controllers/ services/ dtos/ entities/ gateways/
    └── chat/                        # POST /chat (proxy → AI agent)
        ├── controllers/ services/ dtos/ entities/ gateways/
```

## Quick Start

```bash
npm install
npm run dev     # http://localhost:3001
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Dev con hot reload |
| `npm run build` | Build producción |
| `npm run start:prod` | Run producción |
| `npm test` | Jest tests |
| `npm run lint` | ESLint fix |

## API Docs

Swagger UI: `http://localhost:3001/api/docs`

## WebSocket

| Namespace | Descripción |
|-----------|-------------|
| `/predictions` | Predicciones live por estación/zona |
| `/chat` | Streaming del agente LLM |

## Docker

```bash
docker compose -f docker-compose.dev.yml up -d
```

## Requisitos

- Node.js 20+
- PostgreSQL 16 + PostGIS 3.4
- AI service en :8000
