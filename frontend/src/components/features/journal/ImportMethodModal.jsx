import { X, Zap, FileSpreadsheet } from "lucide-react";

export function ImportMethodModal({ isOpen, onClose, onCSVImport, onAutoSync }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="p-5">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-white">Импортын арга сонгох</h2>
              <p className="text-xs text-slate-500 mt-0.5">Арилжааны түүхийг хэрхэн оруулах вэ?</p>
            </div>
            <button onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            {/* CSV Import */}
            <button
              onClick={() => { onClose(); onCSVImport?.(); }}
              className="group w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="text-slate-400" style={{ width: 18, height: 18 }} />
                </div>
                <span className="text-sm font-semibold text-white flex-1">CSV оруулах</span>
                <svg className="shrink-0 w-4 h-4 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>

            {/* Auto-Sync */}
            <button
              onClick={() => { onClose(); onAutoSync?.(); }}
              className="group w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150"
            >
              <div className="flex items-center gap-3.5">
                <div className="shrink-0 w-9 h-9 rounded-xl bg-slate-700/50 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Zap className="text-slate-400" style={{ width: 18, height: 18 }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">Auto-Sync</span>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full border bg-slate-700/50 text-slate-500 border-slate-600/40">Туршилт</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-0.5">MT5 дансаа шууд холбох боломжтой</p>
                </div>
                <svg className="shrink-0 w-4 h-4 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
                  fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
