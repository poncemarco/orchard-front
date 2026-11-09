import type { 
  PlantProfile, 
  PlantTelemetryHistory, 
  PlantAlert, 
  GardenZone, 
  ApiResponse, 
  TimeRange 
} from '../data/types';

import rawPlants from '../data/mocks/plants.json';
import rawTelemetry from '../data/mocks/telemetry.json';
import rawAlerts from '../data/mocks/alerts.json';
import rawZones from '../data/mocks/zones.json';

// In-memory mutable state to simulate stateful backend persistence
let plantsState: PlantProfile[] = JSON.parse(JSON.stringify(rawPlants));
let telemetryState: Record<string, PlantTelemetryHistory> = JSON.parse(JSON.stringify(rawTelemetry));
let alertsState: PlantAlert[] = JSON.parse(JSON.stringify(rawAlerts));
const zonesState: GardenZone[] = JSON.parse(JSON.stringify(rawZones));

const SIMULATED_LATENCY_MS = 180;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const mockApi = {
  /**
   * Obtiene la lista de todas las plantas con sus lecturas más recientes
   */
  async getPlants(): Promise<ApiResponse<PlantProfile[]>> {
    await delay(SIMULATED_LATENCY_MS);
    return {
      success: true,
      data: [...plantsState],
      meta: {
        total: plantsState.length,
        timestamp: new Date().toISOString(),
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: SIMULATED_LATENCY_MS,
      },
    };
  },

  /**
   * Obtiene una planta individual por ID
   */
  async getPlantById(id: string): Promise<ApiResponse<PlantProfile | null>> {
    await delay(SIMULATED_LATENCY_MS);
    const plant = plantsState.find((p) => p.id === id) || null;
    return {
      success: !!plant,
      data: plant,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: SIMULATED_LATENCY_MS,
      },
    };
  },

  /**
   * Obtiene la serie temporal de telemetría (24h, 7d, 30d) para una planta
   */
  async getTelemetry(plantId: string, range: TimeRange = '24h'): Promise<ApiResponse<PlantTelemetryHistory | null>> {
    await delay(SIMULATED_LATENCY_MS);
    let hist = telemetryState[plantId];

    if (!hist) {
      // Fallback si no existe historial previo
      hist = {
        plantId,
        timeRange: range,
        resolution: '1h',
        points: [],
      };
    }

    return {
      success: true,
      data: {
        ...hist,
        timeRange: range,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: SIMULATED_LATENCY_MS,
      },
    };
  },

  /**
   * Obtiene alertas y eventos de la huerta
   */
  async getAlerts(): Promise<ApiResponse<PlantAlert[]>> {
    await delay(SIMULATED_LATENCY_MS / 2);
    return {
      success: true,
      data: [...alertsState],
      meta: {
        total: alertsState.length,
        timestamp: new Date().toISOString(),
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: SIMULATED_LATENCY_MS / 2,
      },
    };
  },

  /**
   * Obtiene las zonas de cultivo
   */
  async getZones(): Promise<ApiResponse<GardenZone[]>> {
    await delay(SIMULATED_LATENCY_MS / 2);
    return {
      success: true,
      data: [...zonesState],
      meta: {
        total: zonesState.length,
        timestamp: new Date().toISOString(),
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: SIMULATED_LATENCY_MS / 2,
      },
    };
  },

  /**
   * Marca una alerta como reconocida
   */
  async acknowledgeAlert(alertId: string): Promise<ApiResponse<PlantAlert | null>> {
    await delay(SIMULATED_LATENCY_MS);
    const alert = alertsState.find((a) => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
    return {
      success: !!alert,
      data: alert || null,
      meta: {
        timestamp: new Date().toISOString(),
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: SIMULATED_LATENCY_MS,
      },
    };
  },

  /**
   * Simula la acción de riego de una planta:
   * - Incrementa la humedad del suelo
   * - Restaura la salud a óptima
   * - Agrega punto de telemetría reciente
   * - Resuelve alertas de humedad para esa planta
   */
  async waterPlant(
    plantId: string, 
    amountMl: number = 350, 
    notes: string = 'Riego manual ejecutado desde el Dashboard'
  ): Promise<ApiResponse<PlantProfile>> {
    await delay(450); // Simula el handshake con el microcontrolador o webhook

    const plantIndex = plantsState.findIndex((p) => p.id === plantId);
    if (plantIndex === -1) {
      throw new Error(`Planta ${plantId} no encontrada`);
    }

    const plant = plantsState[plantIndex];
    const prevMoisture = plant.currentReadings.soilMoisture;
    
    // Calcular nueva humedad post-riego respetando la capacidad de campo
    const targetMoisture = Math.min(
      Math.max(plant.thresholds.soilMoisture.optimal + 5, prevMoisture + Math.min(amountMl / 10, 35)),
      88
    );

    const nowIso = new Date().toISOString();

    // Actualizar planta
    plant.currentReadings.soilMoisture = Number(targetMoisture.toFixed(1));
    plant.currentReadings.lastReadingAt = nowIso;
    plant.lastWatered = {
      timestamp: nowIso,
      amountMl,
      method: 'Manual',
    };
    plant.health = {
      status: 'optimal',
      score: 98,
      summary: `Riego reciente de ${amountMl}ml aplicado exitosamente. Hidratación del sustrato al 100% de la capacidad de campo.`,
    };

    // Actualizar historial de telemetría agregando el pico de riego
    if (!telemetryState[plantId]) {
      telemetryState[plantId] = {
        plantId,
        timeRange: '24h',
        resolution: '1h',
        points: [],
      };
    }

    const currentPoints = telemetryState[plantId].points;
    currentPoints.push({
      timestamp: nowIso,
      soilMoisture: plant.currentReadings.soilMoisture,
      temperature: plant.currentReadings.temperature,
      lightLux: plant.currentReadings.lightLux,
      humidity: plant.currentReadings.humidity,
      soilTemperature: plant.currentReadings.soilTemperature,
    });

    // Auto-reconocer o resolver alertas de humedad para esta planta
    alertsState = alertsState.map((alert) => {
      if (alert.plantId === plantId && alert.metric === 'moisture') {
        return { ...alert, acknowledged: true };
      }
      return alert;
    });

    return {
      success: true,
      data: { ...plant },
      meta: {
        timestamp: nowIso,
        version: 'v1.4.2-mock-iot',
        simulatedLatencyMs: 450,
      },
    };
  },

  /**
   * Suscribe un listener a fluctuaciones realistas en vivo (simulando sensor MQTT/WebSocket)
   */
  subscribeLiveTelemetry(onTick: (updatedPlants: PlantProfile[]) => void): () => void {
    const interval = setInterval(() => {
      plantsState = plantsState.map((plant) => {
        // Pequeñas fluctuaciones naturales:
        // Temperatura varía +/- 0.1 °C
        const tempDelta = (Math.random() - 0.5) * 0.2;
        const newTemp = Number((plant.currentReadings.temperature + tempDelta).toFixed(1));

        // Luz varía levemente según simulación
        const luxDelta = Math.floor((Math.random() - 0.5) * 120);
        const newLux = Math.max(0, plant.currentReadings.lightLux + luxDelta);

        // Humedad cae muy lentamente por transpiración (0.02% por tick)
        const moistureDelta = -(Math.random() * 0.04);
        const newMoisture = Number(
          Math.max(12, plant.currentReadings.soilMoisture + moistureDelta).toFixed(1)
        );

        return {
          ...plant,
          currentReadings: {
            ...plant.currentReadings,
            temperature: newTemp,
            lightLux: newLux,
            soilMoisture: newMoisture,
            lastReadingAt: new Date().toISOString(),
          },
        };
      });

      onTick([...plantsState]);
    }, 4000);

    return () => clearInterval(interval);
  },
};
