import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppSettings } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { LVGL_CODE_FILES, LvglCodeFile } from '../utils/lvglCodeTemplates';
import {
  X,
  Copy,
  Check,
  Download,
  Code2,
  Cpu,
  FileCode,
  Layers,
  Terminal,
  ExternalLink,
  BookOpen
} from 'lucide-react';

interface LvglExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSwitchToYaml?: () => void;
}

export const LvglExportModal: React.FC<LvglExportModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSwitchToYaml
}) => {
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;
  const [selectedFileId, setSelectedFileId] = useState<string>('hondash_ui_c');
  const [copied, setCopied] = useState<boolean>(false);
  const [downloadAllProgress, setDownloadAllProgress] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentFile: LvglCodeFile =
    LVGL_CODE_FILES.find((f) => f.id === selectedFileId) || LVGL_CODE_FILES[0]!;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(currentFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code: ', err);
    }
  };

  const handleDownloadFile = (file: LvglCodeFile) => {
    const blob = new Blob([file.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    setDownloadAllProgress(true);
    LVGL_CODE_FILES.forEach((file, index) => {
      setTimeout(() => {
        handleDownloadFile(file);
        if (index === LVGL_CODE_FILES.length - 1) {
          setDownloadAllProgress(false);
        }
      }, index * 200);
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col shadow-2xl overflow-hidden"
          style={{ borderColor: `${theme.primary}50`, boxShadow: `0 0 40px ${theme.glow}30` }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-zinc-900/90 border-b border-zinc-800/80 shrink-0">
            <div className="flex items-center space-x-3">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center border shadow-lg"
                style={{
                  backgroundColor: `${theme.primary}20`,
                  borderColor: theme.primary,
                  color: theme.primary
                }}
              >
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm sm:text-base font-orbitron font-extrabold text-white tracking-wider uppercase">
                    Código LVGL Embarcado (C / C++)
                  </h2>
                  <span
                    className="px-2 py-0.5 text-[9px] font-mono-dash font-bold rounded-full border uppercase"
                    style={{
                      backgroundColor: `${theme.primary}15`,
                      borderColor: `${theme.primary}60`,
                      color: theme.primary
                    }}
                  >
                    ESP32 / ESP32-S3 / STM32
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-zinc-400 font-mono-dash">
                  Conversão completa do Cyber HUD HonDASH para a biblioteca gráfica LVGL v8 / v9
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onSwitchToYaml && (
                <button
                  onClick={() => {
                    onClose();
                    onSwitchToYaml();
                  }}
                  className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-mono-dash text-zinc-300 hover:text-white bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700 transition-all cursor-pointer"
                  title="Alternar para visualizador declarativo YAML"
                >
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ver em YAML</span>
                </button>
              )}

              <button
                onClick={handleDownloadAll}
                disabled={downloadAllProgress}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-mono-dash text-white border transition-all cursor-pointer shadow-md hover:brightness-110 active:scale-95 disabled:opacity-50"
                style={{ backgroundColor: theme.primary, borderColor: theme.primary }}
                title="Baixar todos os arquivos C, H, CPP e INI"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloadAllProgress ? 'Baixando...' : 'Baixar Todos os Arquivos'}</span>
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="px-4 py-2 bg-zinc-900/40 border-b border-zinc-800/60 flex items-center justify-between text-[11px] font-mono-dash text-zinc-300">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: theme.primary }} />
              <span>
                <strong>Pronto para Gravar:</strong> O código inclui os 4 quadrantes, velocímetro, RPM arc, relógio HUD 12h/24h, perfil do Civic e telemetria.
              </span>
            </div>
            <div className="hidden md:flex items-center gap-3 text-zinc-400 text-[10px]">
              <span>Tamanho: 320x240 / 240x320</span>
              <span>Cores: 16-bit RGB565</span>
              <span>Lib: LVGL 8.3.11</span>
            </div>
          </div>

          {/* Body: Sidebar Tabs + Code Viewer */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Sidebar with Files */}
            <div className="w-full md:w-64 bg-zinc-950/90 border-b md:border-b-0 md:border-r border-zinc-800/80 p-2 sm:p-3 flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto shrink-0">
              <span className="hidden md:block text-[10px] font-orbitron font-bold text-zinc-500 uppercase px-2 mb-1">
                Arquivos do Projeto LVGL
              </span>

              {LVGL_CODE_FILES.map((file) => {
                const isSelected = file.id === selectedFileId;
                return (
                  <button
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-mono-dash transition-all cursor-pointer border whitespace-nowrap shrink-0 md:shrink ${
                      isSelected
                        ? 'text-white font-bold shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60 border-transparent'
                    }`}
                    style={
                      isSelected
                        ? {
                            backgroundColor: `${theme.primary}18`,
                            borderColor: `${theme.primary}60`,
                            color: '#ffffff'
                          }
                        : {}
                    }
                  >
                    <FileCode
                      className="w-3.5 h-3.5 shrink-0"
                      style={{ color: isSelected ? theme.primary : '#71717a' }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="truncate">{file.name}</span>
                      <span className="text-[9px] text-zinc-500 truncate hidden md:block">
                        {file.description}
                      </span>
                    </div>
                  </button>
                );
              })}

              {/* Hardware / ESP32 Flashing Pinout Box */}
              <div className="mt-auto hidden md:block p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/80 text-[10px] font-mono-dash space-y-1.5 text-zinc-400">
                <div className="flex items-center gap-1.5 text-zinc-200 font-bold">
                  <Terminal className="w-3 h-3 text-amber-400" />
                  <span>Dica de Hardware</span>
                </div>
                <p className="leading-tight text-zinc-400">
                  Compatível com placas <strong>ESP32-CYD (Cheap Yellow Display)</strong>, Sunton ESP32 e módulos ST7789/ILI9341 com Touch XPT2046.
                </p>
              </div>
            </div>

            {/* Code Display Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e] overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-3 sm:px-5 py-2 bg-zinc-900/80 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2 truncate">
                  <span className="text-xs font-mono-dash font-bold text-white tracking-wide">
                    {currentFile.name}
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono-dash truncate hidden sm:inline">
                    — {currentFile.description}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-mono-dash font-bold transition-all cursor-pointer"
                    title="Copiar código para a área de transferência"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-300">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleDownloadFile(currentFile)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-mono-dash font-bold transition-all cursor-pointer"
                    title="Baixar este arquivo"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar</span>
                  </button>
                </div>
              </div>

              {/* Code Scrollable Block */}
              <div className="flex-1 p-3 sm:p-4 overflow-auto font-mono text-xs leading-relaxed text-zinc-300 select-text">
                <pre className="whitespace-pre font-mono text-[11px] sm:text-xs">
                  <code>{currentFile.code}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center justify-between text-xs font-mono-dash text-zinc-400 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-zinc-500">Arquivos físicos criados em:</span>
              <code className="px-1.5 py-0.5 bg-black/60 rounded text-zinc-300 font-mono text-[11px]">
                /lvgl/
              </code>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownloadAll}
                className="sm:hidden px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs cursor-pointer"
              >
                Baixar Todos
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white transition-colors cursor-pointer text-xs"
              >
                Fechar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
