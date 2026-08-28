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
  Car,
  Zap,
  Gauge,
  Bluetooth,
  RefreshCw,
  Upload,
  Download,
  Check,
  Play,
  Wifi,
  Cpu,
  Monitor,
  Sparkles,
  HelpCircle,
  FileCode,
  Image as ImageIcon,
  Trash2,
  Link as LinkIcon,
  CheckCircle2,
  Copy,
  Terminal,
  Layers
} from 'lucide-react';

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
}

type TabType = 'appearance' | 'car' | 'boot' | 'sensors' | 'connection' | 'esp32_guide' | 'updates';

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
  onCheckUpdates
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('appearance');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [carImageSaveNotice, setCarImageSaveNotice] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
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

  // Upload Custom Car Image / GIF with instant IndexedDB persistence
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

  // Remove Car Image and reset
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
        `hondash_car_${formData.carModelName.replace(/\s+/g, '_') || 'civic99'}.gif`
      );
    }
  };

  // Upload Custom Boot Logo
  const handleBootLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          handleUpdate('customBootLogoUrl', reader.result as string);
          handleUpdate('bootLogoType', 'custom');
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Export Settings JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(formData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `hondash_config_${formData.carModelName.replace(/\s+/g, '_')}.json`);
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

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 select-none">
      <div className="bg-zinc-950 border border-zinc-800 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-zinc-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/50">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.primary }} />
            <h2 className="font-orbitron font-extrabold text-base sm:text-lg tracking-wider text-white">
              MENU DE CONFIGURAÇÃO // HONDASH
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto border-b border-zinc-800 bg-zinc-950 px-3 py-1 space-x-1 text-xs font-mono-dash scrollbar-none">
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'appearance' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Palette className="w-4 h-4" /> <span>Aparência & Cor</span>
          </button>

          <button
            onClick={() => setActiveTab('car')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'car' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Car className="w-4 h-4" /> <span>Veículo (Civic 99)</span>
          </button>

          <button
            onClick={() => setActiveTab('boot')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'boot' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Zap className="w-4 h-4" /> <span>Logo & Boot</span>
          </button>

          <button
            onClick={() => setActiveTab('sensors')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'sensors' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Gauge className="w-4 h-4" /> <span>Sensores & VTEC</span>
          </button>

          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'connection' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Bluetooth className="w-4 h-4" /> <span>Bluetooth & OBD</span>
          </button>

          <button
            onClick={() => setActiveTab('esp32_guide')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'esp32_guide' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" /> <span>Freenove ESP32-S3 (C / LVGL)</span>
          </button>

          <button
            onClick={() => setActiveTab('updates')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'updates' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <RefreshCw className="w-4 h-4" /> <span>Atualizações</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm font-rajdhani">
          {/* 1. APARÊNCIA & CORES */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Paleta de Cores do Painel (Tema HUD)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(THEME_COLORS).map(([key, t]) => (
                    <button
                      key={key}
                      onClick={() => handleUpdate('themeColor', key as ThemeColor)}
                      className={`p-3 rounded-xl border flex items-center space-x-3 transition-all cursor-pointer ${
                        formData.themeColor === key
                          ? 'border-white bg-zinc-900 shadow-lg'
                          : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                      }`}
                    >
                      <div
                        className="w-5 h-5 rounded-full shadow-[0_0_8px_currentColor]"
                        style={{ backgroundColor: t.primary, color: t.primary }}
                      />
                      <div className="text-left">
                        <span className="font-bold text-xs block text-white">{t.name}</span>
                        <span className="text-[10px] font-mono-dash text-zinc-500">{t.primary}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Layout Switcher */}
              <div className="border-t border-zinc-800 pt-4">
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Layout Principal Padrão
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono-dash">
                  <button
                    onClick={() => handleUpdate('activeLayout', 'cyber_hud')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                      formData.activeLayout === 'cyber_hud'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                    }`}
                  >
                    CYBER HUD (4 QUADS)
                  </button>
                  <button
                    onClick={() => handleUpdate('activeLayout', 'hondash_classic')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                      formData.activeLayout === 'hondash_classic'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                    }`}
                  >
                    HONDASH CLÁSSICO
                  </button>
                  <button
                    onClick={() => handleUpdate('activeLayout', 'track_telemetry')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                      formData.activeLayout === 'track_telemetry'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                    }`}
                  >
                    TELEMETRIA (0-100)
                  </button>
                  <button
                    onClick={() => handleUpdate('activeLayout', 'diagnostic_dtc')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                      formData.activeLayout === 'diagnostic_dtc'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                    }`}
                  >
                    DIAGNÓSTICO DTC
                  </button>
                </div>
              </div>

              {/* Scanlines toggle */}
              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Efeito de Linhas CRT / Scanlines LCD</span>
                  <span className="text-xs text-zinc-400">Adiciona textura sutil de display digital automotivo CYD.</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showScanlines}
                  onChange={(e) => handleUpdate('showScanlines', e.target.checked)}
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* 2. VEÍCULO (CIVIC 99 SEDAN / CUSTOM FOTO / GIF) */}
          {activeTab === 'car' && (
            <div className="space-y-5">
              {carImageSaveNotice && (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/80 text-emerald-300 rounded-xl text-xs font-mono-dash flex items-center gap-2 animate-pulse">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{carImageSaveNotice}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Nome e Identificação do Veículo
                </label>
                <input
                  type="text"
                  value={formData.carModelName}
                  onChange={(e) => handleUpdate('carModelName', e.target.value)}
                  placeholder="HONDA CIVIC SEDAN // B16A2"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-mono-dash text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Especificação do Motor / ECU
                </label>
                <input
                  type="text"
                  value={formData.carEngineSpec}
                  onChange={(e) => handleUpdate('carEngineSpec', e.target.value)}
                  placeholder="B16A2 DOHC VTEC / D16Y8 PGM-FI"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-mono-dash text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              {/* Mode: Preset or Custom GIF/Photo */}
              <div className="border-t border-zinc-800 pt-4">
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Tipo de Imagem do Veículo no Painel
                </label>
                <div className="grid grid-cols-2 gap-3 mb-4 font-mono-dash text-xs">
                  <button
                    onClick={() => handleUpdate('carImageMode', 'preset')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                      formData.carImageMode === 'preset'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                    }`}
                  >
                    HOLOGRAMA VETORIAL CIVIC 99 SEDAN
                  </button>
                  <button
                    onClick={() => handleUpdate('carImageMode', 'custom')}
                    className={`p-3 rounded-xl border text-center transition-colors cursor-pointer ${
                      formData.carImageMode === 'custom'
                        ? 'border-red-500 bg-red-950/40 text-white font-bold'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                    }`}
                  >
                    FOTO OU GIF PERSONALIZADA
                  </button>
                </div>

                {formData.carImageMode === 'preset' ? (
                  <div>
                    <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                      Modelo do Preset
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {CAR_PRESETS.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => {
                            handleUpdate('carPreset', preset.id as CarPreset);
                            handleUpdate('carModelName', preset.badge);
                            handleUpdate('carEngineSpec', preset.engine);
                          }}
                          className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                            formData.carPreset === preset.id
                              ? 'border-red-500 bg-zinc-900 text-white'
                              : 'border-zinc-800 bg-zinc-950/60 text-zinc-400'
                          }`}
                        >
                          <span className="font-bold text-xs block text-white">{preset.name}</span>
                          <span className="text-[11px] text-zinc-500">{preset.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-zinc-900/60 p-4 rounded-xl border border-zinc-800">
                    <div>
                      <span className="font-bold text-white block">Salvar Foto ou GIF do Veículo</span>
                      <span className="text-xs text-zinc-400 block mb-3">
                        O arquivo (GIF Animado, PNG com transparência, JPG ou WebP) será salvo permanentemente na memória interna do painel (IndexedDB).
                      </span>

                      {/* Upload from device */}
                      <div className="flex flex-wrap items-center gap-3 mb-3">
                        <input
                          type="file"
                          ref={carFileInputRef}
                          onChange={handleCarImageUpload}
                          accept="image/*"
                          className="hidden"
                        />
                        <button
                          onClick={() => carFileInputRef.current?.click()}
                          className="flex items-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-mono-dash text-xs font-bold transition-colors cursor-pointer shadow-lg"
                        >
                          <Upload className="w-4 h-4" /> SELECIONAR FOTO / GIF DO CELULAR OU PC
                        </button>
                      </div>

                      {/* Paste Web Image URL */}
                      <div className="pt-2 border-t border-zinc-800/80">
                        <span className="text-xs text-zinc-400 block mb-1.5 font-mono-dash">OU COLE O LINK DIRETO DE UM GIF / IMAGEM (URL):</span>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={customUrlInput}
                              onChange={(e) => setCustomUrlInput(e.target.value)}
                              placeholder="https://exemplo.com/honda_civic_drift.gif"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono-dash text-xs focus:border-red-500 focus:outline-none"
                            />
                          </div>
                          <button
                            onClick={handleApplyCarImageUrl}
                            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-mono-dash text-xs rounded-lg transition-colors cursor-pointer font-bold shrink-0"
                          >
                            SALVAR GIF
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview Card with Actions */}
                    {formData.customCarImageUrl ? (
                      <div className="p-3 bg-black rounded-xl border border-zinc-800 flex flex-col items-center justify-center space-y-3 relative">
                        <div className="w-full flex items-center justify-between text-[11px] font-mono-dash text-zinc-400 border-b border-zinc-900 pb-2">
                          <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> IMAGEM / GIF SALVA NO SISTEMA
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={handleDownloadCarImage}
                              title="Baixar imagem/gif para seu aparelho"
                              className="flex items-center gap-1 text-zinc-300 hover:text-white px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] cursor-pointer"
                            >
                              <Download className="w-3 h-3" /> BAIXAR
                            </button>
                            <button
                              onClick={handleRemoveCarImage}
                              title="Remover imagem e resetar"
                              className="flex items-center gap-1 text-red-400 hover:text-red-300 px-2 py-0.5 rounded bg-red-950/40 border border-red-900/60 text-[10px] cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" /> REMOVER
                            </button>
                          </div>
                        </div>

                        <div className="relative max-h-36 w-full flex items-center justify-center py-2">
                          {formData.showUnderglow && (
                            <div
                              className="absolute bottom-1 w-3/4 h-5 rounded-full blur-md opacity-80"
                              style={{
                                backgroundColor: formData.underglowColor || '#ef4444',
                                boxShadow: `0 0 20px ${formData.underglowColor || '#ef4444'}`
                              }}
                            />
                          )}
                          <img
                            src={formData.customCarImageUrl}
                            alt="Preview do Veículo"
                            className="max-h-32 w-auto object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)] rounded relative z-10"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-black/40 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500 font-mono-dash">
                        Nenhuma foto ou GIF enviada ainda. Selecione um arquivo acima para salvar no painel.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Neon Underglow Setting */}
              <div className="border-t border-zinc-800 pt-4 flex items-center justify-between">
                <div>
                  <span className="font-bold text-white block">Efeito de Iluminação Neon (Underglow)</span>
                  <span className="text-xs text-zinc-400">Projeta brilho neon sob o chassi do Civic.</span>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="color"
                    value={formData.underglowColor || '#ef4444'}
                    onChange={(e) => handleUpdate('underglowColor', e.target.value)}
                    className="w-8 h-8 rounded border-0 cursor-pointer bg-transparent"
                  />
                  <input
                    type="checkbox"
                    checked={formData.showUnderglow}
                    onChange={(e) => handleUpdate('showUnderglow', e.target.checked)}
                    className="w-5 h-5 accent-red-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. LOGO DE INICIALIZAÇÃO & BOOT */}
          {activeTab === 'boot' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Escolha do Logo de Inicialização (1.0)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { id: 'honda_classic', name: 'Honda Clássico' },
                    { id: 'honda_typer', name: 'Type-R Red Badge' },
                    { id: 'mugen', name: 'Mugen Power (無限)' },
                    { id: 'spoon', name: 'Spoon Sports' },
                  ].map((logo) => (
                    <button
                      key={logo.id}
                      onClick={() => handleUpdate('bootLogoType', logo.id as BootLogoType)}
                      className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-2 transition-all cursor-pointer ${
                        formData.bootLogoType === logo.id
                          ? 'border-red-500 bg-zinc-900 shadow-lg'
                          : 'border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900/60'
                      }`}
                    >
                      <HondaBrandLogo type={logo.id as BootLogoType} className="w-12 h-12" color={theme.primary} />
                      <span className="font-bold text-xs text-white">{logo.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom boot logo upload */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <span className="font-bold text-white block">Ou envie sua própria Logo de Inicialização</span>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={bootLogoFileInputRef}
                    onChange={handleBootLogoUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => bootLogoFileInputRef.current?.click()}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-mono-dash text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Upload className="w-4 h-4" /> UPLOAD DE LOGO PERSONALIZADO
                  </button>
                  {formData.bootLogoType === 'custom' && (
                    <span className="text-xs text-emerald-400 font-mono-dash">Logo customizada ativa</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                  Texto de Boas-Vindas no Boot
                </label>
                <input
                  type="text"
                  value={formData.bootWelcomeText}
                  onChange={(e) => handleUpdate('bootWelcomeText', e.target.value)}
                  placeholder="HONDA CIVIC 1999 VTEC"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-white font-mono-dash text-sm focus:border-red-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div>
                  <span className="font-bold text-white block">Duração do Boot (ms)</span>
                  <span className="text-xs text-zinc-400">Tempo de execução da tela de diagnóstico inicial.</span>
                </div>
                <input
                  type="number"
                  step="500"
                  min="1000"
                  max="6000"
                  value={formData.bootDurationMs}
                  onChange={(e) => handleUpdate('bootDurationMs', parseInt(e.target.value))}
                  className="w-28 bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-white font-mono-dash text-sm text-center"
                />
              </div>

              {/* Boot Sound Toggle */}
              <div className="flex items-center justify-between border-t border-zinc-800 pt-4">
                <div>
                  <span className="font-bold text-white block">Som ao Iniciar (Boot Chime)</span>
                  <span className="text-xs text-zinc-400">Tocar efeito sonoro Sci-Fi ao carregar o sistema (desativado por padrão).</span>
                </div>
                <input
                  type="checkbox"
                  checked={formData.enableBootSound || false}
                  onChange={(e) => handleUpdate('enableBootSound', e.target.checked)}
                  className="w-5 h-5 accent-red-500 cursor-pointer"
                />
              </div>

              {/* Test boot button */}
              <div className="border-t border-zinc-800 pt-4 flex justify-end">
                <button
                  onClick={() => {
                    handleSave();
                    onTestBoot();
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-mono-dash text-xs font-bold transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" /> TESTAR ANIMAÇÃO DE BOOT AGORA
                </button>
              </div>
            </div>
          )}

          {/* 4. SENSORES & VTEC */}
          {activeTab === 'sensors' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <label className="text-xs font-mono-dash text-zinc-400 block">RPM ACIONAMENTO VTEC</label>
                  <input
                    type="number"
                    step="100"
                    min="3000"
                    max="8000"
                    value={formData.vtecThresholdRpm}
                    onChange={(e) => handleUpdate('vtecThresholdRpm', parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-orbitron font-bold text-lg"
                  />
                  <span className="text-[10px] text-zinc-500 block">Padrão Civic: 5.200 RPM</span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <label className="text-xs font-mono-dash text-zinc-400 block">RPM SHIFT LIGHT (ALERTA)</label>
                  <input
                    type="number"
                    step="100"
                    min="5000"
                    max="9000"
                    value={formData.shiftLightRpm}
                    onChange={(e) => handleUpdate('shiftLightRpm', parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-orbitron font-bold text-lg"
                  />
                  <span className="text-[10px] text-zinc-500 block">Padrão: 7.200 RPM</span>
                </div>

                <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-1">
                  <label className="text-xs font-mono-dash text-zinc-400 block">CORTE DE GIRO (REDLINE)</label>
                  <input
                    type="number"
                    step="100"
                    min="6000"
                    max="10000"
                    value={formData.revLimitRpm}
                    onChange={(e) => handleUpdate('revLimitRpm', parseInt(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-orbitron font-bold text-lg"
                  />
                  <span className="text-[10px] text-zinc-500 block">Padrão: 8.500 RPM</span>
                </div>
              </div>

              {/* Units */}
              <div className="border-t border-zinc-800 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                    Unidade de Velocidade
                  </label>
                  <div className="flex gap-2 font-mono-dash text-xs">
                    <button
                      onClick={() => handleUpdate('speedUnit', 'kmh')}
                      className={`flex-1 py-2 rounded-lg border text-center cursor-pointer ${
                        formData.speedUnit === 'kmh' ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      KM/H (BRASIL/JDM)
                    </button>
                    <button
                      onClick={() => handleUpdate('speedUnit', 'mph')}
                      className={`flex-1 py-2 rounded-lg border text-center cursor-pointer ${
                        formData.speedUnit === 'mph' ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                      }`}
                    >
                      MPH (USDM)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono-dash text-zinc-400 uppercase mb-2">
                    Unidade de Pressão (MAP / Boost)
                  </label>
                  <div className="flex gap-2 font-mono-dash text-xs">
                    {['kpa', 'bar', 'psi'].map((unit) => (
                      <button
                        key={unit}
                        onClick={() => handleUpdate('pressureUnit', unit as 'kpa' | 'bar' | 'psi')}
                        className={`flex-1 py-2 rounded-lg border text-center uppercase cursor-pointer ${
                          formData.pressureUnit === unit ? 'bg-red-600 text-white font-bold' : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 5. BLUETOOTH & OBD */}
          {activeTab === 'connection' && (
            <div className="space-y-5">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bluetooth className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="font-bold text-white block">Conexão Web Bluetooth (BLE)</span>
                      <span className="text-xs text-zinc-400">
                        Pareia diretamente com ESP32-S3 BLE, HonDash ou Adaptador OBD2 ELM327 Bluetooth.
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onConnectBluetooth}
                    className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono-dash text-xs font-bold transition-colors cursor-pointer"
                  >
                    PROCURAR BLUETOOTH
                  </button>
                </div>

                <div className="border-t border-zinc-800 pt-2 text-xs font-mono-dash flex justify-between items-center">
                  <span className="text-zinc-400">STATUS DA CONEXÃO:</span>
                  <span className={`font-bold ${
                    bleStatus === 'connected' ? 'text-emerald-400' : bleStatus === 'connecting' ? 'text-amber-400' : 'text-zinc-400'
                  }`}>
                    {bleStatus.toUpperCase()} {bleMessage ? `— ${bleMessage}` : ''}
                  </span>
                </div>
              </div>

              {/* Web Serial Direct USB */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-amber-400" />
                    <div>
                      <span className="font-bold text-white block">Conexão USB Serial (CYD ESP32-S3)</span>
                      <span className="text-xs text-zinc-400">
                        Conecta via cabo USB na porta COM da plaquinha CYD (baudrate 115200).
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={onConnectSerial}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono-dash text-xs font-bold transition-colors cursor-pointer"
                  >
                    CONECTAR SERIAL USB
                  </button>
                </div>
              </div>

              {/* Wi-Fi WebSocket */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center space-x-2">
                  <Wifi className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white">IP Local Wi-Fi do ESP32-S3</span>
                </div>
                <input
                  type="text"
                  value={formData.wifiEsp32Ip || '192.168.4.1'}
                  onChange={(e) => handleUpdate('wifiEsp32Ip', e.target.value)}
                  placeholder="192.168.4.1 ou 192.168.1.150"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-white font-mono-dash text-sm"
                />
              </div>
            </div>
          )}

          {/* 6. GUIA & CÓDIGO C / LVGL FREENOVE ESP32-S3 */}
          {activeTab === 'esp32_guide' && (
            <div className="space-y-5 text-xs font-mono-dash">
              {/* Hardware Spec Card */}
              <div className="p-4 bg-zinc-900/90 border border-zinc-700 rounded-xl space-y-3 shadow-lg">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-5 h-5 text-cyan-400" />
                    <div>
                      <span className="font-bold text-white text-sm block">
                        FREENOVE ESP32-S3 CYD 2.8" IPS TOUCH CAPACITIVO
                      </span>
                      <span className="text-[11px] text-zinc-400">
                        Dual-Core Xtensa 32-bit @ 240 MHz | 240x320 IPS | Touch FT6236/CST816 | LVGL v8/v9 | C/C++
                      </span>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-cyan-950/80 border border-cyan-700 text-cyan-300 text-[10px] font-bold rounded">
                    COMPATIBILIDADE 100% C / LVGL
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">CONTROLADOR TELA</span>
                    <span className="text-white font-bold">ST7789 SPI (320x240)</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">TIPO DE TOUCH</span>
                    <span className="text-cyan-400 font-bold">Capacitivo I2C (0x38)</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">MICROCONTROLADOR</span>
                    <span className="text-white font-bold">ESP32-S3 Dual 240MHz</span>
                  </div>
                  <div className="bg-zinc-950 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 block">CONECTIVIDADE</span>
                    <span className="text-emerald-400 font-bold">BLE 5.0 + Wi-Fi Hotspot</span>
                  </div>
                </div>
              </div>

              {/* Download Firmware Files */}
              <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block text-sm">Download dos Arquivos em Código C / C++</span>
                    <span className="text-[11px] text-zinc-400">
                      Arquivos prontos para compilar no Arduino IDE, PlatformIO ou ESP-IDF com biblioteca LVGL.
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => downloadFirmwareFile(FREENOVE_MAIN_CPP_CODE, 'main.cpp')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5 text-cyan-400" /> main.cpp (Código C++)
                  </button>

                  <button
                    onClick={() => downloadFirmwareFile(FREENOVE_ESP32S3_PINOUT_CODE, 'freenove_pinout.h')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5 text-amber-400" /> freenove_pinout.h (Pinagem)
                  </button>

                  <button
                    onClick={() => downloadFirmwareFile(FREENOVE_PLATFORMIO_INI, 'platformio.ini')}
                    className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> platformio.ini (Config)
                  </button>
                </div>
              </div>

              {/* In-App Code Viewer */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800">
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setCCodeFileTab('main.cpp')}
                      className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                        cCodeFileTab === 'main.cpp' ? 'bg-zinc-800 text-cyan-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      main.cpp (C++ / LVGL Engine)
                    </button>
                    <button
                      onClick={() => setCCodeFileTab('freenove_pinout.h')}
                      className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                        cCodeFileTab === 'freenove_pinout.h' ? 'bg-zinc-800 text-amber-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      freenove_pinout.h (GPIOs)
                    </button>
                    <button
                      onClick={() => setCCodeFileTab('platformio.ini')}
                      className={`px-3 py-1 rounded text-xs transition-colors cursor-pointer ${
                        cCodeFileTab === 'platformio.ini' ? 'bg-zinc-800 text-emerald-400 font-bold' : 'text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      platformio.ini
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
                      setCopyCodeNotice(`✓ ${cCodeFileTab} copiado!`);
                      setTimeout(() => setCopyCodeNotice(''), 3000);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-white rounded text-[11px] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{copyCodeNotice || 'COPIAR'}</span>
                  </button>
                </div>

                <div className="p-3 max-h-64 overflow-y-auto font-mono text-[11px] leading-relaxed text-zinc-300 select-text">
                  <pre className="whitespace-pre overflow-x-auto">
                    {cCodeFileTab === 'main.cpp'
                      ? FREENOVE_MAIN_CPP_CODE
                      : cCodeFileTab === 'freenove_pinout.h'
                      ? FREENOVE_ESP32S3_PINOUT_CODE
                      : FREENOVE_PLATFORMIO_INI}
                  </pre>
                </div>
              </div>

              {/* Wiring Pinout Table for Honda Civic 99 OBD */}
              <div className="p-4 bg-zinc-900/80 border border-zinc-800 rounded-xl space-y-3">
                <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> PINAGEM E LIGAÇÃO NO HONDA CIVIC 99 (K-LINE / 3-PIN DLC)
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-cyan-400 font-bold block">GPIO 18 (RX) / GPIO 17 (TX)</span>
                    <span className="text-zinc-400">Transceptor K-Line L9637D / ISO9141 da ECU P28/P30/P72/HonDash.</span>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-amber-400 font-bold block">GPIO 15 (Buzzer PWM)</span>
                    <span className="text-zinc-400">Buzzer piezoelétrico para alarme sonoro de VTEC e Shift Light.</span>
                  </div>
                  <div className="bg-black/60 p-2.5 rounded-lg border border-zinc-800">
                    <span className="text-emerald-400 font-bold block">Alimentação 5V / GND</span>
                    <span className="text-zinc-400">Regulador Step-Down 12V ➔ 5V 2A pós-chave (ACC) do Civic.</span>
                  </div>
                </div>
              </div>

              {/* JSON Protocol for UART */}
              <div className="p-3 bg-black border border-zinc-800 rounded-xl">
                <span className="text-[11px] text-zinc-500 block mb-1">PROTOCOLO JSON SUPORTADO VIA UART / BLUETOOTH BLE:</span>
                <code className="text-emerald-400 text-[11px]">
                  {`{"rpm":3450,"spd":72,"ect":89,"iat":32,"map":98,"tps":25,"vtec":0,"afr":14.7,"volt":14.2}`}
                </code>
              </div>
            </div>
          )}

          {/* 7. ATUALIZAÇÕES & BACKUP */}
          {activeTab === 'updates' && (
            <div className="space-y-5">
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                    <span className="font-bold text-white">Status da Conexão com a Internet</span>
                  </div>
                  <span className="text-xs text-zinc-400 block mt-0.5">
                    {isOnline
                      ? 'Conectado à internet. O aplicativo sincroniza novas versões automaticamente ao iniciar.'
                      : 'Modo offline. Funcionalidades locais do painel continuam operando normalmente.'}
                  </span>
                </div>
                <button
                  onClick={onCheckUpdates}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-mono-dash text-xs font-bold transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" /> VERIFICAR ATUALIZAÇÕES
                </button>
              </div>

              {/* Export / Import Settings */}
              <div className="bg-zinc-900/60 p-4 rounded-xl border border-zinc-800 space-y-3">
                <span className="font-bold text-white block">Backup e Compartilhamento de Perfis</span>
                <span className="text-xs text-zinc-400 block">
                  Exporte sua configuração de painel e Civic 99 em arquivo JSON para usar em outros dispositivos ou na
                  plaquinha CYD.
                </span>

                <div className="flex flex-wrap gap-3 pt-1 font-mono-dash text-xs">
                  <button
                    onClick={handleExportJson}
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    <Download className="w-4 h-4" /> EXPORTAR PERFIL (.JSON)
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
                    className="flex items-center gap-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer font-bold"
                  >
                    <Upload className="w-4 h-4" /> IMPORTAR PERFIL (.JSON)
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-between">
          <span className="text-xs font-mono-dash text-zinc-400">
            {saveSuccess ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <Check className="w-4 h-4" /> CONFIGURAÇÕES SALVAS COM SUCESSO!
              </span>
            ) : (
              'HONDASH PGM-FI ENGINE MANAGEMENT INTERFACE'
            )}
          </span>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono-dash cursor-pointer transition-colors"
            >
              FECHAR
            </button>
            <button
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono-dash text-xs font-bold shadow-lg transition-all cursor-pointer"
            >
              SALVAR E APLICAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
