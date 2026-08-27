import React from 'react';
import { BootLogoType } from '../types';

interface HondaBrandLogoProps {
  type: BootLogoType;
  customUrl?: string;
  className?: string;
  color?: string;
}

export const HondaBrandLogo: React.FC<HondaBrandLogoProps> = ({
  type,
  customUrl,
  className = 'w-24 h-24',
  color = '#ef4444'
}) => {
  if (type === 'custom' && customUrl) {
    return (
      <img
        src={customUrl}
        alt="Custom Boot Logo"
        className={`${className} object-contain`}
        referrerPolicy="no-referrer"
      />
    );
  }

  if (type === 'honda_typer') {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        {/* Type-R Red Badge Outer Frame */}
        <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(220,38,38,0.7)]">
          <defs>
            <linearGradient id="typeRRed" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="60%" stopColor="#b91c1c" />
              <stop offset="100%" stopColor="#7f1d1d" />
            </linearGradient>
            <linearGradient id="chromeBevel" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#cbd5e1" />
              <stop offset="70%" stopColor="#64748b" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>
          {/* Outer Rounded Trapeze Badge */}
          <path
            d="M 12 15 C 12 8, 18 5, 28 5 L 92 5 C 102 5, 108 8, 108 15 L 100 85 C 100 92, 94 95, 84 95 L 36 95 C 26 95, 20 92, 20 85 Z"
            fill="url(#typeRRed)"
            stroke="url(#chromeBevel)"
            strokeWidth="3.5"
          />
          {/* Inner Accent Line */}
          <path
            d="M 17 18 L 103 18 L 95 82 L 25 82 Z"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          {/* Honda H Emblem (Chunky JDM Type-R shape) */}
          <path
            d="M 28 24 L 38 24 L 46 76 L 36 76 Z"
            fill="url(#chromeBevel)"
          />
          <path
            d="M 82 24 L 92 24 L 84 76 L 74 76 Z"
            fill="url(#chromeBevel)"
          />
          {/* Upper arch bar */}
          <path
            d="M 28 24 Q 60 16 92 24 L 88 32 Q 60 26 32 32 Z"
            fill="url(#chromeBevel)"
          />
          {/* Center cross bridge */}
          <path
            d="M 37 45 Q 60 48 83 45 L 81 53 Q 60 56 39 53 Z"
            fill="url(#chromeBevel)"
          />
        </svg>
      </div>
    );
  }

  if (type === 'mugen') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="flex items-center space-x-2">
          {/* Mugen Tricolor bar */}
          <div className="flex h-8 w-14 overflow-hidden rounded shadow-lg">
            <div className="w-1/3 bg-black flex items-center justify-center text-[10px] font-bold text-white font-chakra">無限</div>
            <div className="w-1/3 bg-red-600"></div>
            <div className="w-1/3 bg-amber-400"></div>
          </div>
          <span className="font-orbitron font-extrabold text-xl tracking-wider text-white">
            MUGEN <span className="text-red-500 text-sm font-semibold">POWER</span>
          </span>
        </div>
      </div>
    );
  }

  if (type === 'spoon') {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div className="bg-yellow-400 text-blue-900 px-4 py-2 rounded-lg font-black font-orbitron text-lg tracking-widest border-2 border-blue-900 shadow-[0_0_15px_rgba(250,204,21,0.6)]">
          SPOON <span className="text-cyan-600">SPORTS</span>
        </div>
      </div>
    );
  }

  // Default: Honda Classic Emblem
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 120 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]">
        <defs>
          <linearGradient id="silverH" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        {/* Trapezoid Frame */}
        <path
          d="M 12 15 C 12 8, 18 5, 28 5 L 92 5 C 102 5, 108 8, 108 15 L 100 85 C 100 92, 94 95, 84 95 L 36 95 C 26 95, 20 92, 20 85 Z"
          fill="none"
          stroke={color || '#ffffff'}
          strokeWidth="3.5"
        />
        {/* Honda H */}
        <path
          d="M 29 24 L 38 24 L 46 76 L 36 76 Z"
          fill="url(#silverH)"
        />
        <path
          d="M 81 24 L 90 24 L 82 76 L 73 76 Z"
          fill="url(#silverH)"
        />
        <path
          d="M 29 24 Q 60 16 90 24 L 86 31 Q 60 25 33 31 Z"
          fill="url(#silverH)"
        />
        <path
          d="M 37 45 Q 60 48 83 45 L 81 52 Q 60 55 39 52 Z"
          fill="url(#silverH)"
        />
      </svg>
    </div>
  );
};
