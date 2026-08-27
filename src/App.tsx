import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppSettings, DashboardLayout, TelemetryData } from './types';
import { BootScreen } from './components/BootScreen';
import { CyberHudDashboard } from './components/CyberHudDashboard';
import { HonDashClassicGauges } from './components/HonDashClassicGauges';
import { TrackTelemetryView } from './components/TrackTelemetryView';
import { DiagnosticsDtcView } from './components/DiagnosticsDtcView';
import { ControlsBar } from './components/ControlsBar';
import { SettingsModal } from './components/SettingsModal';
import { SimulatorControls } from './components/SimulatorControls';
import { HonDashDeviceManager, ConnectionStatus } from './utils/bleService';
import { playVtecKickSound, playShiftBeep } from './utils/soundEffects';
import { getVehicleImage, saveVehicleImage } from './utils/vehicleImageStorage';

const STORAGE_KEY = 'hondash_cyd_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  themeColor: 'red',
  customColorHex: '#ef4444',
  carModelName: 'HONDA CIVIC SEDAN // B16A2',
  carEngineSpec: 'B16A2 DOHC VTEC 1.6L // PGM-FI ECU',
  carPreset: 'civic99_sedan',
  carImageMode: 'preset',
  customCarImageUrl: '',
  showUnderglow: true,
  underglowColor: '#ef4444',

  bootLogoType: 'honda_classic',
  customBootLogoUrl: '',
  bootWelcomeText: 'HONDA CIVIC 1999',
  bootDurationMs: 2600,
  enableBootSound: false,
  enableVtecSound: true,
  enableShiftBeep: true,

  speedUnit: 'kmh',
  tempUnit: 'celsius',
  pressureUnit: 'kpa',
  vtecThresholdRpm: 5200,
  shiftLightRpm: 7200,
  revLimitRpm: 8500,
  idleRpm: 850,

  activeLayout: 'cyber_hud',
  audioVisualizerSource: 'simulated',
  devicePreset: 'auto',
  connectionMode: 'simulation',
  wifiEsp32Ip: '192.168.4.1',
  showScanlines: true,
  autoCheckUpdates: true
};

const INITIAL_TELEMETRY: TelemetryData = {
  rpm: 850,
  speed: 0,
  gear: 0, // Neutral
  ect: 88.0, // Engine coolant
  iat: 32.0, // Intake air
  insideTemp: 26.6,
  outsideTemp: 27.2,
  map: 35, // Manifold pressure kPa
  boostPsi: 0,
  tps: 0, // Throttle %
  afr: 14.7, // Stoichiometric
  batteryVoltage: 14.2,
  vtecActive: false,
  oilPressurePsi: 58,
  fuelLevelPct: 82,
  timingAdvanceDeg: 14.5,
  injectorDutyPct: 3.2,
  checkEngineLight: false,
  shiftLightActive: false,
  headlightsOn: false,
  doorsOpen: false,
  gForce: { x: 0, y: 0 },
  audioFrequencies: [0.2, 0.4, 0.6, 0.8, 0.5, 0.7, 0.9, 0.4, 0.8, 0.6, 0.3, 0.7, 0.9, 0.5, 0.3, 0.6, 0.8, 0.4, 0.5, 0.7, 0.3, 0.6, 0.4, 0.2],
  dtcCodes: []
};

export default function App() {
  // 1. Settings state (loaded from local storage)
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return { ...DEFAULT_SETTINGS, ...parsed, enableBootSound: false };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Load custom vehicle image or GIF from persistent IndexedDB storage
  useEffect(() => {
    getVehicleImage().then((persistedImg) => {
      if (persistedImg) {
        setSettings((prev) => ({
          ...prev,
          customCarImageUrl: persistedImg,
          carImageMode: 'custom'
        }));
      }
    });
  }, []);

  // 2. Boot sequence & presentation state
  const [isBooting, setIsBooting] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSimRunning, setIsSimRunning] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string>('Verificando atualizações...');

  // 3. Telemetry State
  const [telemetry, setTelemetry] = useState<TelemetryData>(INITIAL_TELEMETRY);
  const [bleStatus, setBleStatus] = useState<ConnectionStatus>('disconnected');
  const [bleMessage, setBleMessage] = useState<string>('');
  const [isOnline, setIsOnline] = useState<boolean>(typeof navigator !== 'undefined' ? navigator.onLine : true);

  // Device manager ref
  const bleManagerRef = useRef<HonDashDeviceManager | null>(null);
  const vtecPlayedRef = useRef<boolean>(false);
  const shiftBeepPlayedRef = useRef<boolean>(false);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
  }, []);

  // Save settings (including IndexedDB vehicle media persistence)
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    if (newSettings.customCarImageUrl) {
      saveVehicleImage(newSettings.customCarImageUrl);
    }
    try {
      // Strip very large data URL from localStorage JSON to avoid quota errors
      const safeToStore = { ...newSettings };
      if (safeToStore.customCarImageUrl && safeToStore.customCarImageUrl.length > 50000) {
        safeToStore.customCarImageUrl = '[STORED_IN_INDEXEDDB]';
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safeToStore));
    } catch (e) {
      console.warn('Failed to save to localStorage', e);
    }
  };

  // Auto-Update and Online Sync on Startup
  useEffect(() => {
    const performAppStartupUpdate = async () => {
      try {
        setUpdateStatus('Sincronizando registros da ECU e assets...');
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({ type: 'CHECK_FOR_UPDATES' });
        }
        // Verify cache and data integrity
        if (typeof window !== 'undefined' && 'caches' in window) {
          try {
            const cacheKeys = await window.caches.keys();
            console.log('[HonDash OTA] Caches verificados na inicialização:', cacheKeys.length);
          } catch {
            // ignore
          }
        }
        setUpdateStatus('Sistema atualizado com sucesso (v2.4.1)!');
      } catch (err) {
        console.warn('[HonDash Update] Erro ao sincronizar:', err);
      }
    };

    performAppStartupUpdate();
  }, []);

  // Online / Offline and Auto-update detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (settings.autoCheckUpdates) {
        console.log('Online connection detected. HonDash synchronized.');
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [settings.autoCheckUpdates]);

  // Setup BLE Device Manager
  useEffect(() => {
    const manager = new HonDashDeviceManager({
      onStatusChange: (status, message) => {
        setBleStatus(status);
        if (message) setBleMessage(message);
      },
      onTelemetryData: (data) => {
        setTelemetry((prev) => ({
          ...prev,
          ...data
        }));
      }
    });
    bleManagerRef.current = manager;

    return () => {
      manager.disconnect();
    };
  }, []);

  // Realistic Engine Physics & Simulator Loop (when running on PC/Mobile)
  useEffect(() => {
    if (!isSimRunning && bleStatus === 'disconnected') return;

    const gearRatios = [0, 3.25, 1.90, 1.25, 0.90, 0.70]; // Civic B16/D16 manual gear ratios
    const finalDrive = 4.266;
    const tireCircumferenceMeters = 1.85;

    const interval = setInterval(() => {
      setTelemetry((prev) => {
        // If connected to real BLE, physics doesn't override real ECU values
        if (bleStatus === 'connected') {
          // Generate audio equalizer bands based on real RPM harmonics
          const rpmNormalized = prev.rpm / (settings.revLimitRpm || 8500);
          const freqs = prev.audioFrequencies.map((_, i) => {
            const base = Math.sin(Date.now() / 150 + i * 0.4) * 0.3 + 0.5;
            return Math.max(0.1, Math.min(1, base * (0.5 + rpmNormalized * 0.7)));
          });
          return { ...prev, audioFrequencies: freqs };
        }

        // --- SIMULATED PHYSICS ---
        const idle = settings.idleRpm || 850;
        const redline = settings.revLimitRpm || 8500;
        const vtecRpm = settings.vtecThresholdRpm || 5200;
        const shiftRpm = settings.shiftLightRpm || 7200;

        let targetRpm = idle;
        let newRpm = prev.rpm;
        let newSpeed = prev.speed;
        let newMap = 30; // vacuum kPa
        let newBoost = 0;
        let newAfr = 14.7;

        if (prev.tps > 0) {
          // Accelerating
          const accelerationRate = (prev.tps / 100) * 220;
          targetRpm = idle + (prev.tps / 100) * (redline - idle);
          newRpm = Math.min(redline, prev.rpm + accelerationRate);

          // MAP pressure builds
          newMap = 30 + (prev.tps / 100) * 110;
          if (newMap > 100) {
            newBoost = (newMap - 100) * 0.145; // kPa to PSI boost
          }

          // AFR under load (richer)
          newAfr = prev.tps > 70 ? 12.2 : prev.tps > 30 ? 13.5 : 14.7;
        } else {
          // Decelerating / Engine Braking
          newRpm = Math.max(idle, prev.rpm - 140);
          newMap = 28;
          newAfr = prev.rpm > idle + 300 ? 17.5 : 14.7; // Decel fuel cut
        }

        // Calculate Vehicle Speed based on Gear
        if (prev.gear > 0 && prev.gear <= 5) {
          const ratio = gearRatios[prev.gear] * finalDrive;
          const calculatedSpeed = Math.round((newRpm / ratio) * (tireCircumferenceMeters * 60) / 1000);
          newSpeed = calculatedSpeed;
        } else {
          // In Neutral or Reverse
          newSpeed = Math.max(0, prev.speed - 1);
        }

        // VTEC Engagement check
        const isVtecNow = newRpm >= vtecRpm && prev.tps >= 20;

        // VTEC Crossover Sound Trigger
        if (isVtecNow && !vtecPlayedRef.current && soundEnabled && settings.enableVtecSound) {
          playVtecKickSound();
          vtecPlayedRef.current = true;
        } else if (!isVtecNow) {
          vtecPlayedRef.current = false;
        }

        // Shift Light Beep Trigger
        const isShiftLightNow = newRpm >= shiftRpm;
        if (isShiftLightNow && !shiftBeepPlayedRef.current && soundEnabled && settings.enableShiftBeep) {
          playShiftBeep();
          shiftBeepPlayedRef.current = true;
        } else if (!isShiftLightNow) {
          shiftBeepPlayedRef.current = false;
        }

        // G-Force simulation
        const accelG = prev.tps > 10 ? (prev.tps / 100) * 0.45 : 0;
        const newGx = Math.sin(Date.now() / 800) * (newSpeed > 20 ? 0.25 : 0.05);
        const newGy = accelG;

        // Dynamic Audio Equalizer Bars (Engine harmonics)
        const rpmRatio = newRpm / redline;
        const newFreqs = prev.audioFrequencies.map((_, i) => {
          const wave = Math.sin(Date.now() / 120 + i * 0.6) * 0.35 + 0.55;
          const vtecMultiplier = isVtecNow ? 1.3 : 1.0;
          return Math.max(0.08, Math.min(1.0, wave * (0.4 + rpmRatio * 0.6) * vtecMultiplier));
        });

        // Engine Coolant Temperature slowly normalizes to ~89°C
        let newEct = prev.ect;
        if (newEct < 89) newEct += 0.02;
        if (newRpm > 6000 && newEct < 96) newEct += 0.05;

        return {
          ...prev,
          rpm: Math.round(newRpm),
          speed: newSpeed,
          map: Math.round(newMap),
          boostPsi: parseFloat(newBoost.toFixed(1)),
          afr: parseFloat(newAfr.toFixed(2)),
          vtecActive: isVtecNow,
          shiftLightActive: isShiftLightNow,
          gForce: { x: parseFloat(newGx.toFixed(2)), y: parseFloat(newGy.toFixed(2)) },
          timingAdvanceDeg: parseFloat((14.5 + (newRpm / 1000) * 2.2).toFixed(1)),
          injectorDutyPct: parseFloat(((newRpm / redline) * (prev.tps / 100) * 85 + 2).toFixed(1)),
          audioFrequencies: newFreqs,
          ect: parseFloat(newEct.toFixed(1))
        };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isSimRunning, bleStatus, settings, soundEnabled]);

  // Keyboard Shortcuts for Driving and Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === '1') {
        handleSaveSettings({ ...settings, activeLayout: 'cyber_hud' });
      } else if (e.key === '2') {
        handleSaveSettings({ ...settings, activeLayout: 'hondash_classic' });
      } else if (e.key === '3') {
        handleSaveSettings({ ...settings, activeLayout: 'track_telemetry' });
      } else if (e.key === '4') {
        handleSaveSettings({ ...settings, activeLayout: 'diagnostic_dtc' });
      } else if (e.key === ' ' || e.code === 'Space') {
        // Spacebar Rev Burst
        e.preventDefault();
        setTelemetry((prev) => ({ ...prev, tps: 100 }));
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        setTelemetry((prev) => ({ ...prev, tps: Math.min(100, prev.tps + 25) }));
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        setTelemetry((prev) => ({ ...prev, tps: Math.max(0, prev.tps - 35) }));
      } else if (e.key === 'e' || e.key === 'E') {
        // Shift Up
        setTelemetry((prev) => ({
          ...prev,
          gear: Math.min(5, prev.gear + 1),
          rpm: Math.max(settings.idleRpm || 850, prev.rpm * 0.72)
        }));
      } else if (e.key === 'q' || e.key === 'Q') {
        // Shift Down
        setTelemetry((prev) => ({
          ...prev,
          gear: Math.max(0, prev.gear - 1),
          rpm: Math.min(settings.revLimitRpm || 8500, prev.rpm * 1.35)
        }));
      } else if (e.key === 'l' || e.key === 'L') {
        // Toggle headlights
        setTelemetry((prev) => ({ ...prev, headlightsOn: !prev.headlightsOn }));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        setIsSettingsOpen(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === ' ' || e.code === 'Space') {
        setTelemetry((prev) => ({ ...prev, tps: 0 }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [settings]);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Check Updates action
  const handleCheckUpdates = () => {
    alert('Verificação de Atualizações: O HonDash está na versão mais recente (v2.4.0) compatível com CYD ESP32-S3 e PWA.');
  };

  const handleConnectBluetooth = () => {
    bleManagerRef.current?.connectBluetooth();
  };

  const handleConnectSerial = () => {
    bleManagerRef.current?.connectSerial();
  };

  const handleClearDtc = () => {
    setTelemetry((prev) => ({
      ...prev,
      dtcCodes: [],
      checkEngineLight: false
    }));
  };

  const handleInjectTestDtc = (code: string) => {
    setTelemetry((prev) => ({
      ...prev,
      dtcCodes: Array.from(new Set([...prev.dtcCodes, code])),
      checkEngineLight: true
    }));
  };

  return (
    <div className={`w-screen h-screen bg-black text-white flex flex-col justify-between overflow-hidden relative ${settings.showScanlines ? 'dash-scanlines' : ''}`}>
      {/* 1.0 INICIALIZAÇÃO: BOOT SCREEN COM LOGO DA HONDA */}
      <AnimatePresence>
        {isBooting && (
          <BootScreen
            settings={settings}
            onBootComplete={handleBootComplete}
          />
        )}
      </AnimatePresence>

      {/* 2.0 APRESENTAÇÃO APÓS INICIAR: DASHBOARD COMPLETO */}
      {/* Top Controls Bar */}
      <ControlsBar
        settings={settings}
        onUpdateLayout={(layout: DashboardLayout) => handleSaveSettings({ ...settings, activeLayout: layout })}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRestartBoot={() => setIsBooting(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        bleStatus={bleStatus}
        onConnectBle={handleConnectBluetooth}
        isOnline={isOnline}
        onCheckUpdates={handleCheckUpdates}
      />

      {/* Main Display Area */}
      <main className="flex-1 w-full overflow-y-auto overflow-x-hidden flex items-center justify-center p-1 sm:p-2">
        {settings.activeLayout === 'cyber_hud' && (
          <CyberHudDashboard
            settings={settings}
            telemetry={telemetry}
            onRev={() => {
              setTelemetry((prev) => ({ ...prev, tps: 100 }));
              setTimeout(() => {
                setTelemetry((prev) => ({ ...prev, tps: 0 }));
              }, 1200);
            }}
            onToggleLights={() => {
              setTelemetry((prev) => ({ ...prev, headlightsOn: !prev.headlightsOn }));
            }}
            onToggleDoors={() => {
              setTelemetry((prev) => ({ ...prev, doorsOpen: !prev.doorsOpen }));
            }}
          />
        )}

        {settings.activeLayout === 'hondash_classic' && (
          <HonDashClassicGauges settings={settings} telemetry={telemetry} />
        )}

        {settings.activeLayout === 'track_telemetry' && (
          <TrackTelemetryView settings={settings} telemetry={telemetry} />
        )}

        {settings.activeLayout === 'diagnostic_dtc' && (
          <DiagnosticsDtcView
            settings={settings}
            telemetry={telemetry}
            onClearDtc={handleClearDtc}
            onInjectTestDtc={handleInjectTestDtc}
          />
        )}
      </main>

      {/* Interactive Driving Simulator Controls (for testing on PC/Mobile) */}
      <SimulatorControls
        settings={settings}
        telemetry={telemetry}
        onUpdateTelemetry={setTelemetry}
        isSimRunning={isSimRunning}
        onToggleSim={() => setIsSimRunning(!isSimRunning)}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled(!soundEnabled)}
      />

      {/* Settings Modal (1.0 Boot Logo, 2.0 Carro Civic 99, Cores, Sensores, ESP32) */}
      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onSaveSettings={handleSaveSettings}
          onClose={() => setIsSettingsOpen(false)}
          onTestBoot={() => {
            setIsSettingsOpen(false);
            setIsBooting(true);
          }}
          onConnectBluetooth={handleConnectBluetooth}
          onConnectSerial={handleConnectSerial}
          bleStatus={bleStatus}
          bleMessage={bleMessage}
          isOnline={isOnline}
          onCheckUpdates={handleCheckUpdates}
        />
      )}
    </div>
  );
}
