import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { HondaBrandLogo } from './HondaBrandLogos';
import { playBootChime } from '../utils/soundEffects';
import { THEME_COLORS } from '../utils/carPresets';
import { Cpu, Radio, Zap, CheckCircle2 } from 'lucide-react';

interface BootScreenProps {
  settings: AppSettings;
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ settings, onBootComplete }) => {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;

  const onBootCompleteRef = useRef(onBootComplete);
  useEffect(() => {
    onBootCompleteRef.current = onBootComplete;
  }, [onBootComplete]);

  const bootLogs = [
    'ESP32-S3 CORE INITIALIZED (240MHz DUAL CORE)',
    'CHECKING FOR UPDATES & SYNCING SYSTEM (v2.4.1)...',
    'HONDA PGM-FI ECU ROM INTERFACE LOADED',
    'CYD RGB DISPLAY DRIVER SYNC @ 60FPS',
    'BLUETOOTH 5.0 LE TELEMETRY READY',
    'SYSTEM UPDATED & ONLINE — OPENING DASHBOARD'
  ];

  useEffect(() => {
    if (settings.enableBootSound) {
      playBootChime();
    }

    const duration = Math.min(settings.bootDurationMs || 2200, 2400);
    const intervalTime = Math.max(16, duration / 100);

    const progressTimer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 99) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + 2;
      });
    }, intervalTime);

    const stepTimer1 = setTimeout(() => setStep(1), duration * 0.18);
    const stepTimer2 = setTimeout(() => setStep(2), duration * 0.38);
    const stepTimer3 = setTimeout(() => setStep(3), duration * 0.58);
    const stepTimer4 = setTimeout(() => setStep(4), duration * 0.78);
    const stepTimer5 = setTimeout(() => setStep(5), duration * 0.92);

    const completeTimer = setTimeout(() => {
      setProgress(100);
      onBootCompleteRef.current();
    }, duration + 80);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);
      clearTimeout(stepTimer3);
      clearTimeout(stepTimer4);
      clearTimeout(stepTimer5);
      clearTimeout(completeTimer);
    };
  }, [settings.bootDurationMs, settings.enableBootSound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.03, filter: 'blur(8px)' }}
      transition={{ duration: 0.3 }}
      onClick={() => onBootCompleteRef.current()}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden cursor-pointer"
    >
      {/* Background Cyber Grid */}
      <div 
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(${theme.primary} 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* Top Status Bar */}
      <div className="w-full flex items-center justify-between z-10 text-xs font-mono-dash tracking-widest text-zinc-400">
        <div className="flex items-center space-x-2">
          <Cpu className="w-4 h-4 text-zinc-400 animate-pulse" />
          <span>CYD ESP32-S3 BOOTLOADER v2.4</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1 text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
            <span>HONDA OBD-II</span>
          </span>
          <span className="text-zinc-500">[{progress}%]</span>
        </div>
      </div>

      {/* Center Branding & Honda Logo */}
      <div className="flex flex-col items-center justify-center my-auto z-10 text-center max-w-lg">
        {/* Glow halo behind logo */}
        <motion.div
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ backgroundColor: theme.primary }}
        />

        {/* Dynamic / Custom Honda Logo */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-6 relative"
        >
          <HondaBrandLogo
            type={settings.bootLogoType}
            customUrl={settings.customBootLogoUrl}
            className="w-32 h-32 sm:w-44 sm:h-44"
            color={theme.primary}
          />
        </motion.div>

        {/* Welcome Text Configured by User */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-1"
        >
          <h1 className="font-orbitron font-extrabold text-2xl sm:text-3xl tracking-wider text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]">
            {settings.bootWelcomeText || 'HONDA CIVIC 1999'}
          </h1>
          <p className="font-chakra text-sm sm:text-base font-semibold tracking-widest text-zinc-400">
            {settings.carEngineSpec || 'VTEC PGM-FI ENGINE MANAGEMENT // OBD-II'}
          </p>
        </motion.div>

        {/* Diagnostic Steps Log */}
        <div className="mt-8 w-full bg-zinc-950/80 border border-zinc-800/80 rounded-lg p-3 backdrop-blur font-mono-dash text-xs text-left shadow-2xl">
          <div className="flex items-center justify-between text-zinc-400 pb-1.5 mb-1.5 border-b border-zinc-800 text-[10px]">
            <span className="flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>DIAGNOSTIC SEQUENCE</span>
            </span>
            <span className="text-zinc-500">ECU LINK: ACTIVE</span>
          </div>

          <div className="space-y-1 min-h-[55px]">
            {bootLogs.slice(0, step + 1).map((log, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center space-x-2 text-zinc-300"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="truncate">{log}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Progress Bar */}
      <div className="w-full max-w-xl z-10 flex flex-col items-center space-y-2">
        <div className="w-full flex items-center justify-between text-[11px] font-mono-dash mb-0.5">
          <span className="tracking-widest text-zinc-400">VERIFICANDO ATUALIZAÇÕES & SINCRONIZANDO SISTEMA...</span>
          <span className="font-orbitron font-bold text-xs" style={{ color: theme.primary }}>
            {Math.round(progress)}%
          </span>
        </div>

        <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800 relative">
          <motion.div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              backgroundColor: theme.primary,
              boxShadow: `0 0 12px ${theme.glow}`
            }}
          />
        </div>

        <div className="w-full flex items-center justify-between text-[10px] font-mono-dash text-zinc-500">
          <span>PROGRESSO: {Math.round(progress)} / 100%</span>
          <span className={progress >= 100 ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
            {progress >= 100 ? 'SISTEMA ATUALIZADO • INICIANDO...' : 'CARREGANDO MÓDULOS'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
