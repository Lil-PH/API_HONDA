export type ThemeColor = 'red' | 'amber' | 'blue' | 'green' | 'purple' | 'cyan' | 'custom';

export type DashboardLayout = 'cyber_hud' | 'hondash_classic' | 'track_telemetry' | 'diagnostic_dtc';

export type BootLogoType = 'honda_classic' | 'honda_typer' | 'mugen' | 'spoon' | 'custom';

export type CarPreset = 'civic99_sedan' | 'civic99_hatch' | 'civic99_coupe' | 'civic_ek9';

export interface TelemetryData {
  rpm: number;
  speed: number;
  gear: number; // 0 for N, 1-5 for gears, -1 for R
  ect: number; // Engine Coolant Temp °C
  iat: number; // Intake Air Temp °C
  insideTemp: number; // Cabin Temp °C
  outsideTemp: number; // Ambient Temp °C
  map: number; // Manifold Absolute Pressure (kPa or bar/psi)
  boostPsi: number; // Boost in PSI (or vacuum)
  tps: number; // Throttle position 0-100%
  afr: number; // Air Fuel Ratio (e.g. 14.7, 12.5 in boost)
  batteryVoltage: number; // 12.0 - 14.6 V
  vtecActive: boolean;
  oilPressurePsi: number;
  fuelLevelPct: number;
  timingAdvanceDeg: number;
  injectorDutyPct: number;
  checkEngineLight: boolean;
  shiftLightActive: boolean;
  headlightsOn: boolean;
  doorsOpen: boolean;
  gForce: { x: number; y: number };
  audioFrequencies: number[]; // 24-32 frequency bands for visualizer
  dtcCodes: string[];
}

export interface AppSettings {
  themeColor: ThemeColor;
  customColorHex: string;
  
  // Vehicle Info
  carModelName: string;
  carEngineSpec: string;
  carPreset: CarPreset;
  carImageMode: 'preset' | 'custom';
  customCarImageUrl: string;
  showUnderglow: boolean;
  underglowColor: string;
  showVehicleClock?: boolean;
  clockFormat?: '24h' | '12h';

  // Boot sequence
  bootLogoType: BootLogoType;
  customBootLogoUrl: string;
  bootWelcomeText: string;
  bootDurationMs: number;
  enableBootSound: boolean;
  enableVtecSound: boolean;
  enableShiftBeep: boolean;

  // Sensor calibration & limits
  speedUnit: 'kmh' | 'mph';
  tempUnit: 'celsius' | 'fahrenheit';
  pressureUnit: 'bar' | 'psi' | 'kpa';
  vtecThresholdRpm: number;
  shiftLightRpm: number;
  revLimitRpm: number;
  idleRpm: number;

  // Active view & device
  activeLayout: DashboardLayout;
  audioVisualizerSource: 'simulated' | 'microphone' | 'off';
  devicePreset: 'auto' | 'cyd_esp32_320x240' | 'cyd_esp32_480x320' | 'mobile' | 'desktop';
  connectionMode: 'simulation' | 'bluetooth' | 'serial' | 'wifi_ws';
  wifiEsp32Ip: string;
  showScanlines: boolean;
  autoCheckUpdates: boolean;
}

export interface PerformanceStats {
  zeroToHundredTime: number | null; // in seconds
  zeroToSixtyTime: number | null;
  quarterMileTime: number | null;
  quarterMileTrapSpeed: number | null;
  maxRpmRecorded: number;
  maxSpeedRecorded: number;
  maxGForce: number;
  isTimingRun: boolean;
  runStartTime: number | null;
}

export interface DtcFaultCode {
  code: string;
  description: string;
  ecuModule: string;
  severity: 'warning' | 'critical' | 'info';
}
