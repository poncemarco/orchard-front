import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Header } from './Header';
import { PlantSelector } from './PlantSelector';
import { MetricHeroCards } from './MetricCard';
import { TelemetryChart } from './TelemetryChart';
import { SensorHealthPanel } from './SensorHealthPanel';
import { WaterPlantModal } from './WaterPlantModal';
import { AlertsDrawer } from './AlertsDrawer';
import { mockApi } from '../../services/mockApi';
import type { PlantProfile, GardenZone, PlantAlert, TelemetryPoint } from '../../data/types';
import { Droplet, Sparkles, RefreshCw, Layers } from 'lucide-react';

export const PlantDashboard: React.FC = () => {
  const [plants, setPlants] = useState<PlantProfile[]>([]);
  const [zones, setZones] = useState<GardenZone[]>([]);
  const [alerts, setAlerts] = useState<PlantAlert[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState<string>('');
  const [selectedZone, setSelectedZone] = useState<string>('zone-all');
  const [telemetryPoints, setTelemetryPoints] = useState<TelemetryPoint[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLive, setIsLive] = useState<boolean>(true);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState<boolean>(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>(new Date().toISOString());

  // Carga inicial de datos mock
  useEffect(() => {
    async function initDashboard() {
      try {
        setLoading(true);
        const [plantsRes, zonesRes, alertsRes] = await Promise.all([
          mockApi.getPlants(),
          mockApi.getZones(),
          mockApi.getAlerts(),
        ]);

        if (plantsRes.success && plantsRes.data.length > 0) {
          setPlants(plantsRes.data);
          setSelectedPlantId(plantsRes.data[0].id);
        }
        if (zonesRes.success) setZones(zonesRes.data);
        if (alertsRes.success) setAlerts(alertsRes.data);
      } catch (err) {
        console.error('Error cargando datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    initDashboard();
  }, []);

  // Cargar telemetría para la planta seleccionada
  useEffect(() => {
    if (!selectedPlantId) return;

    let isMounted = true;
    async function loadTelemetry() {
      const res = await mockApi.getTelemetry(selectedPlantId, '24h');
      if (isMounted && res.success && res.data) {
        setTelemetryPoints(res.data.points);
      }
    }

    loadTelemetry();
    return () => {
      isMounted = false;
    };
  }, [selectedPlantId]);

  // Suscripción al ticker en vivo (simulación de telemetría IoT MQTT)
  useEffect(() => {
    if (!isLive) return;

    const unsubscribe = mockApi.subscribeLiveTelemetry((updatedPlants) => {
      setPlants(updatedPlants);
      setLastSyncTime(new Date().toISOString());

      // Si la planta actual cambió, actualizar también el último punto de telemetría
      const currentActive = updatedPlants.find((p) => p.id === selectedPlantId);
      if (currentActive) {
        setTelemetryPoints((prev) => {
          if (prev.length === 0) return prev;
          const copy = [...prev];
          const lastIdx = copy.length - 1;
          copy[lastIdx] = {
            ...copy[lastIdx],
            soilMoisture: currentActive.currentReadings.soilMoisture,
            temperature: currentActive.currentReadings.temperature,
            lightLux: currentActive.currentReadings.lightLux,
          };
          return copy;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [isLive, selectedPlantId]);

  // Filtrado de plantas por zona
  const filteredPlants = useMemo(() => {
    if (selectedZone === 'zone-all') return plants;
    const zoneObj = zones.find((z) => z.id === selectedZone);
    if (!zoneObj) return plants;
    return plants.filter((p) => p.zone.includes(zoneObj.name));
  }, [plants, selectedZone, zones]);

  // Planta actualmente seleccionada
  const activePlant = useMemo(() => {
    return plants.find((p) => p.id === selectedPlantId) || plants[0] || null;
  }, [plants, selectedPlantId]);

  // Manejo de riego interactivo
  const handleConfirmWater = useCallback(
    async (amountMl: number) => {
      if (!activePlant) return;
      const res = await mockApi.waterPlant(activePlant.id, amountMl);
      if (res.success && res.data) {
        // Actualizar estado local
        setPlants((prev) =>
          prev.map((p) => (p.id === activePlant.id ? res.data : p))
        );
        // Actualizar telemetría agregando el nuevo punto
        setTelemetryPoints((prev) => [
          ...prev,
          {
            timestamp: new Date().toISOString(),
            soilMoisture: res.data.currentReadings.soilMoisture,
            temperature: res.data.currentReadings.temperature,
            lightLux: res.data.currentReadings.lightLux,
            humidity: res.data.currentReadings.humidity,
            soilTemperature: res.data.currentReadings.soilTemperature,
          },
        ]);
        // Refrescar alertas
        const updatedAlerts = await mockApi.getAlerts();
        if (updatedAlerts.success) setAlerts(updatedAlerts.data);
      }
    },
    [activePlant]
  );

  // Manejo de reconocimiento de alerta
  const handleAcknowledgeAlert = useCallback(async (alertId: string) => {
    const res = await mockApi.acknowledgeAlert(alertId);
    if (res.success && res.data) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
    }
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: '1.2rem',
          color: 'var(--text-muted)',
        }}
      >
        <RefreshCw size={36} className="animate-spin" color="var(--emerald-light)" />
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.95rem' }}>
          Conectando con el concentrador de sensores IoT...
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Header con Estado y Filtros */}
      <Header
        zones={zones}
        selectedZone={selectedZone}
        onSelectZone={setSelectedZone}
        alerts={alerts}
        onOpenAlerts={() => setIsAlertsDrawerOpen(true)}
        isLive={isLive}
        onToggleLive={() => setIsLive((prev) => !prev)}
        lastSyncTime={lastSyncTime}
      />

      {/* Selector de Plantas */}
      <PlantSelector
        plants={filteredPlants}
        selectedPlantId={selectedPlantId}
        onSelectPlant={setSelectedPlantId}
      />

      {/* Detalle y Métricas de la Planta Activa */}
      {activePlant && (
        <section className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Header de la Planta Activa */}
          <div className="glass-panel plant-detail-header">
            <div className="active-plant-info">
              <img
                src={activePlant.photoUrl}
                alt={activePlant.commonName}
                className="active-plant-img"
              />
              <div className="active-plant-titles">
                <h2>{activePlant.commonName}</h2>
                <p>
                  <span>{activePlant.scientificName}</span>
                  <span className="zone-tag">{activePlant.zone}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
                    Categoría: {activePlant.category}
                  </span>
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                onClick={() => setIsWaterModalOpen(true)}
                className="water-action-btn"
                id="btn-water-plant"
              >
                <Droplet size={18} />
                <span>Regar Planta</span>
              </button>
            </div>
          </div>

          {/* 3 Tarjetas Hero: Humedad, Temperatura y Luz */}
          <MetricHeroCards plant={activePlant} />

          {/* Gráfico Interactivo de Telemetría SVG */}
          <TelemetryChart
            plant={activePlant}
            telemetryPoints={telemetryPoints}
          />

          {/* Estado del Microcontrolador y Diagnóstico Biológico */}
          <SensorHealthPanel
            plant={activePlant}
            onOpenWaterModal={() => setIsWaterModalOpen(true)}
          />
        </section>
      )}

      {/* Modal de Riego */}
      {activePlant && (
        <WaterPlantModal
          plant={activePlant}
          isOpen={isWaterModalOpen}
          onClose={() => setIsWaterModalOpen(false)}
          onConfirmWater={handleConfirmWater}
        />
      )}

      {/* Panel de Alertas */}
      <AlertsDrawer
        alerts={alerts}
        isOpen={isAlertsDrawerOpen}
        onClose={() => setIsAlertsDrawerOpen(false)}
        onAcknowledge={handleAcknowledgeAlert}
      />
    </div>
  );
};
