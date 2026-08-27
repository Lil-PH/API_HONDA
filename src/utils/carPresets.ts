// Vehicle Wireframes and Honda Brand Logos for HonDash HUD

export interface CarPresetOption {
  id: string;
  name: string;
  badge: string;
  engine: string;
  description: string;
  type: 'sedan' | 'hatch' | 'coupe';
}

export const CAR_PRESETS: CarPresetOption[] = [
  {
    id: 'civic99_sedan',
    name: 'Honda Civic 1999 Sedan (EJ/EK)',
    badge: 'HONDA CIVIC SEDAN // B16A2',
    engine: 'B16A2 DOHC VTEC / D16Y8',
    description: 'Civic Sedan 6ª Geração (1999 Facelift)',
    type: 'sedan'
  },
  {
    id: 'civic99_hatch',
    name: 'Honda Civic 1999 Hatchback (EK4/EK9)',
    badge: 'HONDA CIVIC HATCH // B16B TYPE-R',
    engine: 'B16B DOHC VTEC 185HP',
    description: 'Civic Hatch 3 portas JDM (EK9)',
    type: 'hatch'
  },
  {
    id: 'civic99_coupe',
    name: 'Honda Civic 1999 Coupe (EM1)',
    badge: 'HONDA CIVIC COUPE // EM1 Si',
    engine: 'B16A3 / D16Y8 VTEC',
    description: 'Civic Coupe Si 2 portas',
    type: 'coupe'
  }
];

export const THEME_COLORS: Record<string, {
  name: string;
  primary: string;
  secondary: string;
  glow: string;
  bgGlow: string;
  border: string;
  text: string;
  rgb: string;
}> = {
  red: {
    name: 'Honda Type-R Red',
    primary: '#ef4444',
    secondary: '#f87171',
    glow: 'rgba(239, 68, 68, 0.6)',
    bgGlow: 'rgba(239, 68, 68, 0.15)',
    border: 'border-red-500/50',
    text: 'text-red-500',
    rgb: '239, 68, 68'
  },
  amber: {
    name: 'JDM Amber VTEC',
    primary: '#f59e0b',
    secondary: '#fbbf24',
    glow: 'rgba(245, 158, 11, 0.6)',
    bgGlow: 'rgba(245, 158, 11, 0.15)',
    border: 'border-amber-500/50',
    text: 'text-amber-500',
    rgb: '245, 158, 11'
  },
  blue: {
    name: 'Cyberpunk Cyan Blue',
    primary: '#06b6d4',
    secondary: '#38bdf8',
    glow: 'rgba(6, 182, 212, 0.6)',
    bgGlow: 'rgba(6, 182, 212, 0.15)',
    border: 'border-cyan-500/50',
    text: 'text-cyan-400',
    rgb: '6, 182, 212'
  },
  green: {
    name: 'Motorsport Acid Green',
    primary: '#10b981',
    secondary: '#34d399',
    glow: 'rgba(16, 185, 129, 0.6)',
    bgGlow: 'rgba(16, 185, 129, 0.15)',
    border: 'border-emerald-500/50',
    text: 'text-emerald-400',
    rgb: '16, 185, 129'
  },
  purple: {
    name: 'Midnight Purple Neon',
    primary: '#a855f7',
    secondary: '#c084fc',
    glow: 'rgba(168, 85, 247, 0.6)',
    bgGlow: 'rgba(168, 85, 247, 0.15)',
    border: 'border-purple-500/50',
    text: 'text-purple-400',
    rgb: '168, 85, 247'
  },
  cyan: {
    name: 'Spoon Sports Aqua',
    primary: '#00e5ff',
    secondary: '#80d8ff',
    glow: 'rgba(0, 229, 255, 0.6)',
    bgGlow: 'rgba(0, 229, 255, 0.15)',
    border: 'border-cyan-400/50',
    text: 'text-cyan-300',
    rgb: '0, 229, 255'
  }
};
