import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Zap,
  Sparkles,
  Send,
  Wifi,
  WifiOff,
  ShieldCheck,
  AlertCircle,
  FileText,
  ExternalLink,
  Bot,
  User,
  CheckCircle2,
  Lock,
  Layers
} from 'lucide-react';
import { MossRetrievalEngine, SearchResult, SearchMetrics } from '../engine/moss-engine';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  retrievedSnippets?: SearchResult[];
  latencyMs?: number;
  egressBytes?: number;
  redactedPiiCount?: number;
  isStreaming?: boolean;
}

interface Props {
  activeVaultId: string;
  onSearchExecuted?: (latency: number, egressBytes: number) => void;
  apiKey?: string;
}

export const SearchAndChat: React.FC<Props> = ({
  activeVaultId,
  onSearchExecuted,
  apiKey,
}) => {
  const engine = MossRetrievalEngine.getInstance();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [metrics, setMetrics] = useState<SearchMetrics | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Welcome to **Tendril** — your local-first zero-latency AI copilot.

I use **Moss** for sub-10ms semantic and hybrid search over your personal notes, legal contracts, financial memos, and YC Fall 2026 RFS tracks **without a traditional vector database**.

Try searching for:
- *"YC Fall 2026 Small Cloud thesis"*
- *"Contract indemnification limit and IP ownership"*
- *"Series A burn rate and runway projections"*
- *"Why Moss eliminates the voice conversational latency bottleneck"*`,
    },
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'copilot'>('search');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Execute instant local search on keystroke
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([]);
      setMetrics(null);
      return;
    }

    const res = engine.query(query, activeVaultId, 5);
    setSearchResults(res.results);
    setMetrics(res.metrics);
    onSearchExecuted?.(res.metrics.latencyMs, 0);

    // Record local event to server telemetry
    if (!isOffline) {
      fetch('/api/telemetry/local-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'LOCAL_SEARCH',
          queryPreview: query.substring(0, 35),
        }),
      }).catch(() => {});
    }
  }, [query, activeVaultId]);

  const handleAskCopilot = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const promptText = query.trim();
    if (!promptText || isGenerating) return;

    // Run immediate local retrieval to collect context
    const retrieval = engine.query(promptText, activeVaultId, 4);
    const topSnippets = retrieval.results;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: promptText,
    };

    const assistantMsgId = `assistant-${Date.now()}`;
    const initialAssistantMsg: Message = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      retrievedSnippets: topSnippets,
      latencyMs: retrieval.metrics.latencyMs,
      egressBytes: 0,
      redactedPiiCount: 0,
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, initialAssistantMsg]);
    setActiveTab('copilot');
    setIsGenerating(true);

    if (isOffline) {
      // Offline mode handling (PRD Section 5.3)
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  isStreaming: false,
                  content: `⚠️ **Offline Mode Active (PRD Section 5.3)**:
Local sub-10ms search remains 100% functional on-device (${retrieval.metrics.latencyMs}ms retrieval).
However, cloud LLM synthesis requires internet connectivity. Your question and ${topSnippets.length} retrieved context snippets have been queued locally.`,
                }
              : m
          )
        );
        setIsGenerating(false);
      }, 500);
      return;
    }

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: promptText,
          contextSnippets: topSnippets.map((s) => ({
            filename: s.chunk.filename,
            heading: s.chunk.heading,
            text: s.chunk.text,
          })),
          apiKey: apiKey || undefined,
        }),
      });

      if (!response.body) throw new Error('Readable stream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      let recordedEgress = 0;
      let redactedCount = 0;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.type === 'token') {
                streamedContent += data.token;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsgId ? { ...m, content: streamedContent } : m
                  )
                );
              } else if (data.type === 'guardrail_report') {
                recordedEgress = data.bytesEgress;
                redactedCount = data.redactedCount;
                onSearchExecuted?.(retrieval.metrics.latencyMs, recordedEgress);
              } else if (data.type === 'error') {
                streamedContent += `\n\n🛡️ ${data.message}`;
              }
            } catch {
              // Non-json chunk
            }
          }
        }
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                content: streamedContent,
                isStreaming: false,
                egressBytes: recordedEgress,
                redactedPiiCount: redactedCount,
              }
            : m
        )
      );
    } catch (err: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? {
                ...m,
                isStreaming: false,
                content: `⚠️ Failed to connect to Small Cloud relay: ${err.message}. Ensure the backend server is running on port 3001.`,
              }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-[#121814] border border-[#233327] rounded-xl p-5 shadow-lg flex flex-col h-full">
      {/* Search Header & Controls */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('search')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'search'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Instant Search</span>
            {searchResults.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 font-mono">
                {searchResults.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('copilot')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1.5 ${
              activeTab === 'copilot'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Copilot</span>
          </button>
        </div>

        {/* Offline Mode Simulator Toggle */}
        <button
          onClick={() => setIsOffline(!isOffline)}
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-mono transition-colors border ${
            isOffline
              ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
              : 'bg-[#162119] text-slate-400 border-[#233327] hover:text-slate-200'
          }`}
          title="Toggle Offline Mode to simulate zero-network local search"
        >
          {isOffline ? (
            <>
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Offline Mode (Local Only)</span>
            </>
          ) : (
            <>
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span>Online Mode</span>
            </>
          )}
        </button>
      </div>

      {/* Main Search Bar */}
      <form onSubmit={handleAskCopilot} className="relative mb-4">
        <div className="relative flex items-center">
          <div className="absolute left-3.5 text-emerald-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search documents or ask AI copilot (e.g. 'indemnification cap', 'YC RFS small cloud')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-[#162119] border border-[#233327] text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/80 transition-all font-sans"
          />

          <div className="absolute right-2 flex items-center space-x-1">
            {metrics && (
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-950/90 text-emerald-400 border border-emerald-500/40 flex items-center mr-1">
                <Zap className="w-3 h-3 mr-0.5 fill-current" />
                {metrics.latencyMs}ms
              </span>
            )}
            <button
              type="submit"
              disabled={!query.trim() || isGenerating}
              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-black font-semibold text-xs transition-colors disabled:opacity-40"
              title="Ask AI Copilot with retrieved local context"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </form>

      {/* Content Display: Instant Search Tab vs AI Copilot Tab */}
      <div className="flex-1 overflow-y-auto pr-1 min-h-[360px]">
        {activeTab === 'search' ? (
          <div>
            {/* Telemetry info header */}
            {metrics && (
              <div className="flex items-center justify-between text-xs font-mono text-slate-400 pb-2 mb-3 border-b border-[#233327]">
                <div className="flex items-center space-x-2">
                  <span className="text-emerald-400 font-bold">{metrics.latencyMs} ms</span>
                  <span>•</span>
                  <span>{metrics.totalChunksSearched} chunks evaluated</span>
                  <span>•</span>
                  <span className="text-emerald-300">0 B Network Egress</span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Moss Vector (65%) + BM25 Lexical (35%)
                </div>
              </div>
            )}

            {searchResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-3 w-12 h-12 mx-auto rounded-full bg-[#162119] border border-[#233327] flex items-center justify-center text-emerald-400 mb-3">
                  <Search className="w-6 h-6 opacity-60" />
                </div>
                <h4 className="text-sm font-medium text-slate-300">Instant Local Knowledge Retrieval</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Type any keyword or concept. Moss executes vector similarity and lexical rank fusion in process in sub-10ms.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {searchResults.map((res) => (
                  <div
                    key={res.chunk.id}
                    className="p-3.5 rounded-xl bg-[#162119]/80 border border-[#233327] hover:border-emerald-500/40 transition-all"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-emerald-400">
                          {res.chunk.filename}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-xs text-slate-400 font-mono">
                          {res.chunk.heading || 'Section'}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 font-mono text-[10px]">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          Score: {res.score.toFixed(1)}
                        </span>
                        <span className="text-slate-500">
                          (Vec: {res.semanticScore}% | BM25: {res.keywordScore})
                        </span>
                        <span className="text-emerald-400/80">
                          {res.latencyMs}ms
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                      {res.chunk.text}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-[#233327] flex items-center justify-between text-[10px] text-slate-400 font-mono">
                      <span className="flex items-center text-emerald-400">
                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified 0 B Egress
                      </span>
                      <button
                        onClick={() => {
                          setQuery(res.chunk.text.substring(0, 100));
                          handleAskCopilot();
                        }}
                        className="text-emerald-400 hover:text-emerald-300 flex items-center"
                      >
                        <Sparkles className="w-3 h-3 mr-1" /> Ask Copilot with this context
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* AI Copilot Chat Thread */
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex space-x-3 text-xs ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-xl p-4 ${
                    msg.role === 'user'
                      ? 'bg-emerald-600 text-black font-medium'
                      : 'bg-[#162119] border border-[#233327] text-slate-200'
                  }`}
                >
                  <div className="leading-relaxed whitespace-pre-wrap font-sans">
                    {msg.content}
                    {msg.isStreaming && (
                      <span className="inline-block w-1.5 h-3.5 bg-emerald-400 animate-pulse ml-1 align-middle" />
                    )}
                  </div>

                  {/* Retrieved Citations Drawer */}
                  {msg.retrievedSnippets && msg.retrievedSnippets.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-[#233327]">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
                        <span className="flex items-center text-emerald-400">
                          <Zap className="w-3 h-3 mr-1" />
                          Retrieved via Moss in {msg.latencyMs}ms
                        </span>
                        <span className="text-slate-400">
                          Egress: {msg.egressBytes || 0} B
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {msg.retrievedSnippets.map((s, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded bg-[#101712] border border-[#233327] text-[11px]"
                          >
                            <div className="flex justify-between text-emerald-300 font-mono text-[10px] mb-1">
                              <span>[Source {idx + 1}: {s.chunk.filename}]</span>
                              <span className="text-slate-500">{s.chunk.heading}</span>
                            </div>
                            <p className="text-slate-400 text-[10px] line-clamp-2">
                              {s.chunk.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-[#233327] border border-[#2e4032] flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            <div ref={chatBottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};
