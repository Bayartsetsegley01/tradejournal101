import { safeFormatDate } from "@/lib/utils";
import { 
  Image, FileText, ArrowUpRight, ArrowDownRight, 
  Bitcoin, DollarSign, LineChart, Coins, Box, Activity, Clock, Layers,
  MoreHorizontal, Edit2, Copy, Trash2
} from "lucide-react";
import { EMOTIONS } from "@/lib/constants";
import { useState, useRef, useEffect } from "react";

const MARKET_CONFIG = {
  crypto: { icon: Bitcoin, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  forex: { icon: DollarSign, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  stock: { icon: LineChart, color: 'text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' },
  gold: { icon: Coins, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
  commodities: { icon: Box, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
  indices: { icon: Activity, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
  futures: { icon: Clock, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  options: { icon: Layers, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
};

export function TradeTable({ trades, onRowClick, onEdit, onDuplicate, onDelete }) {
  const [openActionMenuId, setOpenActionMenuId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenActionMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getEmotionEmoji = (emotionId) => {
    const emotion = EMOTIONS.find(e => e.id === emotionId);
    return emotion ? emotion.emoji : null;
  };

  return (
    <div className="h-full overflow-auto custom-scrollbar">
      <table className="w-full text-left text-sm text-slate-400 border-collapse">
        <thead className="text-xs text-slate-500 uppercase tracking-wider bg-slate-900/95 backdrop-blur-sm sticky top-0 z-20 shadow-sm">
          <tr>
            <th className="px-5 py-4 font-semibold border-b border-slate-800">Огноо</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800">Market & Symbol</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800">L/S</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">Entry</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">Exit</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">R/R</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">P&L</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-center">Status</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-center">Сэтгэл зүй</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-center">Media</th>
            <th className="px-5 py-4 font-semibold border-b border-slate-800 text-right">Үйлдэл</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {trades.map((trade) => {
            const isWin = trade.pnl > 0;
            const isLoss = trade.pnl < 0;
            const isOpen = trade.status === 'OPEN';
            const isPlanned = trade.status === 'PLANNED';
            
            const marketConf = MARKET_CONFIG[trade.market] || MARKET_CONFIG.forex;
            const MarketIcon = marketConf.icon;

            return (
              <tr 
                key={trade.id} 
                onClick={() => onRowClick(trade)}
                className="hover:bg-slate-800/40 cursor-pointer transition-all group"
              >
                {/* Date */}
                <td className="px-5 py-4 whitespace-nowrap">
                  <div className="text-slate-300 font-medium">{safeFormatDate(trade.entry_date || trade.date, "MMM dd, HH:mm")}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{safeFormatDate(trade.entry_date || trade.date, "EEEE")}</div>
                </td>
                
                {/* Market & Symbol */}
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${marketConf.bg} ${marketConf.border} ${marketConf.color}`}>
                      <MarketIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-white tracking-wide">{trade.symbol}</div>
                      <div className="text-xs text-slate-500 uppercase tracking-wider mt-0.5">{trade.market_type || trade.market}</div>
                    </div>
                  </div>
                </td>
                
                {/* Direction */}
                <td className="px-5 py-4">
                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide border ${
                    trade.direction === 'LONG' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>
                    {trade.direction === 'LONG' ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {trade.direction}
                  </div>
                </td>
                
                {/* Entry */}
                <td className="px-5 py-4 text-right font-mono text-slate-300">
                  {trade.entry_price || trade.entry}
                </td>
                
                {/* Exit */}
                <td className="px-5 py-4 text-right font-mono text-slate-300">
                  {trade.exit_price || trade.exit || <span className="text-slate-600">-</span>}
                </td>
                
                {/* R/R */}
                <td className="px-5 py-4 text-right font-mono">
                  {(trade.rr_ratio || trade.rr) ? (
                    <span className={`px-2 py-1 rounded bg-slate-950 border border-slate-800 ${(trade.rr_ratio || trade.rr) >= 2 ? 'text-emerald-400' : 'text-slate-300'}`}>
                      {trade.rr_ratio || trade.rr}R
                    </span>
                  ) : <span className="text-slate-600">-</span>}
                </td>
                
                {/* P&L */}
                <td className="px-5 py-4 text-right">
                  {isOpen || isPlanned ? (
                    <span className="text-slate-600 font-mono">-</span>
                  ) : (
                    <div className={`font-mono font-bold text-base ${
                      isWin ? 'text-emerald-400' : isLoss ? 'text-rose-400' : 'text-slate-400'
                    }`}>
                      {trade.pnl > 0 ? '+' : ''}${trade.pnl}
                    </div>
                  )}
                </td>
                
                {/* Status */}
                <td className="px-5 py-4 text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className={`inline-flex items-center justify-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border ${
                      isOpen ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 
                      isPlanned ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                      'bg-slate-800/50 text-slate-400 border-slate-700/50'
                    }`}>
                      {trade.status}
                    </span>
                    {trade.is_draft && (
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded">
                        Draft
                      </span>
                    )}
                  </div>
                </td>
                
                {/* Emotion */}
                <td className="px-5 py-4 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {trade.emotionBefore && (
                      <span className="text-lg opacity-70 hover:opacity-100 transition-opacity" title="Before Trade">
                        {getEmotionEmoji(trade.emotionBefore)}
                      </span>
                    )}
                    {trade.emotionBefore && trade.emotionAfter && <span className="text-slate-700 text-xs">→</span>}
                    {trade.emotionAfter && (
                      <span className="text-lg hover:scale-110 transition-transform" title="After Trade">
                        {getEmotionEmoji(trade.emotionAfter)}
                      </span>
                    )}
                    {!trade.emotionBefore && !trade.emotionAfter && <span className="text-slate-600">-</span>}
                  </div>
                </td>
                
                {/* Media/Notes */}
                <td className="px-5 py-4">
                  <div className="flex items-center justify-center gap-2.5">
                    {trade.screenshot_url ? (
                      <div className="w-7 h-7 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent" title="Has Screenshot">
                        <Image className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded flex items-center justify-center text-slate-700">
                        <Image className="w-3.5 h-3.5" />
                      </div>
                    )}
                    
                    {trade.notes || trade.whyEntered || trade.whatHappened ? (
                      <div className="w-7 h-7 rounded bg-accent/10 border border-accent/20 flex items-center justify-center text-accent" title="Has Notes">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded flex items-center justify-center text-slate-700">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-5 py-4 text-right relative">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenActionMenuId(openActionMenuId === trade.id ? null : trade.id);
                    }}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md transition-colors"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                  
                  {openActionMenuId === trade.id && (
                    <div 
                      ref={menuRef}
                      className="absolute right-8 top-10 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-30 py-1 overflow-hidden"
                    >
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onEdit(trade); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                      >
                        <Edit2 className="w-4 h-4" /> Засах
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onDuplicate(trade); }}
                        className="w-full text-left px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                      >
                        <Copy className="w-4 h-4" /> Хуулах
                      </button>
                      <div className="h-px bg-slate-700 my-1" />
                      <button 
                        onClick={(e) => { e.stopPropagation(); setOpenActionMenuId(null); onDelete(trade.id); }}
                        className="w-full text-left px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" /> Устгах
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
