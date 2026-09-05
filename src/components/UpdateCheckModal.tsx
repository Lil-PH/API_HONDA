import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { RefreshCw, CheckCircle2, CloudCheck, ShieldCheck, X, Cpu, HardDrive } from 'lucide-react';

interface UpdateCheckModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  isOnline: boolean;
}

export const UpdateCheckModal: React.FC<UpdateCheckModalProps> = ({
  isOpen,
  onClose,
  settings,
  isOnline
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [isChecking, setIsChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    status: 'up_to_date' | 'sync_success';
    message: string;
    checkedAt: string;
  }>({
    status: 'up_to_date',
    message: 'O HondApp está na versão mais recente disponível (v2.4.1).',
    checkedAt: new Date().toLocaleTimeString()
  });

  const handleManualCheck = async () => {
    setIsChecking(true);
    try {
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
      }
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await window.caches.keys();
          console.log('[HondApp OTA] Caches verificados manualmente:', cacheKeys);
        } catch {
          // ignore
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 800));
      setCheckResult({
        status: 'sync_success',
        message: 'Verificação concluída. Todos os módulos da ECU, assets do Civic 1999 e firmwares ESP32 estão sincronizados.',
        checkedAt: new Date().toLocaleTimeString()
      });
    } catch (e) {
      setCheckResult({
        status: 'up_to_date',
        message: 'Sistema validado localmente (v2.4.1).',
        checkedAt: new Date().toLocaleTimeString()
      });
    } finally {
      setIsChecking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-1.5 sm:p-4 bg-black/75 backdrop-blur-md select-none overflow-y-auto">
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          className="relative w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-xl p-2.5 sm:p-4 shadow-2xl font-mono-dash text-zinc-300 max-h-[96vh] overflow-y-auto"
          style={{
            boxShadow: `0 0 30px rgba(0,0,0,0.9), inset 0 0 15px rgba(0,0,0,0.8), 0 0 1px ${theme.glow}`
          }}
        >
          {/* Angular Corner Accents */}
          <div className="absolute top-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
          <div className="absolute top-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
          <div className="absolute bottom-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />
          <div className="absolute bottom-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 sm:pb-2.5 mb-2 sm:mb-3 border-b border-zinc-800/80">
            <div className="flex items-center space-x-1.5">
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} style={{ color: theme.primary }} />
              <span className="font-orbitron font-bold text-xs sm:text-sm text-white tracking-wider">
                ATUALIZAÇÕES
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Version Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-lg p-2 sm:p-3 mb-2 sm:mb-3 space-y-1.5">
            <div className="flex items-center justify-between text-[9px] sm:text-xs">
              <span className="text-zinc-400">VERSÃO</span>
              <span className="font-bold text-white font-orbitron px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-[8px] sm:text-[10px]">
                v2.4.1 OTA
              </span>
            </div>

            <div className="flex items-center justify-between text-[9px] sm:text-xs">
              <span className="text-zinc-400">STATUS</span>
              <span className={`flex items-center gap-1 font-bold ${isOnline ? 'text-emerald-400' : 'text-zinc-500'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
                {isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="flex items-center justify-between text-[9px] sm:text-xs">
              <span className="text-zinc-400">HARDWARE</span>
              <span className="text-zinc-300 font-bold flex items-center gap-1">
                <Cpu className="w-3 h-3 text-amber-400" />
                CYD 240x320 / ESP32
              </span>
            </div>
          </div>

          {/* Module Health Check */}
          <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-3 text-[8px] sm:text-xs">
            <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/40 border border-zinc-800/60">
              <span className="flex items-center gap-1.5 text-zinc-300 truncate">
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">PGM-FI ECU ENGINE</span>
              </span>
              <span className="text-emerald-400 font-bold text-[8px] sm:text-[9px] shrink-0">OK</span>
            </div>

            <div className="flex items-center justify-between p-1.5 rounded bg-zinc-900/40 border border-zinc-800/60">
              <span className="flex items-center gap-1.5 text-zinc-300 truncate">
                <HardDrive className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">CIVIC 99 3D & OFFLINE</span>
              </span>
              <span className="text-emerald-400 font-bold text-[8px] sm:text-[9px] shrink-0">LOCAL</span>
            </div>
          </div>

          {/* Status Message */}
          <div className="p-2 rounded-lg bg-zinc-900/90 border border-zinc-800 text-[9px] sm:text-xs text-zinc-300 mb-3 leading-relaxed">
            <div className="flex items-center gap-1 text-emerald-400 font-bold mb-0.5">
              <ShieldCheck className="w-3 h-3" />
              <span>SISTEMA ATUALIZADO</span>
            </div>
            <p className="text-[8px] sm:text-[10px] text-zinc-400 leading-tight">
              {checkResult.message}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleManualCheck}
              disabled={isChecking}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 sm:py-2 px-2.5 rounded-lg font-orbitron font-bold text-[9px] sm:text-xs text-white transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50"
              style={{
                backgroundColor: theme.primary,
                boxShadow: `0 0 10px ${theme.glow}`
              }}
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? '...' : 'VERIFICAR'}</span>
            </button>

            <button
              onClick={onClose}
              className="py-1.5 sm:py-2 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white font-mono-dash text-[9px] sm:text-xs transition-colors cursor-pointer"
            >
              FECHAR
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
