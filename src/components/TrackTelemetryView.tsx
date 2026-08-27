import React, { useState, useEffect } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { Timer, Zap, Trophy, RefreshCw, Gauge, Target } from 'lucide-react';
import confetti from 'canvas-confetti';

interface TrackTelemetryViewProps {
  settings: AppSettings;
  telemetry: TelemetryData;
}

export const TrackTelemetryView: React.FC<TrackTelemetryViewProps> = ({ settings, telemetry }) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;

  const [zeroToHundred, setZeroToHundred] = useState<number | null>(7.42);
  const [zeroToSixty, setZeroToSixty] = useState<number | null>(4.85);
  const [quarterMile, setQuarterMile] = useState<number | null>(15.2);
  const [maxSpeed, setMaxSpeed] = useState<number>(195);
  const [maxRpm, setMaxRpm] = useState<number>(8450);
  const [isTiming, setIsTiming] = useState(false);
  const [currentRunElapsed, setCurrentRunElapsed] = useState(0);
  const [runStartTime, setRunStartTime] = useState<number | null>(null);

  // Peak recording
  useEffect(() => {
    if (telemetry.speed > maxSpeed) {
      setMaxSpeed(telemetry.speed);
    }
    if (telemetry.rpm > maxRpm) {
      setMaxRpm(telemetry.rpm);
    }
  }, [telemetry.speed, telemetry.rpm, maxSpeed, maxRpm]);

  // Automatic 0-100 timing trigger when vehicle accelerates from stop
  useEffect(() => {
    if (telemetry.speed === 0 && !isTiming) {
      // Ready on staging line
    } else if (telemetry.speed > 0 && telemetry.speed < 5 && !isTiming) {
      // Launch detected!
      setIsTiming(true);
      setRunStartTime(Date.now());
    } else if (isTiming && telemetry.speed >= 100 && runStartTime) {
      // Finished 0-100 run
      const elapsedSec = (Date.now() - runStartTime) / 1000;
      setZeroToHundred(parseFloat(elapsedSec.toFixed(2)));
      setIsTiming(false);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      } catch {}
    }
  }, [telemetry.speed, isTiming, runStartTime]);

  // Live timer tick
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTiming && runStartTime) {
      interval = setInterval(() => {
        setCurrentRunElapsed((Date.now() - runStartTime) / 1000);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isTiming, runStartTime]);

  const resetStats = () => {
    setZeroToHundred(null);
    setZeroToSixty(null);
    setQuarterMile(null);
    setMaxSpeed(telemetry.speed);
    setMaxRpm(telemetry.rpm);
    setIsTiming(false);
    setCurrentRunElapsed(0);
    setRunStartTime(null);
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 flex flex-col justify-between select-none max-w-7xl mx-auto space-y-4">
      {/* Top Header */}
      <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span className="font-orbitron font-extrabold text-sm sm:text-base tracking-widest text-white">
            DRAG & TRACK TELEMETRY // 0-100 KM/H
          </span>
        </div>
        <button
          onClick={resetStats}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono-dash text-zinc-300 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>RESETAR DADOS</span>
        </button>
      </div>

      {/* Main Grid: Sprint Timers & G-Force Ball */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-auto">
        {/* 0-100 km/h Live Sprint Timer Card */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between items-center text-center relative overflow-hidden">
          <div className="w-full flex items-center justify-between text-xs font-mono-dash text-zinc-400 pb-2 border-b border-zinc-800">
            <span>0 - 100 KM/H SPRINT</span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              isTiming ? 'bg-red-600 text-white animate-ping' : 'bg-zinc-900 text-emerald-400'
            }`}>
              {isTiming ? 'GRAVANDO ARRANCADA...' : 'PRONTO PARA LARGADA'}
            </span>
          </div>

          <div className="my-6">
            <span className="font-orbitron font-black text-6xl sm:text-7xl text-white tracking-tight drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              {isTiming ? currentRunElapsed.toFixed(2) : zeroToHundred ? zeroToHundred.toFixed(2) : '--.--'}
            </span>
            <span className="block font-orbitron font-bold text-sm text-zinc-400 mt-1">
              SEGUNDOS
            </span>
          </div>

          <div className="w-full text-xs font-mono-dash text-zinc-400 bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
            <span>VELOCIDADE ATUAL: </span>
            <span className="font-bold text-white text-sm">{telemetry.speed} km/h</span>
          </div>
        </div>

        {/* 2D G-Force Sensor Meter */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between items-center text-center">
          <div className="w-full flex items-center justify-between text-xs font-mono-dash text-zinc-400 pb-2 border-b border-zinc-800">
            <span>G-FORCE ACCELEROMETER</span>
            <span className="text-zinc-500">2-AXIS SENSOR</span>
          </div>

          {/* Circular G-Force Grid */}
          <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-full border-2 border-zinc-800 flex items-center justify-center my-3 bg-zinc-900/30">
            {/* Concentric rings */}
            <div className="absolute w-3/4 h-3/4 rounded-full border border-zinc-800" />
            <div className="absolute w-1/2 h-1/2 rounded-full border border-zinc-800" />
            {/* Crosshairs */}
            <div className="absolute w-full h-[1px] bg-zinc-800" />
            <div className="absolute h-full w-[1px] bg-zinc-800" />

            {/* Live G-Ball */}
            <div
              className="absolute w-4 h-4 rounded-full shadow-[0_0_12px_currentColor] transition-all duration-75"
              style={{
                backgroundColor: theme.primary,
                color: theme.primary,
                transform: `translate(${telemetry.gForce.x * 40}px, ${-telemetry.gForce.y * 40}px)`
              }}
            />

            <span className="absolute top-1 text-[9px] font-mono-dash text-zinc-500">FRENAGEM</span>
            <span className="absolute bottom-1 text-[9px] font-mono-dash text-zinc-500">ACELERAÇÃO</span>
            <span className="absolute left-1 text-[9px] font-mono-dash text-zinc-500">L</span>
            <span className="absolute right-1 text-[9px] font-mono-dash text-zinc-500">R</span>
          </div>

          <div className="w-full flex justify-between text-xs font-mono-dash text-zinc-300">
            <span>LATERAL: {telemetry.gForce.x > 0 ? `+${telemetry.gForce.x.toFixed(2)}` : telemetry.gForce.x.toFixed(2)}G</span>
            <span>LONGITUDINAL: {telemetry.gForce.y > 0 ? `+${telemetry.gForce.y.toFixed(2)}` : telemetry.gForce.y.toFixed(2)}G</span>
          </div>
        </div>

        {/* Peak Records & Trap Speeds */}
        <div className="bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="w-full flex items-center justify-between text-xs font-mono-dash text-zinc-400 pb-2 border-b border-zinc-800">
            <span>RECORDES DA SESSÃO</span>
            <Target className="w-4 h-4 text-cyan-400" />
          </div>

          <div className="space-y-3 my-auto">
            <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
              <span className="text-xs font-mono-dash text-zinc-400">VELOCIDADE MÁXIMA</span>
              <span className="font-orbitron font-extrabold text-xl text-white">{maxSpeed} km/h</span>
            </div>

            <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
              <span className="text-xs font-mono-dash text-zinc-400">PICO DE RPM</span>
              <span className="font-orbitron font-extrabold text-xl text-amber-400">{maxRpm} RPM</span>
            </div>

            <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
              <span className="text-xs font-mono-dash text-zinc-400">0 - 60 MPH</span>
              <span className="font-orbitron font-extrabold text-xl text-zinc-200">
                {zeroToSixty ? `${zeroToSixty.toFixed(2)}s` : '--.--'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-800/80">
              <span className="text-xs font-mono-dash text-zinc-400">1/4 DE MILHA (402M)</span>
              <span className="font-orbitron font-extrabold text-xl text-zinc-200">
                {quarterMile ? `${quarterMile.toFixed(1)}s` : '--.--'}
              </span>
            </div>
          </div>

          <div className="text-[10px] font-mono-dash text-zinc-500 text-center border-t border-zinc-800 pt-2">
            TELEMETRIA GPS + SENSOR OBD-II SINCRONIZADA
          </div>
        </div>
      </div>
    </div>
  );
};
