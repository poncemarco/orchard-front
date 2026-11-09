import React from 'react';
import { X, AlertTriangle, AlertCircle, Info, Check } from 'lucide-react';
import type { PlantAlert } from '../../data/types';

interface AlertsDrawerProps {
  alerts: PlantAlert[];
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string) => Promise<void>;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  alerts,
  isOpen,
  onClose,
  onAcknowledge,
}) => {
  if (!isOpen) return null;

  const getSeverityIcon = (sev: PlantAlert['severity']) => {
    switch (sev) {
      case 'critical':
        return <AlertCircle size={18} color="var(--status-critical)" />;
      case 'warning':
        return <AlertTriangle size={18} color="var(--status-warning)" />;
      case 'info':
        return <Info size={18} color="var(--moisture-cyan)" />;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        style={{ maxWidth: 540 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h3 className="modal-title">Alertas del Sistema</h3>
            <span
              style={{
                fontSize: '0.75rem',
                padding: '0.15rem 0.6rem',
                borderRadius: 'var(--radius-full)',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#fca5a5',
                fontWeight: 600,
              }}
            >
              {alerts.filter((a) => !a.acknowledged).length} pendientes
            </span>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: 420, overflowY: 'auto', paddingRight: '0.3rem' }}>
          {alerts.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
              No hay alertas activas en el sistema.
            </p>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  padding: '1rem',
                  borderRadius: 'var(--radius-md)',
                  background: alert.acknowledged ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${
                    alert.severity === 'critical' && !alert.acknowledged
                      ? 'rgba(239, 68, 68, 0.4)'
                      : 'var(--border-subtle)'
                  }`,
                  opacity: alert.acknowledged ? 0.6 : 1,
                  display: 'flex',
                  gap: '0.85rem',
                }}
              >
                <div style={{ marginTop: '0.2rem' }}>{getSeverityIcon(alert.severity)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#fff' }}>
                      {alert.title}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {new Date(alert.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.6rem', lineHeight: '1.4' }}>
                    {alert.message}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--emerald-light)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                      {alert.plantName}
                    </span>

                    {!alert.acknowledged ? (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        style={{
                          fontSize: '0.75rem',
                          color: '#fff',
                          background: 'rgba(255,255,255,0.1)',
                          padding: '0.3rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <Check size={12} />
                        Reconocer
                      </button>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Reconocida</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
