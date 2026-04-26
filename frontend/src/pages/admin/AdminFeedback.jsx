import { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronLeft, ChevronRight, CheckCircle2 } from "lucide-react";
import { getFeedback, updateFeedbackStatus, deleteFeedback } from "@/services/adminService";

const TYPE_LABELS = { bug: "Алдаа", feature: "Санал", general: "Ерөнхий", complaint: "Гомдол" };
const TYPE_COLORS = { bug: "bg-rose-500/10 text-rose-400", feature: "bg-blue-500/10 text-blue-400", general: "bg-slate-700 text-slate-300", complaint: "bg-amber-500/10 text-amber-400" };
const STATUS_LABELS = { new: "Шинэ", reviewed: "Хянасан", resolved: "Шийдсэн" };
const STATUS_COLORS = { new: "bg-amber-500/10 text-amber-400", reviewed: "bg-blue-500/10 text-blue-400", resolved: "bg-emerald-500/10 text-emerald-400" };

export function AdminFeedback() {
  const [data, setData] = useState({ feedback: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    getFeedback({ page, limit: 20, status: statusFilter || undefined, type: typeFilter || undefined })
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [page, statusFilter, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleStatus = async (id, status) => {
    await updateFeedbackStatus(id, status);
    load();
  };

  const handleDelete = async (id) => {
    await deleteFeedback(id);
    load();
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-slate-400 text-sm mt-1">Нийт {data.total} feedback</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50">
          <option value="">Бүх статус</option>
          <option value="new">Шинэ</option>
          <option value="reviewed">Хянасан</option>
          <option value="resolved">Шийдсэн</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50">
          <option value="">Бүх төрөл</option>
          <option value="bug">Алдаа мэдэгдэх</option>
          <option value="feature">Санал</option>
          <option value="general">Ерөнхий</option>
          <option value="complaint">Гомдол</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Уншиж байна...</div>
        ) : data.feedback.length === 0 ? (
          <div className="text-center py-12 text-slate-500">Feedback олдсонгүй</div>
        ) : data.feedback.map(fb => (
          <div key={fb.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${TYPE_COLORS[fb.type] || TYPE_COLORS.general}`}>
                    {TYPE_LABELS[fb.type] || fb.type}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${STATUS_COLORS[fb.status]}`}>
                    {STATUS_LABELS[fb.status]}
                  </span>
                  <span className="text-xs text-slate-500">{new Date(fb.created_at).toLocaleDateString('mn-MN')}</span>
                </div>
                <p className="text-xs text-slate-500 mb-1">{fb.user_name || 'Нэргүй'} · {fb.user_email || '—'}</p>
                <p className={`text-sm text-slate-300 ${expanded !== fb.id ? 'line-clamp-2' : ''}`}>{fb.message}</p>
                {fb.message.length > 120 && (
                  <button onClick={() => setExpanded(expanded === fb.id ? null : fb.id)}
                    className="text-xs text-accent mt-1 hover:underline">
                    {expanded === fb.id ? 'Хураах' : 'Дэлгэрэнгүй'}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {fb.status !== 'resolved' && (
                  <button onClick={() => handleStatus(fb.id, fb.status === 'new' ? 'reviewed' : 'resolved')}
                    title="Дараагийн статус" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                )}
                <button onClick={() => handleDelete(fb.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-xs text-slate-500">{page} / {data.pages} хуудас</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-400 transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}
              className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-40 text-slate-400 transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
