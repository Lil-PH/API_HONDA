import React from 'react';
import { motion } from 'motion/react';
import { AppSettings, TelemetryData } from '../types';
import { THEME_COLORS } from '../utils/carPresets';

interface CivicVehicleProfileProps {
  settings: AppSettings;
  telemetry: TelemetryData;
}

export const CivicVehicleProfile: React.FC<CivicVehicleProfileProps> = ({ settings, telemetry }) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const underglow = settings.underglowColor || theme.primary;

  return (
    <div className="w-full h-full flex flex-col justify-between relative select-none">
      {/* Top Header Row of Quad */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <span className="font-orbitron font-bold text-xs sm:text-sm tracking-widest text-zinc-100 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full animate-ping shrink-0" style={{ backgroundColor: theme.primary }} />
            VEHICLE PROFILE
          </span>
        </div>
        <div className="flex items-center space-x-2">
          {telemetry.vtecActive && (
            <span className="px-2 py-0.5 rounded text-[10px] font-orbitron font-black tracking-wider bg-red-600 text-white animate-bounce shadow-[0_0_10px_rgba(239,68,68,0.9)]">
              VTEC ON
            </span>
          )}
          <span 
            className="px-2 py-0.5 rounded text-[10px] font-mono-dash font-bold tracking-wider border text-zinc-300"
            style={{ borderColor: `${theme.primary}50`, backgroundColor: `${theme.primary}15` }}
          >
            360 LIVE
          </span>
        </div>
      </div>

      {/* Center Vehicle Graphic: Wireframe or Custom Photo/GIF */}
      <div className="relative my-auto flex flex-col items-center justify-center py-2 w-full">
        {/* Neon Underglow Floor Projection */}
        {settings.showUnderglow && (
          <motion.div
            animate={{
              opacity: [0.6, 0.95, 0.6],
              scaleX: [0.95, 1.05, 0.95],
            }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-3 w-4/5 h-6 rounded-full blur-md pointer-events-none"
            style={{
              backgroundColor: underglow,
              boxShadow: `0 0 25px ${underglow}, 0 0 45px ${underglow}`
            }}
          />
        )}

        {settings.carImageMode === 'custom' && settings.customCarImageUrl ? (
          <div className="relative z-10 max-h-36 sm:max-h-44 w-full flex items-center justify-center p-1">
            <img
              src={settings.customCarImageUrl}
              alt="Custom Honda Civic"
              className="max-h-36 sm:max-h-40 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] rounded"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          /* SVG Holographic Wireframe of Civic 1999 Sedan (EJ6/EK4) */
          <div className="relative z-10 w-full max-w-[340px] sm:max-w-[400px] h-32 sm:h-38 flex items-center justify-center">
            <svg
              viewBox="0 0 520 210"
              className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.75)]"
            >
              <defs>
                <filter id="hologramGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="1.2" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="0%" y2="100%">
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
                filter="url(#hologramGlow)"
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
                  fill="url(#glassGradient)"
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
          </div>
        )}
      </div>

      {/* Bottom Chassis Spec Badge (Identical to reference image) */}
      <div className="w-full flex items-center justify-between text-center border-t border-zinc-800/80 pt-1.5 z-10">
        <span className="font-mono-dash text-[10px] sm:text-xs font-bold tracking-wider text-zinc-300 mx-auto">
          {settings.carModelName || 'HONDA CIVIC SEDAN // B16A2'}
        </span>
      </div>
    </div>
  );
};
