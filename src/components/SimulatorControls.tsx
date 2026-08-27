import React, { useState } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { Play, Pause, ChevronUp, ChevronDown, Sliders, Zap, Volume2, VolumeX, Lightbulb, DoorClosed } from 'lucide-react';

interface SimulatorControlsProps {
  settings: AppSettings;
  telemetry: TelemetryData;
  onUpdateTelemetry: (updater: (prev: TelemetryData) => TelemetryData) => void;
  isSimRunning: boolean;
  onToggleSim: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SimulatorControls: React.FC<SimulatorControlsProps> = ({
  settings,
  telemetry,
  onUpdateTelemetry,
  isSimRunning,
  onToggleSim,
  soundEnabled,
  onToggleSound
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [isOpen, setIsOpen] = useState(false);

  const handleThrottleChange = (val: number) => {
    onUpdateTelemetry((prev) => ({
      ...prev,
      tps: val
    }));
  };

  const shiftUp = () => {
    onUpdateTelemetry((prev) => {
      const nextGear = prev.gear === -1 ? 0 : Math.min(5, prev.gear + 1);
      return {
        ...prev,
        gear: nextGear,
        rpm: Math.max(settings.idleRpm || 900, prev.rpm * 0.7) // RPM drops on upshift
      };
    });
  };

  const shiftDown = () => {
    onUpdateTelemetry((prev) => {
      const nextGear = prev.gear === 0 ? -1 : Math.max(0, prev.gear - 1);
      return {
        ...prev,
        gear: nextGear,
        rpm: Math.min(settings.revLimitRpm || 8500, prev.rpm * 1.35) // Rev match spike on downshift
      };
    });
  };

  const toggleHeadlights = () => {
    onUpdateTelemetry((prev) => ({
      ...prev,
      headlightsOn: !prev.headlightsOn
    }));
  };

  const toggleDoors = () => {
    onUpdateTelemetry((prev) => ({
      ...prev,
      doorsOpen: !prev.doorsOpen
    }));
  };

  return (
    <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex flex-col items-end">
      {/* Expanded Controls Card */}
      {isOpen && (
        <div className="bg-zinc-950/95 border border-zinc-800 rounded-2xl p-4 shadow-2xl backdrop-blur-xl mb-2 w-72 sm:w-80 text-xs font-mono-dash select-none animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-zinc-800 text-zinc-300">
            <span className="font-orbitron font-bold text-white flex items-center gap-1.5">
              <Sliders className="w-4 h-4" style={{ color: theme.primary }} />
              SIMULADOR DE CONDUÇÃO
            </span>
            <button
              onClick={onToggleSim}
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isSimRunning ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {isSimRunning ? 'MOTOR LIGADO' : 'MOTOR DESLIGADO'}
            </button>
          </div>

          {/* Throttle Pedal Slider */}
          <div className="my-3 space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>ACELERADOR (TPS):</span>
              <span className="font-bold text-white">{telemetry.tps.toFixed(0)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={telemetry.tps}
              onChange={(e) => handleThrottleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex gap-1.5 pt-1">
              <button
                onMouseDown={() => handleThrottleChange(100)}
                onMouseUp={() => handleThrottleChange(0)}
                onTouchStart={() => handleThrottleChange(100)}
                onTouchEnd={() => handleThrottleChange(0)}
                className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded font-bold text-[11px] tracking-wider active:scale-95 transition-all shadow-lg"
              >
                PÉ NO FUNDO (WOT)
              </button>
              <button
                onClick={() => handleThrottleChange(0)}
                className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-bold text-[11px]"
              >
                SOLTAR
              </button>
            </div>
          </div>

          {/* Gear Shifter Buttons */}
          <div className="my-3 space-y-1">
            <div className="flex justify-between text-[11px] text-zinc-400">
              <span>CÂMBIO MANUAL (MARCHAS):</span>
              <span className="font-bold text-amber-400">
                {telemetry.gear === 0 ? 'NEUTRO (N)' : telemetry.gear === -1 ? 'RÉ (R)' : `${telemetry.gear}ª MARCHA`}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={shiftDown}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded font-bold cursor-pointer"
              >
                <ChevronDown className="w-3.5 h-3.5" /> REDUZIR
              </button>
              <button
                onClick={shiftUp}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-200 rounded font-bold cursor-pointer"
              >
                <ChevronUp className="w-3.5 h-3.5" /> SUBIR
              </button>
            </div>
          </div>

          {/* Quick Vehicle Controls (Lights, Sound, VTEC) */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-zinc-800">
            <button
              onClick={toggleHeadlights}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded border text-[11px] transition-colors ${
                telemetry.headlightsOn
                  ? 'bg-amber-950 border-amber-600 text-amber-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span>FARÓIS</span>
            </button>

            <button
              onClick={onToggleSound}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded border text-[11px] transition-colors ${
                soundEnabled
                  ? 'bg-cyan-950 border-cyan-600 text-cyan-300'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>{soundEnabled ? 'ÁUDIO ATIVO' : 'MUDO'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono-dash text-white shadow-2xl backdrop-blur-md cursor-pointer transition-all hover:scale-105"
        style={{ borderColor: isOpen ? theme.primary : 'rgba(255,255,255,0.15)' }}
      >
        <Sliders className="w-4 h-4" style={{ color: theme.primary }} />
        <span className="hidden sm:inline">SIMULADOR ECU</span>
        <span className="font-bold text-emerald-400">{telemetry.rpm} RPM</span>
      </button>
    </div>
  );
};
