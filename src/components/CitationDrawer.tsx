import React from 'react';
import { X, FileText, Shield, Copy, Check, ExternalLink, Hash } from 'lucide-react';
import { DocumentItem } from '../engine/sample-vaults';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  highlightedText?: string;
  sourceLabel?: string;
}

export const CitationDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  document,
  highlightedText = '',
  sourceLabel = 'Retrieved Citation',
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !document) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(highlightedText || document.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  // Render document content with the matched snippet highlighted
  const renderHighlightedContent = () => {
    const content = document.content;
    if (!highlightedText.trim()) {
      return (
        <pre className="font-sans text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
          {content}
        </pre>
      );
    }

    // Clean snippet for fuzzy or substring matching
    const cleanSnippet = highlightedText.trim().slice(0, 120);
    const index = content.indexOf(cleanSnippet);

    if (index === -1) {
      return (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-lg">
            <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
              Retrieved Context Snippet (Active Grounding)
            </span>
            <p className="text-xs text-emerald-200 font-sans leading-relaxed">
              "{highlightedText}"
            </p>
          </div>
          <div className="border-t border-[#233327] pt-3">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
              Full Document Context ({document.filename})
            </span>
            <pre className="font-sans text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
              {content}
            </pre>
          </div>
        </div>
      );
    }

    const before = content.substring(0, index);
    const match = content.substring(index, index + highlightedText.length);
    const after = content.substring(index + highlightedText.length);

    return (
      <div className="font-sans text-xs leading-relaxed whitespace-pre-wrap">
        <span className="text-slate-400">{before}</span>
        <mark className="bg-emerald-500/25 text-emerald-200 border-l-4 border-emerald-500 px-1 py-0.5 rounded shadow-sm">
          {match || cleanSnippet}
        </mark>
        <span className="text-slate-400">{after}</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#111713] border border-[#233327] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-start space-x-3 mb-4">
          <div className="p-2.5 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-400 mt-1">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                {sourceLabel}
              </span>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                document.sensitivity === 'Restricted'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-800/40'
              }`}>
                {document.sensitivity}
              </span>
            </div>
            <h3 className="text-base font-semibold text-white mt-1">{document.title}</h3>
            <p className="text-xs text-slate-400 font-mono">
              {document.filename} • Vault: {document.vaultId}
            </p>
          </div>
        </div>

        {/* Highlighted Document Body */}
        <div className="flex-1 overflow-y-auto bg-[#0d130f] p-4 rounded-lg border border-[#233327] pr-2">
          {renderHighlightedContent()}
        </div>

        {/* Footer actions */}
        <div className="mt-4 pt-3 border-t border-[#233327] flex items-center justify-between text-xs text-slate-400 font-mono">
          <span className="flex items-center text-emerald-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 mr-1" />
            Verified Local Grounding (Zero Cloud Leakage)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-[#162119] hover:bg-[#202e24] border border-[#233327] text-slate-200 rounded flex items-center space-x-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Snippet</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#233327] hover:bg-[#344c3b] text-slate-200 rounded transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
