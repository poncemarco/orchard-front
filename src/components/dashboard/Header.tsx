import React from 'react';
import { Sprout, Bell, Activity, RefreshCw } from 'lucide-react';
import type { GardenZone, PlantAlert } from '../../data/types';

interface HeaderProps {
  zones: GardenZone[];
  selectedZone: string;
  onSelectZone: (zoneId: string) => void;
  alerts: PlantAlert[];
  onOpenAlerts: () => void;
  isLive: boolean;
  onToggleLive: () => void;
  lastSyncTime: string;
}

export const Header: React.FC<HeaderProps> = ({
  zones,
  selectedZone,
  onSelectZone,
  alerts,
  onOpenAlerts,
  isLive,
  onToggleLive,
  lastSyncTime,
}) => {
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <header className="dash-header glass-panel">
      <div className="brand-wrapper">
        <div className="brand-logo-icon">
          <Sprout size={28} />
        </div>
        <div className="brand-titles">
          <h1>
            VERDANT <span className="brand-badge">IoT Core v1.4</span>
          </h1>
          <p>Telemetría de Huerto y Monitoreo Biométrico de Sustrato</p>
        </div>
      </div>

      <div className="header-controls">
        <button
          onClick={onToggleLive}
          className="live-pill"
          title={isLive ? 'Pausar transmisión en vivo' : 'Reanudar transmisión en vivo'}
        >
          <span className={`live-dot ${isLive ? '' : 'paused'}`} />
          <span>{isLive ? 'Sensor Feed: En Vivo' : 'Feed Pausado'}</span>
          <Activity size={14} style={{ opacity: 0.7 }} />
        </button>

        <button
          onClick={onOpenAlerts}
          className="icon-btn-badge"
          aria-label="Ver alertas"
          title="Ver alertas del sistema"
        >
          <Bell size={20} />
          {unacknowledgedCount > 0 && (
            <span className="badge-count">{unacknowledgedCount}</span>
          )}
        </button>
      </div>

      {/* Zone selection filter bar */}
      <nav className="zone-filter-bar" style={{ width: '100%', marginTop: '0.2rem' }}>
        {zones.map((zone) => {
          const isActive = selectedZone === zone.id;
          return (
            <button
              key={zone.id}
              onClick={() => onSelectZone(zone.id)}
              className={`zone-chip ${isActive ? 'active' : ''}`}
            >
              {zone.name}
              <span style={{ opacity: 0.6, fontSize: '0.75rem', marginLeft: '0.35rem' }}>
                ({zone.plantCount})
              </span>
            </button>
          );
        })}
      </nav>
    </header>
  );
};
