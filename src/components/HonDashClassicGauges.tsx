import React from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { Gauge, Zap, Flame, Battery, AlertOctagon, Fuel, Thermometer } from 'lucide-react';

interface HonDashClassicGaugesProps {
  settings: AppSettings;
  telemetry: TelemetryData;
}

export const HonDashClassicGauges: React.FC<HonDashClassicGaugesProps> = ({ settings, telemetry }) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;

  const maxRpm = settings.revLimitRpm || 8500;
  const rpmFraction = Math.min(1, Math.max(0, telemetry.rpm / maxRpm));
  const isShiftLight = telemetry.rpm >= (settings.shiftLightRpm || 7200);
  const isVtec = telemetry.vtecActive || telemetry.rpm >= (settings.vtecThresholdRpm || 5200);

  // Progressive Shift Light LED Bar (16 LEDs: 6 Green, 5 Yellow, 5 Red)
  const totalLeds = 16;
  const activeLeds = Math.round(rpmFraction * totalLeds);

  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 flex flex-col justify-between select-none max-w-7xl mx-auto space-y-3">
      {/* Top Shift Light Bar (F1 / Motec style) */}
      <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl p-2.5 sm:p-3 shadow-2xl flex flex-col items-center">
        <div className="w-full flex items-center justify-between px-2 mb-1.5 text-[11px] font-mono-dash text-zinc-400">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>RPM SHIFT LIGHTS</span>
          </span>
          <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
            isShiftLight
              ? 'bg-red-600 text-white animate-ping'
              : isVtec
              ? 'bg-amber-500 text-black font-extrabold'
              : 'text-zinc-500'
          }`}>
            {isShiftLight ? 'SHIFT NOW!' : isVtec ? 'VTEC ENGAGED' : 'LOW CAM'}
          </span>
        </div>

        {/* LED Strip */}
        <div className="w-full grid grid-cols-16 gap-1 sm:gap-1.5 h-4 sm:h-5">
          {Array.from({ length: totalLeds }).map((_, idx) => {
            const isActive = idx < activeLeds;
            let ledColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
            if (idx >= 6 && idx < 11) {
              ledColor = 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]';
            } else if (idx >= 11) {
              ledColor = 'bg-red-600 shadow-[0_0_12px_rgba(239,68,68,1)]';
            }

            return (
              <div
                key={idx}
                className={`h-full rounded-sm transition-all duration-75 ${
                  isActive
                    ? isShiftLight && idx >= 11
                      ? `${ledColor} animate-pulse`
                      : ledColor
                    : 'bg-zinc-900 border border-zinc-800/80'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Center Cluster: Tachometer & Speedometer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4 my-auto">
        {/* Left Side: Secondary Telemetry Gauges (Boost, AFR, TPS) */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
          {/* Boost / MAP */}
          <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-xl p-3 sm:p-4 backdrop-blur shadow-xl relative">
            <div className="text-[11px] font-orbitron text-zinc-400 flex items-center justify-between mb-1">
              <span>MANIFOLD (MAP)</span>
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-orbitron font-extrabold text-2xl sm:text-3xl text-white">
                {telemetry.boostPsi > 0 ? `+${telemetry.boostPsi.toFixed(1)}` : telemetry.map.toFixed(0)}
              </span>
              <span className="font-mono-dash text-xs text-zinc-400">
                {telemetry.boostPsi > 0 ? 'PSI BOOST' : 'kPa'}
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (telemetry.map / 200) * 100)}%`,
                  backgroundColor: theme.primary
                }}
              />
            </div>
          </div>

          {/* AFR Wideband */}
          <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-xl p-3 sm:p-4 backdrop-blur shadow-xl">
            <div className="text-[11px] font-orbitron text-zinc-400 flex items-center justify-between mb-1">
              <span>AFR WIDEBAND</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span
                className="font-orbitron font-extrabold text-2xl sm:text-3xl"
                style={{
                  color: telemetry.afr < 12.0 ? '#ef4444' : telemetry.afr > 16.0 ? '#38bdf8' : '#34d399'
                }}
              >
                {telemetry.afr.toFixed(2)}
              </span>
              <span className="font-mono-dash text-xs text-zinc-400">LAMBDA</span>
            </div>
            <div className="flex justify-between text-[9px] font-mono-dash text-zinc-500 mt-1">
              <span>RICH (10.0)</span>
              <span>STOICH (14.7)</span>
              <span>LEAN (18.0)</span>
            </div>
          </div>
        </div>

        {/* Center: Big Racing Tachometer & Speedometer */}
        <div className="lg:col-span-6 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-4 sm:p-6 backdrop-blur shadow-2xl flex flex-col items-center justify-between text-center relative overflow-hidden">
          {/* Radial glow */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none blur-3xl"
            style={{ backgroundColor: theme.primary }}
          />

          {/* Top Engine & Chassis badge */}
          <div className="w-full flex items-center justify-between text-xs font-mono-dash text-zinc-400 pb-2 border-b border-zinc-800/80 z-10">
            <span className="font-bold text-zinc-200">{settings.carModelName || 'HONDA CIVIC 1999'}</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>OBD-II LIVE</span>
            </span>
          </div>

          {/* Massive Speed Number */}
          <div className="my-auto py-2 z-10 flex flex-col items-center">
            <div className="flex items-baseline justify-center">
              <span className="font-orbitron font-black text-6xl sm:text-8xl md:text-9xl text-white tracking-tighter drop-shadow-[0_0_25px_rgba(255,255,255,0.4)]">
                {telemetry.speed}
              </span>
              <span className="font-orbitron font-bold text-base sm:text-xl text-zinc-400 ml-2 uppercase">
                {settings.speedUnit}
              </span>
            </div>

            {/* Gear Indicator */}
            <div className="flex items-center space-x-3 mt-1">
              <span className="text-xs font-mono-dash text-zinc-400">MARCHA:</span>
              <span
                className="w-10 h-10 rounded-lg flex items-center justify-center font-orbitron font-black text-2xl border shadow-lg"
                style={{
                  borderColor: theme.primary,
                  backgroundColor: `${theme.primary}20`,
                  color: '#ffffff'
                }}
              >
                {telemetry.gear === 0 ? 'N' : telemetry.gear === -1 ? 'R' : telemetry.gear}
              </span>
            </div>
          </div>

          {/* Big Tachometer Bar (0 to 9000 RPM) */}
          <div className="w-full z-10 mt-2">
            <div className="flex items-center justify-between text-xs font-mono-dash mb-1">
              <span className="text-zinc-400 flex items-center gap-1">
                <span>TACHOMETER</span>
              </span>
              <span className="font-orbitron font-extrabold text-lg text-white">
                {telemetry.rpm} <span className="text-xs text-zinc-500 font-normal">RPM</span>
              </span>
            </div>

            <div className="w-full bg-zinc-900 h-4 rounded-lg overflow-hidden border border-zinc-800 relative">
              {/* VTEC mark on bar */}
              <div
                className="absolute top-0 bottom-0 w-[2px] bg-amber-400 z-20 shadow-[0_0_6px_rgba(251,191,36,1)]"
                style={{ left: `${((settings.vtecThresholdRpm || 5200) / maxRpm) * 100}%` }}
              />
              <div
                className="h-full rounded-lg transition-all duration-75"
                style={{
                  width: `${rpmFraction * 100}%`,
                  backgroundColor: isShiftLight ? '#ef4444' : isVtec ? theme.primary : theme.secondary,
                  boxShadow: `0 0 15px ${theme.glow}`
                }}
              />
            </div>

            {/* Scale numbers (0, 2, 4, 6, 8, 9k) */}
            <div className="w-full flex justify-between text-[10px] font-mono-dash text-zinc-500 mt-1 px-1">
              <span>0</span>
              <span>2k</span>
              <span>4k</span>
              <span className="text-amber-400 font-bold">5.2k VTEC</span>
              <span className="text-red-500 font-bold">7.2k SHIFT</span>
              <span>9k</span>
            </div>
          </div>
        </div>

        {/* Right Side: Temperature & Voltage (ECT, IAT, Battery, Fuel) */}
        <div className="lg:col-span-3 grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
          {/* Coolant Temperature */}
          <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-xl p-3 sm:p-4 backdrop-blur shadow-xl">
            <div className="text-[11px] font-orbitron text-zinc-400 flex items-center justify-between mb-1">
              <span>ENGINE COOLANT</span>
              <Thermometer className="w-3.5 h-3.5 text-red-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className={`font-orbitron font-extrabold text-2xl sm:text-3xl ${
                telemetry.ect > 102 ? 'text-red-500 animate-pulse' : 'text-white'
              }`}>
                {telemetry.ect.toFixed(0)}°
              </span>
              <span className="font-mono-dash text-xs text-zinc-400">CELSIUS</span>
            </div>
            <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(100, (telemetry.ect / 120) * 100)}%`,
                  backgroundColor: telemetry.ect > 100 ? '#ef4444' : '#10b981'
                }}
              />
            </div>
          </div>

          {/* Battery & Fuel */}
          <div className="bg-zinc-950/85 border border-zinc-800/90 rounded-xl p-3 sm:p-4 backdrop-blur shadow-xl">
            <div className="text-[11px] font-orbitron text-zinc-400 flex items-center justify-between mb-1">
              <span>ALTERNATOR</span>
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-orbitron font-extrabold text-2xl sm:text-3xl text-white">
                {telemetry.batteryVoltage.toFixed(1)}
              </span>
              <span className="font-mono-dash text-xs text-zinc-400">VOLTS</span>
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono-dash text-zinc-400 mt-2 pt-1 border-t border-zinc-800">
              <span className="flex items-center gap-1">
                <Fuel className="w-3 h-3 text-amber-400" />
                <span>TANQUE:</span>
              </span>
              <span className="font-bold text-zinc-200">{telemetry.fuelLevelPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Telltales */}
      <div className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-2 sm:p-3 flex items-center justify-between text-xs font-mono-dash text-zinc-400">
        <div className="flex items-center space-x-4">
          <span className={`flex items-center gap-1.5 ${telemetry.checkEngineLight ? 'text-red-500 font-bold animate-pulse' : 'text-zinc-600'}`}>
            <AlertOctagon className="w-4 h-4" />
            <span>CHECK ENGINE (MIL)</span>
          </span>
          <span className={`flex items-center gap-1.5 ${telemetry.vtecActive ? 'text-amber-400 font-bold' : 'text-zinc-600'}`}>
            <Zap className="w-4 h-4" />
            <span>VTEC SOLENOID</span>
          </span>
        </div>

        <div className="flex items-center space-x-3 text-[11px]">
          <span>IAT: {telemetry.iat}°C</span>
          <span>•</span>
          <span>TPS: {telemetry.tps.toFixed(0)}%</span>
          <span>•</span>
          <span>TIMING: +{telemetry.timingAdvanceDeg.toFixed(1)}°</span>
        </div>
      </div>
    </div>
  );
};
