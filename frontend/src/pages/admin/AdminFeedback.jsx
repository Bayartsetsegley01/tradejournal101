import { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronLeft, ChevronRight, CheckCircle2, Mail, Flag } from "lucide-react";
import { getFeedback, updateFeedbackStatus, deleteFeedback } from "@/services/adminService";

const TYPE_LABELS = { bug: "Bug", feature: "Feature", general: "General", complaint: "Complaint" };
const TYPE_COLORS = { bug: "bg-rose-500/10 text-rose-400", feature: "bg-blue-500/10 text-blue-400", general: "bg-slate-700 text-slate-300", complaint: "bg-amber-500/10 text-amber-400" };
const STATUS_LABELS = { new: "New", reviewed: "Reviewed", resolved: "Resolved" };
const STATUS_COLORS = { new: "bg-amber-500/10 text-amber-400", reviewed: "bg-blue-500/10 text-blue-400", resolved: "bg-emerald-500/10 text-emerald-400" };
const PRIORITY_CONFIG = {
  urgent: { label: "Urgent", color: "bg-rose-500/15 text-rose-400 border-rose-500/30" },
  normal: { label: "Normal", color: "bg-slate-700 text-slate-300 border-slate-600" },
  low:    { label: "Low",    color: "bg-slate-800 text-slate-500 border-slate-700" },
};

export function AdminFeedback() {
  const [data, setData] = useState({ feedback: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [priorities, setPriorities] = useState(() => {
    try { return JSON.parse(localStorage.getItem('feedback_priorities') || '{}'); } catch { return {}; }
  });

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

  const setPriority = (id, priority) => {
    const next = { ...priorities, [id]: priority };
    setPriorities(next);
    localStorage.setItem('feedback_priorities', JSON.stringify(next));
  };

  const handleReply = (fb) => {
    const subject = encodeURIComponent(`Re: Your feedback — ${TYPE_LABELS[fb.type] || fb.type}`);
    const body = encodeURIComponent(`Hi${fb.user_name ? ` ${fb.user_name}` : ''},\n\nThank you for your feedback.\n\n---\nYour message: "${fb.message}"\n---\n\nBest regards,\nTradeJournal Team`);
    window.open(`mailto:${fb.user_email}?subject=${subject}&body=${body}`, '_blank');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-slate-400 text-sm mt-1">{data.total} total submissions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50">
          <option value="">All status</option>
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="resolved">Resolved</option>
        </select>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-accent/50">
          <option value="">All types</option>
          <option value="bug">Bug report</option>
          <option value="feature">Feature request</option>
          <option value="general">General</option>
          <option value="complaint">Complaint</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Loading...</div>
        ) : data.feedback.length === 0 ? (
          <div className="text-center py-12 text-slate-500">No feedback found</div>
        ) : data.feedback.map(fb => {
          const priority = priorities[fb.id] || 'normal';
          const pConfig = PRIORITY_CONFIG[priority];
          return (
            <div key={fb.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 hover:border-slate-700 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${TYPE_COLORS[fb.type] || TYPE_COLORS.general}`}>
                      {TYPE_LABELS[fb.type] || fb.type}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${STATUS_COLORS[fb.status]}`}>
                      {STATUS_LABELS[fb.status]}
                    </span>
                    {/* Priority tag */}
                    <div className="relative group/priority">
                      <span className={`text-xs px-2 py-0.5 rounded-lg font-medium border cursor-pointer flex items-center gap-1 ${pConfig.color}`}>
                        <Flag className="w-2.5 h-2.5" /> {pConfig.label}
                      </span>
                      <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl p-1 z-10 opacity-0 invisible group-hover/priority:opacity-100 group-hover/priority:visible transition-all shadow-xl min-w-[100px]">
                        {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                          <button
                            key={key}
                            onClick={() => setPriority(fb.id, key)}
                            className={`w-full text-left text-xs px-3 py-1.5 rounded-lg transition-colors hover:bg-slate-700 flex items-center gap-2 ${priority === key ? 'text-white' : 'text-slate-400'}`}
                          >
                            <Flag className="w-2.5 h-2.5" /> {cfg.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(fb.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1.5">{fb.user_name || 'Anonymous'} · {fb.user_email || '—'}</p>
                  <p className={`text-sm text-slate-300 ${expanded !== fb.id ? 'line-clamp-2' : ''}`}>{fb.message}</p>
                  {fb.message.length > 120 && (
                    <button onClick={() => setExpanded(expanded === fb.id ? null : fb.id)}
                      className="text-xs text-accent mt-1 hover:underline">
                      {expanded === fb.id ? 'Collapse' : 'Read more'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {fb.user_email && (
                    <button
                      onClick={() => handleReply(fb)}
                      title="Reply via email"
                      className="p-1.5 rounded-lg hover:bg-blue-500/10 text-slate-400 hover:text-blue-400 transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                    </button>
                  )}
                  {fb.status !== 'resolved' && (
                    <button onClick={() => handleStatus(fb.id, fb.status === 'new' ? 'reviewed' : 'resolved')}
                      title="Next status" className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 transition-colors">
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
          );
        })}
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <span className="text-xs text-slate-500">{page} / {data.pages} pages</span>
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
