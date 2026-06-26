export default function configuration() { return ({
  port: Number.parseInt(process.env.PORT ?? '3001', 10),
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: Number.parseInt(process.env.DB_PORT ?? '5432', 10),
    username: process.env.DB_USERNAME || 'movicol',
    password: process.env.DB_PASSWORD || 'movicol_dev',
    database: process.env.DB_DATABASE || 'movicol',
  },
  ai: {
    serviceUrl: process.env.AI_SERVICE_URL || 'http://localhost:8000',
  },
}); }
