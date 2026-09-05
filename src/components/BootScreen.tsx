import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { AppSettings } from '../types';
import { THEME_COLORS } from '../utils/carPresets';
import { playBootChime } from '../utils/soundEffects';
import { HondaBrandLogo } from './HondaBrandLogos';

interface BootScreenProps {
  settings: AppSettings;
  onBootComplete: () => void;
}

export const BootScreen: React.FC<BootScreenProps> = ({ settings, onBootComplete }) => {
  const [progress, setProgress] = useState(0);
  const theme = THEME_COLORS[settings.themeColor] || THEME_COLORS.red;

  const onBootCompleteRef = useRef(onBootComplete);
  useEffect(() => {
    onBootCompleteRef.current = onBootComplete;
  }, [onBootComplete]);

  useEffect(() => {
    if (settings.enableBootSound) {
      playBootChime();
    }

    const duration = 2000;
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

    const completeTimer = setTimeout(() => {
      setProgress(100);
      onBootCompleteRef.current();
    }, duration + 50);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(completeTimer);
    };
  }, [settings.enableBootSound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(6px)' }}
      transition={{ duration: 0.35 }}
      onClick={() => onBootCompleteRef.current()}
      className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center p-3 sm:p-6 select-none cursor-pointer overflow-hidden"
    >
      {/* Background Soft Glow */}
      <div
        className="absolute w-64 sm:w-96 h-64 sm:h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: theme.primary }}
      />

      {/* Boot Logo / GIF */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="z-10 flex flex-col items-center mb-3 sm:mb-6"
      >
        <HondaBrandLogo
          type={settings.bootLogoType || 'honda_classic'}
          customUrl={settings.customBootLogoUrl}
          className="w-16 h-16 sm:w-28 sm:h-28 max-w-[140px] max-h-[140px] object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.25)]"
        />
      </motion.div>

      {/* Optional Welcome text if user configured it */}
      {settings.bootWelcomeText?.trim() && (
        <motion.h1
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-orbitron font-extrabold text-xs sm:text-lg tracking-widest text-white mb-3 sm:mb-6 text-center drop-shadow-[0_0_10px_rgba(255,255,255,0.3)] z-10 px-2"
        >
          {settings.bootWelcomeText}
        </motion.h1>
      )}

      {/* Center: Loading / Progress Bar */}
      <div className="w-full max-w-[200px] sm:max-w-md z-10 flex flex-col items-center space-y-1.5 sm:space-y-3">
        {/* Progress Bar Container */}
        <div className="w-full bg-zinc-900/90 h-2 sm:h-3 rounded-full overflow-hidden border border-zinc-800 p-0.5 shadow-2xl relative">
          <motion.div
            className="h-full rounded-full transition-all duration-75"
            style={{
              width: `${progress}%`,
              backgroundColor: theme.primary,
              boxShadow: `0 0 12px ${theme.glow}`
            }}
          />
        </div>

        {/* Percentage indicator */}
        <div className="w-full flex items-center justify-between text-[8px] sm:text-xs font-mono-dash text-zinc-400 px-0.5">
          <span className="tracking-widest text-[8px] sm:text-[11px] text-zinc-400">CARREGANDO...</span>
          <span className="font-orbitron font-bold text-[9px] sm:text-xs" style={{ color: theme.primary }}>
            {Math.round(progress)}%
          </span>
        </div>
      </div>
    </motion.div>
  );
};
