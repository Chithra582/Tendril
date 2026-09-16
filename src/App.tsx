import React, { useState } from 'react';
import {
  Layers,
  Shield,
  Zap,
  Cpu,
  Settings,
  Sparkles,
  ExternalLink,
  Code2,
  Database,
  Activity,
  FolderLock
} from 'lucide-react';
import { NetworkActivityIndicator } from './components/NetworkActivityIndicator';
import { LatencyBenchmark } from './components/LatencyBenchmark';
import { DocumentVaultManager } from './components/DocumentVaultManager';
import { SearchAndChat } from './components/SearchAndChat';
import { SettingsModal } from './components/SettingsModal';
import { MossRetrievalEngine } from './engine/moss-engine';

export const App: React.FC = () => {
  const [activeVaultId, setActiveVaultId] = useState<string>('all');
  const [showBenchmark, setShowBenchmark] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('tendril_gemini_api_key') || '');
  const [lastLatency, setLastLatency] = useState<number>(2.4);
  const [lastEgress, setLastEgress] = useState<number>(0);
  const [, setRefreshState] = useState(0);

  const engine = MossRetrievalEngine.getInstance();
  const totalChunks = engine.getTotalChunkCount();

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('tendril_gemini_api_key', key);
  };

  return (
    <div className="min-h-screen bg-[#0b0f0d] text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <header className="border-b border-[#1c271f] bg-[#0f1511]/90 backdrop-blur sticky top-0 z-40 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-emerald-400 flex items-center justify-center text-black font-bold shadow-lg shadow-emerald-500/20">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold tracking-tight text-white">Tendril</h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  Moss Zero-Latency Engine
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-mono bg-indigo-950/80 text-indigo-300 border border-indigo-500/30">
                  YC Fall 2026 RFS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Local-First AI & The Small Cloud • Sub-10ms Semantic Search Without a Vector DB
              </p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3">
            {/* Real-time Network Activity Indicator & Privacy Inspector */}
            <NetworkActivityIndicator
              lastSearchLatency={lastLatency}
              lastEgressBytes={lastEgress}
            />

            {/* Toggle Benchmark Card */}
            <button
              onClick={() => setShowBenchmark(!showBenchmark)}
              className={`p-2 rounded-lg border text-xs font-mono transition-colors flex items-center space-x-1.5 ${
                showBenchmark
                  ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300'
                  : 'bg-[#162119] border-[#233327] text-slate-400 hover:text-slate-200'
              }`}
              title="Toggle Sub-10ms Benchmark Telemetry"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden md:inline">Benchmark</span>
            </button>

            {/* Settings */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-[#162119] hover:bg-[#202e24] border border-[#233327] text-slate-400 hover:text-slate-200 transition-colors"
              title="Settings & Gemini API Configuration"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col space-y-4">
        {/* Benchmark Telemetry Card (Collapsible) */}
        {showBenchmark && (
          <div className="transition-all animate-fadeIn">
            <LatencyBenchmark />
          </div>
        )}

        {/* 2-Column Work Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* Left Column: Multi-Index Document Vaults (5 cols) */}
          <div className="lg:col-span-5 h-[620px]">
            <DocumentVaultManager
              activeVaultId={activeVaultId}
              onSelectVault={setActiveVaultId}
              onDocumentCountChange={() => setRefreshState((s) => s + 1)}
            />
          </div>

          {/* Right Column: Search & Guarded AI Copilot (7 cols) */}
          <div className="lg:col-span-7 h-[620px]">
            <SearchAndChat
              activeVaultId={activeVaultId}
              apiKey={apiKey}
              onSearchExecuted={(lat, egress) => {
                setLastLatency(lat);
                setLastEgress(egress);
              }}
            />
          </div>
        </div>
      </main>

      {/* Bottom Status Bar */}
      <footer className="border-t border-[#1c271f] bg-[#0c120e] px-6 py-2 text-[11px] font-mono text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-3">
            <span className="flex items-center text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
              Runtime: Moss In-Process Engine
            </span>
            <span>•</span>
            <span>Vector Index: {totalChunks} Chunks Loaded</span>
            <span>•</span>
            <span className="text-slate-500">Track: Local-First AI & The Small Cloud</span>
          </div>

          <div className="flex items-center space-x-3">
            <span className="flex items-center text-slate-400">
              <Shield className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Enkrypt Privacy Guardrails
            </span>
            <span>•</span>
            <span className="text-slate-400">
              Small Cloud Relay: Gemini 2.0 Flash
            </span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
};
