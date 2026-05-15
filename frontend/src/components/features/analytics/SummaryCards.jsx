import { useLang } from "@/contexts/LanguageContext";

const MNT_RATE = 3450;

function fmtSigned(val, currency) {
  if (val === null || val === undefined) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  const abs = Math.abs(n);
  if (currency === '₮') return `${n >= 0 ? '+' : '-'}${Math.round(abs * MNT_RATE).toLocaleString()} ₮`;
  return `${n >= 0 ? '+' : '-'}$${abs.toFixed(2)}`;
}

function fmtBalance(val, currency) {
  if (!val && val !== 0) return '—';
  const n = parseFloat(val);
  if (isNaN(n)) return '—';
  if (currency === '₮') return `${Math.round(n * MNT_RATE).toLocaleString()} ₮`;
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function BigCard({ label, value, valueCls = 'text-white', sub, subCls = 'text-slate-500' }) {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-5 hover:border-slate-700 transition-all duration-300 cursor-default">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">{label}</p>
      <p className={`text-2xl font-bold font-mono leading-none ${valueCls}`}>{value}</p>
      {sub && <p className={`text-xs mt-2 font-medium ${subCls}`}>{sub}</p>}
    </div>
  );
}

function SmallCard({ label, value, valueCls = 'text-white' }) {
  return (
    <div className="bg-slate-900 border border-slate-800/60 rounded-xl p-3.5 hover:border-slate-700 transition-all duration-300 cursor-default">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{label}</p>
      <p className={`text-base font-bold font-mono leading-none ${valueCls}`}>{value}</p>
    </div>
  );
}

export function SummaryCards({ data, currency = '$' }) {
  const { lang } = useLang();
  if (!data) return null;

  const netPnl   = parseFloat(data.netPnl   ?? 0);
  const winRate  = parseFloat(data.winRate  ?? 0);
  const avgRR    = parseFloat(data.avgRR    ?? 0);
  const avgWin   = parseFloat(data.avgWin   ?? 0);
  const avgLoss  = parseFloat(data.avgLoss  ?? 0);
  const expectancy = parseFloat(data.expectancy ?? 0);
  const volume   = parseFloat(data.totalVolume ?? 0);

  return (
    <div className="space-y-3">
      {/* Row 1 – 3 large cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BigCard
          label={lang === 'mn' ? 'ҮЛДЭГДЭЛ' : 'BALANCE'}
          value={fmtBalance(data.balance, currency)}
        />
        <BigCard
          label={lang === 'mn' ? 'ЦЭВЭР ДҮН' : 'NET P&L'}
          value={fmtSigned(netPnl, currency)}
          valueCls={netPnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <BigCard
          label={lang === 'mn' ? 'ЯЛАЛТЫН ХУВЬ' : 'WIN RATE'}
          value={`${winRate.toFixed(1)}%`}
          valueCls={winRate >= 50 ? 'text-emerald-400' : 'text-rose-400'}
          sub={winRate >= 50
            ? (lang === 'mn' ? 'Сайн үзүүлэлт' : 'Good performance')
            : (lang === 'mn' ? 'Сайжруулна уу' : 'Needs improvement')}
          subCls={winRate >= 50 ? 'text-emerald-500' : 'text-rose-500'}
        />
      </div>

      {/* Row 2 – 6 small cards */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        <SmallCard
          label="RISK REWARD"
          value={avgRR > 0 ? avgRR.toFixed(2) : '—'}
          valueCls={avgRR >= 1.5 ? 'text-emerald-400' : avgRR > 0 ? 'text-amber-400' : 'text-slate-500'}
        />
        <SmallCard
          label={lang === 'mn' ? 'ХҮЛЭЭЛТ' : 'EXPECTANCY'}
          value={data.expectancy != null ? fmtSigned(expectancy, currency) : '—'}
          valueCls={expectancy >= 0 ? 'text-emerald-400' : 'text-rose-400'}
        />
        <SmallCard
          label={lang === 'mn' ? 'АРИЛЖАА' : 'TRADES'}
          value={data.totalTrades ?? 0}
        />
        <SmallCard
          label={lang === 'mn' ? 'ДУНДАЖ АШИГ' : 'AVG WIN'}
          value={avgWin > 0 ? fmtSigned(avgWin, currency) : '—'}
          valueCls="text-emerald-400"
        />
        <SmallCard
          label={lang === 'mn' ? 'ДУНДАЖ АЛДАГДАЛ' : 'AVG LOSS'}
          value={avgLoss < 0 ? fmtSigned(avgLoss, currency) : '—'}
          valueCls="text-rose-400"
        />
        <SmallCard
          label={lang === 'mn' ? 'ЛОТ' : 'VOLUME'}
          value={volume > 0 ? volume.toFixed(2) : '—'}
          valueCls="text-slate-300"
        />
      </div>
    </div>
  );
}
