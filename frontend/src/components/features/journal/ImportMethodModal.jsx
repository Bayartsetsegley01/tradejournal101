import { useNavigate } from "react-router-dom";
import { X, Zap, Monitor, FileSpreadsheet } from "lucide-react";

const METHODS = [
  {
    id: 'autosync',
    icon: Zap,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    label: 'Auto-Sync',
    badge: 'Санал болгох',
    badgeCls: 'bg-accent/10 text-accent border-accent/20',
    desc: 'MT5 login болон investor password оруулна. Бид cloud-оор read-only горимоор холбогдож trade history татна.',
  },
  {
    id: 'easync',
    icon: Monitor,
    iconBg: 'bg-blue-500/10',
    iconColor: 'text-blue-400',
    label: 'EA Sync',
    badge: 'Real-time',
    badgeCls: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    desc: 'MT5 дотроо Expert Advisor суулгана. Trade хаагдах бүрт автоматаар илгээдэг. Компьютер асаатай үед л ажилладаг.',
  },
  {
    id: 'csv',
    icon: FileSpreadsheet,
    iconBg: 'bg-slate-700/50',
    iconColor: 'text-slate-400',
    label: 'CSV Import',
    badge: 'Гараар',
    badgeCls: 'bg-slate-700/50 text-slate-400 border-slate-600/40',
    desc: 'MT5-аас CSV export хийж upload хийнэ. Ямар ч холболт шаардахгүй — хамгийн энгийн арга.',
  },
];

function MethodCard({ method, onClick }) {
  const Icon = method.icon;
  return (
    <button
      onClick={onClick}
      className="group w-full text-left p-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-800/60 hover:border-slate-700 transition-all duration-150"
    >
      <div className="flex items-start gap-3.5">
        <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${method.iconBg} group-hover:scale-105 transition-transform`}>
          <Icon className={`w-4.5 h-4.5 ${method.iconColor}`} style={{ width: 18, height: 18 }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">{method.label}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${method.badgeCls}`}>
              {method.badge}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">{method.desc}</p>
        </div>
        <svg className="shrink-0 self-center w-4 h-4 text-slate-700 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all"
          fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </button>
  );
}

export function ImportMethodModal({ isOpen, onClose, onCSVImport, onImportComplete }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleMethod = (id) => {
    if (id === 'csv') {
      onClose();
      onCSVImport();
      return;
    }
    onClose();
    navigate('/app/settings', { state: { activeTab: 'mt5' } });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="p-5">
          {/* Header */}
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

          {/* Method cards */}
          <div className="space-y-2">
            {METHODS.map(m => (
              <MethodCard key={m.id} method={m} onClick={() => handleMethod(m.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
