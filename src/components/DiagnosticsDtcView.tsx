import React, { useState } from 'react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { AlertTriangle, CheckCircle2, RefreshCw, Trash2, Cpu, Wrench, ShieldAlert } from 'lucide-react';

interface DiagnosticsDtcViewProps {
  settings: AppSettings;
  telemetry: TelemetryData;
  onClearDtc: () => void;
  onInjectTestDtc: (code: string) => void;
}

export const DiagnosticsDtcView: React.FC<DiagnosticsDtcViewProps> = ({
  settings,
  telemetry,
  onClearDtc,
  onInjectTestDtc
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [isScanning, setIsScanning] = useState(false);

  const dtcList = telemetry.dtcCodes || [];

  const handleScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
    }, 1200);
  };

  return (
    <div className="w-full h-full p-2 sm:p-4 md:p-6 flex flex-col justify-between select-none max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="w-full bg-zinc-950/90 border border-zinc-800 rounded-xl p-3 sm:p-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-2">
          <Wrench className="w-5 h-5" style={{ color: theme.primary }} />
          <span className="font-orbitron font-extrabold text-sm sm:text-base tracking-widest text-white">
            HONDA PGM-FI OBD-II DIAGNOSTICS & DTC SCANNER
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-mono-dash text-zinc-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isScanning ? 'ESCANEAR ECU...' : 'VERIFICAR FALHAS'}</span>
          </button>

          <button
            onClick={onClearDtc}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/60 hover:bg-red-900/80 border border-red-800 text-xs font-mono-dash text-red-300 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>LIMPAR CÓDIGOS (RESET MIL)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: DTC Codes List & Live PID Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-auto">
        {/* Left Column: DTC Trouble Codes */}
        <div className="md:col-span-7 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="w-full flex items-center justify-between text-xs font-mono-dash text-zinc-400 pb-2 border-b border-zinc-800">
            <span className="flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>CÓDIGOS DE AVARIA IDENTIFICADOS ({dtcList.length})</span>
            </span>
            <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${
              dtcList.length > 0 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
            }`}>
              {dtcList.length > 0 ? 'CHECK ENGINE ATIVO' : 'NENHUMA FALHA ATIVA'}
            </span>
          </div>

          <div className="space-y-3 my-4 max-h-64 overflow-y-auto pr-1">
            {dtcList.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 text-zinc-500">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                <span className="font-mono-dash text-sm text-zinc-300 font-bold">
                  SISTEMA DE INJEÇÃO PGM-FI 100% OPERACIONAL
                </span>
                <span className="text-xs">Nenhum código de falha registrado na memória da ECU.</span>
              </div>
            ) : (
              dtcList.map((dtc, index) => (
                <div
                  key={index}
                  className="bg-zinc-900/90 border border-red-900/50 rounded-xl p-3.5 flex items-start justify-between"
                >
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-mono-dash font-black text-red-400 text-sm tracking-wider block">
                        {dtc.split(':')[0] || dtc}
                      </span>
                      <span className="text-xs text-zinc-300 font-chakra">
                        {dtc.split(':')[1] || 'Sensor / Circuito com leitura fora do padrão da ECU'}
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-[10px] font-mono-dash text-zinc-400">
                    CONFIRMADO
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Test injector buttons */}
          <div className="border-t border-zinc-800 pt-3 flex items-center justify-between text-xs font-mono-dash text-zinc-400">
            <span>SIMULAR CÓDIGO DE TESTE:</span>
            <div className="flex gap-2">
              <button
                onClick={() => onInjectTestDtc('P0135: Circuito Aquecedor Sensor O2 (Banco 1)')}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-700 cursor-pointer"
              >
                + P0135 (O2)
              </button>
              <button
                onClick={() => onInjectTestDtc('P0505: Válvula IACV Marcha Lenta Falha')}
                className="px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[11px] text-zinc-300 border border-zinc-700 cursor-pointer"
              >
                + P0505 (IACV)
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Real-time Live PIDs from ECU */}
        <div className="md:col-span-5 bg-zinc-950/90 border border-zinc-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="w-full flex items-center justify-between text-xs font-mono-dash text-zinc-400 pb-2 border-b border-zinc-800">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>LIVE ECU PIDs STREAM</span>
            </span>
            <span className="text-zinc-500">OBD-II MODE 01</span>
          </div>

          <div className="space-y-2 my-auto font-mono-dash text-xs">
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 010C - ENGINE RPM</span>
              <span className="font-bold text-white">{telemetry.rpm} RPM</span>
            </div>
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 010D - SPEED</span>
              <span className="font-bold text-white">{telemetry.speed} km/h</span>
            </div>
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 0105 - COOLANT TEMP (ECT)</span>
              <span className="font-bold text-white">{telemetry.ect}°C</span>
            </div>
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 010F - INTAKE AIR (IAT)</span>
              <span className="font-bold text-white">{telemetry.iat}°C</span>
            </div>
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 010B - MANIFOLD (MAP)</span>
              <span className="font-bold text-white">{telemetry.map} kPa</span>
            </div>
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 0111 - THROTTLE (TPS)</span>
              <span className="font-bold text-white">{telemetry.tps.toFixed(0)}%</span>
            </div>
            <div className="flex justify-between bg-zinc-900/60 p-2 rounded border border-zinc-800/80">
              <span className="text-zinc-400">PID 0142 - CONTROL MODULE VOLTAGE</span>
              <span className="font-bold text-white">{telemetry.batteryVoltage.toFixed(1)} V</span>
            </div>
          </div>

          <div className="text-[10px] font-mono-dash text-zinc-500 text-center border-t border-zinc-800 pt-2">
            TAXA DE ATUALIZAÇÃO OBD: 20 Hz (50ms)
          </div>
        </div>
      </div>
    </div>
  );
};
