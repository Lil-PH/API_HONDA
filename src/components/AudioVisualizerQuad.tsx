import React, { useState } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { Activity, Radio, Gauge, Zap } from 'lucide-react';

interface AudioVisualizerQuadProps {
  settings: AppSettings;
  telemetry: TelemetryData;
}

export const AudioVisualizerQuad: React.FC<AudioVisualizerQuadProps> = ({ settings, telemetry }) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [viewMode, setViewMode] = useState<'visualizer' | 'ecu_graph'>('visualizer');

  // Total bars in the equalizer
  const bars = telemetry.audioFrequencies || Array(24).fill(0.3);

  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative">
      {/* Header */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'visualizer' ? 'ecu_graph' : 'visualizer')}
            className="font-orbitron font-bold text-xs sm:text-sm tracking-widest text-zinc-100 flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer"
          >
            {viewMode === 'visualizer' ? (
              <>
                <Activity className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                <span>AUDIO VISUALIZER</span>
              </>
            ) : (
              <>
                <Gauge className="w-3.5 h-3.5" style={{ color: theme.primary }} />
                <span>ECU TELEMETRY WAVE</span>
              </>
            )}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'visualizer' ? 'ecu_graph' : 'visualizer')}
            className="px-2 py-0.5 rounded text-[10px] font-mono-dash font-bold tracking-wider text-zinc-400 hover:text-white border border-zinc-800 transition-colors"
          >
            {viewMode === 'visualizer' ? 'SIMULATED INPUT' : 'OBD LIVE PIDs'}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-auto w-full flex items-end justify-center h-28 sm:h-36 pt-2 pb-1">
        {viewMode === 'visualizer' ? (
          /* Segmented Equalizer Spectrum (Exact style of reference screenshot) */
          <div className="w-full h-full flex items-end justify-between gap-1 sm:gap-1.5 px-2">
            {bars.map((val, idx) => {
              // Number of vertical segments per bar (up to 12 segments)
              const maxSegments = 12;
              const activeCount = Math.max(1, Math.round(val * maxSegments));

              return (
                <div key={idx} className="flex-1 flex flex-col-reverse gap-[2px] h-full justify-start items-center">
                  {Array.from({ length: maxSegments }).map((_, segIdx) => {
                    const isActive = segIdx < activeCount;
                    const isPeak = segIdx >= 9;

                    return (
                      <div
                        key={segIdx}
                        className={`w-full h-1.5 sm:h-2 rounded-[1px] transition-all duration-75 ${
                          isActive
                            ? isPeak
                              ? 'bg-amber-300 shadow-[0_0_6px_rgba(252,211,77,0.8)]'
                              : 'shadow-[0_0_4px_currentColor]'
                            : 'bg-zinc-900/60'
                        }`}
                        style={
                          isActive && !isPeak
                            ? {
                                backgroundColor: theme.primary,
                                color: theme.primary
                              }
                            : {}
                        }
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        ) : (
          /* ECU Telemetry Waveform View */
          <div className="w-full h-full flex flex-col justify-between py-1 px-2 font-mono-dash">
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-zinc-900/80 p-1.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">AFR LAMBDA</span>
                <span className="font-bold text-sm" style={{ color: theme.primary }}>
                  {telemetry.afr.toFixed(2)}
                </span>
              </div>
              <div className="bg-zinc-900/80 p-1.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">TPS VALVE</span>
                <span className="font-bold text-sm text-zinc-200">
                  {telemetry.tps.toFixed(0)}%
                </span>
              </div>
              <div className="bg-zinc-900/80 p-1.5 rounded border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block">MANIFOLD (MAP)</span>
                <span className="font-bold text-sm text-zinc-200">
                  {telemetry.map.toFixed(0)} kPa
                </span>
              </div>
            </div>

            {/* Spark & Duty progress gauges */}
            <div className="space-y-1.5 text-[11px]">
              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>IGNITION TIMING ADVANCE</span>
                  <span className="font-bold text-zinc-200">+{telemetry.timingAdvanceDeg.toFixed(1)}°</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (telemetry.timingAdvanceDeg / 40) * 100)}%`,
                      backgroundColor: theme.primary
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-zinc-400 text-[10px]">
                  <span>INJECTOR DUTY CYCLE</span>
                  <span className="font-bold text-zinc-200">{telemetry.injectorDutyPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, telemetry.injectorDutyPct)}%`,
                      backgroundColor: telemetry.injectorDutyPct > 85 ? '#ef4444' : theme.secondary
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="w-full flex items-center justify-between text-[10px] font-mono-dash text-zinc-500 border-t border-zinc-800/80 pt-1.5 z-10">
        <span className="flex items-center gap-1">
          <Radio className="w-3 h-3 text-emerald-400" />
          <span>FREQ: 44.1 kHz</span>
        </span>
        <span className="flex items-center gap-1 text-zinc-400">
          <Zap className="w-3 h-3 text-amber-400" />
          <span>VTEC CAM: {telemetry.vtecActive ? 'HIGH LIFT' : 'LOW LIFT'}</span>
        </span>
      </div>
    </div>
  );
};
