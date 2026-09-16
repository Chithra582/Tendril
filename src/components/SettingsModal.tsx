import React, { useState } from 'react';
import { Settings, X, Key, Sliders, Shield, Database, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
}

export const SettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
}) => {
  const [inputKey, setInputKey] = useState(apiKey);
  const [isSaved, setIsSaved] = useState(false);
  const [vectorWeight, setVectorWeight] = useState(65);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveApiKey(inputKey.trim());
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-[#111713] border border-[#233327] rounded-xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Tendril Configuration</h3>
            <p className="text-xs text-slate-400">
              Moss Retrieval & Stateless Small Cloud Settings
            </p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Gemini API Key */}
          <div>
            <label className="block text-slate-300 font-medium mb-1.5 flex items-center justify-between">
              <span className="flex items-center">
                <Key className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Google Gemini API Key (Optional)
              </span>
              <span className="text-[10px] text-slate-500">Stored client-side</span>
            </label>
            <input
              type="password"
              placeholder="AIzaSy... (leave blank for local synthetic fallback)"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[#162119] border border-[#233327] text-white focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Used exclusively by the stateless Small Cloud relay for response synthesis. Never receives raw files.
            </p>
          </div>

          {/* Moss Hybrid Weights */}
          <div className="p-3 rounded-lg bg-[#162119] border border-[#233327] space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-slate-300 flex items-center">
                <Sliders className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                Moss Hybrid Search Weight
              </span>
              <span className="font-mono text-emerald-400 font-bold">
                {vectorWeight}% Vector / {100 - vectorWeight}% BM25
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={90}
              value={vectorWeight}
              onChange={(e) => setVectorWeight(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-[#233327] rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Keyword Exact</span>
              <span>Balanced (Reciprocal Rank Fusion)</span>
              <span>Semantic Dense</span>
            </div>
          </div>

          {/* Privacy Information */}
          <div className="p-3 rounded-lg bg-[#0e1410] border border-[#1e2e22] text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center text-emerald-400 font-medium mb-0.5">
              <Shield className="w-3.5 h-3.5 mr-1" />
              Verified Local-First Architecture
            </div>
            <p>
              • File indexing, chunking, and vectors reside 100% in local memory.
            </p>
            <p>
              • Sub-10ms search requires 0 network activity.
            </p>
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-[#1a251e] text-slate-300 hover:bg-[#233327]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold flex items-center space-x-1"
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save Preferences</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
