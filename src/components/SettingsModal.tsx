'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Sliders, Sun, Moon, Database, Trash2, HelpCircle } from 'lucide-react';
import { clearLocalStore } from '@/lib/indexed-db-store';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    theme: 'dark' | 'light';
    topK: number;
    temperature: number;
    defaultMode: 'cloud' | 'local';
  };
  onUpdateSettings: (settings: {
    theme: 'dark' | 'light';
    topK: number;
    temperature: number;
    defaultMode: 'cloud' | 'local';
  }) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  if (!isOpen) return null;

  const handleThemeChange = (theme: 'dark' | 'light') => {
    onUpdateSettings({ ...settings, theme });
  };

  const handleTopKChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, topK: parseInt(e.target.value) });
  };

  const handleTemperatureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateSettings({ ...settings, temperature: parseFloat(e.target.value) });
  };

  const handleModeChange = (defaultMode: 'cloud' | 'local') => {
    onUpdateSettings({ ...settings, defaultMode });
  };

  const handleResetStorage = async () => {
    if (confirm('CRITICAL WARNING: This will permanently wipe all uploaded files, indexed vector chunks, and generated study kits from your local browser database. Continue?')) {
      try {
        await clearLocalStore();
        alert('Local store cleared successfully. The page will reload now.');
        window.location.reload();
      } catch (err) {
        console.error('Reset store failed:', err);
        alert('Reset store failed: ' + (err as Error).message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="w-full max-w-lg border-2 border-white bg-black p-6 retro-shadow text-white relative font-mono"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5" />
            <span className="font-bold text-xs uppercase tracking-wider">[ SYSTEM_SETTINGS ]</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-transparent hover:border-white text-white transition-all"
            title="Close Settings"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Theme Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white">
              [1] UI COLOR THEME
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs ${
                  settings.theme === 'dark' ? 'bg-white text-black' : ''
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>CRT_DARK (DEFAULT)</span>
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs ${
                  settings.theme === 'light' ? 'bg-white text-black' : ''
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>CRT_LIGHT</span>
              </button>
            </div>
          </div>

          {/* Default Mode Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white">
              [2] DEFAULT CONNECTION MODE
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleModeChange('cloud')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs ${
                  settings.defaultMode === 'cloud' ? 'bg-white text-black' : ''
                }`}
              >
                <span>CLOUD MODEL</span>
              </button>
              <button
                onClick={() => handleModeChange('local')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs ${
                  settings.defaultMode === 'local' ? 'bg-white text-black' : ''
                }`}
              >
                <span>LOCAL DEVICE AI</span>
              </button>
            </div>
          </div>

          {/* Top-K Chunks Context Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white">
                [3] RAG RETRIEVAL CHUNKS LIMIT (TOP_K)
              </label>
              <span className="text-xs font-bold font-mono border border-white px-2 py-0.5">
                {settings.topK} CHUNKS
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="10"
              step="1"
              value={settings.topK}
              onChange={handleTopKChange}
              className="w-full accent-white bg-white/20 h-1 appearance-none cursor-pointer"
            />
            <span className="text-[8px] text-white/50 uppercase leading-normal">
              Determines how many chunks of text context are fed into the LLM system prompt. Larger values provide more background but consume more tokens.
            </span>
          </div>

          {/* LLM Temperature Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white">
                [4] LLM GENERATION CREATIVITY (TEMPERATURE)
              </label>
              <span className="text-xs font-bold font-mono border border-white px-2 py-0.5">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.1"
              value={settings.temperature}
              onChange={handleTemperatureChange}
              className="w-full accent-white bg-white/20 h-1 appearance-none cursor-pointer"
            />
            <span className="text-[8px] text-white/50 uppercase leading-normal">
              Lower temperature results in more deterministic, grounded responses. Higher values make the output more varied but increase the risk of hallucination.
            </span>
          </div>

          {/* Reset IndexedDB Store */}
          <div className="border-t border-dashed border-white/20 pt-4 flex flex-col gap-2.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5" />
              <span>[5] STORAGE ADMINISTRATION</span>
            </label>
            <div className="flex justify-between items-center bg-white/5 p-3 border border-white/20">
              <span className="text-[9px] uppercase text-white/60 max-w-[280px] leading-relaxed">
                Purge all client database collections (notes, vectors, and study guides).
              </span>
              <button
                onClick={handleResetStorage}
                className="retro-button bg-black text-white hover:bg-red-600 hover:text-white hover:border-red-600 px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>WIPE LOCAL DB</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Tips */}
        <div className="mt-6 flex gap-2 p-3 border border-white/20 bg-white/5 text-[9px] font-mono leading-normal text-white/60">
          <HelpCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <div>
            <span className="text-white font-bold uppercase block mb-0.5">Console Notes:</span>
            Settings are stored in the client&apos;s localStorage and loaded dynamically on each workspace session initialize.
          </div>
        </div>
      </motion.div>
    </div>
  );
}
