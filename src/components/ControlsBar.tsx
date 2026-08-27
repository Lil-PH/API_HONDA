import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings, DashboardLayout } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import {
  Settings,
  Maximize,
  Minimize,
  Bluetooth,
  Wifi,
  WifiOff,
  Gauge,
  Activity,
  Trophy,
  Wrench,
  RotateCcw,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ControlsBarProps {
  settings: AppSettings;
  onUpdateLayout: (layout: DashboardLayout) => void;
  onOpenSettings: () => void;
  onRestartBoot: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  bleStatus: string;
  onConnectBle: () => void;
  isOnline: boolean;
  onCheckUpdates: () => void;
}

export const ControlsBar: React.FC<ControlsBarProps> = ({
  settings,
  onUpdateLayout,
  onOpenSettings,
  onRestartBoot,
  isFullscreen,
  onToggleFullscreen,
  bleStatus,
  onConnectBle,
  isOnline,
  onCheckUpdates
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
            className="pointer-events-auto group flex items-center gap-1.5 px-4 py-1 bg-zinc-950/90 hover:bg-zinc-900 border-x border-b border-zinc-800 rounded-b-xl backdrop-blur-md text-zinc-400 hover:text-white transition-all cursor-pointer shadow-lg active:scale-95"
            style={{
              boxShadow: `0 4px 14px rgba(0,0,0,0.6)`
            }}
            title="Arraste para baixo ou clique para abrir o Menu"
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: theme.primary, boxShadow: `0 0 6px ${theme.primary}` }}
            />
            <span className="text-[10px] font-mono-dash tracking-wider font-bold">
              MENU
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white transition-transform group-hover:translate-y-0.5" />
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
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px]"
            />

            {/* Menu Container floating fixed on top */}
            <motion.div
              ref={barRef}
              initial={{ y: -80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -80, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 450, damping: 35 }}
              className="fixed top-0 left-0 right-0 z-50 bg-zinc-950/98 border-b border-zinc-800 px-3 sm:px-6 py-2.5 flex items-center justify-between select-none backdrop-blur-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)]"
            >
              {/* Left: App Brand & Navigation Tabs */}
              <div className="flex items-center space-x-2 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                    style={{ backgroundColor: theme.primary, color: theme.primary }}
                  />
                  <span className="font-orbitron font-extrabold text-xs sm:text-sm tracking-wider text-white hidden sm:inline">
                    HONDASH <span className="text-[10px] text-zinc-500 font-normal">CYD ESP32</span>
                  </span>
                </div>

                {/* Layout Switcher Buttons */}
                <div className="flex items-center space-x-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800 text-[11px] font-mono-dash">
                  <button
                    onClick={() => {
                      onUpdateLayout('cyber_hud');
                      setIsVisible(false);
                    }}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      settings.activeLayout === 'cyber_hud'
                        ? 'bg-zinc-800 text-white font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Cyber HUD 4-Quadrantes"
                  >
                    <Activity className="w-3.5 h-3.5" style={{ color: settings.activeLayout === 'cyber_hud' ? theme.primary : undefined }} />
                    <span className="hidden md:inline">CYBER HUD</span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateLayout('hondash_classic');
                      setIsVisible(false);
                    }}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      settings.activeLayout === 'hondash_classic'
                        ? 'bg-zinc-800 text-white font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Mostradores HonDash Clássicos"
                  >
                    <Gauge className="w-3.5 h-3.5" style={{ color: settings.activeLayout === 'hondash_classic' ? theme.primary : undefined }} />
                    <span className="hidden md:inline">CLÁSSICO</span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateLayout('track_telemetry');
                      setIsVisible(false);
                    }}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      settings.activeLayout === 'track_telemetry'
                        ? 'bg-zinc-800 text-white font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Arrancada e 0-100"
                  >
                    <Trophy className="w-3.5 h-3.5" style={{ color: settings.activeLayout === 'track_telemetry' ? theme.primary : undefined }} />
                    <span className="hidden md:inline">0-100 KM/H</span>
                  </button>

                  <button
                    onClick={() => {
                      onUpdateLayout('diagnostic_dtc');
                      setIsVisible(false);
                    }}
                    className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                      settings.activeLayout === 'diagnostic_dtc'
                        ? 'bg-zinc-800 text-white font-bold shadow'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                    title="Scanner de Falhas OBD2 DTC"
                  >
                    <Wrench className="w-3.5 h-3.5" style={{ color: settings.activeLayout === 'diagnostic_dtc' ? theme.primary : undefined }} />
                    <span className="hidden md:inline">DIAGNÓSTICO</span>
                  </button>
                </div>
              </div>

              {/* Right: Connectivity Status & Actions */}
              <div className="flex items-center space-x-2 sm:space-x-3 text-xs font-mono-dash">
                {/* Bluetooth OBD Connection Status */}
                <button
                  onClick={onConnectBle}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer ${
                    bleStatus === 'connected'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-400'
                      : bleStatus === 'connecting'
                      ? 'bg-amber-950/60 border-amber-800 text-amber-300 animate-pulse'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                  }`}
                  title="Conectar Bluetooth HonDash / OBD-II"
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">
                    {bleStatus === 'connected' ? 'BLE CONECTADO' : bleStatus === 'connecting' ? 'CONECTANDO...' : 'BLUETOOTH'}
                  </span>
                </button>

                {/* Internet Sync Status */}
                <button
                  onClick={onCheckUpdates}
                  className="flex items-center gap-1 text-zinc-400 hover:text-zinc-200 px-1.5 py-1 cursor-pointer"
                  title={isOnline ? 'Online - Sincronizado' : 'Modo Offline'}
                >
                  {isOnline ? <Wifi className="w-3.5 h-3.5 text-emerald-400" /> : <WifiOff className="w-3.5 h-3.5 text-zinc-500" />}
                </button>

                {/* Restart Boot Animation */}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onRestartBoot();
                  }}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Ver animação de Boot Honda"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>

                {/* Fullscreen / Kiosk Toggle */}
                <button
                  onClick={onToggleFullscreen}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Tela Cheia / Kiosk Mode"
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>

                {/* Settings Menu Button */}
                <button
                  onClick={() => {
                    setIsVisible(false);
                    onOpenSettings();
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white font-bold transition-all cursor-pointer hover:scale-105 shadow"
                  style={{ borderColor: `${theme.primary}60` }}
                >
                  <Settings className="w-4 h-4" style={{ color: theme.primary }} />
                  <span className="hidden sm:inline">CONFIGURAÇÕES</span>
                </button>

                {/* Close Button on the right */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  title="Fechar Menu"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
