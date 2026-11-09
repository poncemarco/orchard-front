import React, { useState, useMemo } from 'react';
import { Droplets, Thermometer, Sun } from 'lucide-react';
import type { PlantProfile, TelemetryPoint, MetricType, TimeRange } from '../../data/types';

interface TelemetryChartProps {
  plant: PlantProfile;
  telemetryPoints: TelemetryPoint[];
}

export const TelemetryChart: React.FC<TelemetryChartProps> = ({ plant, telemetryPoints }) => {
  const [activeMetric, setActiveMetric] = useState<MetricType>('moisture');
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Configuraciones por métrica
  const metricConfig = useMemo(() => {
    switch (activeMetric) {
      case 'moisture':
        return {
          title: 'Humedad de Tierra',
          unit: '%',
          color: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.35)',
          gradientId: 'moistureGradient',
          getValue: (p: TelemetryPoint) => p.soilMoisture,
          threshold: plant.thresholds.soilMoisture.min,
          thresholdLabel: `Mínimo (${plant.thresholds.soilMoisture.min}%)`,
        };
      case 'temperature':
        return {
          title: 'Temperatura',
          unit: '°C',
          color: '#fb923c',
          glow: 'rgba(251, 146, 60, 0.35)',
          gradientId: 'tempGradient',
          getValue: (p: TelemetryPoint) => p.temperature,
          threshold: plant.thresholds.temperature.optimal,
          thresholdLabel: `Meta (${plant.thresholds.temperature.optimal}°C)`,
        };
      case 'light':
        return {
          title: 'Radiación Lumínica',
          unit: 'lux',
          color: '#facc15',
          glow: 'rgba(250, 204, 21, 0.35)',
          gradientId: 'lightGradient',
          getValue: (p: TelemetryPoint) => p.lightLux,
          threshold: plant.thresholds.lightLux.optimal,
          thresholdLabel: `Óptimo (${plant.thresholds.lightLux.optimal} lux)`,
        };
      default:
        return {
          title: 'Humedad de Tierra',
          unit: '%',
          color: '#38bdf8',
          glow: 'rgba(56, 189, 248, 0.35)',
          gradientId: 'moistureGradient',
          getValue: (p: TelemetryPoint) => p.soilMoisture,
          threshold: plant.thresholds.soilMoisture.min,
          thresholdLabel: 'Mínimo',
        };
    }
  }, [activeMetric, plant]);

  // Si no hay suficientes puntos, generamos puntos interpolados basados en currentReadings
  const points = useMemo(() => {
    if (telemetryPoints && telemetryPoints.length >= 3) {
      return telemetryPoints;
    }
    // Fallback sintetizado de 12 horas
    return Array.from({ length: 12 }).map((_, i) => {
      const d = new Date();
      d.setHours(d.getHours() - (11 - i));
      return {
        timestamp: d.toISOString(),
        soilMoisture: Number((plant.currentReadings.soilMoisture + Math.sin(i / 2) * 2).toFixed(1)),
        temperature: Number((plant.currentReadings.temperature + Math.cos(i / 2) * 1.5).toFixed(1)),
        lightLux: Math.max(0, Math.floor(plant.currentReadings.lightLux + Math.sin(i) * 2000)),
        humidity: 60,
      };
    });
  }, [telemetryPoints, plant]);

  // Dimensiones del SVG
  const width = 800;
  const height = 260;
  const padding = { top: 25, right: 35, bottom: 35, left: 55 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Escalas
  const values = points.map(metricConfig.getValue);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const minVal = Math.max(0, Math.floor(rawMin * 0.85));
  const maxVal = Math.ceil(rawMax * 1.15) || 100;

  const getX = (index: number) => padding.left + (index / (points.length - 1)) * chartWidth;
  const getY = (val: number) =>
    padding.top + chartHeight - ((val - minVal) / (maxVal - minVal || 1)) * chartHeight;

  // Generador de curva Bézier suave
  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    const coords = points.map((p, i) => ({
      x: getX(i),
      y: getY(metricConfig.getValue(p)),
    }));

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  }, [points, metricConfig, minVal, maxVal]);

  const areaD = useMemo(() => {
    if (!pathD || points.length === 0) return '';
    const firstX = getX(0);
    const lastX = getX(points.length - 1);
    const baselineY = padding.top + chartHeight;
    return `${pathD} L ${lastX} ${baselineY} L ${firstX} ${baselineY} Z`;
  }, [pathD, points]);

  // Línea de umbral Y
  const thresholdY =
    metricConfig.threshold >= minVal && metricConfig.threshold <= maxVal
      ? getY(metricConfig.threshold)
      : null;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="glass-panel telemetry-section">
      <div className="chart-controls-bar">
        {/* Selector de Métrica */}
        <div className="metric-tab-group">
          <button
            onClick={() => setActiveMetric('moisture')}
            className={`metric-tab-btn moisture ${activeMetric === 'moisture' ? 'active' : ''}`}
          >
            <Droplets size={15} />
            <span>Humedad Tierra</span>
          </button>
          <button
            onClick={() => setActiveMetric('temperature')}
            className={`metric-tab-btn temp ${activeMetric === 'temperature' ? 'active' : ''}`}
          >
            <Thermometer size={15} />
            <span>Temperatura</span>
          </button>
          <button
            onClick={() => setActiveMetric('light')}
            className={`metric-tab-btn light ${activeMetric === 'light' ? 'active' : ''}`}
          >
            <Sun size={15} />
            <span>Luz (Lux)</span>
          </button>
        </div>

        {/* Selector de Rango */}
        <div className="range-tab-group">
          <button
            onClick={() => setTimeRange('24h')}
            className={`range-btn ${timeRange === '24h' ? 'active' : ''}`}
          >
            Últimas 24h
          </button>
          <button
            onClick={() => setTimeRange('7d')}
            className={`range-btn ${timeRange === '7d' ? 'active' : ''}`}
          >
            7 Días
          </button>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="svg-chart-wrapper">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="chart-svg"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="90%" stopColor="#38bdf8" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb923c" stopOpacity="0.4" />
              <stop offset="90%" stopColor="#fb923c" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lightGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#facc15" stopOpacity="0.4" />
              <stop offset="90%" stopColor="#facc15" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines horizontales */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = padding.top + chartHeight * pct;
            const val = Math.round(maxVal - (maxVal - minVal) * pct);
            return (
              <g key={i}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  fill="var(--text-dim)"
                  fontSize="11"
                  fontFamily="var(--font-mono)"
                  textAnchor="end"
                >
                  {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
                  {metricConfig.unit}
                </text>
              </g>
            );
          })}

          {/* Línea de umbral de referencia */}
          {thresholdY !== null && (
            <g>
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={width - padding.right}
                y2={thresholdY}
                stroke="rgba(239, 68, 68, 0.6)"
                strokeDasharray="6 3"
                strokeWidth="1.5"
              />
              <text
                x={width - padding.right - 8}
                y={thresholdY - 6}
                fill="rgba(239, 68, 68, 0.8)"
                fontSize="10"
                fontFamily="var(--font-sans)"
                textAnchor="end"
              >
                {metricConfig.thresholdLabel}
              </text>
            </g>
          )}

          {/* Área con gradiente */}
          <path d={areaD} fill={`url(#${metricConfig.gradientId})`} />

          {/* Línea principal trazada */}
          <path
            d={pathD}
            fill="none"
            stroke={metricConfig.color}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 6px ${metricConfig.glow})` }}
          />

          {/* Puntos de muestreo interactivos */}
          {points.map((p, i) => {
            const cx = getX(i);
            const cy = getY(metricConfig.getValue(p));
            const isHovered = hoveredIndex === i;

            return (
              <g key={i}>
                {/* Zona invisible para captura de mouse */}
                <circle
                  cx={cx}
                  cy={cy}
                  r="14"
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  style={{ cursor: 'pointer' }}
                />
                {/* Punto visible */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 3.5}
                  fill={isHovered ? '#ffffff' : metricConfig.color}
                  stroke="#0b130e"
                  strokeWidth="2"
                  style={{ transition: 'all 0.15s ease' }}
                />
              </g>
            );
          })}

          {/* Tooltip flotante en SVG */}
          {hoveredPoint && hoveredIndex !== null && (
            <g transform={`translate(${getX(hoveredIndex)}, ${getY(metricConfig.getValue(hoveredPoint))})`}>
              {/* Línea vertical guía */}
              <line
                x1="0"
                y1={padding.top + chartHeight - getY(metricConfig.getValue(hoveredPoint))}
                x2="0"
                y2={padding.top - getY(metricConfig.getValue(hoveredPoint))}
                stroke="rgba(255, 255, 255, 0.2)"
                strokeDasharray="3 3"
              />
              {/* Tooltip Card */}
              <g transform="translate(0, -45)">
                <rect
                  x="-55"
                  y="-10"
                  width="110"
                  height="38"
                  rx="6"
                  fill="#0c1711"
                  stroke={metricConfig.color}
                  strokeWidth="1"
                  style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))' }}
                />
                <text
                  x="0"
                  y="6"
                  fill="#ffffff"
                  fontSize="12"
                  fontWeight="bold"
                  fontFamily="var(--font-mono)"
                  textAnchor="middle"
                >
                  {metricConfig.getValue(hoveredPoint)} {metricConfig.unit}
                </text>
                <text
                  x="0"
                  y="20"
                  fill="var(--text-dim)"
                  fontSize="9"
                  fontFamily="var(--font-sans)"
                  textAnchor="middle"
                >
                  {new Date(hoveredPoint.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </text>
              </g>
            </g>
          )}

          {/* Timestamps en eje X */}
          {points.map((p, i) => {
            // Mostrar cada 2 o 3 puntos para no saturar
            if (i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return null;
            const x = getX(i);
            const timeStr = new Date(p.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            });
            return (
              <text
                key={i}
                x={x}
                y={height - 8}
                fill="var(--text-dim)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {timeStr}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
