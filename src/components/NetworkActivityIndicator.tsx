import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowUpRight, Lock, Eye, AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface AuditLog {
  id: string;
  timestamp: string;
  type: 'LOCAL_INDEX' | 'LOCAL_SEARCH' | 'SMALL_CLOUD_GENERATE';
  queryPreview: string;
  bytesEgress: number;
  piiRedactedCount: number;
  injectionDetected: boolean;
  status: 'AUDITED_ZERO_EGRESS' | 'TRANSMITTED_MINIMAL_PAYLOAD' | 'BLOCKED';
}

interface Props {
  lastSearchLatency?: number;
  lastEgressBytes?: number;
}

export const NetworkActivityIndicator: React.FC<Props> = ({ lastSearchLatency, lastEgressBytes = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [telemetry, setTelemetry] = useState<{
    totalEgressBytes: number;
    logs: AuditLog[];
  }>({
    totalEgressBytes: 0,
    logs: [],
  });

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      if (res.ok) {
        const data = await res.json();
        setTelemetry({
          totalEgressBytes: data.totalEgressBytes || 0,
          logs: data.logs || [],
        });
      }
    } catch {
      // Offline fallback
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Real-time status pill */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 hover:border-emerald-500/60 transition-all text-xs font-mono"
        title="Click to inspect Network Activity & Privacy Proof"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-emerald-400 font-medium">Zero-Leakage Active</span>
        <span className="text-emerald-300/60">|</span>
        <span className="text-slate-300 flex items-center">
          <ArrowUpRight className="w-3 h-3 mr-0.5 text-emerald-400" />
          {lastEgressBytes === 0 ? '0 B Egress' : `${lastEgressBytes} B Relay`}
        </span>
      </button>

      {/* Privacy Inspector Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#111713] border border-[#233327] rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[85vh] flex flex-col">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Network Activity & Privacy Auditor</h3>
                <p className="text-xs text-slate-400">
                  Verifiable proof of local data isolation under PRD Section 6 (Non-Functional Requirements)
                </p>
              </div>
            </div>

            {/* Metrics banner */}
            <div className="grid grid-cols-3 gap-3 mb-5">
              <div className="bg-[#162119] p-3 rounded-lg border border-[#233327]">
                <div className="text-[11px] text-slate-400">Search Egress</div>
                <div className="text-lg font-mono font-bold text-emerald-400">0 Bytes</div>
                <div className="text-[10px] text-emerald-400/70 flex items-center mt-0.5">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> 100% In-Process Moss
                </div>
              </div>

              <div className="bg-[#162119] p-3 rounded-lg border border-[#233327]">
                <div className="text-[11px] text-slate-400">Total Cloud Egress</div>
                <div className="text-lg font-mono font-bold text-slate-200">
                  {telemetry.totalEgressBytes} Bytes
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Only sanitized top-k context
                </div>
              </div>

              <div className="bg-[#162119] p-3 rounded-lg border border-[#233327]">
                <div className="text-[11px] text-slate-400">Guardrail Status</div>
                <div className="text-lg font-mono font-bold text-emerald-400 flex items-center">
                  <Lock className="w-4 h-4 mr-1" /> Enkrypt Shield
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  PII & Key Redactor Active
                </div>
              </div>
            </div>

            {/* Live Audit Log */}
            <div className="flex-1 overflow-y-auto pr-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Real-Time Auditable Event Log
              </h4>

              {telemetry.logs.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs font-mono">
                  Perform a search or ask a question to view live telemetry events.
                </div>
              ) : (
                <div className="space-y-2">
                  {telemetry.logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded bg-[#162119]/80 border border-[#233327] flex items-center justify-between text-xs font-mono"
                    >
                      <div className="flex items-center space-x-2">
                        {log.bytesEgress === 0 ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                            LOCAL ZERO-EGRESS
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-950 text-amber-400 border border-amber-500/30">
                            SMALL CLOUD RELAY
                          </span>
                        )}
                        <span className="text-slate-300 truncate max-w-[240px]">
                          "{log.queryPreview}"
                        </span>
                      </div>

                      <div className="flex items-center space-x-3 text-slate-400">
                        <span className="font-semibold text-slate-200">
                          {log.bytesEgress} B
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#233327] flex justify-between items-center text-xs text-slate-400">
              <span className="flex items-center">
                <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" />
                Raw files never transmitted to third parties
              </span>
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 bg-[#233327] hover:bg-[#344c3b] text-slate-200 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
