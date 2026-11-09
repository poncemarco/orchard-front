export type HealthStatus = 'optimal' | 'warning' | 'critical' | 'dormant';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type MetricType = 'temperature' | 'light' | 'moisture' | 'humidity';
export type TimeRange = '24h' | '7d' | '30d';

export interface ThresholdRange {
  min: number;
  max: number;
  optimal: number;
  unit: string;
}

export interface SensorDevice {
  id: string;
  name: string;
  type: string; // e.g., 'ESP32-SHT31-CapacitiveV2'
  battery: number; // percentage 0-100
  batteryVoltage: number; // e.g., 3.85V
  signalRssi: number; // dBm e.g., -64
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  lastSync: string;
  status: 'online' | 'degraded' | 'offline';
}

export interface PlantProfile {
  id: string;
  commonName: string;
  scientificName: string;
  zone: string;
  category: 'Interior' | 'Hortaliza' | 'Aromática' | 'Suculenta' | 'Frutal';
  photoUrl: string;
  description: string;
  sensorDevice: SensorDevice;
  thresholds: {
    soilMoisture: ThresholdRange;
    temperature: ThresholdRange;
    lightLux: ThresholdRange;
    humidity: ThresholdRange;
  };
  currentReadings: {
    soilMoisture: number; // percentage
    temperature: number; // Celsius
    lightLux: number; // lux
    humidity: number; // % relative humidity
    soilTemperature: number; // Celsius
    vpd: number; // kPa (Vapor Pressure Deficit)
    lastReadingAt: string;
  };
  health: {
    status: HealthStatus;
    score: number; // 0-100
    summary: string;
  };
  lastWatered: {
    timestamp: string;
    amountMl: number;
    method: 'Manual' | 'Riego por goteo automatizado' | 'Inmersión';
  };
  nextRecommendedWatering: string;
}

export interface TelemetryPoint {
  timestamp: string;
  soilMoisture: number;
  temperature: number;
  lightLux: number;
  humidity: number;
  soilTemperature?: number;
}

export interface PlantTelemetryHistory {
  plantId: string;
  timeRange: TimeRange;
  resolution: string; // e.g. '1h' or '10m'
  points: TelemetryPoint[];
}

export interface PlantAlert {
  id: string;
  plantId: string;
  plantName: string;
  severity: AlertSeverity;
  metric: MetricType;
  title: string;
  message: string;
  currentValue: number;
  thresholdValue: number;
  unit: string;
  timestamp: string;
  acknowledged: boolean;
}

export interface WateringEvent {
  id: string;
  plantId: string;
  timestamp: string;
  amountMl: number;
  technique: string;
  notes: string;
  soilMoistureBefore: number;
  soilMoistureAfter: number;
}

export interface GardenZone {
  id: string;
  name: string;
  description: string;
  plantCount: number;
  averageTemp: number;
  averageMoisture: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    total?: number;
    timestamp: string;
    version: string;
    simulatedLatencyMs: number;
  };
}
