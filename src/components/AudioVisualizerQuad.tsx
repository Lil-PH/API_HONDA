import React, { useState, useEffect, useRef } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { Activity, Radio, Gauge, Zap, Mic, MicOff, AlertCircle, Play, Sliders } from 'lucide-react';

interface AudioVisualizerQuadProps {
  settings: AppSettings;
  telemetry: TelemetryData;
}

export type VisualizerSourceMode = 'mic' | 'simulated' | 'ecu_pids';

export const AudioVisualizerQuad: React.FC<AudioVisualizerQuadProps> = ({ settings, telemetry }) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  
  // Source mode: 'mic' (real hardware microphone), 'simulated' (audio spectrum simulation), 'ecu_pids' (ECU telemetry waveform)
  const [sourceMode, setSourceMode] = useState<VisualizerSourceMode>('simulated');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [isRequestingPermission, setIsRequestingPermission] = useState<boolean>(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [micFrequencies, setMicFrequencies] = useState<number[]>(Array(24).fill(0.05));
  const [simulatedFrequencies, setSimulatedFrequencies] = useState<number[]>(
    Array.from({ length: 24 }).map((_, i) => Math.sin(i * 0.5) * 0.3 + 0.45)
  );
  const [peakDb, setPeakDb] = useState<number>(-60);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const simAnimFrameRef = useRef<number | null>(null);
  const smoothBarsRef = useRef<number[]>(Array(24).fill(0.05));
  const smoothSimRef = useRef<number[]>(
    Array.from({ length: 24 }).map((_, i) => Math.sin(i * 0.5) * 0.3 + 0.45)
  );

  const startMicrophone = async () => {
    try {
      setIsRequestingPermission(true);
      setMicError(null);

      // Clean up previous instance
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }

      // Explicitly trigger browser hardware permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });
      
      streamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') {
        await audioCtx.resume();
      }
      audioContextRef.current = audioCtx;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 128; // 64 frequency bands
      analyser.smoothingTimeConstant = 0.78;
      analyserRef.current = analyser;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      setIsMicActive(true);
      setSourceMode('mic');
      setIsRequestingPermission(false);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const render = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        // Group into 12 base frequency bands for center-out stereo mirroring (24 bars total)
        const halfBands = 12;
        const halfValues = new Array(halfBands).fill(0);
        let maxVal = 0;

        for (let i = 0; i < halfBands; i++) {
          const startIdx = Math.floor(Math.pow(i / halfBands, 1.45) * (bufferLength - 2));
          const endIdx = Math.max(startIdx + 1, Math.floor(Math.pow((i + 1) / halfBands, 1.45) * bufferLength));
          let sum = 0;
          let count = 0;
          for (let j = startIdx; j < endIdx && j < bufferLength; j++) {
            sum += dataArray[j];
            count++;
          }
          const avg = count > 0 ? sum / count : 0;
          const normalized = Math.min(1, Math.max(0.04, avg / 255));
          if (normalized > maxVal) maxVal = normalized;

          // Decay physics
          const prev = smoothBarsRef.current[i] || 0.05;
          if (normalized > prev) {
            smoothBarsRef.current[i] = prev + (normalized - prev) * 0.78;
          } else {
            smoothBarsRef.current[i] = prev * 0.86;
          }
          halfValues[i] = smoothBarsRef.current[i];
        }

        // Radiate from Center to Sides: [High ... Low (Center) Low ... High]
        const centerOutBands: number[] = [];
        // Left half (High -> Low towards center)
        for (let i = halfBands - 1; i >= 0; i--) {
          centerOutBands.push(halfValues[i]);
        }
        // Right half (Low from center -> High outwards)
        for (let i = 0; i < halfBands; i++) {
          centerOutBands.push(halfValues[i]);
        }

        setMicFrequencies(centerOutBands);
        setPeakDb(Math.round(20 * Math.log10(Math.max(0.001, maxVal))));
        animationFrameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (err: unknown) {
      console.warn('Microphone permission or access error:', err);
      setIsRequestingPermission(false);
      setIsMicActive(false);
      const errMsg = err instanceof Error 
        ? (err.name === 'NotAllowedError' ? 'Permissão de microfone negada no aparelho. Conceda permissão no navegador.' : err.message)
        : 'Microfone não disponível.';
      setMicError(errMsg);
    }
  };

  const stopMicrophone = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    setIsMicActive(false);
  };

  const selectMode = (mode: VisualizerSourceMode) => {
    if (mode === 'mic') {
      if (!isMicActive) {
        startMicrophone();
      } else {
        setSourceMode('mic');
      }
    } else if (mode === 'simulated') {
      if (isMicActive) {
        stopMicrophone();
      }
      setMicError(null);
      setSourceMode('simulated');
    } else if (mode === 'ecu_pids') {
      if (isMicActive) {
        stopMicrophone();
      }
      setMicError(null);
      setSourceMode('ecu_pids');
    }
  };

  // Active simulated audio equalizer animation loop (fluid harmonics matching v1 behavior)
  useEffect(() => {
    if (sourceMode !== 'simulated') {
      if (simAnimFrameRef.current) {
        cancelAnimationFrame(simAnimFrameRef.current);
        simAnimFrameRef.current = null;
      }
      return;
    }

    const animateSim = (time: number) => {
      const rpmFactor = Math.max(0.15, (telemetry.rpm || 0) / (settings.revLimitRpm || 8500));
      const tpsFactor = (telemetry.tps || 0) / 100;
      const vtecBoost = telemetry.vtecActive ? 0.35 : 0;

      const bands = new Array(24).fill(0);
      for (let i = 0; i < 24; i++) {
        // Multi-frequency wave synthesis for organic sound visualizer behavior
        const mainWave = Math.sin((time / 110) * (1 + (i / 24) * 1.8) + i * 0.45) * 0.35 + 0.55;
        const subHarmonic = Math.cos((time / 170) * 2.2 + i * 0.7) * 0.2;
        const beatPulse = Math.sin(time / 240) > 0.65 ? 0.18 : 0;
        
        // Bass bands (0-6) react more to beat and RPM
        const bandBias = i < 6 ? 1.15 : i > 18 ? 0.88 : 1.0;
        const rawEnergy = (mainWave + subHarmonic + beatPulse) * bandBias;
        const dynamicEnergy = rawEnergy * (0.5 + rpmFactor * 0.45 + tpsFactor * 0.25 + vtecBoost);

        const target = Math.max(0.08, Math.min(1.0, dynamicEnergy));
        
        // Smooth interpolation for natural bouncing
        const prev = smoothSimRef.current[i] || 0.3;
        smoothSimRef.current[i] = prev + (target - prev) * 0.28;
        bands[i] = smoothSimRef.current[i];
      }

      setSimulatedFrequencies([...bands]);
      simAnimFrameRef.current = requestAnimationFrame(animateSim);
    };

    simAnimFrameRef.current = requestAnimationFrame(animateSim);

    return () => {
      if (simAnimFrameRef.current) {
        cancelAnimationFrame(simAnimFrameRef.current);
        simAnimFrameRef.current = null;
      }
    };
  }, [sourceMode, telemetry.rpm, telemetry.tps, telemetry.vtecActive, settings.revLimitRpm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMicrophone();
      if (simAnimFrameRef.current) {
        cancelAnimationFrame(simAnimFrameRef.current);
      }
    };
  }, []);

  // Determine current equalizer bars data (simulated frequencies move continuously like v1)
  const bars = sourceMode === 'mic' && isMicActive
    ? micFrequencies
    : sourceMode === 'simulated'
    ? simulatedFrequencies
    : telemetry.audioFrequencies || Array(24).fill(0.05);

  return (
    <div className="w-full h-full flex flex-col justify-between select-none relative">
      {/* Header with Title */}
      <div className="flex items-center justify-between z-10 gap-0.5 overflow-hidden">
        <div className="flex items-center space-x-1 overflow-hidden">
          <span 
            className="font-orbitron font-bold text-[7px] sm:text-[9px] md:text-[10px] tracking-wider uppercase truncate"
            style={{ color: theme.primary }}
          >
            AUDIO VISUALIZER
          </span>
        </div>
      </div>

      {/* Main Content Display Area */}
      <div className="my-auto w-full flex items-end justify-center h-14 sm:h-20 md:h-26 pt-0.5 pb-0.5 overflow-hidden">
        {sourceMode === 'ecu_pids' ? (
          /* ECU Telemetry Waveform View */
          <div className="w-full h-full flex flex-col justify-between py-0.5 px-0.5 sm:px-1 font-mono-dash">
            <div className="grid grid-cols-3 gap-1 text-center text-[7px] sm:text-xs">
              <div className="bg-zinc-900/80 p-0.5 sm:p-1 rounded border border-zinc-800">
                <span className="text-[6px] sm:text-[8px] text-zinc-500 block truncate">AFR</span>
                <span className="font-bold text-[8px] sm:text-xs" style={{ color: theme.primary }}>
                  {telemetry.afr.toFixed(1)}
                </span>
              </div>
              <div className="bg-zinc-900/80 p-0.5 sm:p-1 rounded border border-zinc-800">
                <span className="text-[6px] sm:text-[8px] text-zinc-500 block truncate">TPS</span>
                <span className="font-bold text-[8px] sm:text-xs text-zinc-200">
                  {telemetry.tps.toFixed(0)}%
                </span>
              </div>
              <div className="bg-zinc-900/80 p-0.5 sm:p-1 rounded border border-zinc-800">
                <span className="text-[6px] sm:text-[8px] text-zinc-500 block truncate">MAP</span>
                <span className="font-bold text-[8px] sm:text-xs text-zinc-200">
                  {telemetry.map.toFixed(0)}k
                </span>
              </div>
            </div>

            {/* Spark & Duty progress gauges */}
            <div className="space-y-0.5 sm:space-y-1 text-[7px] sm:text-[10px]">
              <div>
                <div className="flex justify-between text-zinc-400 text-[6px] sm:text-[8px]">
                  <span>IGN TIMING</span>
                  <span className="font-bold text-zinc-200">+{telemetry.timingAdvanceDeg.toFixed(1)}°</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 sm:h-1.5 rounded-full overflow-hidden">
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
                <div className="flex justify-between text-zinc-400 text-[6px] sm:text-[8px]">
                  <span>INJ DUTY</span>
                  <span className="font-bold text-zinc-200">{telemetry.injectorDutyPct.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-zinc-900 h-1 sm:h-1.5 rounded-full overflow-hidden">
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
        ) : (
          /* Segmented Equalizer Spectrum (Real microphone OR Simulated) */
          <div className="w-full h-full flex flex-col justify-end relative overflow-hidden">
            {micError && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/85 backdrop-blur-[2px] p-1 text-center rounded border border-rose-500/30">
                <div className="text-[6.5px] xs:text-[7.5px] sm:text-[9px] font-mono-dash text-rose-300 flex flex-col items-center gap-0.5 max-w-[95%]">
                  <AlertCircle className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 text-rose-400 shrink-0" />
                  <span className="truncate max-w-full leading-tight font-bold">{micError}</span>
                  <button
                    type="button"
                    onClick={startMicrophone}
                    className="mt-0.5 px-1.5 py-0.5 bg-rose-950/90 border border-rose-500/50 rounded text-rose-200 hover:bg-rose-900 text-[6px] xs:text-[7px] font-bold cursor-pointer transition-all active:scale-95"
                  >
                    TENTAR
                  </button>
                </div>
              </div>
            )}

            {sourceMode === 'mic' && !isMicActive && !micError && !isRequestingPermission && (
              <div 
                onClick={startMicrophone}
                className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-[2px] cursor-pointer rounded p-1"
              >
                <button
                  type="button"
                  onClick={startMicrophone}
                  className="text-[6.5px] xs:text-[7.5px] sm:text-[9px] font-mono-dash font-bold text-emerald-300 bg-emerald-950/95 px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded border border-emerald-500/60 flex items-center gap-1 shadow-[0_0_10px_rgba(16,185,129,0.35)] hover:scale-105 transition-transform active:scale-95 cursor-pointer leading-tight"
                >
                  <Mic className="w-2 h-2 sm:w-2.5 sm:h-2.5 text-emerald-400 shrink-0 animate-pulse" />
                  <span>ATIVAR MIC</span>
                </button>
              </div>
            )}

            {isRequestingPermission && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 backdrop-blur-[2px] rounded p-1">
                <div className="text-[6.5px] xs:text-[7.5px] sm:text-[9px] font-mono-dash text-amber-300 flex items-center gap-1 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/40 animate-pulse">
                  <Mic className="w-2 h-2 text-amber-400 shrink-0 animate-spin" />
                  <span>SOLICITANDO...</span>
                </div>
              </div>
            )}

            <div className="w-full h-full flex items-end justify-between gap-[1px] sm:gap-1 px-0.5">
              {bars.map((val, idx) => {
                const maxSegments = 10;
                const activeCount = Math.max(1, Math.round(val * maxSegments));

                return (
                  <div key={idx} className="flex-1 flex flex-col-reverse gap-[1px] h-full justify-start items-center">
                    {Array.from({ length: maxSegments }).map((_, segIdx) => {
                      const isActive = segIdx < activeCount;
                      const isPeak = segIdx >= 8;

                      return (
                        <div
                          key={segIdx}
                          className={`w-full h-[3px] sm:h-1 rounded-[1px] transition-all duration-75 ${
                            isActive
                              ? isPeak
                                ? 'bg-amber-300 shadow-[0_0_4px_rgba(252,211,77,0.8)]'
                                : 'shadow-[0_0_3px_currentColor]'
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
          </div>
        )}
      </div>

      {/* Footer Info with 3 Selectable Modes Pill (SIM | MIC | ECU) - Optimized for 240x320 & 320x240 */}
      <div className="w-full flex items-center justify-between text-[6px] xs:text-[7px] sm:text-[8px] font-mono-dash text-zinc-500 border-t border-zinc-800/80 pt-0.5 z-10 gap-0.5 overflow-hidden select-none">
        {/* Left: Audio Source Status */}
        <span className="flex items-center gap-0.5 truncate shrink-0 max-w-[32%] xs:max-w-none">
          <Radio className={`w-2 h-2 shrink-0 ${isMicActive ? 'text-emerald-400 animate-pulse' : 'text-zinc-600'}`} />
          <span className="truncate text-[5.5px] xs:text-[6.5px] sm:text-[8px]">
            {sourceMode === 'mic'
              ? (isMicActive ? `${peakDb}dB` : 'MIC OFF')
              : sourceMode === 'simulated'
              ? '44.1k'
              : 'OBD'}
          </span>
        </span>

        {/* Center: 3 Selectable Modes (SIM | MIC | ECU) */}
        <div className="flex items-center bg-zinc-950/90 p-[1px] sm:p-0.5 rounded border border-zinc-800 gap-[1px] sm:gap-0.5 shrink-0">
          {/* SIM BUTTON */}
          <button
            type="button"
            onClick={() => selectMode('simulated')}
            className={`px-0.5 sm:px-1 py-[1px] sm:py-0.5 rounded text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono-dash font-bold tracking-tight flex items-center gap-0.5 transition-all cursor-pointer leading-none ${
              sourceMode === 'simulated'
                ? 'text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={
              sourceMode === 'simulated'
                ? {
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 6px ${theme.glow}`,
                    color: '#ffffff'
                  }
                : {}
            }
            title="Simulação interna de áudio"
          >
            <Play className="w-1.5 h-1.5 text-sky-300 shrink-0" />
            <span>SIM</span>
          </button>

          {/* MIC BUTTON */}
          <button
            type="button"
            onClick={() => selectMode('mic')}
            className={`px-0.5 sm:px-1 py-[1px] sm:py-0.5 rounded text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono-dash font-bold tracking-tight flex items-center gap-0.5 transition-all cursor-pointer leading-none ${
              sourceMode === 'mic' && isMicActive
                ? 'text-emerald-200 border border-emerald-500/60 shadow-[0_0_6px_rgba(16,185,129,0.3)] animate-pulse'
                : isRequestingPermission
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                : sourceMode === 'mic'
                ? 'text-white'
                : 'text-zinc-400 hover:text-white'
            }`}
            style={
              sourceMode === 'mic'
                ? isMicActive
                  ? { backgroundColor: 'rgba(16,185,129,0.3)' }
                  : {
                      backgroundColor: theme.primary,
                      boxShadow: `0 0 6px ${theme.glow}`,
                      color: '#ffffff'
                    }
                : {}
            }
            title="Ativar microfone do aparelho"
          >
            {isMicActive ? (
              <Mic className="w-1.5 h-1.5 text-emerald-400 shrink-0" />
            ) : (
              <MicOff className="w-1.5 h-1.5 text-zinc-400 shrink-0" />
            )}
            <span>MIC</span>
          </button>

          {/* ECU BUTTON */}
          <button
            type="button"
            onClick={() => selectMode('ecu_pids')}
            className={`px-0.5 sm:px-1 py-[1px] sm:py-0.5 rounded text-[5.5px] xs:text-[6.5px] sm:text-[8px] font-mono-dash font-bold tracking-tight flex items-center gap-0.5 transition-all cursor-pointer leading-none ${
              sourceMode === 'ecu_pids'
                ? 'text-white shadow'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
            style={
              sourceMode === 'ecu_pids'
                ? {
                    backgroundColor: theme.primary,
                    boxShadow: `0 0 6px ${theme.glow}`,
                    color: '#ffffff'
                  }
                : {}
            }
            title="Telemetria da ECU"
          >
            <Gauge className="w-1.5 h-1.5 text-amber-300 shrink-0" />
            <span>ECU</span>
          </button>
        </div>

        {/* Right: VTEC Cam Status */}
        <span className="flex items-center gap-0.5 text-zinc-400 shrink-0">
          <Zap className="w-2 h-2 text-amber-400 shrink-0" />
          <span className="text-[5.5px] xs:text-[6.5px] sm:text-[8px]">{telemetry.vtecActive ? 'VTEC' : 'LOW CAM'}</span>
        </span>
      </div>
    </div>
  );
};
