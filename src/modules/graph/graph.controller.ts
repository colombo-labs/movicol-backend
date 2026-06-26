import { Public } from '../auth/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { HttpClientService } from '../../common/services/http-client.service';
import { RedisService } from '../../common/services/redis.service';

import * as fs from 'node:fs';
import * as path from 'node:path';

// Haversine distance in meters
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.pow(Math.sin(dLon / 2), 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const DATA_DIR = process.env.DATA_PATH || path.join(process.cwd(), '..', 'movicol-data', 'exports');

function loadGeoJson(filename: string) {
  const primary = path.join(DATA_DIR, filename);
  if (fs.existsSync(primary)) {
    return JSON.parse(fs.readFileSync(primary, 'utf-8'));
  }
  const backend = path.join(DATA_DIR, 'backend', filename);
  if (fs.existsSync(backend)) {
    return JSON.parse(fs.readFileSync(backend, 'utf-8'));
  }
  throw new Error(`GeoJSON file not found: ${filename} (tried ${primary} and ${backend})`);
}

const GEO_TTL = 600; // 10 min for static infrastructure data

@ApiTags('Graph')
@Public()
@Controller('graph')
export class GraphController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly redis: RedisService,
  ) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get graph statistics' })
  getStats() {
    return this.httpClient.get('/graph/stats');
  }

  @Get('analysis')
  @ApiOperation({ summary: 'Get advanced graph analysis' })
  getAnalysis() {
    return this.httpClient.get('/graph/analysis');
  }

  @Get('heatmap')
  @ApiOperation({ summary: 'Get GNN congestion heatmap' })
  async getHeatmap(@Query('hour') hour?: string) {
    const h = hour ? Number.parseInt(hour, 10) : 8;
    const key = `graph:heatmap:${h}`;
    const cached = await this.redis.get(key);
    if (cached) return cached;
    const data = await this.httpClient.get(`/graph/heatmap?hour=${h}`);
    await this.redis.set(key, data, 60); // 1 min TTL for dynamic data
    return data;
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find stations near a point' })
  getNearby(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius_km') radiusKm?: string,
    @Query('limit') limit?: string,
  ) {
    const r = radiusKm ? Number.parseFloat(radiusKm) : 1;
    const l = limit ? Number.parseInt(limit, 10) : 10;
    return this.httpClient.get(`/graph/nearby?lat=${lat}&lon=${lon}&radius_km=${r}&limit=${l}`);
  }

  @Get('compare-hours')
  @ApiOperation({ summary: 'Compare congestion across hours' })
  compareHours(@Query('station_id') stationId: string) {
    return this.httpClient.get(`/graph/compare-hours?station_id=${encodeURIComponent(stationId)}`);
  }

  @Get('stations')
  @ApiOperation({ summary: 'List stations from graph' })
  async getStations(@Query('limit') limit?: string, @Query('offset') offset?: string) {
    const l = limit ? Number.parseInt(limit, 10) : 100;
    const o = offset ? Number.parseInt(offset, 10) : 0;
    const key = `graph:stations:${l}:${o}`;
    const cached = await this.redis.get(key);
    if (cached) return cached;
    const data = await this.httpClient.get(`/graph/stations?limit=${l}&offset=${o}`);
    await this.redis.set(key, data, GEO_TTL);
    return data;
  }

  @Get('stations/:id')
  @ApiOperation({ summary: 'Get station by ID' })
  getStation(@Param('id') id: string) {
    return this.httpClient.get(`/graph/stations/${encodeURIComponent(id)}`);
  }

  @Get('edges')
  @ApiOperation({ summary: 'Get graph edges for map rendering' })
  async getEdges(@Query('type') type?: string, @Query('limit') limit?: string) {
    const t = type ?? 'all';
    const l = limit ? Number.parseInt(limit, 10) : 500;
    const key = `graph:edges:${t}:${l}`;
    const cached = await this.redis.get(key);
    if (cached) return cached;
    const data = await this.httpClient.get(`/graph/edges?type=${t}&limit=${l}`);
    await this.redis.set(key, data, GEO_TTL);
    return data;
  }

  @Get('stations/:id/neighbors')
  @ApiOperation({ summary: 'Get station neighbors' })
  getNeighbors(@Param('id') id: string) {
    return this.httpClient.get(`/graph/stations/${encodeURIComponent(id)}/neighbors`);
  }

  @Get('tm/troncales')
  @ApiOperation({ summary: 'Get TransMilenio trunk lines GeoJSON (Redis cached)' })
  async getTmTroncales() {
    const key = 'graph:tm:troncales';
    const cached = await this.redis.get(key);
    if (cached) return cached;
    const data = await this.httpClient.get('/graph/tm/troncales');
    await this.redis.set(key, data, GEO_TTL);
    return data;
  }

  @Get('tm/estaciones')
  @ApiOperation({ summary: 'Get TransMilenio stations GeoJSON (Redis cached)' })
  async getTmEstaciones() {
    const key = 'graph:tm:estaciones';
    const cached = await this.redis.get(key);
    if (cached) return cached;
    const data = await this.httpClient.get('/graph/tm/estaciones');
    await this.redis.set(key, data, GEO_TTL);
    return data;
  }
  @Get('sitp/paraderos')
  @ApiOperation({ summary: 'Get SITP bus stops GeoJSON' })
  async getSitpParaderos() {
    const data = loadGeoJson('sitp_paraderos.geojson');
    return data;
  }

  @Get('sitp/paraderos/nearby')
  @ApiOperation({ summary: 'Find SITP bus stops near a geographic point' })
  getSitpParaderosNearby(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius') radius?: string,
  ) {
    const targetLat = Number.parseFloat(lat);
    const targetLon = Number.parseFloat(lon);
    const r = radius ? Number.parseFloat(radius) : 500; // default 500 meters

    const paraderos = loadGeoJson('sitp_paraderos.geojson');
    const cercanos = [];

    for (const feat of paraderos.features) {
      if (!feat.geometry?.coordinates) continue;
      const pLon = feat.geometry.coordinates[0];
      const pLat = feat.geometry.coordinates[1];
      const dist = haversine(targetLat, targetLon, pLat, pLon);

      if (dist <= r) {
        cercanos.push({
          ...feat,
          properties: {
            ...feat.properties,
            distancia_metros: Math.round(dist),
          },
        });
      }
    }

    cercanos.sort((a, b) => a.properties.distancia_metros - b.properties.distancia_metros);

    return {
      type: 'FeatureCollection',
      features: cercanos.slice(0, 50),
    };
  }

  @Get('sitp/paraderos/:id')
  @ApiOperation({ summary: 'Get specific SITP bus stop details' })
  getSitpParadero(@Param('id') id: string) {
    const paraderos = loadGeoJson('sitp_paraderos.geojson');
    // En el geojson los IDs pueden ser de tipo string o number dependiendo del campo
    const targetId = String(id);
    const paradero = paraderos.features.find(
      (f: any) =>
        String(f.id) === targetId ||
        String(f.properties?.objectid) === targetId ||
        String(f.properties?.cenefa) === targetId,
    );

    if (!paradero) {
      return { error: 'Paradero no encontrado' };
    }
    return paradero;
  }

  @Get('sitp/rutas')
  @ApiOperation({ summary: 'Get SITP routes with ordered stops and frequencies' })
  async getSitpRutas() {
    const raw = loadGeoJson('sitp_rutas_paraderos.geojson');

    let frecuencias: Record<string, any> = {};
    try {
      frecuencias = loadGeoJson('sitp_rutas_frecuencias.json');
    } catch (e) {
      // Si el archivo no existe, no falla
    }

    const rutasMap: Record<
      string,
      {
        ruta: string;
        cenefa: string;
        frecuencia_base_min: number;
        tipo_servicio: string;
        paraderos: { lat: number; lon: number; nombre: string; orden: string }[];
      }
    > = {};
    for (const feat of raw.features) {
      const props = feat.properties;
      const geom = feat.geometry;
      if (!geom?.coordinates || !props?.ruta) continue;
      const ruta = props.ruta;
      if (!rutasMap[ruta]) {
        rutasMap[ruta] = {
          ruta,
          cenefa: props.cenefa || '',
          frecuencia_base_min: frecuencias[ruta]?.frecuencia_base_min || 15,
          tipo_servicio: frecuencias[ruta]?.tipo_servicio || 'Urbano',
          paraderos: [],
        };
      }
      rutasMap[ruta].paraderos.push({
        lat: geom.coordinates[1],
        lon: geom.coordinates[0],
        nombre: props.nombre || '',
        orden: props.orden || '',
      });
    }
    // Sort paraderos by orden within each ruta
    const rutas = Object.values(rutasMap).map((r) => {
      r.paraderos.sort((a, b) => a.orden.localeCompare(b.orden));
      return r;
    });
    return { total: rutas.length, rutas };
  }

  @Get('sitp/rutas/shapes')
  @ApiOperation({ summary: 'Get exact SITP routes shapes (LineStrings)' })
  async getSitpRutasShapes() {
    try {
      const data = loadGeoJson('sitp_rutas_shapes.geojson');
      return data;
    } catch (e) {
      return { error: 'Shapes file not found. Have you executed HT1 pipeline?' };
    }
  }

  @Get('tm/rutas')
  @ApiOperation({ summary: 'Get TransMilenio troncal routes (126 routes)' })
  async getTmRutas() {
    const rutas = JSON.parse(
      fs.readFileSync(path.join(DATA_DIR, 'tm_rutas_troncales.json'), 'utf-8'),
    );
    return { total: rutas.length, rutas };
  }

  @Get('accesibilidad')
  @ApiOperation({ summary: 'Get accessibility metrics from real data' })
  async getAccesibilidad() {
    // Load real data
    const paraderos = loadGeoJson('sitp_paraderos.geojson');
    const rutasData = loadGeoJson('sitp_rutas_paraderos.geojson');

    const totalParaderos = paraderos.features ? paraderos.features.length : 0;
    const totalRutas = new Set(
      rutasData.features.filter((f: any) => f.properties?.ruta).map((f: any) => f.properties.ruta),
    ).size;
    const totalPuntos = rutasData.features.length;
    const rutasTroncales = new Set(
      rutasData.features
        .filter((f: any) => f.properties?.ruta && /^[A-Z]/.test(f.properties.ruta))
        .map((f: any) => f.properties.ruta),
    ).size;
    const rutasZonales = totalRutas - rutasTroncales;

    // Calculate coverage based on lat/lon spread
    const lats = paraderos.features
      .filter((f: any) => f.geometry?.coordinates)
      .map((f: any) => f.geometry.coordinates[1]);
    const lons = paraderos.features
      .filter((f: any) => f.geometry?.coordinates)
      .map((f: any) => f.geometry.coordinates[0]);
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lonRange = Math.max(...lons) - Math.min(...lons);
    const areaCovered = latRange * lonRange * 111 * 111; // approx km2
    const bogotaArea = 1775; // km2
    const coveragePercent = Math.min(Math.round((areaCovered / bogotaArea) * 100), 95);

    return {
      totalParaderos,
      totalRutas,
      rutasTroncales,
      rutasZonales,
      totalPuntos,
      cobertura: coveragePercent,
      areaCubierta: Math.round(areaCovered),
      areaBogota: bogotaArea,
    };
  }

  @Get('rutas-cercanas')
  @ApiOperation({ summary: 'Find routes passing near a geographic point' })
  getRutasCercanas(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const targetLat = Number.parseFloat(lat);
    const targetLng = Number.parseFloat(lng);
    const r = radius ? Number.parseFloat(radius) : 800; // meters (default 800m)

    const raw = loadGeoJson('sitp_rutas_paraderos.geojson');

    // Haversine distance in meters

    // Find paraderos within radius and collect routes
    const rutasMap: Record<
      string,
      { ruta: string; cenefa: string; paraderosCercanos: { nombre: string; distancia: number }[] }
    > = {};

    for (const feat of raw.features) {
      const props = feat.properties;
      const geom = feat.geometry;
      if (!geom?.coordinates || !props?.ruta) continue;
      const pLat = geom.coordinates[1];
      const pLng = geom.coordinates[0];
      const dist = haversine(targetLat, targetLng, pLat, pLng);
      if (dist <= r) {
        const ruta = props.ruta;
        if (!rutasMap[ruta]) {
          rutasMap[ruta] = { ruta, cenefa: props.cenefa || ruta, paraderosCercanos: [] };
        }
        rutasMap[ruta].paraderosCercanos.push({
          nombre: props.nombre || '',
          distancia: Math.round(dist),
        });
      }
    }

    // Sort paraderos by distance within each ruta, and sort rutas by min distance
    const rutas = Object.values(rutasMap).map((r) => {
      r.paraderosCercanos.sort((a, b) => a.distancia - b.distancia);
      return { ...r, distanciaMinima: r.paraderosCercanos[0]?.distancia || 9999 };
    });
    rutas.sort((a, b) => a.distanciaMinima - b.distanciaMinima);

    return { total: rutas.length, radio: r, rutas: rutas.slice(0, 20) };
  }

  @Get('siniestralidad')
  @ApiOperation({ summary: 'Siniestralidad por localidad con scores de seguridad' })
  getSiniestralidad() {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'siniestralidad.json'), 'utf-8'));
    return {
      total_siniestros: data.total_siniestros,
      por_localidad: data.por_localidad,
      metadata: data.metadata,
    };
  }

  @Get('siniestralidad/heatmap')
  @ApiOperation({ summary: 'Puntos georreferenciados para heatmap de siniestros' })
  getSiniestrosHeatmap() {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'siniestralidad.json'), 'utf-8'));
    return data.heatmap_points;
  }

  @Get('siniestralidad/localidad/:localidad')
  @ApiOperation({ summary: 'Siniestralidad de una localidad específica' })
  getSiniestrosByLocalidad(@Param('localidad') localidad: string) {
    const data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'siniestralidad.json'), 'utf-8'));
    const loc = data.por_localidad[localidad];
    if (!loc)
      return { error: 'Localidad no encontrada', disponibles: Object.keys(data.por_localidad) };
    return { localidad, ...loc };
  }
}
