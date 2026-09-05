import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AnimatePresence } from 'motion/react';
import { AppSettings, TelemetryData } from './types';
import { BootScreen } from './components/BootScreen';
import { CyberHudDashboard } from './components/CyberHudDashboard';
import { ControlsBar } from './components/ControlsBar';
import { SettingsModal } from './components/SettingsModal';
import { UpdateCheckModal } from './components/UpdateCheckModal';
import { LvglExportModal } from './components/LvglExportModal';
import { YamlExportModal } from './components/YamlExportModal';
import { HonDashDeviceManager, ConnectionStatus } from './utils/bleService';
import { playVtecKickSound, playShiftBeep } from './utils/soundEffects';
import { getVehicleImage, saveVehicleImage } from './utils/vehicleImageStorage';

const STORAGE_KEY = 'hondash_cyd_settings_v1';

const DEFAULT_SETTINGS: AppSettings = {
  themeColor: 'red',
  customColorHex: '#ef4444',
  carModelName: '',
  carEngineSpec: '',
  carPreset: 'civic99_sedan',
  carImageMode: 'preset',
  customCarImageUrl: '',
  showUnderglow: true,
  underglowColor: '#ef4444',
  showVehicleClock: true,
  clockFormat: '24h',

  bootLogoType: 'honda_classic',
  customBootLogoUrl: '',
  bootWelcomeText: '',
  bootDurationMs: 2200,
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
  connectionMode: 'bluetooth',
  wifiEsp32Ip: '192.168.4.1',
  showScanlines: true,
  autoCheckUpdates: true
};

const INITIAL_TELEMETRY: TelemetryData = {
  rpm: 0,
  speed: 0,
  gear: 0, // Neutral
  ect: 25.0, // Temperatura de repouso (°C)
  iat: 25.0, // Arrefecimento/admissão (°C)
  insideTemp: 25.0,
  outsideTemp: 25.0,
  map: 0, // Pressão do coletor kPa
  boostPsi: 0,
  tps: 0, // Borboleta %
  afr: 14.7, // Razão estequiométrica
  batteryVoltage: 12.6, // Voltagem da bateria em repouso
  vtecActive: false,
  oilPressurePsi: 0,
  fuelLevelPct: 75,
  timingAdvanceDeg: 0,
  injectorDutyPct: 0,
  checkEngineLight: false,
  shiftLightActive: false,
  headlightsOn: false,
  doorsOpen: false,
  gForce: { x: 0, y: 0 },
  audioFrequencies: [0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05, 0.05],
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
  const [settingsInitialTab, setSettingsInitialTab] = useState<'customization' | 'connection' | 'esp32_guide' | 'updates'>('customization');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isLvglModalOpen, setIsLvglModalOpen] = useState(false);
  const [isYamlModalOpen, setIsYamlModalOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Online / Offline detection
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
        setTelemetry((prev) => {
          const nextRpm = typeof data.rpm === 'number' ? data.rpm : prev.rpm;
          const nextSpeed = typeof data.speed === 'number' ? data.speed : prev.speed;
          const nextTps = typeof data.tps === 'number' ? data.tps : prev.tps;
          const vtecThreshold = settings.vtecThresholdRpm || 5200;
          const shiftThreshold = settings.shiftLightRpm || 7200;
          const isVtec = typeof data.vtecActive === 'boolean' ? data.vtecActive : nextRpm >= vtecThreshold;
          const isShift = nextRpm >= shiftThreshold;

          // Play VTEC sound transitions if enabled
          if (isVtec && !prev.vtecActive && settings.enableVtecSound) {
            playVtecKickSound();
          }
          if (isShift && !prev.shiftLightActive && settings.enableShiftBeep) {
            playShiftBeep();
          }

          // Dynamic gear calculation if not directly sent by ECU
          let currentGear = prev.gear;
          if (typeof data.gear === 'number') {
            currentGear = data.gear;
          } else if (nextSpeed > 3 && nextRpm > 500) {
            const ratio = nextRpm / nextSpeed;
            if (ratio > 105) currentGear = 1;
            else if (ratio > 68) currentGear = 2;
            else if (ratio > 48) currentGear = 3;
            else if (ratio > 34) currentGear = 4;
            else currentGear = 5;
          } else if (nextSpeed === 0) {
            currentGear = 0; // Neutral
          }

          // Real-time audio spectrum harmonics derived from live engine acoustic frequency & TPS
          const rpmNormalized = Math.max(0, Math.min(1, nextRpm / (settings.revLimitRpm || 8500)));
          const tpsNormalized = Math.max(0, Math.min(1, nextTps / 100));
          const timeNow = Date.now();
          const liveAudioBands = Array.from({ length: 18 }).map((_, i) => {
            const harmonic = Math.sin((timeNow / 90) * (1 + (i / 18) * 2.5) + i) * 0.3 + 0.5;
            const vtecBoost = isVtec ? 0.35 : 0;
            const energy = (rpmNormalized * 0.65 + tpsNormalized * 0.25 + vtecBoost + harmonic * 0.2);
            return Math.max(0.08, Math.min(1, energy));
          });

          return {
            ...prev,
            ...data,
            rpm: nextRpm,
            speed: nextSpeed,
            tps: nextTps,
            gear: currentGear,
            vtecActive: isVtec,
            shiftLightActive: isShift,
            audioFrequencies: liveAudioBands
          };
        });
      }
    });
    bleManagerRef.current = manager;

    return () => {
      manager.disconnect();
    };
  }, [settings.vtecThresholdRpm, settings.shiftLightRpm, settings.revLimitRpm, settings.enableVtecSound, settings.enableShiftBeep]);

  // Keyboard Shortcuts for HondApp controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'l' || e.key === 'L') {
        // Toggle headlights
        setTelemetry((prev) => ({ ...prev, headlightsOn: !prev.headlightsOn }));
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'c' || e.key === 'C') {
        setIsSettingsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Fullscreen toggle handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  // Check Updates action (Manual check available from menu)
  const handleCheckUpdates = () => {
    setIsUpdateModalOpen(true);
  };

  const handleConnectBluetooth = () => {
    bleManagerRef.current?.connectBluetooth();
  };

  const handleConnectSerial = () => {
    bleManagerRef.current?.connectSerial();
  };

  return (
    <div className={`w-screen h-screen max-h-screen bg-black text-white flex flex-col justify-between overflow-hidden relative select-none ${settings.showScanlines ? 'dash-scanlines' : ''}`}>
      {/* 1.0 INICIALIZAÇÃO: BOOT SCREEN COM LOGO DA HONDA */}
      <AnimatePresence>
        {isBooting && (
          <BootScreen
            settings={settings}
            onBootComplete={handleBootComplete}
          />
        )}
      </AnimatePresence>

      {/* 2.0 APRESENTAÇÃO APÓS INICIAR: DASHBOARD COMPLETO HONDAPP */}
      {/* Top Controls Bar */}
      <ControlsBar
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onRestartBoot={() => setIsBooting(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        bleStatus={bleStatus}
        onConnectBle={handleConnectBluetooth}
        isOnline={isOnline}
        onCheckUpdates={handleCheckUpdates}
        onOpenLvglExport={() => setIsLvglModalOpen(true)}
        onOpenYamlExport={() => setIsYamlModalOpen(true)}
      />

      {/* Main Display Area */}
      <main className="flex-1 w-full h-full max-h-full overflow-hidden flex items-center justify-center p-1 sm:p-2">
        <CyberHudDashboard
          settings={settings}
          telemetry={telemetry}
          bleStatus={bleStatus}
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
          onOpenCarImageSettings={() => {
            // Open settings dialog directly on the vehicle customization tab
            setSettingsInitialTab('customization');
            setIsSettingsOpen(true);
          }}
          onUpdateSettings={handleSaveSettings}
        />
      </main>

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
          initialTab={settingsInitialTab}
          onOpenLvglExport={() => {
            setIsSettingsOpen(false);
            setIsLvglModalOpen(true);
          }}
          onOpenYamlExport={() => {
            setIsSettingsOpen(false);
            setIsYamlModalOpen(true);
          }}
        />
      )}

      {/* Central de Atualizações Modal */}
      <UpdateCheckModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        settings={settings}
        isOnline={isOnline}
      />

      {/* LVGL Embedded C / C++ Modal & Code Exporter */}
      <LvglExportModal
        isOpen={isLvglModalOpen}
        onClose={() => setIsLvglModalOpen(false)}
        settings={settings}
        onSwitchToYaml={() => setIsYamlModalOpen(true)}
      />

      {/* YAML Declarative Config & Exporter Modal */}
      <YamlExportModal
        isOpen={isYamlModalOpen}
        onClose={() => setIsYamlModalOpen(false)}
        settings={settings}
        onSwitchToLvgl={() => setIsLvglModalOpen(true)}
      />
    </div>
  );
}
