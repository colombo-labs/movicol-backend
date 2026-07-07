# Postman — MoviCol API Tests

## Archivos

```
postman/
├── MoviCol-API.postman_collection.json   ← Colección principal
├── environment-local.json                ← Env: localhost
├── environment-dev.json                  ← Env: servidor dev
└── environment-prod.json                 ← Env: producción
```

## Importar en Postman

1. Abrir Postman
2. Import → seleccionar `MoviCol-API.postman_collection.json`
3. Import → seleccionar los 3 `environment-*.json`
4. Seleccionar el ambiente (esquina superior derecha)

## Estructura de la colección

| Carpeta | Endpoints | Tests |
|---------|-----------|-------|
| Health | Backend + AI health check | Status 200, body.status == "ok" |
| Chat | Greeting, plan_route, confirm, context, cost | Schema validation, flow completo |
| Graph | Estaciones TM, Troncales | Status 200, data exists |
| AI Direct | Chat directo al AI, Route prediction | Station info, route fields, cost |

## Pre-request scripts (globales)

- Genera `timestamp` y `session_id` únicos por request
- Inyecta `Authorization: Bearer` si hay `access_token` en el environment

## Post-request tests (globales)

- Valida response time < 5s en TODOS los requests
- Log de tiempos para monitoreo

## Tests por request

Cada request tiene tests específicos que validan:
- Status code correcto
- Schema de respuesta (campos requeridos)
- Valores de negocio (precio $3.550, nombre estación, etc.)
- Flujo conversacional (confirm devuelve action)

## Correr con Newman (CLI)

```bash
# Instalar
npm install -g newman

# Correr contra local
newman run postman/MoviCol-API.postman_collection.json \
  -e postman/environment-local.json \
  --reporters cli,json \
  --reporter-json-export results/api-tests.json

# Correr contra dev
newman run postman/MoviCol-API.postman_collection.json \
  -e postman/environment-dev.json

# Correr contra prod
newman run postman/MoviCol-API.postman_collection.json \
  -e postman/environment-prod.json
```

## CI Integration

```yaml
# En GitHub Actions:
- name: API Tests
  run: |
    newman run postman/MoviCol-API.postman_collection.json \
      -e postman/environment-dev.json \
      --bail
```
