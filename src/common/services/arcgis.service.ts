import { Injectable, Logger } from '@nestjs/common';
import type { Feature, FeatureCollection } from 'geojson';

import { RedisService } from './redis.service';

/** ArcGIS FeatureServer base URL for Bogotá transport data */
const ARCGIS_BASE = 'https://services2.arcgis.com/NEwhEo9GGSHXcRXV/arcgis/rest/services';

/** Dataset endpoints */
const DATASETS = {
  sitpParaderos: `${ARCGIS_BASE}/Paraderos_SITP_Bogot%C3%A1_D_C/FeatureServer/0`,
  sitpRutas: `${ARCGIS_BASE}/Rutas_SITP/FeatureServer/0`,
  tmEstaciones: `${ARCGIS_BASE}/Estaciones_y_trazados_de_Transmilenio_WFL1/FeatureServer/0`,
  tmTroncales: `${ARCGIS_BASE}/Trazados_Troncales_de_TRANSMILENIO/FeatureServer/0`,
  tmRutas: `${ARCGIS_BASE}/Estaciones_y_trazados_de_Transmilenio_WFL1/FeatureServer/2`,
  carrilPreferencial: `${ARCGIS_BASE}/Carril_Preferencial_SITP_Bogota_D_C/FeatureServer/0`,
  siniestros2024: `${ARCGIS_BASE}/Siniestros_graves_2024/FeatureServer/0`,
  siniestrosPorLocalidad: `${ARCGIS_BASE}/Siniestros_Fallecidos_por_Localidad/FeatureServer/0`,
  paraderosRuta: `${ARCGIS_BASE}/Paraderos_Ruta/FeatureServer/0`,
  rutasZonalesSitp: `${ARCGIS_BASE}/Rutas_zonales_SITP/FeatureServer/0`,
} as const;

/** 24h TTL — this data barely changes */
const CACHE_TTL = 86400;

@Injectable()
export class ArcGisService {
  private readonly logger = new Logger(ArcGisService.name);

  constructor(private readonly redis: RedisService) {}

  /** Fetch all features from an ArcGIS FeatureServer (handles pagination) */
  private async fetchAll(endpoint: string): Promise<FeatureCollection> {
    const features: Feature[] = [];
    let offset = 0;
    const batchSize = 2000;

    while (true) {
      const url = `${endpoint}/query?where=1=1&outFields=*&f=geojson&resultRecordCount=${batchSize}&resultOffset=${offset}`;
      const res = await fetch(url);
      if (!res.ok) {
        this.logger.error(`ArcGIS fetch failed: ${res.status} ${res.statusText}`);
        break;
      }
      const data = await res.json();
      const batch = data.features ?? [];
      features.push(...batch);

      if (!data.properties?.exceededTransferLimit || batch.length < batchSize) break;
      offset += batchSize;
    }

    return { type: 'FeatureCollection', features };
  }

  /** Generic cached fetch */
  private async getCached(key: string, endpoint: string): Promise<FeatureCollection> {
    const cached = await this.redis.get(key);
    if (cached) return cached as FeatureCollection;

    this.logger.log(`Cache miss for ${key}, fetching from ArcGIS...`);
    const data = await this.fetchAll(endpoint);
    await this.redis.set(key, data, CACHE_TTL);
    return data;
  }

  /** SITP bus stops (7,694 points) */
  async getSitpParaderos(): Promise<FeatureCollection> {
    return this.getCached('arcgis:sitp:paraderos', DATASETS.sitpParaderos);
  }

  /** SITP routes with shapes (700 LineStrings) */
  async getSitpRutas(): Promise<FeatureCollection> {
    return this.getCached('arcgis:sitp:rutas', DATASETS.sitpRutas);
  }

  /** TransMilenio stations (154 points) */
  async getTmEstaciones(): Promise<FeatureCollection> {
    return this.getCached('arcgis:tm:estaciones', DATASETS.tmEstaciones);
  }

  /** TransMilenio trunk line trazados (20 LineStrings) */
  async getTmTroncales(): Promise<FeatureCollection> {
    return this.getCached('arcgis:tm:troncales', DATASETS.tmTroncales);
  }

  /** TransMilenio routes with schedules and bus types (155 routes) */
  async getTmRutas(): Promise<FeatureCollection> {
    return this.getCached('arcgis:tm:rutas', DATASETS.tmRutas);
  }

  /** Carriles preferenciales SITP (8 LineStrings) */
  async getCarrilPreferencial(): Promise<FeatureCollection> {
    return this.getCached('arcgis:carril:preferencial', DATASETS.carrilPreferencial);
  }

  /** Siniestros graves 2024 Bogotá (12,908 points) */
  async getSiniestros2024(): Promise<FeatureCollection> {
    return this.getCached('arcgis:siniestros:2024', DATASETS.siniestros2024);
  }

  /** Siniestros fallecidos por localidad (Polygons) */
  async getSiniestrosPorLocalidad(): Promise<FeatureCollection> {
    return this.getCached('arcgis:siniestros:localidad', DATASETS.siniestrosPorLocalidad);
  }

  /** Paraderos asociados a rutas SITP (41,038 records — tabla, sin geometría) */
  async getParaderosRuta(): Promise<any[]> {
    const cached = await this.redis.get('arcgis:paraderos:ruta');
    if (cached) return cached as any[];

    this.logger.log('Cache miss for arcgis:paraderos:ruta, fetching from ArcGIS...');
    const records: any[] = [];
    let offset = 0;
    const batchSize = 2000;
    const endpoint = DATASETS.paraderosRuta;

    while (true) {
      const url = `${endpoint}/query?where=1=1&outFields=*&f=json&resultRecordCount=${batchSize}&resultOffset=${offset}`;
      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const batch = data.features?.map((f: any) => f.attributes) ?? [];
      records.push(...batch);
      if (!data.exceededTransferLimit || batch.length < batchSize) break;
      offset += batchSize;
    }

    await this.redis.set('arcgis:paraderos:ruta', records, CACHE_TTL);
    return records;
  }

  /** Color map: route_name/codigo_def → desc_tipo_ (URBANA, ALIMENTADORA, COMPLEMENTARIA, ESPECIAL) */
  async getRutaColorMap(): Promise<Record<string, string>> {
    const cached = await this.redis.get('arcgis:sitp:color-map');
    if (cached) return cached as Record<string, string>;

    this.logger.log('Cache miss for arcgis:sitp:color-map, fetching...');
    const colorMap: Record<string, string> = {};
    const geo = await this.getCached('arcgis:sitp:rutas-zonales', DATASETS.rutasZonalesSitp);
    for (const f of geo.features) {
      const name = f.properties?.route_name || '';
      const tipo = (f.properties?.desc_tipo_ || '').trim();
      if (name && tipo) colorMap[name] = tipo;
    }
    await this.redis.set('arcgis:sitp:color-map', colorMap, CACHE_TTL);
    return colorMap;
  }
}
