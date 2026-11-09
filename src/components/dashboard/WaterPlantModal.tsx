import React, { useState } from 'react';
import { Droplet, X, Check, Loader2 } from 'lucide-react';
import type { PlantProfile } from '../../data/types';

interface WaterPlantModalProps {
  plant: PlantProfile;
  isOpen: boolean;
  onClose: () => void;
  onConfirmWater: (amountMl: number) => Promise<void>;
}

export const WaterPlantModal: React.FC<WaterPlantModalProps> = ({
  plant,
  isOpen,
  onClose,
  onConfirmWater,
}) => {
  const [amount, setAmount] = useState<number>(350);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<boolean>(false);

  if (!isOpen) return null;

  const presets = [150, 300, 500, 750];

  const handleWater = async () => {
    setIsSubmitting(true);
    try {
      await onConfirmWater(amount);
      setSuccessMsg(true);
      setTimeout(() => {
        setSuccessMsg(false);
        setIsSubmitting(false);
        onClose();
      }, 1000);
    } catch (e) {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--moisture-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Droplet size={20} />
            </div>
            <div>
              <h3 className="modal-title">Regar {plant.commonName}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                Humedad actual: {plant.currentReadings.soilMoisture}% (Meta:{' '}
                {plant.thresholds.soilMoisture.optimal}%)
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={18} />
          </button>
        </div>

        {successMsg ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.2)',
                color: 'var(--emerald-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Check size={28} />
            </div>
            <h4 style={{ color: '#fff', fontSize: '1.2rem' }}>¡Riego Aplicado!</h4>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              Se suministraron {amount}ml de agua. El sustrato se ha rehidratado y la telemetría ha
              sido actualizada.
            </p>
          </div>
        ) : (
          <div>
            <div style={{ textAlign: 'center', margin: '1rem 0' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: 'var(--moisture-cyan)',
                }}
              >
                {amount}
              </span>
              <span style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginLeft: '0.3rem' }}>
                ml
              </span>
            </div>

            <input
              type="range"
              min="50"
              max="1000"
              step="50"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="water-amount-slider"
            />

            <div className="water-preset-chips">
              {presets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAmount(preset)}
                  className={`preset-chip ${amount === preset ? 'active' : ''}`}
                >
                  {preset} ml
                </button>
              ))}
            </div>

            <button
              onClick={handleWater}
              disabled={isSubmitting}
              className="confirm-water-btn"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Sincronizando electroválvula...</span>
                </>
              ) : (
                <>
                  <Droplet size={18} />
                  <span>Confirmar Riego ({amount}ml)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
