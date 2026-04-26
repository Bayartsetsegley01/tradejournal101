import { useState } from "react";
import { X, Send, CheckCircle2 } from "lucide-react";
import { submitFeedback } from "@/services/adminService";

const TYPES = [
  { value: "bug", label: "🐛 Алдаа мэдэгдэх" },
  { value: "feature", label: "💡 Санал оруулах" },
  { value: "general", label: "💬 Ерөнхий" },
  { value: "complaint", label: "⚠️ Гомдол" },
];

export function FeedbackModal({ onClose }) {
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return setError("Зурвас бичнэ үү");
    setLoading(true);
    setError("");
    try {
      await submitFeedback(type, message);
      setDone(true);
    } catch (err) {
      setError(err.message || "Илгээхэд алдаа гарлаа");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-semibold">Санал, хүсэлт</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <p className="text-white font-medium mb-1">Баярлалаа!</p>
            <p className="text-slate-400 text-sm">Таны саналыг хүлээн авлаа.</p>
            <button onClick={onClose} className="mt-5 w-full py-2.5 rounded-xl text-sm font-bold bg-accent hover:bg-accent-hover text-slate-950 transition-all">
              Хаах
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              {TYPES.map(t => (
                <button key={t.value} type="button" onClick={() => setType(t.value)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium transition-all text-left ${type === t.value ? 'bg-accent/10 text-accent border border-accent/30' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 border border-transparent'}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div>
              <textarea
                value={message} onChange={e => { setMessage(e.target.value); setError(""); }}
                rows={4} placeholder="Саналаа бичнэ үү..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 resize-none"
              />
              {error && <p className="text-rose-400 text-xs mt-1">{error}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-accent hover:bg-accent-hover text-slate-950 disabled:opacity-50 transition-all">
              <Send className="w-4 h-4" />
              {loading ? 'Илгээж байна...' : 'Илгээх'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
