import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'motion/react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { AlertTriangle, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react';

interface CivicVehicleProfileProps {
  settings: AppSettings;
  telemetry: TelemetryData;
  onOpenCarImageSettings?: () => void;
  onToggleClockFormat?: () => void;
}

interface CivicSvgBlueprintProps {
  telemetry: TelemetryData;
  className?: string;
}

export const CivicSvgBlueprint: React.FC<CivicSvgBlueprintProps> = ({
  telemetry,
  className = "w-full h-full drop-shadow-[0_0_8px_rgba(255,255,255,0.7)]"
}) => {
  return (
    <svg
      viewBox="0 0 520 210"
      className={className}
    >
      <defs>
        <filter id="hologramGlowCar" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="glassGradientCar" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.03)" />
        </linearGradient>
      </defs>

      {/* Group containing the exact Civic 1999 Sedan Blueprint Line-art */}
      <g
        stroke="#ffffff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter="url(#hologramGlowCar)"
      >
        {/* 1. Main Outer Silhouette Path */}
        <path
          d="M 24 168 
             L 24 148 
             C 24 140, 32 134, 40 130 
             L 52 122 
             L 82 120 
             C 120 114, 150 108, 178 102 
             C 192 98, 228 62, 268 46 
             C 285 40, 335 40, 362 44 
             C 388 48, 412 74, 435 94 
             L 482 96 
             C 488 96, 492 100, 492 106 
             L 492 124 
             L 486 128 
             L 494 132 
             L 494 154 
             C 494 160, 488 166, 476 168 
             L 444 170 
             L 442 176 
             L 426 176
             /* Rear Wheel Arch */
             C 426 142, 356 142, 356 174 
             /* Rocker Panel / Side Skirt */
             L 152 174 
             /* Front Wheel Arch */
             C 152 142, 72 142, 72 174 
             /* Front lower lip */
             L 24 174 
             L 24 168 Z"
          strokeWidth="2.2"
        />

        {/* 2. Front Bumper Details & Fog Light Bezel */}
        {/* Lower Lip Divider */}
        <line x1="24" y1="168" x2="72" y2="168" strokeWidth="1.6" />
        {/* Fog light inlet */}
        <rect x="30" y="146" width="16" height="15" rx="3" strokeWidth="1.5" />
        <path d="M 30 153 L 46 153" strokeWidth="1.2" opacity="0.7" />

        {/* 3. Headlight (EK/EJ Facelift Headlamp) */}
        <path
          d="M 38 132 L 64 121 L 82 120 L 74 135 L 42 135 Z"
          fill={telemetry.headlightsOn ? 'rgba(254,240,138,0.85)' : 'none'}
          stroke="#ffffff"
          strokeWidth="1.6"
        />
        {/* Headlight Amber Corner / Reflector */}
        <line x1="48" y1="128" x2="52" y2="135" strokeWidth="1.2" opacity="0.8" />

        {/* 4. Hood Line */}
        <path d="M 82 120 C 110 115, 145 109, 178 102" strokeWidth="1.6" />

        {/* 5. Greenhouse / Windows Outline (Double Line Trim) */}
        {/* Outer Glass Contour */}
        <path
          d="M 186 98 
             C 200 94, 232 60, 268 48 
             C 285 43, 332 43, 358 47 
             C 382 51, 404 74, 426 94 
             L 186 98 Z"
          strokeWidth="1.8"
          fill="url(#glassGradientCar)"
        />

        {/* Front Door Window */}
        <path
          d="M 194 96 
             C 205 92, 234 62, 266 51 
             L 282 51 
             L 278 96 Z"
          strokeWidth="1.5"
        />

        {/* B-Pillar Dual Separation Bars */}
        <line x1="282" y1="50" x2="278" y2="96" strokeWidth="2.2" />
        <line x1="290" y1="50" x2="286" y2="96" strokeWidth="2.2" />

        {/* Rear Door Window & Quarter Glass Divider */}
        <path
          d="M 294 51 
             L 354 51 
             C 374 54, 396 74, 416 94 
             L 290 96 Z"
          strokeWidth="1.5"
        />
        {/* C-Pillar Fixed Window Vent Divider Line */}
        <line x1="376" y1="53" x2="396" y2="95" strokeWidth="1.4" opacity="0.8" />

        {/* Aerodynamic Side Mirror */}
        <path
          d="M 194 95 
             C 190 90, 194 84, 206 84 
             C 214 84, 218 89, 216 95 
             C 214 99, 200 99, 194 95 Z"
          strokeWidth="1.6"
          fill="#09090b"
        />
        <line x1="202" y1="95" x2="204" y2="102" strokeWidth="1.8" />

        {/* 6. Doors & Panel Seam Lines */}
        {/* Front Fender to Front Door Cut Line */}
        <path
          d="M 178 102 
             C 172 118, 162 144, 154 174"
          strokeWidth="1.6"
        />

        {/* Center B-Pillar Door Divide Seam */}
        <line x1="284" y1="96" x2="282" y2="174" strokeWidth="1.7" />

        {/* Rear Door to Quarter Panel Seam Line */}
        <path
          d="M 388 95 
             C 392 116, 394 130, 390 144 
             C 386 156, 370 166, 356 174"
          strokeWidth="1.6"
        />

        {/* 7. Side Body Molding (Friso Lateral Contínuo Honda) */}
        <line x1="72" y1="138" x2="160" y2="138" strokeWidth="2.2" />
        <line x1="164" y1="138" x2="280" y2="138" strokeWidth="2.2" />
        <line x1="288" y1="138" x2="384" y2="138" strokeWidth="2.2" />

        {/* 8. Flush Door Handles (Puxadores Ovais Honda) */}
        <rect x="256" y="112" width="18" height="6" rx="3" strokeWidth="1.5" />
        <rect x="358" y="110" width="18" height="6" rx="3" strokeWidth="1.5" />

        {/* 9. Fuel Door (Tampa do Tanque de Combustível) */}
        <rect x="402" y="99" width="18" height="17" rx="2.5" strokeWidth="1.5" opacity="0.9" />

        {/* 10. Trunk & Rear Bumper Lines */}
        <path d="M 435 94 L 482 96" strokeWidth="1.6" />
        {/* Taillight Assembly (Civic 99/00 Red & Clear) */}
        <path
          d="M 460 96 L 488 96 L 490 124 L 458 124 Z"
          fill="#ef4444"
          stroke="#ffffff"
          strokeWidth="1.5"
          opacity="0.9"
        />
        <line x1="459" y1="110" x2="489" y2="110" strokeWidth="1.3" stroke="#ffffff" />
        {/* Rear Bumper Shelf / Step */}
        <line x1="452" y1="132" x2="494" y2="132" strokeWidth="1.6" />
        <line x1="440" y1="162" x2="484" y2="162" strokeWidth="1.4" opacity="0.6" />

        {/* 11. Rocker Panel Lower Accent */}
        <line x1="152" y1="170" x2="356" y2="170" strokeWidth="1.5" opacity="0.7" />

        {/* 12. Front Wheel (Spiral Swirl Wheel Design with Lug Nuts) */}
        <g transform="translate(112, 172)">
          {/* Tire Outer & Inner Rim */}
          <circle cx="0" cy="0" r="28" strokeWidth="2.2" fill="#000000" />
          <circle cx="0" cy="0" r="20" strokeWidth="1.6" fill="#09090b" />
          {/* Center Cap Hub */}
          <circle cx="0" cy="0" r="7" strokeWidth="1.4" fill="#18181b" />
          {/* 4 Lug Nuts */}
          <circle cx="-3" cy="-3" r="1" fill="#ffffff" stroke="none" />
          <circle cx="3" cy="-3" r="1" fill="#ffffff" stroke="none" />
          <circle cx="-3" cy="3" r="1" fill="#ffffff" stroke="none" />
          <circle cx="3" cy="3" r="1" fill="#ffffff" stroke="none" />
          {/* Spiral Swirl Blades matching the blueprint image */}
          <path d="M 0 -7 C 5 -12, 14 -12, 18 -6 C 14 -7, 6 -8, 0 -7 Z" fill="#ffffff" stroke="none" />
          <path d="M 7 0 C 12 5, 12 14, 6 18 C 7 14, 8 6, 7 0 Z" fill="#ffffff" stroke="none" />
          <path d="M 0 7 C -5 12, -14 12, -18 6 C -14 7, -6 8, 0 7 Z" fill="#ffffff" stroke="none" />
          <path d="M -7 0 C -12 -5, -12 -14, -6 -18 C -7 -14, -8 -6, -7 0 Z" fill="#ffffff" stroke="none" />
        </g>

        {/* 13. Rear Wheel (Spiral Swirl Wheel Design with Lug Nuts) */}
        <g transform="translate(391, 172)">
          {/* Tire Outer & Inner Rim */}
          <circle cx="0" cy="0" r="28" strokeWidth="2.2" fill="#000000" />
          <circle cx="0" cy="0" r="20" strokeWidth="1.6" fill="#09090b" />
          {/* Center Cap Hub */}
          <circle cx="0" cy="0" r="7" strokeWidth="1.4" fill="#18181b" />
          {/* 4 Lug Nuts */}
          <circle cx="-3" cy="-3" r="1" fill="#ffffff" stroke="none" />
          <circle cx="3" cy="-3" r="1" fill="#ffffff" stroke="none" />
          <circle cx="-3" cy="3" r="1" fill="#ffffff" stroke="none" />
          <circle cx="3" cy="3" r="1" fill="#ffffff" stroke="none" />
          {/* Spiral Swirl Blades matching the blueprint image */}
          <path d="M 0 -7 C 5 -12, 14 -12, 18 -6 C 14 -7, 6 -8, 0 -7 Z" fill="#ffffff" stroke="none" />
          <path d="M 7 0 C 12 5, 12 14, 6 18 C 7 14, 8 6, 7 0 Z" fill="#ffffff" stroke="none" />
          <path d="M 0 7 C -5 12, -14 12, -18 6 C -14 7, -6 8, 0 7 Z" fill="#ffffff" stroke="none" />
          <path d="M -7 0 C -12 -5, -12 -14, -6 -18 C -7 -14, -8 -6, -7 0 Z" fill="#ffffff" stroke="none" />
        </g>
      </g>
    </svg>
  );
};

export const CivicVehicleProfile: React.FC<CivicVehicleProfileProps> = ({
  settings,
  telemetry,
  onOpenCarImageSettings,
  onToggleClockFormat
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const underglow = settings.underglowColor || theme.primary;

  const longPressTimerRef = useRef<number | null>(null);
  const [isPressing, setIsPressing] = useState(false);
  const [pressProgress, setPressProgress] = useState(0);
  const progressAnimRef = useRef<number | null>(null);
  const pressStartRef = useRef<number>(0);
  const hasTriggeredLongPressRef = useRef<boolean>(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const showVehicleClock = settings.showVehicleClock !== false;

  const [clockTime, setClockTime] = useState<Date>(new Date());
  useEffect(() => {
    if (!isExpanded || !showVehicleClock) return;
    setClockTime(new Date());
    const timer = setInterval(() => {
      setClockTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpanded, showVehicleClock]);

  const use24Hour = settings.clockFormat !== '12h';
  const rawHours = clockTime.getHours();
  const displayHours = use24Hour ? rawHours : rawHours % 12 || 12;
  const clockHours = String(displayHours).padStart(2, '0');
  const clockMinutes = String(clockTime.getMinutes()).padStart(2, '0');
  const clockSeconds = String(clockTime.getSeconds()).padStart(2, '0');
  const ampm = !use24Hour ? (rawHours >= 12 ? 'PM' : 'AM') : '';

  // Formatted Date String in UPPERCASE (e.g. WEDNESDAY 29 JULY 2026) matching first screen
  const weekdays = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const dayName = weekdays[clockTime.getDay()];
  const dayNum = clockTime.getDate();
  const monthName = months[clockTime.getMonth()];
  const yearNum = clockTime.getFullYear();
  const formattedDate = `${dayName} ${dayNum} ${monthName} ${yearNum}`;

  useEffect(() => {
    if (!isExpanded) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isExpanded]);

  const startPress = () => {
    hasTriggeredLongPressRef.current = false;
    setIsPressing(true);
    pressStartRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - pressStartRef.current;
      const progress = Math.min(100, (elapsed / 650) * 100);
      setPressProgress(progress);
      if (progress < 100) {
        progressAnimRef.current = requestAnimationFrame(updateProgress);
      }
    };
    progressAnimRef.current = requestAnimationFrame(updateProgress);

    longPressTimerRef.current = window.setTimeout(() => {
      hasTriggeredLongPressRef.current = true;
      setIsPressing(false);
      setPressProgress(0);
      if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
      if (onOpenCarImageSettings) {
        onOpenCarImageSettings();
      }
    }, 650);
  };

  const endPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (progressAnimRef.current) {
      cancelAnimationFrame(progressAnimRef.current);
      progressAnimRef.current = null;
    }
    setIsPressing(false);
    setPressProgress(0);
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasTriggeredLongPressRef.current) {
      hasTriggeredLongPressRef.current = false;
      return;
    }
    setIsExpanded(true);
  };

  return (
    <>
      <div
        onClick={handleClick}
        onMouseDown={startPress}
        onMouseUp={endPress}
        onMouseLeave={endPress}
        onTouchStart={startPress}
        onTouchEnd={endPress}
        onTouchCancel={endPress}
        title="Clique: Preencher tela da aplicação | Segure: Trocar foto/GIF"
        className="relative bg-zinc-950/90 border border-zinc-800/80 rounded-lg sm:rounded-xl p-1.5 sm:p-2.5 md:p-3.5 flex flex-col justify-between backdrop-blur-md overflow-hidden shadow-2xl cursor-pointer select-none transition-all hover:border-zinc-700 active:scale-[0.99]"
        style={{
          boxShadow: `inset 0 0 15px rgba(0,0,0,0.8), 0 0 1px ${theme.glow}`
        }}
      >
        {/* Corner Bracket Accents */}
        <div className="absolute top-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute top-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 left-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />
        <div className="absolute bottom-0 right-0 w-2.5 sm:w-3.5 h-2.5 sm:h-3.5 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

        {/* Visual Indicator when Holding / Long-Pressing */}
        {isPressing && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-30 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-150 p-2">
            <ImageIcon className="w-5 h-5 text-amber-400 animate-pulse mb-1" />
            <span className="font-orbitron text-[8px] sm:text-[10px] font-bold text-amber-300 tracking-wider text-center">
              SEGURE PARA TROCAR IMAGEM...
            </span>
            <div className="w-24 sm:w-36 h-1 bg-zinc-800 rounded-full mt-1.5 overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-amber-400 transition-all duration-75"
                style={{ width: `${pressProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Top Header Row of Quad */}
        <div className="flex items-center justify-between z-10">
          <div className="flex items-center space-x-1 sm:space-x-1.5 overflow-hidden">
            <span 
              className="font-orbitron font-bold text-[7px] sm:text-[9px] md:text-[10px] tracking-wider uppercase truncate"
              style={{ color: theme.primary }}
            >
              VEHICLE PROFILE
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {telemetry.checkEngineLight && (
              <span className="px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-orbitron font-black tracking-wider bg-amber-500 text-black flex items-center gap-0.5 animate-pulse">
                <AlertTriangle className="w-2.5 h-2.5" />
                <span>CEL</span>
              </span>
            )}
            {telemetry.vtecActive && (
              <span className="px-1 py-0.2 rounded text-[7px] sm:text-[9px] font-orbitron font-black tracking-wider bg-red-600 text-white animate-bounce">
                VTEC
              </span>
            )}
            <span 
              className="px-1 sm:px-1.5 py-0.2 rounded text-[6px] sm:text-[8px] font-mono-dash font-bold tracking-wider border flex items-center gap-0.5"
              style={{ 
                borderColor: `${theme.primary}60`, 
                backgroundColor: `${theme.primary}18`,
                color: theme.secondary
              }}
            >
              <Maximize2 className="w-1.5 h-1.5 sm:w-2 sm:h-2 opacity-80" />
              <span>360 LIVE</span>
            </span>
          </div>
        </div>

        {/* Center Vehicle Graphic: Wireframe or Custom Photo/GIF */}
        <div className="relative my-auto flex-1 flex flex-col items-center justify-center py-0.5 sm:py-1 w-full overflow-hidden">
          {/* Neon Underglow Floor Projection */}
          {settings.showUnderglow && (
            <motion.div
              animate={{
                opacity: [0.5, 0.9, 0.5],
                scaleX: [0.95, 1.05, 0.95],
              }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1 sm:bottom-2 w-4/5 h-4 sm:h-6 rounded-full blur-md pointer-events-none"
              style={{
                backgroundColor: underglow,
                boxShadow: `0 0 20px ${underglow}`
              }}
            />
          )}

          {settings.carImageMode === 'custom' && settings.customCarImageUrl ? (
            <div className="relative z-10 flex-1 min-h-[75px] sm:min-h-[110px] md:min-h-[140px] w-full flex items-center justify-center p-0.5">
              <img
                src={settings.customCarImageUrl}
                alt="Custom Honda Civic"
                className="max-h-24 sm:max-h-36 md:max-h-48 w-auto max-w-full object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.35)] rounded transition-all"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            /* SVG Holographic Wireframe of Civic 1999 Sedan (EJ6/EK4) */
            <div className="relative z-10 w-full max-w-[260px] sm:max-w-[340px] md:max-w-[420px] h-18 sm:h-26 md:h-34 flex items-center justify-center">
              <CivicSvgBlueprint telemetry={telemetry} />
            </div>
          )}
        </div>

        {/* Bottom Chassis Spec Badge (Optional - displayed only if provided by user) */}
        {settings.carModelName?.trim() ? (
          <div className="w-full flex items-center justify-center text-center border-t border-zinc-800/80 pt-1 z-10">
            <span 
              className="font-orbitron text-[7px] sm:text-[9px] md:text-[10px] font-bold tracking-wider uppercase truncate"
              style={{ color: theme.secondary }}
            >
              {settings.carModelName}
            </span>
          </div>
        ) : null}
      </div>

      {/* Expanded View: Apresenta a DIV INTEIRA com máxima visibilidade, relógio acima do GIF e controles */}
      {isExpanded && typeof document !== 'undefined' && createPortal(
        <div
          onClick={() => setIsExpanded(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-2.5 sm:p-5 md:p-8 animate-in fade-in duration-200 cursor-pointer select-none"
          title="Clique no fundo para fechar (ESC)"
        >
          {/* Card DIV Inteira Expandida Preenchendo a Tela da Aplicação */}
          <div
            onClick={() => setIsExpanded(false)}
            className="relative w-full h-full max-w-6xl max-h-[92vh] bg-zinc-950/95 border border-zinc-700/90 rounded-xl sm:rounded-2xl p-3 sm:p-5 md:p-6 flex flex-col justify-between backdrop-blur-xl shadow-2xl overflow-hidden cursor-pointer"
            title="Clique para fechar / minimizar (ESC)"
            style={{
              boxShadow: `inset 0 0 35px rgba(0,0,0,0.9), 0 0 25px ${theme.glow}40`
            }}
          >
            {/* Corner Bracket Accents in Theme Color */}
            <div className="absolute top-0 left-0 w-3.5 sm:w-6 h-3.5 sm:h-6 border-t-2 border-l-2" style={{ borderColor: theme.primary }} />
            <div className="absolute top-0 right-0 w-3.5 sm:w-6 h-3.5 sm:h-6 border-t-2 border-r-2" style={{ borderColor: theme.primary }} />
            <div className="absolute bottom-0 left-0 w-3.5 sm:w-6 h-3.5 sm:h-6 border-b-2 border-l-2" style={{ borderColor: theme.primary }} />
            <div className="absolute bottom-0 right-0 w-3.5 sm:w-6 h-3.5 sm:h-6 border-b-2 border-r-2" style={{ borderColor: theme.primary }} />

            {/* Top Header Row da DIV */}
            <div className="flex items-center justify-between z-10 border-b border-zinc-800/80 pb-2.5 sm:pb-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <span 
                  className="font-orbitron font-bold text-xs sm:text-sm md:text-base tracking-widest uppercase"
                  style={{ color: theme.primary, textShadow: `0 0 10px ${theme.glow}` }}
                >
                  VEHICLE PROFILE
                </span>
                {settings.carModelName?.trim() && (
                  <span className="hidden xs:inline-block text-[10px] sm:text-xs font-orbitron font-semibold text-zinc-400 tracking-wider">
                    / {settings.carModelName}
                  </span>
                )}
              </div>

              {/* Status & Minimizar */}
              <div className="flex items-center space-x-1.5 sm:space-x-2.5">
                {/* Status Badges */}
                {telemetry.checkEngineLight && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-orbitron font-black tracking-wider bg-amber-500 text-black flex items-center gap-0.5 animate-pulse">
                    <AlertTriangle className="w-3 h-3" />
                    <span>CEL</span>
                  </span>
                )}
                {telemetry.vtecActive && (
                  <span className="px-1.5 py-0.5 rounded text-[8px] sm:text-[10px] font-orbitron font-black tracking-wider bg-red-600 text-white animate-bounce">
                    VTEC
                  </span>
                )}
                <span 
                  className="px-1.5 py-0.5 rounded text-[7px] sm:text-[9px] font-mono-dash font-bold tracking-wider border flex items-center gap-1"
                  style={{ 
                    borderColor: `${theme.primary}60`, 
                    backgroundColor: `${theme.primary}18`,
                    color: theme.secondary
                  }}
                >
                  <Maximize2 className="w-2.5 h-2.5 opacity-80" />
                  <span>360 LIVE</span>
                </span>

                {/* Botão Minimizar / Fechar */}
                <button
                  type="button"
                  onClick={() => setIsExpanded(false)}
                  className="p-1 sm:p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all ml-1 shadow"
                  title="Fechar / Minimizar (ESC)"
                >
                  <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* Centro da DIV: Relógio Acima do GIF (Configurado nas Opções) + GIF Ampliado com Máxima Visibilidade */}
            <div className="relative flex-1 w-full my-auto flex flex-col items-center justify-center py-2 sm:py-4 overflow-hidden">
              {/* Neon Underglow Floor Projection */}
              {settings.showUnderglow && (
                <motion.div
                  animate={{
                    opacity: [0.5, 0.9, 0.5],
                    scaleX: [0.95, 1.05, 0.95],
                  }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute bottom-4 sm:bottom-8 w-4/5 max-w-4xl h-8 sm:h-16 rounded-full blur-2xl pointer-events-none"
                  style={{
                    backgroundColor: underglow,
                    boxShadow: `0 0 45px ${underglow}`
                  }}
                />
              )}

              {/* Relógio Digital Acima do GIF (Mesma configuração e estilo da Primeira Tela) */}
              {showVehicleClock && (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleClockFormat?.();
                  }}
                  title="Clique para alternar 12h / 24h"
                  className="flex flex-col items-center justify-center mb-2 sm:mb-3.5 select-none animate-in fade-in duration-150 z-20 cursor-pointer group"
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
                      {clockHours}:{clockMinutes}
                    </span>
                    <span
                      className="font-orbitron font-bold text-xs sm:text-base md:text-lg tracking-tight font-mono-dash leading-none"
                      style={{ color: theme.secondary }}
                    >
                      {clockSeconds}
                    </span>
                    {ampm && (
                      <span className="text-[7px] sm:text-[9px] font-orbitron font-bold text-zinc-400 ml-1">
                        {ampm}
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
              )}

              {/* GIF ou Wireframe com Dimensões Maiores e Melhor Visibilidade */}
              {settings.carImageMode === 'custom' && settings.customCarImageUrl ? (
                <div className="relative z-10 flex-1 max-h-[58vh] sm:max-h-[66vh] md:max-h-[70vh] w-full flex items-center justify-center p-1 sm:p-2">
                  <img
                    src={settings.customCarImageUrl}
                    alt="Custom Honda Civic"
                    className="max-h-[55vh] sm:max-h-[62vh] md:max-h-[66vh] max-w-[95%] w-auto h-auto object-contain drop-shadow-[0_0_28px_rgba(255,255,255,0.35)] rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : (
                <div className="relative z-10 w-full max-w-4xl max-h-[55vh] sm:max-h-[62vh] flex items-center justify-center p-2">
                  <CivicSvgBlueprint
                    telemetry={telemetry}
                    className="w-full h-full max-h-[52vh] drop-shadow-[0_0_16px_rgba(255,255,255,0.8)]"
                  />
                </div>
              )}
            </div>

            {/* Bottom Footer Row da DIV */}
            <div className="w-full flex items-center justify-between border-t border-zinc-800/80 pt-2 sm:pt-2.5 z-10 text-[8px] sm:text-[10px] font-orbitron text-zinc-400">
              <span className="tracking-wider uppercase" style={{ color: theme.secondary }}>
                {settings.carModelName || 'HONDA CIVIC 1999'}
              </span>
              <span className="tracking-wider text-zinc-500 font-mono-dash">
                HONDA EJ6/EK4 CHASSIS • LIVE PROFILE
              </span>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
