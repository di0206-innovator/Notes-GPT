'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Sliders, Sun, Moon, Database, Trash2, HelpCircle, Activity } from 'lucide-react';
import { clearLocalStore } from '@/lib/indexed-db-store';

export interface Settings {
  theme: 'dark' | 'light';
  topK: number;
  temperature: number;
  defaultMode: 'cloud' | 'local';
  localProvider: 'window-ai' | 'ollama' | 'web-llm';
  ollamaUrl: string;
  ollamaModel: string;
  webLlmModel: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}: SettingsModalProps) {
  const [testStatus, setTestStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });
  const [isTesting, setIsTesting] = useState(false);
  const [localOllamaUrl, setLocalOllamaUrl] = useState(settings.ollamaUrl);
  const [localOllamaModel, setLocalOllamaModel] = useState(settings.ollamaModel);
  const [showWipeConfirm, setShowWipeConfirm] = useState(false);

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

  const handleLocalProviderChange = (localProvider: 'window-ai' | 'ollama' | 'web-llm') => {
    onUpdateSettings({ ...settings, localProvider });
  };

  const handleOllamaUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOllamaUrl(e.target.value);
  };

  const handleOllamaModelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalOllamaModel(e.target.value);
  };

  const handleWebLlmModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdateSettings({ ...settings, webLlmModel: e.target.value });
  };

  const handleTestOllama = async () => {
    setIsTesting(true);
    setTestStatus({ type: null, message: 'Verifying connection to Ollama server...' });
    try {
      const response = await fetch('/api/local-ai/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'check',
          url: localOllamaUrl,
          model: localOllamaModel,
        }),
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server returned error');
      }

      if (data.available && data.hasModel) {
        setTestStatus({ type: 'success', message: data.message });
        // Auto-save on successful test
        onUpdateSettings({
          ...settings,
          ollamaUrl: localOllamaUrl,
          ollamaModel: localOllamaModel,
        });
      } else {
        setTestStatus({ type: 'error', message: data.message || 'Model missing or offline.' });
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setTestStatus({ type: 'error', message: errMsg });
    } finally {
      setIsTesting(false);
    }
  };

  const handleResetStorage = async () => {
    setShowWipeConfirm(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="w-full max-w-lg border-2 border-white bg-black p-6 retro-shadow text-white relative font-mono overflow-y-auto max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-white pb-3 mb-6">
          <div className="flex items-center gap-2">
            <Sliders className="w-4.5 h-4.5" />
            <span className="font-bold text-xs uppercase tracking-wider">[ SYSTEM_SETTINGS ]</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 border border-transparent hover:border-white text-white transition-all cursor-pointer"
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
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs cursor-pointer ${
                  settings.theme === 'dark' ? 'bg-white text-black' : ''
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>CRT_DARK (DEFAULT)</span>
              </button>
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs cursor-pointer ${
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
                type="button"
                onClick={() => handleModeChange('cloud')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs cursor-pointer ${
                  settings.defaultMode === 'cloud' ? 'bg-white text-black' : ''
                }`}
              >
                <span>CLOUD MODEL</span>
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('local')}
                className={`retro-button flex items-center justify-center gap-2 py-2 text-xs cursor-pointer ${
                  settings.defaultMode === 'local' ? 'bg-white text-black' : ''
                }`}
              >
                <span>LOCAL DEVICE AI</span>
              </button>
            </div>
          </div>

          {/* Local AI Engine Selector */}
          <div className="flex flex-col gap-2 border-t border-dashed border-white/20 pt-4">
            <label className="text-[10px] font-bold uppercase tracking-wider text-white">
              [3] LOCAL AI ENGINE TYPE
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleLocalProviderChange('window-ai')}
                className={`retro-button py-2 text-[10px] cursor-pointer ${
                  settings.localProvider === 'window-ai' ? 'bg-white text-black' : ''
                }`}
              >
                <span>WINDOW.AI</span>
              </button>
              <button
                type="button"
                onClick={() => handleLocalProviderChange('ollama')}
                className={`retro-button py-2 text-[10px] cursor-pointer ${
                  settings.localProvider === 'ollama' ? 'bg-white text-black' : ''
                }`}
              >
                <span>OLLAMA</span>
              </button>
              <button
                type="button"
                onClick={() => handleLocalProviderChange('web-llm')}
                className={`retro-button py-2 text-[10px] cursor-pointer ${
                  settings.localProvider === 'web-llm' ? 'bg-white text-black' : ''
                }`}
              >
                <span>WEBLLM</span>
              </button>
            </div>

            {/* Provider Descriptions */}
            <span className="text-[8px] text-white/50 uppercase leading-normal">
              {settings.localProvider === 'window-ai' && 'Uses Chrome experimental built-in Gemini Nano model (Requires enabling chrome://flags).'}
              {settings.localProvider === 'ollama' && 'Uses local Ollama background server. High performance, works offline, supports custom models.'}
              {settings.localProvider === 'web-llm' && 'Runs fully client-side inside the browser tab using WebGPU. Downloads model on first use.'}
            </span>
          </div>

          {/* Ollama Settings Extra Inputs */}
          {settings.localProvider === 'ollama' && (
            <div className="p-3 border border-white/40 bg-white/5 space-y-3">
              <span className="text-[9px] font-bold tracking-wider uppercase text-white block">
                [ OLLAMA PARAMETERS ]
              </span>
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] text-white/70 uppercase">Ollama Server Endpoint</label>
                <input
                  type="text"
                  value={localOllamaUrl}
                  onChange={handleOllamaUrlChange}
                  className="bg-black border border-white p-1.5 text-xs text-white outline-none focus:border-white/80 font-mono"
                  placeholder="e.g. http://localhost:11434"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] text-white/70 uppercase">Ollama Model Name</label>
                <input
                  type="text"
                  value={localOllamaModel}
                  onChange={handleOllamaModelChange}
                  className="bg-black border border-white p-1.5 text-xs text-white outline-none focus:border-white/80 font-mono"
                  placeholder="e.g. gemma2:2b"
                />
              </div>

              {/* Connection Tester & Apply */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestOllama}
                  disabled={isTesting}
                  className="retro-button flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] cursor-pointer font-bold bg-white text-black uppercase"
                >
                  <Activity className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'TESTING...' : 'TEST CONNECTION'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSettings({
                      ...settings,
                      ollamaUrl: localOllamaUrl,
                      ollamaModel: localOllamaModel,
                    });
                    setTestStatus({ type: 'success', message: 'Settings applied successfully!' });
                  }}
                  className="retro-button flex items-center justify-center gap-1.5 px-3 py-1.5 text-[9px] cursor-pointer font-bold bg-white text-black uppercase"
                >
                  <span>APPLY CHANGES</span>
                </button>
              </div>
              {testStatus.message && (
                <span className={`text-[8px] block mt-1 leading-normal uppercase font-bold ${
                  testStatus.type === 'success' ? 'text-green-400' : 'text-red-400'
                }`}>
                  &gt; {testStatus.message}
                </span>
              )}
            </div>
          )}

          {/* WebLLM Settings Extra Inputs */}
          {settings.localProvider === 'web-llm' && (
            <div className="p-3 border border-white/40 bg-white/5 space-y-3">
              <span className="text-[9px] font-bold tracking-wider uppercase text-white block">
                [ WEBLLM MODEL SELECTOR ]
              </span>
              <div className="flex flex-col gap-1.5">
                <label className="text-[8px] text-white/70 uppercase">Select GPU Model</label>
                <select
                  value={settings.webLlmModel}
                  onChange={handleWebLlmModelChange}
                  className="bg-black border border-white p-1.5 text-xs text-white outline-none font-mono cursor-pointer"
                >
                  <option value="Phi-3-mini-4k-instruct-q4f16-1K-MLC">Phi-3-Mini (~2.1 GB, Recommended)</option>
                  <option value="gemma-2b-it-q4f16-MLC">Gemma-2B (~1.6 GB, Fast)</option>
                  <option value="Qwen2.5-1.5B-Instruct-q4f16-MLC">Qwen-2.5-1.5B (~1.0 GB, Low VRAM)</option>
                  <option value="Llama-3-8B-Instruct-q4f16_1-MLC">Llama-3-8B (~4.5 GB, Requires 16GB+ RAM)</option>
                </select>
              </div>
              <span className="text-[7.5px] leading-normal uppercase text-white/40 block">
                * Note: The selected model is downloaded into your browser cache on first run. If cached, subsequent loads run entirely offline using local WebGPU acceleration.
              </span>
            </div>
          )}

          {/* Top-K Chunks Context Slider */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold uppercase tracking-wider text-white">
                [4] RAG RETRIEVAL CHUNKS LIMIT (TOP_K)
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
                [5] LLM GENERATION CREATIVITY (TEMPERATURE)
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
              <span>[6] STORAGE ADMINISTRATION</span>
            </label>
            <div className="flex justify-between items-center bg-white/5 p-3 border border-white/20">
              <span className="text-[9px] uppercase text-white/60 max-w-[280px] leading-relaxed">
                Purge all client database collections (notes, vectors, and study guides).
              </span>
              <button
                type="button"
                onClick={handleResetStorage}
                className="retro-button bg-black text-white hover:bg-red-600 hover:text-white hover:border-red-600 px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold cursor-pointer"
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
        {/* Custom Confirmation Dialog for Wiping DB */}
        {showWipeConfirm && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-6 border-2 border-white">
            <div className="border border-white p-6 max-w-sm w-full bg-black text-center flex flex-col gap-4 retro-shadow-black">
              <span className="text-xs font-bold text-white uppercase tracking-widest block">
                [ ⚠️ CRITICAL WARNING ⚠️ ]
              </span>
              <p className="text-[10px] text-white/80 leading-normal uppercase">
                THIS WILL PERMANENTLY WIPE ALL UPLOADED FILES, VECTOR CHUNKS, AND GENERATED STUDY MATERIALS FROM YOUR LOCAL BROWSER DATABASE. THIS CANNOT BE UNDONE.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await clearLocalStore();
                      setShowWipeConfirm(false);
                      onClose();
                      alert('Local store cleared successfully. The page will reload now.');
                      window.location.reload();
                    } catch (err) {
                      console.error('Reset store failed:', err);
                      alert('Reset store failed: ' + (err as Error).message);
                      setShowWipeConfirm(false);
                    }
                  }}
                  className="retro-button text-xs py-2 bg-red-600 border-red-600 hover:bg-red-700 text-white font-bold"
                >
                  PROCEED
                </button>
                <button
                  type="button"
                  onClick={() => setShowWipeConfirm(false)}
                  className="retro-button text-xs py-2"
                >
                  CANCEL
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
