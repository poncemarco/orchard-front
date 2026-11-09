import React from 'react';
import { Droplets, Thermometer, Sun, Gauge, Sparkles } from 'lucide-react';
import type { PlantProfile } from '../../data/types';

interface MetricHeroCardsProps {
  plant: PlantProfile;
}

export const MetricHeroCards: React.FC<MetricHeroCardsProps> = ({ plant }) => {
  const { currentReadings, thresholds, lastWatered } = plant;

  // Calculo de porcentaje de la aguja respecto al rango del medidor
  const calculateNeedlePos = (val: number, min: number, max: number) => {
    const range = max - min;
    const padding = range * 0.25;
    const gaugeMin = Math.max(0, min - padding);
    const gaugeMax = max + padding;
    const clamped = Math.min(gaugeMax, Math.max(gaugeMin, val));
    return ((clamped - gaugeMin) / (gaugeMax - gaugeMin)) * 100;
  };

  const moistureNeedle = calculateNeedlePos(
    currentReadings.soilMoisture,
    thresholds.soilMoisture.min,
    thresholds.soilMoisture.max
  );

  const tempNeedle = calculateNeedlePos(
    currentReadings.temperature,
    thresholds.temperature.min,
    thresholds.temperature.max
  );

  const lightNeedle = calculateNeedlePos(
    currentReadings.lightLux,
    thresholds.lightLux.min,
    thresholds.lightLux.max
  );

  return (
    <div className="metrics-hero-grid">
      {/* 1. HUMEDAD DE TIERRA */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <div className="metric-card-title">
            <div className="metric-icon-wrap moisture">
              <Droplets size={20} />
            </div>
            <div>
              <span>Humedad de Tierra</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sensor Capacitivo v1.2</p>
            </div>
          </div>
          <span
            className={`plant-status-badge ${
              currentReadings.soilMoisture < thresholds.soilMoisture.min
                ? 'critical'
                : currentReadings.soilMoisture > thresholds.soilMoisture.max
                ? 'warning'
                : 'optimal'
            }`}
          >
            {currentReadings.soilMoisture < thresholds.soilMoisture.min
              ? 'Sustrato Seco'
              : currentReadings.soilMoisture > thresholds.soilMoisture.max
              ? 'Exceso de Agua'
              : 'Nivel Ideal'}
          </span>
        </div>

        <div className="metric-value-row">
          <span className="metric-huge-value">{currentReadings.soilMoisture}</span>
          <span className="metric-unit">%</span>
        </div>

        <div className="metric-subtext">
          <Sparkles size={13} color="var(--moisture-cyan)" />
          <span>
            Óptimo: <strong>{thresholds.soilMoisture.optimal}%</strong> (Mín {thresholds.soilMoisture.min}% - Máx{' '}
            {thresholds.soilMoisture.max}%)
          </span>
        </div>

        {/* Gauge horizontal con aguja */}
        <div className="threshold-gauge-container">
          <div className="threshold-labels">
            <span>Seco</span>
            <span style={{ color: 'var(--emerald-light)' }}>Rango Saludable</span>
            <span>Saturado</span>
          </div>
          <div className="gauge-track">
            <div
              className="gauge-optimal-range"
              style={{
                left: '25%',
                width: '50%',
              }}
            />
            <div className="gauge-needle" style={{ left: `${moistureNeedle}%` }} />
          </div>
        </div>
      </div>

      {/* 2. TEMPERATURA */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <div className="metric-card-title">
            <div className="metric-icon-wrap temp">
              <Thermometer size={20} />
            </div>
            <div>
              <span>Temperatura</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sonda Térmica SHT31</p>
            </div>
          </div>
          <span className="plant-status-badge optimal">
            VPD {currentReadings.vpd} kPa
          </span>
        </div>

        <div className="metric-value-row">
          <span className="metric-huge-value">{currentReadings.temperature}</span>
          <span className="metric-unit">°C</span>
        </div>

        <div className="metric-subtext">
          <Gauge size={13} color="var(--temp-amber)" />
          <span>
            Temp. de Sustrato: <strong>{currentReadings.soilTemperature}°C</strong> | Aire: {currentReadings.humidity}% HR
          </span>
        </div>

        {/* Gauge horizontal con aguja */}
        <div className="threshold-gauge-container">
          <div className="threshold-labels">
            <span>{thresholds.temperature.min}°C</span>
            <span style={{ color: 'var(--emerald-light)' }}>
              Meta: {thresholds.temperature.optimal}°C
            </span>
            <span>{thresholds.temperature.max}°C</span>
          </div>
          <div className="gauge-track">
            <div
              className="gauge-optimal-range"
              style={{
                left: '25%',
                width: '50%',
              }}
            />
            <div className="gauge-needle" style={{ left: `${tempNeedle}%` }} />
          </div>
        </div>
      </div>

      {/* 3. LUZ E INSOLACIÓN */}
      <div className="glass-panel metric-card">
        <div className="metric-card-header">
          <div className="metric-card-title">
            <div className="metric-icon-wrap light">
              <Sun size={20} />
            </div>
            <div>
              <span>Radiación Lumínica</span>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Sensor BH1750 Fotométrico</p>
            </div>
          </div>
          <span className="plant-status-badge optimal">
            {currentReadings.lightLux > 25000
              ? 'Luz Solar Directa'
              : currentReadings.lightLux > 5000
              ? 'Luz Indirecta Brillante'
              : 'Sombra Parcial'}
          </span>
        </div>

        <div className="metric-value-row">
          <span className="metric-huge-value">
            {currentReadings.lightLux.toLocaleString()}
          </span>
          <span className="metric-unit">lux</span>
        </div>

        <div className="metric-subtext">
          <Sun size={13} color="var(--light-sun)" />
          <span>
            Rango óptimo para la especie:{' '}
            <strong>{(thresholds.lightLux.optimal / 1000).toFixed(1)}k lux</strong>
          </span>
        </div>

        {/* Gauge horizontal con aguja */}
        <div className="threshold-gauge-container">
          <div className="threshold-labels">
            <span>{(thresholds.lightLux.min / 1000).toFixed(1)}k</span>
            <span style={{ color: 'var(--emerald-light)' }}>
              {(thresholds.lightLux.optimal / 1000).toFixed(1)}k
            </span>
            <span>{(thresholds.lightLux.max / 1000).toFixed(1)}k lux</span>
          </div>
          <div className="gauge-track">
            <div
              className="gauge-optimal-range"
              style={{
                left: '25%',
                width: '50%',
              }}
            />
            <div className="gauge-needle" style={{ left: `${lightNeedle}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
};
