import React from 'react';
import { Droplets, Thermometer, Sun, AlertTriangle, CheckCircle2, AlertCircle } from 'lucide-react';
import type { PlantProfile } from '../../data/types';

interface PlantSelectorProps {
  plants: PlantProfile[];
  selectedPlantId: string;
  onSelectPlant: (id: string) => void;
}

export const PlantSelector: React.FC<PlantSelectorProps> = ({
  plants,
  selectedPlantId,
  onSelectPlant,
}) => {
  const getStatusIcon = (status: PlantProfile['health']['status']) => {
    switch (status) {
      case 'optimal':
        return <CheckCircle2 size={13} />;
      case 'warning':
        return <AlertTriangle size={13} />;
      case 'critical':
        return <AlertCircle size={13} />;
      default:
        return null;
    }
  };

  const getStatusText = (status: PlantProfile['health']['status']) => {
    switch (status) {
      case 'optimal':
        return 'Óptimo';
      case 'warning':
        return 'Atención';
      case 'critical':
        return 'Crítico';
      default:
        return 'Latente';
    }
  };

  return (
    <section>
      <div className="plants-section-header">
        <h2 className="section-title">
          <span>Plantas Monitoreadas</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', fontWeight: 400 }}>
            ({plants.length} sensores activos)
          </span>
        </h2>
      </div>

      <div className="plants-grid">
        {plants.map((plant) => {
          const isSelected = plant.id === selectedPlantId;
          const isDry = plant.currentReadings.soilMoisture < plant.thresholds.soilMoisture.min;

          return (
            <div
              key={plant.id}
              onClick={() => onSelectPlant(plant.id)}
              className={`glass-panel plant-card ${isSelected ? 'active' : ''}`}
            >
              <div className="plant-card-top">
                <div className="plant-avatar-wrap">
                  <img
                    src={plant.photoUrl}
                    alt={plant.commonName}
                    className="plant-avatar-img"
                    loading="lazy"
                  />
                </div>
                <div className="plant-meta">
                  <h3 className="plant-name">{plant.commonName}</h3>
                  <p className="plant-scientific">{plant.scientificName}</p>
                  <span className={`plant-status-badge ${plant.health.status}`}>
                    {getStatusIcon(plant.health.status)}
                    {getStatusText(plant.health.status)}
                  </span>
                </div>
              </div>

              {/* Soil Moisture Bar */}
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.74rem',
                    color: 'var(--text-muted)',
                    marginBottom: '0.3rem',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Droplets size={12} color="var(--moisture-cyan)" /> Humedad Tierra
                  </span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: '#fff' }}>
                    {plant.currentReadings.soilMoisture}%
                  </span>
                </div>
                <div className="moisture-bar-track">
                  <div
                    className={`moisture-bar-fill ${isDry ? 'dry' : ''}`}
                    style={{ width: `${Math.min(100, Math.max(5, plant.currentReadings.soilMoisture))}%` }}
                  />
                </div>
              </div>

              {/* Quick stats row */}
              <div className="plant-quick-metrics">
                <div className="quick-metric-item">
                  <Thermometer size={14} color="var(--temp-amber)" />
                  <span className="quick-metric-val">{plant.currentReadings.temperature}°C</span>
                </div>
                <div className="quick-metric-item">
                  <Sun size={14} color="var(--light-sun)" />
                  <span className="quick-metric-val">
                    {plant.currentReadings.lightLux > 1000
                      ? `${(plant.currentReadings.lightLux / 1000).toFixed(1)}k`
                      : plant.currentReadings.lightLux}{' '}
                    lux
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
