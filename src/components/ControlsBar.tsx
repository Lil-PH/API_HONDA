import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import {
  Settings,
  Maximize,
  Minimize,
  Bluetooth,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Cpu,
  Layers
} from 'lucide-react';

interface ControlsBarProps {
  settings: AppSettings;
  onOpenSettings: () => void;
  onRestartBoot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  bleStatus: string;
  onConnectBle: () => void;
  isOnline: boolean;
  onCheckUpdates: () => void;
  onOpenLvglExport?: () => void;
  onOpenYamlExport?: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  settings,
  onOpenSettings,
  onRestartBoot,
  isFullscreen,
  onToggleFullscreen,
  bleStatus,
  onConnectBle,
  isOnline,
  onCheckUpdates,
  onOpenLvglExport,
  onOpenYamlExport
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [isVisible, setIsVisible] = useState(false);
  const touchStartYRef = useRef<number | null>(null);
  const barRef = useRef<HTMLDivElement | null>(null);

  // Global touch listener for swipe-down from top of the screen
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        touchStartYRef.current = touch.clientY;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartYRef.current === null) return;
      const touch = e.changedTouches[0];
      if (touch) {
        const deltaY = touch.clientY - touchStartYRef.current;
        // If swiped down from near top (starting within top 120px) -> show controls
        if (touchStartYRef.current <= 120 && deltaY > 40) {
          setIsVisible(true);
        }
        // If swiped up while bar is visible -> hide controls
        else if (deltaY < -40 && isVisible) {
          setIsVisible(false);
        }
      }
      touchStartYRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isVisible]);

  return (
    <>
      {/* Pull-Down Trigger Tab (Always accessible floating at top-center when menu is closed) */}
      {!isVisible && (
        <div className="fixed top-0 left-0 right-0 z-40 flex justify-center pointer-events-none">
          <button
            onClick={() => setIsVisible(true)}
            className="pointer-events-auto group flex items-center gap-1 px-2.5 py-0.5 bg-zinc-950/90 hover:bg-zinc-900 border-x border-b border-zinc-800 rounded-b-lg backdrop-blur-md text-zinc-400 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
            style={{
              boxShadow: `0 2px 10px rgba(0,0,0,0.7)`
            }}
            title="Arraste para baixo ou clique para abrir o Menu"
          >
            <div
              className="w-1 h-1 rounded-full"
              style={{ backgroundColor: theme.primary, boxShadow: `0 0 5px ${theme.primary}` }}
            />
            <span className="text-[8px] sm:text-[10px] font-mono-dash tracking-wider font-bold">
              MENU
            </span>
            <ChevronDown className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      )}

      {/* Floating Overlay Menu Bar */}
      <AnimatePresence>
        {isVisible && (
          <>
            {/* Backdrop Overlay - click outside to close */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsVisible(false)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[2px]"
            />

            {/* Menu Container floating fixed on top */}
            <motion.div
              ref={barRef}
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/98 border-b border-zinc-800 px-2 sm:px-4 py-1.5 sm:py-2.5 flex items-center justify-between select-none backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            >
              {/* Left: App Brand */}
              <div className="flex items-center space-x-1.5 sm:space-x-3">
                <div
                  className="w-2 h-2 rounded-full shadow-[0_0_6px_currentColor] shrink-0"
                  style={{ backgroundColor: theme.primary, color: theme.primary }}
                />
                <span className="font-orbitron font-extrabold text-[10px] sm:text-xs md:text-sm tracking-wider text-white truncate">
                  HONDAPP <span className="text-[8px] sm:text-[10px] text-zinc-500 font-normal hidden xs:inline">240x320</span>
                </span>
              </div>

              {/* Right: Connectivity Status & Actions */}
              <div className="flex items-center space-x-1 sm:space-x-2 text-[8px] sm:text-xs font-mono-dash">
                {/* Bluetooth OBD Connection Status */}
                <button
                  onClick={onConnectBle}
                  className={`flex items-center gap-1 px-1.5 sm:px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                    bleStatus === 'connected'
                      ? 'bg-emerald-950/80 border-emerald-500 text-emerald-300 font-bold'
                      : bleStatus === 'connecting'
                      ? 'bg-amber-950/70 border-amber-600 text-amber-300 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Conectar Bluetooth HondApp / OBD-II"
                >
                  <Bluetooth className={`w-3 h-3 ${bleStatus === 'connected' ? 'text-emerald-400' : ''}`} />
                  <span className="hidden sm:inline">
                    {bleStatus === 'connected' ? 'BLE ON' : bleStatus === 'connecting' ? 'CONN...' : 'BLE'}
                  </span>
                </button>

                {/* Restart Boot Animation */}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onRestartBoot();
                  }}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Ver animação de Boot"
                >
                  <RotateCcw className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>

                {/* Fullscreen / Kiosk Toggle */}
                <button
                  onClick={onToggleFullscreen}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Tela Cheia / Kiosk Mode"
                >
                  {isFullscreen ? <Minimize className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <Maximize className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
                </button>

                {/* LVGL Embedded C++ Code Exporter */}
                {onOpenLvglExport && (
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      onOpenLvglExport();
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-all cursor-pointer"
                    style={{ borderColor: `${theme.primary}60` }}
                    title="Ver e Exportar Código LVGL (C / C++) para ESP32"
                  >
                    <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: theme.primary }} />
                    <span className="hidden sm:inline">LVGL</span>
                  </button>
                )}

                {/* YAML Exporter */}
                {onOpenYamlExport && (
                  <button
                    onClick={() => {
                      setIsVisible(false);
                      onOpenYamlExport();
                    }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-all cursor-pointer"
                    style={{ borderColor: `${theme.primary}60` }}
                    title="Ver e Exportar Configurações YAML (ESPHome / OpenHASP / Home Assistant)"
                  >
                    <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
                    <span className="hidden sm:inline">YAML</span>
                  </button>
                )}

                {/* Settings Menu Button */}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-all cursor-pointer"
                  style={{ borderColor: `${theme.primary}60` }}
                  title="Configurações"
                >
                  <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: theme.primary }} />
                  <span className="hidden sm:inline">CONFIG</span>
                </button>

                {/* Close Button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar Menu"
                >
                  <ChevronUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
