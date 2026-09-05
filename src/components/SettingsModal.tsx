import React, { useState, useRef } from 'react';
import { AppSettings, BootLogoType, CarPreset, ThemeColor } from '../types';
import { CAR_PRESETS, THEME_COLORS } from '../utils/carPresets';
import { HondaBrandLogo } from './HondaBrandLogos';
import { saveVehicleImage, deleteVehicleImage, downloadVehicleMedia } from '../utils/vehicleImageStorage';
import {
  FREENOVE_ESP32S3_PINOUT_CODE,
  FREENOVE_MAIN_CPP_CODE,
  FREENOVE_PLATFORMIO_INI,
  downloadFirmwareFile
} from '../utils/esp32FirmwareExporter';
import {
  X,
  Palette,
  Bluetooth,
  RefreshCw,
  Upload,
  Download,
  Check,
  Play,
  Wifi,
  Cpu,
  CheckCircle2,
  Copy,
  Terminal,
  Layers,
  Sparkles,
  Link as LinkIcon,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';

export type SettingsTabType = 'customization' | 'connection' | 'esp32_guide' | 'updates';

interface SettingsModalProps {
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClose: () => void;
  onTestBoot: () => void;
  onConnectBluetooth: () => void;
  onConnectSerial: () => void;
  bleStatus: string;
  bleMessage?: string;
  isOnline: boolean;
  onCheckUpdates: () => void;
  initialTab?: SettingsTabType;
  onOpenLvglExport?: () => void;
  onOpenYamlExport?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onClose,
  onTestBoot,
  onConnectBluetooth,
  onConnectSerial,
  bleStatus,
  bleMessage,
  isOnline,
  onCheckUpdates,
  initialTab = 'customization',
  onOpenLvglExport,
  onOpenYamlExport
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTabType>(initialTab);
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [carImageSaveNotice, setCarImageSaveNotice] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [bootLogoNotice, setBootLogoNotice] = useState<string>('');
  const [customBootUrlInput, setCustomBootUrlInput] = useState<string>('');
  const [cCodeFileTab, setCCodeFileTab] = useState<'main.cpp' | 'freenove_pinout.h' | 'platformio.ini'>('main.cpp');
  const [copyCodeNotice, setCopyCodeNotice] = useState<string>('');

  const carFileInputRef = useRef<HTMLInputElement | null>(null);
  const bootLogoFileInputRef = useRef<HTMLInputElement | null>(null);
  const jsonImportInputRef = useRef<HTMLInputElement | null>(null);

  const theme = THEME_COLORS[formData.themeColor] || THEME_COLORS.red;

  const handleUpdate = <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => {
    setFormData((prev) => ({ ...prev, [key]: val }));
  };

  const handleSave = () => {
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Upload Custom Car Image / GIF with IndexedDB persistence
  const handleCarImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (reader.result) {
          const imgData = reader.result as string;
          const updated = {
            ...formData,
            customCarImageUrl: imgData,
            carImageMode: 'custom' as const
          };
          setFormData(updated);
          onSaveSettings(updated);
          await saveVehicleImage(imgData);
          setCarImageSaveNotice('✓ Imagem/GIF do veículo salva e sincronizada com sucesso!');
          setTimeout(() => setCarImageSaveNotice(''), 3500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Custom Car URL (e.g. Tenor / Giphy GIF)
  const handleApplyCarImageUrl = async () => {
    if (!customUrlInput.trim()) return;
    const updated = {
      ...formData,
      customCarImageUrl: customUrlInput.trim(),
      carImageMode: 'custom' as const
    };
    setFormData(updated);
    onSaveSettings(updated);
    await saveVehicleImage(customUrlInput.trim());
    setCustomUrlInput('');
    setCarImageSaveNotice('✓ Link da imagem/GIF salvo com sucesso!');
    setTimeout(() => setCarImageSaveNotice(''), 3500);
  };

  // Remove Car Image and reset to vector wireframe
  const handleRemoveCarImage = async () => {
    const updated = {
      ...formData,
      customCarImageUrl: '',
      carImageMode: 'preset' as const
    };
    setFormData(updated);
    onSaveSettings(updated);
    await deleteVehicleImage();
    setCarImageSaveNotice('✓ Imagem removida. Modo holograma restaurado.');
    setTimeout(() => setCarImageSaveNotice(''), 3500);
  };

  // Download Current Car Image
  const handleDownloadCarImage = () => {
    if (formData.customCarImageUrl) {
      downloadVehicleMedia(
        formData.customCarImageUrl,
        `hondash_car_${formData.carModelName ? formData.carModelName.replace(/\s+/g, '_') : 'civic99'}.gif`
      );
    }
  };

  // Upload Custom Boot Logo / GIF
  const handleBootLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          const imgData = reader.result as string;
          const updated = {
            ...formData,
            customBootLogoUrl: imgData,
            bootLogoType: 'custom' as const
          };
          setFormData(updated);
          onSaveSettings(updated);
          setBootLogoNotice('✓ Logo/GIF de inicialização salvo!');
          setTimeout(() => setBootLogoNotice(''), 3500);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Apply Custom Boot Logo / GIF URL
  const handleApplyBootLogoUrl = () => {
    if (!customBootUrlInput.trim()) return;
    const updated = {
      ...formData,
      customBootLogoUrl: customBootUrlInput.trim(),
      bootLogoType: 'custom' as const
    };
    setFormData(updated);
    onSaveSettings(updated);
    setCustomBootUrlInput('');
    setBootLogoNotice('✓ Link do logo/GIF de inicialização salvo!');
    setTimeout(() => setBootLogoNotice(''), 3500);
  };

  // Remove Custom Boot Logo
  const handleRemoveBootLogo = () => {
    const updated = {
      ...formData,
      customBootLogoUrl: '',
      bootLogoType: 'honda_classic' as const
    };
    setFormData(updated);
    onSaveSettings(updated);
    setBootLogoNotice('✓ Logo clássico Honda restaurado.');
    setTimeout(() => setBootLogoNotice(''), 3500);
  };

  // Export Settings JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `hondash_config_${formData.carModelName ? formData.carModelName.replace(/\s+/g, '_') : 'custom'}.json`);
    dlAnchor.click();
  };

  // Import Settings JSON
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          setFormData(parsed);
          onSaveSettings(parsed);
          alert('Configurações importadas com sucesso!');
        } catch {
          alert('Arquivo JSON inválido.');
        }
      };
      reader.readAsText(file);
    }
  };

  const navItems = [
    {
      id: 'customization' as SettingsTabType,
      label: 'Personalização',
      icon: Palette,
      description: 'Cores, Imagem/GIF, Linhas e Inicialização'
    },
    {
      id: 'connection' as SettingsTabType,
      label: 'Bluetooth & OBD',
      icon: Bluetooth,
      description: 'Pareamento BLE, Serial e Wi-Fi'
    },
    {
      id: 'esp32_guide' as SettingsTabType,
      label: 'Freenove ESP32-S3',
      icon: Cpu,
      description: 'Código C++, LVGL e Guia'
    },
    {
      id: 'updates' as SettingsTabType,
      label: 'Atualizações',
      icon: RefreshCw,
      description: 'Versão, status e backup'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-0 sm:p-4 select-none">
      <div className="bg-zinc-950 border-0 sm:border border-zinc-800 w-full max-w-5xl h-full sm:h-[92vh] max-h-none sm:max-h-[800px] rounded-none sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-2.5 sm:px-5 py-2 sm:py-3.5 border-b border-zinc-800 bg-zinc-900/80 shrink-0">
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <span
              className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
              style={{ backgroundColor: theme.primary, color: theme.primary }}
            />
            <h2 className="font-orbitron font-extrabold text-[10px] sm:text-base tracking-wider text-white truncate">
              CONFIGURAÇÃO // HONDAPP
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 sm:p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
            title="Fechar menu"
          >
            <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Modal Body: Left Sidebar + Right Content */}
        <div className="flex flex-1 overflow-hidden flex-col md:flex-row min-h-0">
          
          {/* LEFT/TOP NAVIGATION TABS */}
          <div className="w-full md:w-56 lg:w-64 bg-zinc-950 md:bg-zinc-900/40 border-b md:border-b-0 md:border-r border-zinc-800/80 p-1 md:p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto shrink-0 font-mono-dash scrollbar-none">
            <div className="hidden md:block px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              Opções do Sistema
            </div>

            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-1.5 sm:gap-3 px-2 sm:px-3 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-left transition-all cursor-pointer whitespace-nowrap md:whitespace-normal w-auto md:w-full shrink-0 ${
                    isActive
                      ? 'bg-zinc-800/90 text-white font-bold shadow-md border border-zinc-700/80'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border border-transparent'
                  }`}
                  style={isActive ? { borderLeftColor: theme.primary, borderLeftWidth: '3px' } : {}}
                >
                  <Icon
                    className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-colors ${
                      isActive ? 'text-white' : 'text-zinc-500'
                    }`}
                    style={isActive ? { color: theme.primary } : {}}
                  />
                  <div className="flex flex-col">
                    <span className="text-[9px] sm:text-xs">{item.label}</span>
                    <span className="text-[10px] text-zinc-500 font-sans hidden md:block leading-tight mt-0.5">
                      {item.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* RIGHT CONTENT PANEL */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-5 space-y-4 sm:space-y-6 text-xs sm:text-sm font-rajdhani">
            
            {/* 1. ABA PERSONALIZAÇÃO */}
            {activeTab === 'customization' && (
              <div className="space-y-4 sm:space-y-6">
                
                {/* 1.1 Paleta de Cores do Painel */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] sm:text-xs font-mono-dash text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      Paleta de Cores (Tema HUD)
                    </label>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2.5">
                    {Object.entries(THEME_COLORS).map(([key, t]) => (
                      <button
                        key={key}
                        onClick={() => handleUpdate('themeColor', key as ThemeColor)}
                        className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl border flex items-center space-x-2 sm:space-x-3 transition-all cursor-pointer ${
                          formData.themeColor === key
                            ? 'border-white bg-zinc-900 shadow-lg'
                            : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div
                          className="w-3.5 h-3.5 sm:w-5 sm:h-5 rounded-full shadow-[0_0_8px_currentColor] shrink-0"
                          style={{ backgroundColor: t.primary, color: t.primary }}
                        />
                        <div className="text-left overflow-hidden">
                          <span className="font-bold text-[10px] sm:text-xs block text-white truncate">{t.name}</span>
                          <span className="text-[8px] sm:text-[10px] font-mono-dash text-zinc-500">{t.primary}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1.2 Imagem / GIF do Veículo */}
                <div className="border-t border-zinc-800 pt-3 sm:pt-5 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] sm:text-xs font-mono-dash text-zinc-300 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                      Foto, GIF ou Holograma do Veículo
                    </label>
                  </div>

                  {carImageSaveNotice && (
                    <div className="p-2 sm:p-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-mono-dash flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{carImageSaveNotice}</span>
                    </div>
                  )}

                  {/* Mode Buttons: Hologram Wireframe or Custom GIF */}
                  <div className="grid grid-cols-2 gap-1.5 sm:gap-3 font-mono-dash text-[9px] sm:text-xs">
                    <button
                      onClick={() => handleUpdate('carImageMode', 'preset')}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-center transition-colors cursor-pointer ${
                        formData.carImageMode === 'preset'
                          ? 'border-red-500 bg-red-950/40 text-white font-bold'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                      }`}
                    >
                      HOLOGRAMA VETOR
                    </button>
                    <button
                      onClick={() => handleUpdate('carImageMode', 'custom')}
                      className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-center transition-colors cursor-pointer ${
                        formData.carImageMode === 'custom'
                          ? 'border-red-500 bg-red-950/40 text-white font-bold'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                      }`}
                    >
                      FOTO OU GIF
                    </button>
                  </div>

                  {formData.carImageMode === 'preset' ? (
                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono-dash text-zinc-400 uppercase mb-1.5">
                        Modelo do Preset
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2">
                        {CAR_PRESETS.map((preset) => (
                          <button
                            key={preset.id}
                            onClick={() => {
                              handleUpdate('carPreset', preset.id as CarPreset);
                            }}
                            className={`p-2 sm:p-3 rounded-lg sm:rounded-xl border text-left transition-colors cursor-pointer ${
                              formData.carPreset === preset.id
                                ? 'border-red-500 bg-zinc-900 text-white'
                                : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                            }`}
                          >
                            <span className="font-bold text-[10px] sm:text-xs block text-white">{preset.name}</span>
                            <span className="text-[9px] sm:text-[11px] text-zinc-500">{preset.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 bg-zinc-900/60 p-2.5 sm:p-4 rounded-xl border border-zinc-800">
                      <div>
                        <span className="font-bold text-white block text-xs">Salvar Foto ou GIF do Veículo</span>
                        <span className="text-[10px] sm:text-xs text-zinc-400 block mb-2">
                          Salvo permanentemente na memória interna do painel (IndexedDB).
                        </span>

                        {/* Upload from device */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <input
                            type="file"
                            ref={carFileInputRef}
                            onChange={handleCarImageUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            onClick={() => carFileInputRef.current?.click()}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold transition-colors cursor-pointer shadow-lg"
                          >
                            <Upload className="w-3.5 h-3.5" /> SELECIONAR FOTO / GIF DO DISPOSITIVO
                          </button>
                        </div>

                        {/* Paste Web Image URL */}
                        <div className="pt-2 border-t border-zinc-800/80">
                          <span className="text-[9px] sm:text-xs text-zinc-400 block mb-1 font-mono-dash">OU COLE O LINK DIRETO DE UM GIF / IMAGEM (URL):</span>
                          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                            <input
                              type="text"
                              value={customUrlInput}
                              onChange={(e) => setCustomUrlInput(e.target.value)}
                              placeholder="https://exemplo.com/civic-turbo.gif"
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 sm:p-2 text-white font-mono text-[10px] sm:text-xs focus:border-red-500 focus:outline-none"
                            />
                            <button
                              onClick={handleApplyCarImageUrl}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold cursor-pointer transition-colors"
                            >
                              APLICAR LINK
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Current active image preview & controls */}
                      {formData.customCarImageUrl ? (
                        <div className="border-t border-zinc-800 pt-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5 w-full sm:w-auto">
                            <button
                              onClick={handleRemoveCarImage}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-300 rounded-lg text-[9px] sm:text-xs font-mono-dash cursor-pointer transition-colors"
                            >
                              <Trash2 className="w-3 h-3" /> REMOVER
                            </button>
                            <button
                              onClick={handleDownloadCarImage}
                              className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg text-[9px] sm:text-xs font-mono-dash cursor-pointer transition-colors"
                            >
                              <Download className="w-3 h-3" /> BAIXAR
                            </button>
                          </div>

                          <div className="relative p-1.5 bg-black/60 rounded-lg border border-zinc-800 flex items-center justify-center">
                            {formData.showUnderglow && (
                              <div
                                className="absolute bottom-1 w-3/4 h-4 rounded-full blur-md opacity-80"
                                style={{
                                  backgroundColor: formData.underglowColor || '#ef4444',
                                  boxShadow: `0 0 16px ${formData.underglowColor || '#ef4444'}`
                                }}
                              />
                            )}
                            <img
                              src={formData.customCarImageUrl}
                              alt="Preview do Veículo"
                              className="max-h-20 sm:max-h-28 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded relative z-10"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 bg-black/40 rounded-lg border border-dashed border-zinc-800 text-center text-[10px] sm:text-xs text-zinc-500 font-mono-dash">
                          Nenhuma foto ou GIF enviada ainda.
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 1.3 Identificação do Veículo e Motor (Campos Opcionais) */}
                <div className="border-t border-zinc-800 pt-3 sm:pt-5 space-y-3 sm:space-y-4">
                  <span className="text-[10px] sm:text-xs font-mono-dash text-zinc-300 font-bold uppercase tracking-wider block">
                    Textos de Identificação (Opcionais)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4">
                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono-dash text-zinc-400 uppercase mb-1">
                        Nome / Identificação do Veículo
                      </label>
                      <input
                        type="text"
                        value={formData.carModelName}
                        onChange={(e) => handleUpdate('carModelName', e.target.value)}
                        placeholder="(Opcional) Ex: HONDA CIVIC // B16A2"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono-dash text-xs focus:border-red-500 focus:outline-none"
                      />
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5 block">Deixe vazio se não quiser exibir.</span>
                    </div>

                    <div>
                      <label className="block text-[10px] sm:text-xs font-mono-dash text-zinc-400 uppercase mb-1">
                        Especificação do Motor / ECU
                      </label>
                      <input
                        type="text"
                        value={formData.carEngineSpec}
                        onChange={(e) => handleUpdate('carEngineSpec', e.target.value)}
                        placeholder="(Opcional) Ex: B16A2 DOHC VTEC"
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono-dash text-xs focus:border-red-500 focus:outline-none"
                      />
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5 block">Deixe vazio se não quiser exibir.</span>
                    </div>
                  </div>
                </div>

                {/* 1.4 Efeitos Visuais (Underglow & Scanlines) */}
                <div className="border-t border-zinc-800 pt-3 sm:pt-5 space-y-2.5 sm:space-y-4">
                  <span className="text-[10px] sm:text-xs font-mono-dash text-zinc-300 font-bold uppercase tracking-wider block">
                    Efeitos Visuais e Iluminação
                  </span>

                  {/* Neon Underglow */}
                  <div className="flex items-center justify-between bg-zinc-900/40 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-zinc-800/80 gap-2">
                    <div>
                      <span className="font-bold text-white block text-xs sm:text-sm">Neon sob o Chassi (Underglow)</span>
                      <span className="text-[9px] sm:text-xs text-zinc-400">Brilho neon sob o holograma/foto do veículo.</span>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <input
                        type="color"
                        value={formData.underglowColor || '#ef4444'}
                        onChange={(e) => handleUpdate('underglowColor', e.target.value)}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded border-0 cursor-pointer bg-transparent"
                      />
                      <input
                        type="checkbox"
                        checked={formData.showUnderglow}
                        onChange={(e) => handleUpdate('showUnderglow', e.target.checked)}
                        className="w-4 h-4 sm:w-5 sm:h-5 accent-red-500 cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Scanlines toggle */}
                  <div className="flex items-center justify-between bg-zinc-900/40 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-zinc-800/80 gap-2">
                    <div>
                      <span className="font-bold text-white block text-xs sm:text-sm">Efeito Scanlines LCD</span>
                      <span className="text-[9px] sm:text-xs text-zinc-400">Textura sutil de display automotivo CYD.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showScanlines}
                      onChange={(e) => handleUpdate('showScanlines', e.target.checked)}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-red-500 cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Relógio Digital Acima do Veículo / GIF (Apenas em Tela Expandida) */}
                  <div className="flex items-center justify-between bg-zinc-900/40 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-zinc-800/80 gap-2">
                    <div>
                      <span className="font-bold text-white block text-xs sm:text-sm">Relógio Acima do GIF (Tela Expandida)</span>
                      <span className="text-[9px] sm:text-xs text-zinc-400">Exibe o horário atual acima do GIF/veículo somente quando o card for expandido.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.showVehicleClock !== false}
                      onChange={(e) => handleUpdate('showVehicleClock', e.target.checked)}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-red-500 cursor-pointer shrink-0"
                    />
                  </div>

                  {/* Formato de Horário (24h / 12h) */}
                  <div className="flex items-center justify-between bg-zinc-900/40 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-zinc-800/80 gap-2">
                    <div>
                      <span className="font-bold text-white block text-xs sm:text-sm">Formato de Horário</span>
                      <span className="text-[9px] sm:text-xs text-zinc-400">Padrão de exibição das horas em todo o painel (24 Horas ou 12 Horas AM/PM).</span>
                    </div>
                    <select
                      value={formData.clockFormat || '24h'}
                      onChange={(e) => handleUpdate('clockFormat', e.target.value as '24h' | '12h')}
                      className="bg-zinc-950 border border-zinc-700 text-white rounded px-2 py-1 text-xs sm:text-sm font-orbitron cursor-pointer"
                    >
                      <option value="24h">24 Horas (24h)</option>
                      <option value="12h">12 Horas (AM/PM)</option>
                    </select>
                  </div>
                </div>

                {/* 1.5 Inicialização, Logo e Boas-Vindas */}
                <div className="border-t border-zinc-800 pt-3 sm:pt-5 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs font-mono-dash text-zinc-300 font-bold uppercase tracking-wider block">
                      Tela de Inicialização & Logo
                    </span>
                    <button
                      onClick={() => {
                        handleSave();
                        onTestBoot();
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono-dash text-[9px] sm:text-xs font-bold transition-colors cursor-pointer"
                    >
                      <Play className="w-3 h-3" /> TESTAR BOOT
                    </button>
                  </div>

                  {bootLogoNotice && (
                    <div className="p-2 sm:p-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 rounded-lg text-[10px] sm:text-xs font-mono-dash flex items-center gap-1.5 animate-pulse">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>{bootLogoNotice}</span>
                    </div>
                  )}

                  {/* Logo Mode Selection */}
                  <div>
                    <label className="block text-[10px] sm:text-xs font-mono-dash text-zinc-400 uppercase mb-1.5">
                      Logo ou GIF da Inicialização
                    </label>
                    <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5">
                      {/* 1: Honda Classic Silver H */}
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdate('bootLogoType', 'honda_classic');
                        }}
                        className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left transition-all cursor-pointer ${
                          formData.bootLogoType === 'honda_classic' || !formData.bootLogoType
                            ? 'border-white bg-zinc-900 shadow-lg text-white font-bold'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-black/60 rounded-md p-1 border border-zinc-700/80 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                          <HondaBrandLogo type="honda_classic" className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[9px] sm:text-xs block text-white font-bold truncate">HONDA</span>
                          <span className="text-[8px] sm:text-[10px] text-zinc-400 font-mono-dash hidden sm:inline">Prata</span>
                        </div>
                      </button>

                      {/* 2: Type-R Red Badge */}
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdate('bootLogoType', 'honda_typer');
                        }}
                        className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left transition-all cursor-pointer ${
                          formData.bootLogoType === 'honda_typer'
                            ? 'border-red-500 bg-zinc-900 shadow-lg text-white font-bold'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-black/60 rounded-md p-1 border border-zinc-700/80 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                          <HondaBrandLogo type="honda_typer" className="w-5 h-5 sm:w-7 sm:h-7" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[9px] sm:text-xs block text-red-400 font-bold truncate">TYPE R</span>
                          <span className="text-[8px] sm:text-[10px] text-zinc-400 font-mono-dash hidden sm:inline">Vermelho</span>
                        </div>
                      </button>

                      {/* 3: Custom Image / GIF */}
                      <button
                        type="button"
                        onClick={() => {
                          handleUpdate('bootLogoType', 'custom');
                        }}
                        className={`p-1.5 sm:p-3 rounded-lg sm:rounded-xl border flex flex-col sm:flex-row items-center sm:gap-2.5 text-center sm:text-left transition-all cursor-pointer ${
                          formData.bootLogoType === 'custom'
                            ? 'border-amber-500 bg-zinc-900 shadow-lg text-white font-bold'
                            : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:bg-zinc-900/60'
                        }`}
                      >
                        <div className="w-7 h-7 sm:w-9 sm:h-9 bg-black/60 rounded-md p-1 border border-zinc-700/80 flex items-center justify-center shrink-0 mb-1 sm:mb-0">
                          <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                        </div>
                        <div className="overflow-hidden">
                          <span className="text-[9px] sm:text-xs block text-amber-400 font-bold truncate">CUSTOM</span>
                          <span className="text-[8px] sm:text-[10px] text-zinc-400 font-mono-dash hidden sm:inline">Foto/GIF</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Custom Boot Logo Upload Area */}
                  {formData.bootLogoType === 'custom' && (
                    <div className="space-y-2.5 bg-zinc-900/60 p-2.5 sm:p-4 rounded-xl border border-zinc-800">
                      <div>
                        <span className="font-bold text-white block text-xs font-mono-dash">
                          CARREGAR LOGO OU GIF PARA A INICIALIZAÇÃO
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-zinc-400 block mb-2">
                          Suporta GIF animado, PNG com transparência, JPG ou WebP.
                        </span>

                        {/* File selector from phone / PC */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <input
                            type="file"
                            ref={bootLogoFileInputRef}
                            onChange={handleBootLogoUpload}
                            accept="image/*"
                            className="hidden"
                          />
                          <button
                            type="button"
                            onClick={() => bootLogoFileInputRef.current?.click()}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold transition-colors cursor-pointer shadow"
                          >
                            <Upload className="w-3.5 h-3.5" /> SELECIONAR ARQUIVO DO DISPOSITIVO
                          </button>
                        </div>

                        {/* URL Paste */}
                        <div className="pt-2 border-t border-zinc-800/80">
                          <span className="text-[9px] sm:text-xs text-zinc-400 block mb-1 font-mono-dash">
                            OU COLE O LINK DIRETO DE UM GIF / LOGO (URL):
                          </span>
                          <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-2">
                            <input
                              type="text"
                              value={customBootUrlInput}
                              onChange={(e) => setCustomBootUrlInput(e.target.value)}
                              placeholder="https://exemplo.com/honda-logo.gif"
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-1.5 sm:p-2 text-white font-mono text-[10px] sm:text-xs focus:border-amber-500 focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleApplyBootLogoUrl}
                              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold cursor-pointer transition-colors"
                            >
                              APLICAR LINK
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Custom Logo Preview & Remove */}
                      {formData.customBootLogoUrl ? (
                        <div className="border-t border-zinc-800 pt-2.5 flex items-center justify-between gap-3">
                          <button
                            type="button"
                            onClick={handleRemoveBootLogo}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-red-950/70 hover:bg-red-900 border border-red-700/80 text-red-300 rounded-lg text-[9px] sm:text-xs font-mono-dash cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3 h-3" /> REMOVER LOGO
                          </button>

                          <div className="p-1.5 bg-black/70 rounded-lg border border-zinc-800 flex items-center justify-center">
                            <img
                              src={formData.customBootLogoUrl}
                              alt="Preview Logo Boot"
                              className="max-h-16 max-w-[100px] object-contain rounded drop-shadow"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 bg-black/40 rounded-lg border border-dashed border-zinc-800 text-center text-[10px] sm:text-xs text-zinc-500 font-mono-dash">
                          Nenhum logo/GIF personalizado selecionado ainda.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Optional Welcome Text */}
                  <div>
                    <label className="block text-[10px] sm:text-xs font-mono-dash text-zinc-400 uppercase mb-1">
                      Texto de Boas-Vindas no Carregamento
                    </label>
                    <input
                      type="text"
                      value={formData.bootWelcomeText}
                      onChange={(e) => handleUpdate('bootWelcomeText', e.target.value)}
                      placeholder="(Opcional) Ex: HONDA CIVIC 1999"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono-dash text-xs focus:border-red-500 focus:outline-none"
                    />
                    <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5 block">
                      Deixe vazio para mostrar exclusivamente o logo e o carregamento.
                    </span>
                  </div>

                  {/* Boot Sound Toggle */}
                  <div className="flex items-center justify-between bg-zinc-900/40 p-2 sm:p-3 rounded-lg sm:rounded-xl border border-zinc-800/80 gap-2">
                    <div>
                      <span className="font-bold text-white block text-xs sm:text-sm">Som de Inicialização</span>
                      <span className="text-[9px] sm:text-xs text-zinc-400">Tocar efeito sonoro automotivo ao iniciar.</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={formData.enableBootSound || false}
                      onChange={(e) => handleUpdate('enableBootSound', e.target.checked)}
                      className="w-4 h-4 sm:w-5 sm:h-5 accent-red-500 cursor-pointer shrink-0"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* 2. ABA BLUETOOTH & OBD */}
            {activeTab === 'connection' && (
              <div className="space-y-3 sm:space-y-5">
                <div className="bg-zinc-900/60 p-3 sm:p-4 rounded-xl border border-zinc-800 space-y-2.5 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2.5">
                      <Bluetooth className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block text-xs sm:text-sm">Web Bluetooth (BLE)</span>
                        <span className="text-[10px] sm:text-xs text-zinc-400">
                          Pareia diretamente com ESP32-S3 BLE, HonDash ou OBD2 ELM327.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onConnectBluetooth}
                      className="w-full sm:w-auto px-3.5 py-1.5 sm:py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold transition-colors cursor-pointer shadow"
                    >
                      PROCURAR BLUETOOTH
                    </button>
                  </div>

                  <div className="border-t border-zinc-800 pt-2 text-[10px] sm:text-xs font-mono-dash flex justify-between items-center">
                    <span className="text-zinc-400">STATUS:</span>
                    <span className={`font-bold truncate max-w-[160px] sm:max-w-none ${
                      bleStatus === 'connected' ? 'text-emerald-400' : bleStatus === 'connecting' ? 'text-amber-400' : 'text-zinc-400'
                    }`}>
                      {bleStatus.toUpperCase()} {bleMessage ? `— ${bleMessage}` : ''}
                    </span>
                  </div>
                </div>

                {/* Web Serial Direct USB */}
                <div className="bg-zinc-900/60 p-3 sm:p-4 rounded-xl border border-zinc-800 space-y-2.5 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-center space-x-2.5">
                      <Cpu className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white block text-xs sm:text-sm">USB Serial (CYD ESP32-S3)</span>
                        <span className="text-[10px] sm:text-xs text-zinc-400">
                          Conecta via cabo USB na porta COM da plaquinha CYD (baudrate 115200).
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={onConnectSerial}
                      className="w-full sm:w-auto px-3.5 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold transition-colors cursor-pointer shadow"
                    >
                      CONECTAR SERIAL USB
                    </button>
                  </div>
                </div>

                {/* Wi-Fi WebSocket */}
                <div className="bg-zinc-900/60 p-3 sm:p-4 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Wifi className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                    <span className="font-bold text-white text-xs sm:text-sm">IP Local Wi-Fi do ESP32-S3</span>
                  </div>
                  <input
                    type="text"
                    value={formData.wifiEsp32Ip || '192.168.4.1'}
                    onChange={(e) => handleUpdate('wifiEsp32Ip', e.target.value)}
                    placeholder="192.168.4.1 ou 192.168.1.150"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 sm:p-2.5 text-white font-mono-dash text-xs sm:text-sm"
                  />
                </div>
              </div>
            )}

            {/* 3. ABA GUIA & CÓDIGO C / LVGL FREENOVE ESP32-S3 */}
            {activeTab === 'esp32_guide' && (
              <div className="space-y-3 sm:space-y-5 text-xs font-mono-dash">
                {/* Hardware Spec Card */}
                <div className="p-3 sm:p-4 bg-zinc-900/90 border border-zinc-700 rounded-xl space-y-2.5 sm:space-y-3 shadow-lg">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-zinc-800 pb-2.5">
                    <div className="flex items-center space-x-2">
                      <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400 shrink-0" />
                      <div>
                        <span className="font-bold text-white text-xs sm:text-sm block">
                          ESP32-S3 CYD 240x320
                        </span>
                        <span className="text-[9px] sm:text-[11px] text-zinc-400">
                          Dual-Core 240MHz | 240x320 IPS | Touch Capacitivo
                        </span>
                      </div>
                    </div>
                    <span className="px-1.5 py-0.5 bg-cyan-950/80 border border-cyan-700 text-cyan-300 text-[8px] sm:text-[10px] font-bold rounded">
                      LVGL v8/v9 C/C++
                    </span>
                  </div>

                  {/* Complete LVGL Export Action */}
                  {onOpenLvglExport && (
                    <div className="p-2.5 bg-cyan-950/40 border border-cyan-500/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-white font-bold block text-xs">Conversão Completa em LVGL (C/C++)</span>
                        <span className="text-[10px] text-cyan-200/80">Código em C com 4 quadrantes, widgets, fontes e telemetria pronto para flash.</span>
                      </div>
                      <button
                        onClick={onOpenLvglExport}
                        className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                      >
                        <Cpu className="w-3.5 h-3.5" /> ABRIR EXPORTADOR LVGL
                      </button>
                    </div>
                  )}

                  {/* Complete YAML Export Action */}
                  {onOpenYamlExport && (
                    <div className="p-2.5 bg-amber-950/30 border border-amber-500/50 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <span className="text-white font-bold block text-xs">Conversão Declarativa em YAML</span>
                        <span className="text-[10px] text-amber-200/80">Configuração ESPHome LVGL, OpenHASP, Home Assistant e arquitetura master.</span>
                      </div>
                      <button
                        onClick={onOpenYamlExport}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-lg transition-all cursor-pointer shadow-md flex items-center gap-1.5 shrink-0"
                      >
                        <Layers className="w-3.5 h-3.5" /> ABRIR EXPORTADOR YAML
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 text-[9px] sm:text-[11px]">
                    <div className="bg-zinc-950 p-1.5 sm:p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[8px] sm:text-[10px]">TELA</span>
                      <span className="text-white font-bold">ST7789 (240x320)</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 sm:p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[8px] sm:text-[10px]">TOUCH</span>
                      <span className="text-cyan-400 font-bold">Capacitivo I2C</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 sm:p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[8px] sm:text-[10px]">MCU</span>
                      <span className="text-white font-bold">ESP32-S3 240MHz</span>
                    </div>
                    <div className="bg-zinc-950 p-1.5 sm:p-2.5 rounded-lg border border-zinc-800">
                      <span className="text-zinc-500 block text-[8px] sm:text-[10px]">WIRELESS</span>
                      <span className="text-emerald-400 font-bold">BLE 5.0 + Wi-Fi</span>
                    </div>
                  </div>
                </div>

                {/* Download Firmware Files */}
                <div className="p-3 sm:p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-2.5 sm:space-y-3">
                  <div>
                    <span className="font-bold text-white block text-xs sm:text-sm">Download do Código C / C++</span>
                    <span className="text-[9px] sm:text-[11px] text-zinc-400">
                      Pronto para Arduino IDE, PlatformIO ou ESP-IDF com LVGL.
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1">
                    <button
                      onClick={() => downloadFirmwareFile(FREENOVE_MAIN_CPP_CODE, 'main.cpp')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-[10px] sm:text-xs font-bold"
                    >
                      <Download className="w-3 h-3 text-cyan-400" /> main.cpp
                    </button>

                    <button
                      onClick={() => downloadFirmwareFile(FREENOVE_ESP32S3_PINOUT_CODE, 'freenove_pinout.h')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-[10px] sm:text-xs font-bold"
                    >
                      <Download className="w-3 h-3 text-amber-400" /> pinout.h
                    </button>

                    <button
                      onClick={() => downloadFirmwareFile(FREENOVE_PLATFORMIO_INI, 'platformio.ini')}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-[10px] sm:text-xs font-bold"
                    >
                      <Download className="w-3 h-3 text-emerald-400" /> platformio.ini
                    </button>
                  </div>
                </div>

                {/* In-App Code Viewer */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                  <div className="flex items-center justify-between px-2 sm:px-3 py-1.5 bg-zinc-900 border-b border-zinc-800">
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => setCCodeFileTab('main.cpp')}
                        className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs transition-colors cursor-pointer ${
                          cCodeFileTab === 'main.cpp' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        main.cpp
                      </button>
                      <button
                        onClick={() => setCCodeFileTab('freenove_pinout.h')}
                        className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded text-[10px] sm:text-xs transition-colors cursor-pointer ${
                          cCodeFileTab === 'freenove_pinout.h' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        pinout.h
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        const code = cCodeFileTab === 'main.cpp'
                          ? FREENOVE_MAIN_CPP_CODE
                          : cCodeFileTab === 'freenove_pinout.h'
                          ? FREENOVE_ESP32S3_PINOUT_CODE
                          : FREENOVE_PLATFORMIO_INI;
                        navigator.clipboard.writeText(code);
                        setCopyCodeNotice(`✓ Copiado!`);
                        setTimeout(() => setCopyCodeNotice(''), 3000);
                      }}
                      className="flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[9px] sm:text-[11px] transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copyCodeNotice || 'COPIAR'}</span>
                    </button>
                  </div>

                  <div className="p-2 sm:p-3 max-h-48 sm:max-h-64 overflow-y-auto font-mono text-[9px] sm:text-[11px] leading-relaxed text-zinc-300 select-text">
                    <pre className="whitespace-pre overflow-x-auto">
                      {cCodeFileTab === 'main.cpp'
                        ? FREENOVE_MAIN_CPP_CODE
                        : cCodeFileTab === 'freenove_pinout.h'
                        ? FREENOVE_ESP32S3_PINOUT_CODE
                        : FREENOVE_PLATFORMIO_INI}
                    </pre>
                  </div>
                </div>

                {/* Wiring Pinout Table */}
                <div className="p-3 sm:p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-2">
                  <span className="font-bold text-amber-400 text-xs sm:text-sm flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> PINAGEM HONDA CIVIC 99 (K-LINE / 3-PIN DLC)
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 sm:gap-2 text-[9px] sm:text-[11px]">
                    <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                      <span className="text-cyan-400 font-bold block">GPIO 18 / GPIO 17</span>
                      <span className="text-zinc-400">K-Line L9637D ECU P28/P30/P72/HonDash.</span>
                    </div>
                    <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                      <span className="text-amber-400 font-bold block">GPIO 15 (Buzzer)</span>
                      <span className="text-zinc-400">Alarme sonoro VTEC / Shift Light.</span>
                    </div>
                    <div className="bg-black/60 p-2 rounded-lg border border-zinc-800">
                      <span className="text-emerald-400 font-bold block">5V / GND Pós-Chave</span>
                      <span className="text-zinc-400">Step-Down 12V ➔ 5V 2A (ACC) do Civic.</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. ABA ATUALIZAÇÕES & BACKUP */}
            {activeTab === 'updates' && (
              <div className="space-y-3 sm:space-y-5">
                <div className="bg-zinc-900/60 p-3 sm:p-4 rounded-xl border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                      <span className="font-bold text-white text-xs sm:text-sm">Status da Conexão</span>
                    </div>
                    <span className="text-[10px] sm:text-xs text-zinc-400 block mt-0.5">
                      {isOnline
                        ? 'Online. Sincroniza novas versões automaticamente.'
                        : 'Offline. Funcionalidades locais operando normalmente.'}
                    </span>
                  </div>
                  <button
                    onClick={onCheckUpdates}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono-dash text-[10px] sm:text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> VERIFICAR ATUALIZAÇÕES
                  </button>
                </div>

                {/* Export / Import Settings */}
                <div className="bg-zinc-900/60 p-3 sm:p-4 rounded-xl border border-zinc-800 space-y-2.5 sm:space-y-3">
                  <span className="font-bold text-white block text-xs sm:text-sm">Backup de Perfis</span>
                  <span className="text-[10px] sm:text-xs text-zinc-400 block">
                    Exporte sua configuração de personalização em JSON.
                  </span>

                  <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono-dash text-[10px] sm:text-xs">
                    <button
                      onClick={handleExportJson}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer font-bold"
                    >
                      <Download className="w-3.5 h-3.5" /> EXPORTAR PERFIL (.JSON)
                    </button>

                    <input
                      type="file"
                      ref={jsonImportInputRef}
                      onChange={handleImportJson}
                      accept=".json"
                      className="hidden"
                    />
                    <button
                      onClick={() => jsonImportInputRef.current?.click()}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer font-bold"
                    >
                      <Upload className="w-3.5 h-3.5" /> IMPORTAR PERFIL (.JSON)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-2.5 sm:px-4 py-2 sm:py-3.5 border-t border-zinc-800 bg-zinc-900/90 flex items-center justify-between shrink-0">
          <span className="text-[9px] sm:text-xs font-mono-dash text-zinc-400 truncate max-w-[120px] sm:max-w-none">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1 font-bold">
                <Check className="w-3.5 h-3.5 shrink-0" /> SALVO!
              </span>
            ) : (
              'HONDAPP 240x320'
            )}
          </span>

          <div className="flex gap-1.5 sm:gap-2.5 shrink-0">
            <button
              onClick={onClose}
              className="px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] sm:text-xs font-mono-dash cursor-pointer transition-colors"
            >
              FECHAR
            </button>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-3.5 py-1.5 sm:px-5 sm:py-2 rounded-lg sm:rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-dash text-[10px] sm:text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              SALVAR E APLICAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
