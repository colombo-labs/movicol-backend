import { Public } from '../auth/decorators/public.decorator';
import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Feature, FeatureCollection, Point } from 'geojson';

import { ArcGisService } from '../../common/services/arcgis.service';
import { HttpClientService } from '../../common/services/http-client.service';
import { RedisService } from '../../common/services/redis.service';

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

const GEO_TTL = 600; // 10 min for AI-proxied data

@ApiTags('Graph')
@Public()
@Controller('graph')
export class GraphController {
  constructor(
    private readonly httpClient: HttpClientService,
    private readonly redis: RedisService,
    private readonly arcgis: ArcGisService,
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
    await this.redis.set(key, data, 60);
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

  // ─── TransMilenio — from ArcGIS REST API ──────────────────────────

  @Get('tm/troncales')
  @ApiOperation({ summary: 'Get TransMilenio trunk lines GeoJSON (ArcGIS → Redis cached 24h)' })
  async getTmTroncales() {
    return this.arcgis.getTmTroncales();
  }

  @Get('tm/estaciones')
  @ApiOperation({ summary: 'Get TransMilenio stations GeoJSON (ArcGIS → Redis cached 24h)' })
  async getTmEstaciones() {
    return this.arcgis.getTmEstaciones();
  }

  @Get('tm/rutas')
  @ApiOperation({ summary: 'Get TransMilenio troncal routes (ArcGIS → Redis cached 24h)' })
  async getTmRutas() {
    const tipoBusMap: Record<number, string> = { 1: 'BIARTICULADO', 2: 'ARTICULADO', 3: 'DUAL', 4: 'PADRON' };
    const geo = await this.arcgis.getTmRutas();
    const rutas = geo.features.map((f: any) => {
      const p = f.properties ?? {};
      const coords = f.geometry?.coordinates?.map((c: number[]) => [c[1], c[0]]) ?? [];
      return {
        codigo: p.route_name || '',
        nombre: p.nombre_rut || p.route_name || '',
        origen: p.origen_rut || '',
        destino: p.destino_ru || '',
        tipo_bus: tipoBusMap[p.tipo_bus_r] || 'DUAL',
        tipo_ruta: p.tipo_opera || 'Normal',
        horario_lv: p.horario_lu || '',
        horario_sab: p.horario_sa?.trim() || '',
        horario_dom: p.horario_do || '',
        estado: p.estado_rut || 'OPERATIVA',
        coords,
        estaciones: [],
      };
    });
    return { total: rutas.length, rutas };
  }

  // ─── SITP — from ArcGIS REST API ─────────────────────────────────

  @Get('sitp/paraderos')
  @ApiOperation({ summary: 'Get SITP bus stops GeoJSON (ArcGIS → Redis cached 24h)' })
  async getSitpParaderos() {
    return this.arcgis.getSitpParaderos();
  }

  @Get('sitp/paraderos/nearby')
  @ApiOperation({ summary: 'Find SITP bus stops near a geographic point' })
  async getSitpParaderosNearby(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('radius') radius?: string,
  ) {
    const targetLat = Number.parseFloat(lat);
    const targetLon = Number.parseFloat(lon);
    const r = radius ? Number.parseFloat(radius) : 500;

    const paraderos = await this.arcgis.getSitpParaderos();
    const cercanos: Feature[] = [];

    for (const feat of paraderos.features) {
      if (!feat.geometry || feat.geometry.type !== 'Point') continue;
      const [pLon, pLat] = (feat.geometry as Point).coordinates;
      const dist = haversine(targetLat, targetLon, pLat, pLon);

      if (dist <= r) {
        cercanos.push({
          ...feat,
          properties: { ...feat.properties, distancia_metros: Math.round(dist) },
        });
      }
    }

    cercanos.sort(
      (a, b) => (a.properties?.distancia_metros ?? 0) - (b.properties?.distancia_metros ?? 0),
    );
    return { type: 'FeatureCollection', features: cercanos.slice(0, 50) };
  }

  @Get('sitp/paraderos/:id')
  @ApiOperation({ summary: 'Get specific SITP bus stop details' })
  async getSitpParadero(@Param('id') id: string) {
    const paraderos = await this.arcgis.getSitpParaderos();
    const targetId = String(id);
    const paradero = paraderos.features.find(
      (f: Feature) =>
        String(f.id) === targetId ||
        String(f.properties?.OBJECTID) === targetId ||
        String(f.properties?.NTRCODIGO) === targetId,
    );
    if (!paradero) return { error: 'Paradero no encontrado' };
    return paradero;
  }

  @Get('sitp/rutas')
  @ApiOperation({ summary: 'Get SITP routes with ordered stops (ArcGIS → Redis cached 24h)' })
  async getSitpRutas() {
    const [records, colorMap] = await Promise.all([
      this.arcgis.getParaderosRuta(),
      this.arcgis.getRutaColorMap(),
    ]);
    const tipoToColor: Record<string, string> = {
      URBANA: '1565C0',
      ALIMENTADORA: '2E7D32',
      COMPLEMENTARIA: 'E65100',
      ESPECIAL: '6A1B9A',
    };
    const rutasMap: Record<string, { ruta: string; cenefa: string; tipo: string; paraderos: { lat: number; lon: number; nombre: string }[] }> = {};
    for (const r of records) {
      if (!r.RUTA) continue;
      const ruta = r.RUTA;
      if (!rutasMap[ruta]) {
        // Match exact route_name first (includes suffix a/c/e), fallback to URBANA
        const tipo = colorMap[ruta] || 'URBANA';
        rutasMap[ruta] = { ruta, cenefa: tipoToColor[tipo] || '1565C0', tipo, paraderos: [] };
      }
      const lat = parseFloat(String(r.Latitud).replace(',', '.'));
      const lon = parseFloat(String(r.Longitud).replace(',', '.'));
      if (!isNaN(lat) && !isNaN(lon)) {
        rutasMap[ruta].paraderos.push({ lat, lon, nombre: r.NOMBRE || '' });
      }
    }
    const rutas = Object.values(rutasMap);
    return { total: rutas.length, rutas };
  }

  @Get('sitp/rutas/shapes')
  @ApiOperation({ summary: 'Get SITP routes as GeoJSON LineStrings (ArcGIS)' })
  async getSitpRutasShapes() {
    return this.arcgis.getSitpRutas();
  }

  // ─── Computed endpoints ───────────────────────────────────────────

  @Get('accesibilidad')
  @ApiOperation({ summary: 'Get accessibility metrics from ArcGIS data' })
  async getAccesibilidad() {
    const paraderos = await this.arcgis.getSitpParaderos();
    const records = await this.arcgis.getParaderosRuta();

    const totalParaderos = paraderos.features.length;
    const totalRutas = new Set(records.map((r: any) => r.RUTA).filter(Boolean)).size;
    const totalPuntos = records.length;

    const lats: number[] = [];
    const lons: number[] = [];
    for (const f of paraderos.features) {
      if (f.geometry?.type === 'Point') {
        const [lon, lat] = (f.geometry as Point).coordinates;
        lats.push(lat);
        lons.push(lon);
      }
    }
    const latRange = Math.max(...lats) - Math.min(...lats);
    const lonRange = Math.max(...lons) - Math.min(...lons);
    const areaCovered = latRange * lonRange * 111 * 111;
    const bogotaArea = 1775;
    const coveragePercent = Math.min(Math.round((areaCovered / bogotaArea) * 100), 95);

    const rutasTroncales = new Set(
      records.filter((r: any) => r.RUTA && /^[A-Z]/.test(r.RUTA)).map((r: any) => r.RUTA),
    ).size;
    const rutasZonales = totalRutas - rutasTroncales;

    return {
      totalParaderos,
      totalRutas,
      rutasTroncales,
      rutasZonales,
      totalPuntos,
      cobertura: coveragePercent,
      areaCubierta: Math.round(areaCovered),
      areaBogota: bogotaArea,
      fuente: 'ArcGIS FeatureServer — datos.gov.co',
    };
  }

  @Get('rutas-cercanas')
  @ApiOperation({ summary: 'Find SITP routes passing near a geographic point' })
  async getRutasCercanas(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('radius') radius?: string,
  ) {
    const targetLat = Number.parseFloat(lat);
    const targetLng = Number.parseFloat(lng);
    const r = radius ? Number.parseFloat(radius) : 800;

    const records = await this.arcgis.getParaderosRuta();
    const rutasMap: Record<string, { ruta: string; cenefa: string; paraderosCercanos: { nombre: string; distancia: number }[] }> = {};

    for (const rec of records) {
      if (!rec.RUTA) continue;
      const pLat = parseFloat(String(rec.Latitud).replace(',', '.'));
      const pLng = parseFloat(String(rec.Longitud).replace(',', '.'));
      if (isNaN(pLat) || isNaN(pLng)) continue;
      const dist = haversine(targetLat, targetLng, pLat, pLng);
      if (dist <= r) {
        const ruta = rec.RUTA;
        if (!rutasMap[ruta]) {
          rutasMap[ruta] = { ruta, cenefa: rec.CENEFA || ruta, paraderosCercanos: [] };
        }
        rutasMap[ruta].paraderosCercanos.push({ nombre: rec.NOMBRE || '', distancia: Math.round(dist) });
      }
    }

    const rutas = Object.values(rutasMap).map((rt) => {
      rt.paraderosCercanos.sort((a, b) => a.distancia - b.distancia);
      return { ...rt, distanciaMinima: rt.paraderosCercanos[0]?.distancia || 9999 };
    });
    rutas.sort((a, b) => a.distanciaMinima - b.distanciaMinima);

    return { total: rutas.length, radio: r, rutas: rutas.slice(0, 20) };
  }

  @Get('carril-preferencial')
  @ApiOperation({ summary: 'Carriles preferenciales SITP (ArcGIS → Redis cached 24h)' })
  async getCarrilPreferencial() {
    return this.arcgis.getCarrilPreferencial();
  }

  @Get('siniestralidad')
  @ApiOperation({ summary: 'Siniestralidad por localidad (ArcGIS → Redis cached 24h)' })
  async getSiniestralidad() {
    const localidades = await this.arcgis.getSiniestrosPorLocalidad();
    const porLocalidad: Record<string, any> = {};
    let total = 0;
    for (const f of localidades.features) {
      const nombre = f.properties?.LocNombre || f.properties?.Localidad || '';
      const count = f.properties?.COUNT_FORMULARIO || f.properties?.FREQUENCY_1 || 0;
      porLocalidad[nombre] = { siniestros: count };
      total += count;
    }
    return { total_siniestros: total, por_localidad: porLocalidad, fuente: 'ArcGIS FeatureServer — SDM Bogotá' };
  }

  @Get('siniestralidad/heatmap')
  @ApiOperation({ summary: 'Puntos georreferenciados para heatmap de siniestros 2024' })
  async getSiniestrosHeatmap() {
    const geo = await this.arcgis.getSiniestros2024();
    const points = geo.features
      .filter((f: any) => f.geometry?.type === 'Point')
      .map((f: any) => ({
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        gravedad: f.properties?.GRAVEDAD30D || '',
        clase: f.properties?.CLASE_ACC || '',
        localidad: f.properties?.LOCALIDAD || '',
      }));
    return points;
  }

  @Get('siniestralidad/localidad/:localidad')
  @ApiOperation({ summary: 'Siniestros 2024 filtrados por localidad' })
  async getSiniestrosByLocalidad(@Param('localidad') localidad: string) {
    const geo = await this.arcgis.getSiniestros2024();
    const filtered = geo.features.filter(
      (f: any) => f.properties?.LOCALIDAD?.toLowerCase() === localidad.toLowerCase()
    );
    if (!filtered.length) {
      const disponibles = [...new Set(geo.features.map((f: any) => f.properties?.LOCALIDAD).filter(Boolean))];
      return { error: 'Localidad no encontrada', disponibles };
    }
    return {
      localidad,
      total: filtered.length,
      siniestros: filtered.slice(0, 100).map((f: any) => ({
        lat: f.geometry?.coordinates?.[1],
        lng: f.geometry?.coordinates?.[0],
        fecha: f.properties?.MES_OCURRENCIA_ACC,
        dia: f.properties?.DIA_OCURRENCIA_ACC,
        hora: f.properties?.HORA_OCURRENCIA_ACC,
        clase: f.properties?.CLASE_ACC,
        gravedad: f.properties?.GRAVEDAD30D,
        direccion: f.properties?.DIRECCION,
      })),
    };
  }
}
