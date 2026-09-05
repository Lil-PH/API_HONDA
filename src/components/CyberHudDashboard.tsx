import React, { useState, useEffect } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { CivicVehicleProfile } from './CivicVehicleProfile';
import { AudioVisualizerQuad } from './AudioVisualizerQuad';
import { useLocationWeather } from '../utils/weatherService';
import { 
  Thermometer, 
  MapPin,
  RefreshCw
} from 'lucide-react';

interface CyberHudDashboardProps {
  settings: AppSettings;
  telemetry: TelemetryData;
  bleStatus?: 'disconnected' | 'connecting' | 'connected';
  onRev?: () => void;
  onToggleLights?: () => void;
  onToggleDoors?: () => void;
  onOpenCarImageSettings?: () => void;
  onUpdateSettings?: (newSettings: AppSettings) => void;
}

export const CyberHudDashboard: React.FC<CyberHudDashboardProps> = ({
  settings,
  telemetry,
  bleStatus = 'disconnected',
  onOpenCarImageSettings,
  onUpdateSettings
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const use24Hour = settings.clockFormat !== '12h';
  const toggle24Hour = () => {
    const nextFormat = use24Hour ? '12h' : '24h';
    if (onUpdateSettings) {
      onUpdateSettings({ ...settings, clockFormat: nextFormat });
    }
  };
  const [useFahrenheit, setUseFahrenheit] = useState(settings.tempUnit === 'fahrenheit');

  // Live Location & Weather
  const [currentTime, setCurrentTime] = useState(new Date());

  const { weather, refreshLocationWeather } = useLocationWeather();

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

  // Formatted Date String in UPPERCASE (e.g. WEDNESDAY 29 JULY 2026)
  const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const dayName = weekdays[currentTime.getDay()];
  const dayNum = currentTime.getDate();
  const monthName = months[currentTime.getMonth()];
  const yearNum = currentTime.getFullYear();
  const formattedDate = `${dayName} ${dayNum} ${monthName} ${yearNum}`;

  const convertTemp = (celsius: number) => {
    return useFahrenheit ? (celsius * 9) / 5 + 32 : celsius;
  };

  const tempUnitLabel = '°';

  // Resolved Real-time temperatures
  const outsideCelsius = weather.status === 'success' && typeof weather.outsideTemp === 'number'
    ? weather.outsideTemp 
    : telemetry.outsideTemp || 32.4;

  const insideCelsius = weather.status === 'success' && typeof weather.insideTemp === 'number'
    ? weather.insideTemp
    : telemetry.insideTemp || 32.2;

  // Segmented Bar Component for Temperatures (Syncs with Theme Palette & Glow)
  const renderLedSegments = (value: number, min = 15, max = 40, segments = 8) => {
    const fraction = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const activeCount = Math.max(2, Math.round(fraction * segments));

    return (
      <div className="flex items-center gap-[2px] sm:gap-1 mt-0.5 w-full max-w-[90px] sm:max-w-[130px]">
        {Array.from({ length: segments }).map((_, i) => {
          const isActive = i < activeCount;
          const isPeak = i >= segments - 2;

          return (
            <div
              key={i}
              className={`h-1.5 sm:h-2 flex-1 rounded-[1px] transition-all duration-300 ${
                isActive
                  ? ''
                  : 'bg-zinc-900 border border-zinc-800'
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: isPeak ? theme.secondary : theme.primary,
                      boxShadow: `0 0 5px ${theme.glow}`
                    }
                  : {}
              }
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="w-full h-full p-0.5 sm:p-1.5 md:p-2 grid grid-cols-2 grid-rows-2 gap-1 sm:gap-2 select-none max-w-7xl mx-auto items-stretch overflow-hidden">
      {/* 1. TOP-LEFT QUAD: TIME / DATE & DRIVER INTERFACE */}
      <div
        className="relative bg-zinc-950/95 border border-zinc-800/90 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl"
        style={{
          boxShadow: `inset 0 0 15px rgba(0,0,0,0.85), 0 0 1px ${theme.glow}`
        }}
      >
        {/* Angular HUD Corner Accents (All 4 Corners) */}
        <div className="absolute top-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute top-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

        {/* Top Header: CIVIC // DRIVER INTERFACE ... SYSTEM ONLINE */}
        <div className="flex items-center justify-between text-[7px] sm:text-[9px] md:text-[10px] font-mono-dash tracking-wider z-10">
          <div className="flex items-center space-x-1 overflow-hidden">
            <span className="font-orbitron font-bold text-white tracking-wider truncate">
              CIVIC <span style={{ color: theme.primary }}>//</span> DRIVER INTERFACE
            </span>
            <span className="text-zinc-500 hidden xs:inline tracking-widest font-mono">...</span>
          </div>

          <div className="flex items-center space-x-1 font-mono-dash text-[6px] sm:text-[8px]">
            {bleStatus === 'connected' ? (
              <span className="font-bold flex items-center gap-0.5" style={{ color: theme.secondary }}>
                <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: theme.primary, boxShadow: `0 0 5px ${theme.glow}` }} />
                <span>SYSTEM ONLINE</span>
              </span>
            ) : bleStatus === 'connecting' ? (
              <span className="text-amber-400 font-bold flex items-center gap-0.5">
                <span className="w-1 h-1 rounded-full bg-amber-400 animate-pulse" />
                <span>CONNECTING...</span>
              </span>
            ) : (
              <span className="font-mono-dash flex items-center gap-0.5" style={{ color: theme.secondary }}>
                <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.primary, boxShadow: `0 0 4px ${theme.glow}` }} />
                <span>SYSTEM ONLINE</span>
              </span>
            )}
          </div>
        </div>

        {/* Center Clock, Sub-Header, Line & Date */}
        <div 
          onClick={toggle24Hour}
          title="Clique para alternar 12h / 24h"
          className="my-auto text-center py-0.5 z-10 flex flex-col items-center justify-center cursor-pointer group select-none"
        >
          {/* Subheader: TIME / DATE */}
          <div 
            className="text-[7px] sm:text-[9px] font-orbitron font-bold tracking-[0.18em] uppercase mb-0.5"
            style={{ color: theme.primary }}
          >
            TIME / DATE
          </div>

          {/* Big Digital Clock */}
          <div className="flex items-baseline justify-center space-x-1 sm:space-x-1.5 my-0 leading-none">
            <span className="font-orbitron font-black text-2xl sm:text-4xl md:text-5xl tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.4)] leading-none">
              {hours}:{minutes}
            </span>
            <span
              className="font-orbitron font-bold text-xs sm:text-base md:text-lg tracking-tight font-mono-dash leading-none"
              style={{ color: theme.secondary }}
            >
              {seconds}
            </span>
            {!use24Hour && (
              <span className="text-[7px] sm:text-[9px] font-orbitron font-bold text-zinc-400 ml-1">
                {rawHours >= 12 ? 'PM' : 'AM'}
              </span>
            )}
          </div>

          {/* Center Glowing Dot on Subtle Divider Line */}
          <div className="w-32 xs:w-40 sm:w-56 h-[1px] bg-zinc-800/90 relative my-1 sm:my-1.5 flex items-center justify-center">
            <div 
              className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full shrink-0"
              style={{ 
                backgroundColor: theme.primary, 
                boxShadow: `0 0 8px ${theme.glow}, 0 0 14px ${theme.glow}` 
              }}
            />
          </div>

          {/* Centered Date Text */}
          <div className="text-center font-orbitron font-bold text-[6.5px] xs:text-[7.5px] sm:text-[9px] md:text-[10px] text-zinc-100 tracking-[0.14em] uppercase truncate max-w-full px-1">
            {formattedDate}
          </div>
        </div>
      </div>

      {/* 2. TOP-RIGHT QUAD: CLIMATE MONITOR */}
      <div
        className="relative bg-zinc-950/95 border border-zinc-800/90 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl"
        style={{
          boxShadow: `inset 0 0 15px rgba(0,0,0,0.85), 0 0 1px ${theme.glow}`
        }}
      >
        {/* Angular HUD Corner Accents */}
        <div className="absolute top-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute top-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

        {/* Header: CLIMATE MONITOR & SENSORS ONLINE */}
        <div className="flex items-center justify-between z-10">
          <span 
            className="font-orbitron font-bold text-[7px] sm:text-[9px] md:text-[10px] tracking-wider uppercase truncate"
            style={{ color: theme.primary }}
          >
            CLIMATE MONITOR
          </span>

          <div className="text-[6px] sm:text-[8px] font-mono-dash uppercase tracking-wider flex items-center gap-0.5" style={{ color: theme.secondary }}>
            <span className="w-1 h-1 rounded-full animate-pulse" style={{ backgroundColor: theme.primary, boxShadow: `0 0 4px ${theme.glow}` }} />
            <span>SENSORS ONLINE</span>
          </div>
        </div>

        {/* Dual Temperature Rows (INSIDE & OUTSIDE) */}
        <div className="my-auto flex flex-col justify-center space-y-1 sm:space-y-2 py-0.5 z-10">
          {/* 1. INSIDE (CABINE) */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <div 
                className="w-5 h-5 sm:w-7 sm:h-7 rounded-md bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0"
                style={{ borderColor: `${theme.primary}33` }}
              >
                <Thermometer 
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  style={{ color: theme.primary }} 
                />
              </div>

              <div className="flex flex-col justify-center min-w-0 flex-1">
                <span className="font-orbitron font-bold text-[7px] sm:text-[9px] tracking-wider text-zinc-300 uppercase truncate">
                  INSIDE
                </span>
                {renderLedSegments(insideCelsius, 16, 36, 8)}
              </div>
            </div>

            <div className="text-right flex flex-col justify-center shrink-0">
              <span className="font-orbitron font-black text-sm sm:text-xl md:text-2xl text-white tracking-tight leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
                {convertTemp(insideCelsius).toFixed(1)}{tempUnitLabel}
              </span>
            </div>
          </div>

          {/* 2. OUTSIDE */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
              <div 
                className="w-5 h-5 sm:w-7 sm:h-7 rounded-md bg-zinc-900/90 border border-zinc-800 flex items-center justify-center shrink-0"
                style={{ borderColor: `${theme.primary}33` }}
              >
                <Thermometer 
                  className="w-3 h-3 sm:w-4 sm:h-4"
                  style={{ color: theme.primary }} 
                />
              </div>

              <div className="flex flex-col justify-center min-w-0 flex-1">
                <span className="font-orbitron font-bold text-[7px] sm:text-[9px] tracking-wider text-zinc-300 uppercase truncate">
                  OUTSIDE
                </span>
                {renderLedSegments(outsideCelsius, 0, 45, 8)}
              </div>
            </div>

            <div className="text-right flex flex-col justify-center shrink-0">
              <span className="font-orbitron font-black text-sm sm:text-xl md:text-2xl text-white tracking-tight leading-none drop-shadow-[0_0_10px_rgba(255,255,255,0.25)]">
                {convertTemp(outsideCelsius).toFixed(1)}{tempUnitLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar with Unit Switch Button & Interactive Location Span */}
        <div className="w-full flex items-center justify-between font-mono-dash text-[6px] sm:text-[8px] text-zinc-500 uppercase tracking-wider border-t border-zinc-800/80 pt-1 z-10">
          <button
            type="button"
            onClick={() => setUseFahrenheit(!useFahrenheit)}
            className="px-1.5 py-0.5 rounded text-[6px] sm:text-[8px] font-mono-dash font-bold tracking-wider border transition-all cursor-pointer flex items-center gap-1 hover:brightness-125 active:scale-95 leading-none"
            style={{
              borderColor: `${theme.primary}50`,
              backgroundColor: `${theme.primary}18`,
              color: theme.secondary
            }}
            title="Alternar unidade (°C / °F)"
          >
            <span className="w-1 h-1 rounded-full" style={{ backgroundColor: theme.primary }} />
            <span>UNIT: {useFahrenheit ? '°F' : '°C'}</span>
          </button>

          {/* Interactive Location GPS Span */}
          <button
            type="button"
            onClick={refreshLocationWeather}
            disabled={weather.status === 'loading'}
            className="flex items-center justify-end gap-1 text-zinc-400 hover:text-zinc-200 cursor-pointer transition-all active:scale-95 leading-none max-w-[65%] truncate bg-transparent border-0 p-0"
            title="Clique para sincronizar clima e localização via GPS"
          >
            {weather.status === 'loading' ? (
              <RefreshCw className="w-2 h-2 animate-spin shrink-0" style={{ color: theme.primary }} />
            ) : (
              <MapPin className="w-2 h-2 shrink-0" style={{ color: theme.primary }} />
            )}
            <span className="truncate">
              {weather.status === 'loading'
                ? 'OBTENDO GPS...'
                : weather.cityName && weather.status === 'success'
                ? weather.cityName
                : 'OBTER GPS'}
            </span>
          </button>
        </div>
      </div>

      {/* 3. BOTTOM-LEFT QUAD: VEHICLE PROFILE & 360 LIVE */}
      <CivicVehicleProfile
        settings={settings}
        telemetry={telemetry}
        onOpenCarImageSettings={onOpenCarImageSettings}
        onToggleClockFormat={toggle24Hour}
      />

      {/* 4. BOTTOM-RIGHT QUAD: AUDIO VISUALIZER */}
      <div
        className="relative bg-zinc-950/95 border border-zinc-800/90 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl"
        style={{
          boxShadow: `inset 0 0 15px rgba(0,0,0,0.85), 0 0 1px ${theme.glow}`
        }}
      >
        <div className="absolute top-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute top-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

        <AudioVisualizerQuad settings={settings} telemetry={telemetry} />
      </div>
    </div>
  );
};

