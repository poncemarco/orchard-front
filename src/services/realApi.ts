import type {
  GardenZone,
  ApiResponse,
  TimeRange,
} from '../data/types';

// URL base del backend Go. Configurable via variable de entorno en Astro.
const BASE_URL = (import.meta.env.PUBLIC_API_URL as string | undefined) ?? 'http://localhost:8080/api/v1';

// ─── Mappers ────────────────────────────────────────────────────────────────
// El backend usa camelCase con nombres ligeramente distintos (zonId, etc.).
// Estos mappers convierten la respuesta del backend al contrato de types.ts.

function mapZone(raw: any): GardenZone {
  return {
    id:              raw.id,
    name:            raw.name,
    description:     raw.description ?? '',
    plantCount:      0, // Etapa 2: vendrá del backend cuando existan plantas
    averageTemp:     raw.latestReading?.temperatureC   ?? 0,
    averageMoisture: raw.latestReading?.soilMoisturePct ?? 0,
  };
}

// ─── API real ────────────────────────────────────────────────────────────────

export const realApi = {
  /**
   * Obtiene todas las zonas con su última lectura de sensor.
   */
  async getZones(): Promise<ApiResponse<GardenZone[]>> {
    const res = await fetch(`${BASE_URL}/zones`);
    if (!res.ok) throw new Error(`GET /zones → ${res.status}`);
    const json = await res.json();
    return {
      success: json.success,
      data:    (json.data as any[]).map(mapZone),
      meta: {
        total:               json.meta?.total ?? json.data?.length ?? 0,
        timestamp:           json.meta?.timestamp ?? new Date().toISOString(),
        version:             json.meta?.version ?? 'v1',
        simulatedLatencyMs:  0,
      },
    };
  },

  /**
   * Obtiene la serie temporal de lecturas de una zona.
   * Retorna en el formato TelemetryHistory esperado por TelemetryChart.
   */
  async getReadings(zoneId: string, range: TimeRange = '24h') {
    const res = await fetch(`${BASE_URL}/zones/${zoneId}/readings?range=${range}`);
    if (!res.ok) throw new Error(`GET /zones/${zoneId}/readings → ${res.status}`);
    const json = await res.json();
    const data = json.data;

    // Mapear al formato TelemetryPoint que usa el frontend
    const points = (data?.points ?? []).map((p: any) => ({
      timestamp:        p.recordedAt,
      soilMoisture:     p.soilMoisturePct  ?? 0,
      temperature:      p.temperatureC     ?? 0,
      lightLux:         p.lightLux         ?? 0,
      humidity:         p.humidityPct      ?? 0,
      soilTemperature:  p.soilTemperatureC ?? undefined,
    }));

    return {
      success: json.success,
      data: {
        plantId:    zoneId,  // El dashboard usa plantId; en Etapa 1 es el zoneId
        timeRange:  data?.timeRange ?? range,
        resolution: data?.resolution ?? '1h',
        points,
      },
      meta: {
        timestamp:          json.meta?.timestamp ?? new Date().toISOString(),
        version:            json.meta?.version   ?? 'v1',
        simulatedLatencyMs: 0,
      },
    };
  },
};

