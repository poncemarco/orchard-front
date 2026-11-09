import React from 'react';
import { Wifi, BatteryCharging, Cpu, Calendar, HeartPulse, Droplet } from 'lucide-react';
import type { PlantProfile } from '../../data/types';

interface SensorHealthPanelProps {
  plant: PlantProfile;
  onOpenWaterModal: () => void;
}

export const SensorHealthPanel: React.FC<SensorHealthPanelProps> = ({
  plant,
  onOpenWaterModal,
}) => {
  const { sensorDevice, lastWatered, nextRecommendedWatering, health } = plant;

  // Calculo de barras WiFi según RSSI (dBm)
  const getSignalStrength = (rssi: number) => {
    if (rssi > -60) return { label: 'Excelente', bars: 4, color: 'var(--emerald-light)' };
    if (rssi > -70) return { label: 'Bueno', bars: 3, color: 'var(--emerald-primary)' };
    if (rssi > -80) return { label: 'Regular', bars: 2, color: 'var(--status-warning)' };
    return { label: 'Débil', bars: 1, color: 'var(--status-critical)' };
  };

  const signal = getSignalStrength(sensorDevice.signalRssi);

  return (
    <div className="secondary-grid">
      {/* 1. Panel de Hardware IoT (ESP32) */}
      <div className="glass-panel info-card">
        <h3 className="section-title" style={{ marginBottom: '1.2rem' }}>
          <Cpu size={18} color="var(--emerald-light)" />
          <span>Telemetría del Nodo Sensor</span>
        </h3>

        <div className="info-row">
          <span className="info-label">
            <Cpu size={14} /> Dispositivo MCU
          </span>
          <span className="info-value">{sensorDevice.name}</span>
        </div>

        <div className="info-row">
          <span className="info-label">
            <BatteryCharging size={14} /> Batería LiPo
          </span>
          <span className="info-value" style={{ color: sensorDevice.battery > 30 ? 'var(--emerald-light)' : 'var(--status-critical)' }}>
            {sensorDevice.battery}% ({sensorDevice.batteryVoltage}V)
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">
            <Wifi size={14} /> Señal WiFi (RSSI)
          </span>
          <span className="info-value" style={{ color: signal.color }}>
            {sensorDevice.signalRssi} dBm — {signal.label}
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Firmware</span>
          <span className="info-value" style={{ color: 'var(--text-dim)' }}>
            {sensorDevice.firmwareVersion} (OTA Ready)
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">Dirección IP / MAC</span>
          <span className="info-value" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {sensorDevice.ipAddress}
          </span>
        </div>
      </div>

      {/* 2. Diagnóstico Biométrico y Riego */}
      <div className="glass-panel info-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h3 className="section-title">
            <HeartPulse size={18} color="var(--moisture-cyan)" />
            <span>Condición y Ciclo de Riego</span>
          </h3>
          <button onClick={onOpenWaterModal} className="water-action-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>
            <Droplet size={14} />
            <span>Regar Ahora</span>
          </button>
        </div>

        <div className="info-row">
          <span className="info-label">
            <HeartPulse size={14} /> Índice de Vigor Biológico
          </span>
          <span className="info-value" style={{ color: health.score >= 85 ? 'var(--emerald-light)' : 'var(--status-warning)' }}>
            {health.score} / 100
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">
            <Calendar size={14} /> Último Riego Registrado
          </span>
          <span className="info-value">
            {new Date(lastWatered.timestamp).toLocaleDateString([], {
              day: '2-digit',
              month: 'short',
            })}{' '}
            ({lastWatered.amountMl}ml · {lastWatered.method})
          </span>
        </div>

        <div className="info-row">
          <span className="info-label">
            <Droplet size={14} /> Próximo Riego Estimado
          </span>
          <span
            className="info-value"
            style={{
              color: nextRecommendedWatering === 'Inmediato' ? 'var(--status-critical)' : 'var(--emerald-light)',
            }}
          >
            {nextRecommendedWatering === 'Inmediato'
              ? '⚠️ Inmediato requerido'
              : new Date(nextRecommendedWatering).toLocaleDateString([], {
                  day: '2-digit',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
          </span>
        </div>

        <div style={{ marginTop: '1rem', padding: '0.85rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.45' }}>
            💡 <strong style={{ color: '#fff' }}>Diagnóstico del Asistente:</strong> {health.summary}
          </p>
        </div>
      </div>
    </div>
  );
};
