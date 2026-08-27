import React, { useState, useEffect } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { CivicVehicleProfile } from './CivicVehicleProfile';
import { AudioVisualizerQuad } from './AudioVisualizerQuad';
import { Thermometer, Gauge, Battery, Activity, Zap, AlertTriangle, ShieldCheck } from 'lucide-react';

interface CyberHudDashboardProps {
  settings: AppSettings;
  telemetry: TelemetryData;
  onRev?: () => void;
  onToggleLights?: () => void;
  onToggleDoors?: () => void;
}

export const CyberHudDashboard: React.FC<CyberHudDashboardProps> = ({
  settings,
  telemetry,
  onRev,
  onToggleLights,
  onToggleDoors
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [currentTime, setCurrentTime] = useState(new Date());
  const [use24Hour, setUse24Hour] = useState(true);
  const [useFahrenheit, setUseFahrenheit] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const rawHours = currentTime.getHours();
  const displayHours = use24Hour ? rawHours : rawHours % 12 || 12;
  const hours = String(displayHours).padStart(2, '0');
  const minutes = String(currentTime.getMinutes()).padStart(2, '0');
  const seconds = String(currentTime.getSeconds()).padStart(2, '0');
  const ampm = rawHours >= 12 ? 'PM' : 'AM';

  const convertTemp = (celsius: number) => {
    return useFahrenheit ? (celsius * 9) / 5 + 32 : celsius;
  };

  const tempUnitLabel = useFahrenheit ? '°F' : '°C';

  // Segmented Bar Component for Temperatures (Exact match to reference photo)
  const renderSegmentedBar = (value: number, min = 15, max = 45, segments = 12) => {
    const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const activeCount = Math.round(fraction * segments);

    return (
      <div className="flex items-center space-x-[3px] mt-1">
        {Array.from({ length: segments }).map((_, i) => {
          const isActive = i < activeCount;
          const isHigh = i >= segments - 2;

          return (
            <div
              key={i}
              className={`h-2.5 sm:h-3 w-3 sm:w-4 rounded-[1px] transition-all duration-150 ${
                isActive
                  ? isHigh
                    ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                    : 'shadow-[0_0_6px_currentColor]'
                  : 'bg-zinc-900 border border-zinc-800/60'
              }`}
              style={
                isActive && !isHigh
                  ? { backgroundColor: theme.primary, color: theme.primary }
                  : {}
              }
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 md:gap-5 select-none max-w-7xl mx-auto items-stretch">
      {/* 1. TOP-LEFT QUAD: TIME / DATE & DRIVER INTERFACE */}
      <div
        className="relative bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-3 sm:p-5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl"
        style={{
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 1px ${theme.glow}`
        }}
      >
        {/* Angular HUD Corner Accents */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

        {/* Top Header */}
        <div className="flex items-center justify-between text-xs font-mono-dash tracking-wider z-10">
          <div className="flex items-center space-x-2">
            <span className="font-orbitron font-extrabold text-xs sm:text-sm tracking-widest text-zinc-100">
              GRAC // DRIVER INTERFACE
            </span>
            <span className="flex space-x-0.5 text-zinc-500">
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
              <span className="w-1 h-1 rounded-full bg-zinc-400" />
            </span>
          </div>

          <div className="flex items-center space-x-1.5 text-emerald-400 font-mono-dash text-[10px] sm:text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>[ SYSTEM ONLINE ]</span>
          </div>
        </div>

        {/* Center Clock Display - Somente Hora, Minuto e Segundo */}
        <div 
          onClick={() => setUse24Hour(!use24Hour)}
          title="Clique para alternar formato 12h / 24h"
          className="my-auto text-center py-4 z-10 flex flex-col items-center justify-center cursor-pointer group"
        >
          <div className="text-[11px] font-orbitron font-bold tracking-[0.25em] text-zinc-400 uppercase mb-1 group-hover:text-white transition-colors flex items-center gap-1.5">
            <span>TIME ({use24Hour ? '24H' : ampm})</span>
            <span className="text-[9px] opacity-0 group-hover:opacity-100 text-zinc-400">⚡ ALTERNAR</span>
          </div>

          <div className="flex items-baseline justify-center space-x-2 my-1">
            <span
              className="font-orbitron font-extrabold text-5xl sm:text-6xl md:text-7xl tracking-tighter text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]"
            >
              {hours}:{minutes}
            </span>
            <span
              className="font-orbitron font-bold text-2xl sm:text-3xl tracking-tight font-mono-dash"
              style={{ color: theme.secondary }}
            >
              {seconds}
            </span>
          </div>
        </div>

        {/* Bottom Quick Status & Speed Readout */}
        <div 
          onClick={onRev}
          title="Clique para acelerar o motor (Rev Burst)"
          className="flex items-center justify-between text-xs font-mono-dash text-zinc-400 border-t border-zinc-800/80 pt-2 z-10 cursor-pointer hover:bg-white/5 rounded px-1 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <span className="flex items-center gap-1 text-zinc-300">
              <Gauge className="w-3.5 h-3.5" style={{ color: theme.primary }} />
              <span className="font-bold">{telemetry.speed}</span>
              <span className="text-[10px] text-zinc-500">{settings.speedUnit.toUpperCase()}</span>
            </span>
            <span className="flex items-center gap-1 text-zinc-300">
              <Activity className="w-3.5 h-3.5" style={{ color: theme.secondary }} />
              <span className="font-bold">{telemetry.rpm}</span>
              <span className="text-[10px] text-zinc-500">RPM</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <span className="flex items-center gap-1 text-zinc-300">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>{telemetry.batteryVoltage.toFixed(1)}V</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300">
              GEAR: {telemetry.gear === 0 ? 'N' : telemetry.gear === -1 ? 'R' : telemetry.gear}
            </span>
          </div>
        </div>
      </div>

      {/* 2. TOP-RIGHT QUAD: CLIMATE MONITOR & SENSORS */}
      <div
        className="relative bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-3 sm:p-5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl"
        style={{
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 1px ${theme.glow}`
        }}
      >
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />

        {/* Header */}
        <div className="flex items-center justify-between text-xs font-mono-dash tracking-wider z-10">
          <div className="flex items-center space-x-2">
            <span className="font-orbitron font-extrabold text-xs sm:text-sm tracking-widest text-zinc-100">
              CLIMATE MONITOR
            </span>
          </div>
          <button
            onClick={() => setUseFahrenheit(!useFahrenheit)}
            className="flex items-center space-x-1.5 text-zinc-400 font-mono-dash text-[10px] sm:text-xs hover:text-white transition-colors cursor-pointer bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>UNIDADE: {useFahrenheit ? '°FAHRENHEIT' : '°CELSIUS'}</span>
          </button>
        </div>

        {/* Dual Temperature Segmented Meters (Exact to reference image) */}
        <div 
          onClick={() => setUseFahrenheit(!useFahrenheit)}
          title="Clique para alternar entre Celsius e Fahrenheit"
          className="my-auto flex flex-col justify-center space-y-4 py-2 z-10 cursor-pointer"
        >
          {/* Inside Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <Thermometer className="w-5 h-5" style={{ color: theme.primary }} />
              </div>
              <div>
                <span className="font-orbitron font-bold text-xs sm:text-sm tracking-widest text-zinc-300 block">
                  INSIDE
                </span>
                {renderSegmentedBar(telemetry.insideTemp, 18, 38, 12)}
              </div>
            </div>
            <div className="text-right">
              <span className="font-orbitron font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                {convertTemp(telemetry.insideTemp).toFixed(1)}{tempUnitLabel}
              </span>
              <span className="block text-[10px] font-mono-dash text-zinc-500">CABIN SENSOR</span>
            </div>
          </div>

          {/* Outside Temperature */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-zinc-900/80 border border-zinc-800">
                <Thermometer className="w-5 h-5" style={{ color: theme.secondary }} />
              </div>
              <div>
                <span className="font-orbitron font-bold text-xs sm:text-sm tracking-widest text-zinc-300 block">
                  OUTSIDE
                </span>
                {renderSegmentedBar(telemetry.outsideTemp, 18, 38, 12)}
              </div>
            </div>
            <div className="text-right">
              <span className="font-orbitron font-extrabold text-2xl sm:text-3xl tracking-tight text-white">
                {convertTemp(telemetry.outsideTemp).toFixed(1)}{tempUnitLabel}
              </span>
              <span className="block text-[10px] font-mono-dash text-zinc-500">AMBIENT SENSOR</span>
            </div>
          </div>
        </div>

        {/* Engine Coolant (ECT) & Intake Air Temp (IAT) OBD-II Readout */}
        <div className="grid grid-cols-2 gap-2 border-t border-zinc-800/80 pt-2 z-10 font-mono-dash text-xs">
          <div className="flex items-center justify-between bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800/60">
            <span className="text-[10px] text-zinc-400">ECT COOLANT</span>
            <span className={`font-bold ${telemetry.ect > 102 ? 'text-red-500 animate-pulse' : 'text-zinc-200'}`}>
              {convertTemp(telemetry.ect).toFixed(0)}{tempUnitLabel}
            </span>
          </div>
          <div className="flex items-center justify-between bg-zinc-900/60 px-2 py-1 rounded border border-zinc-800/60">
            <span className="text-[10px] text-zinc-400">IAT INTAKE</span>
            <span className="font-bold text-zinc-200">{convertTemp(telemetry.iat).toFixed(0)}{tempUnitLabel}</span>
          </div>
        </div>
      </div>

      {/* 3. BOTTOM-LEFT QUAD: VEHICLE PROFILE & 360 LIVE (Civic 99 Sedan Wireframe / Gif) */}
      <div
        onClick={onToggleLights}
        title="Clique para alternar Faróis / Luzes"
        className="relative bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-3 sm:p-5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl min-h-[220px] cursor-pointer"
        style={{
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 1px ${theme.glow}`
        }}
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

        <CivicVehicleProfile settings={settings} telemetry={telemetry} />
      </div>

      {/* 4. BOTTOM-RIGHT QUAD: AUDIO VISUALIZER / ECU TELEMETRY */}
      <div
        className="relative bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-3 sm:p-5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl min-h-[220px]"
        style={{
          boxShadow: `inset 0 0 20px rgba(0,0,0,0.8), 0 0 1px ${theme.glow}`
        }}
      >
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />

        <AudioVisualizerQuad settings={settings} telemetry={telemetry} />
      </div>
    </div>
  );
};
