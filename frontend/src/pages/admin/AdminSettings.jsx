import { useEffect, useState } from "react";
import { AlertTriangle, Save } from "lucide-react";
import { getConfig, updateConfig } from "@/services/adminService";

export function AdminSettings() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMsg, setMaintenanceMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getConfig().then(({ config }) => {
      setMaintenanceMode(config.maintenance_mode === 'true');
      setMaintenanceMsg(config.maintenance_message || '');
    }).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateConfig('maintenance_mode', String(maintenanceMode));
      await updateConfig('maintenance_message', maintenanceMsg);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Тохиргоо</h1>
        <p className="text-slate-400 text-sm mt-1">Системийн ерөнхий тохиргоо</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-white font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Засвар горим
              </h2>
              <p className="text-slate-400 text-sm mt-1">
                Идэвхжүүлбэл бүх хэрэглэгчид мэдэгдэл харагдана. Систем ажиллаж хэвийнээ үргэлжилнэ.
              </p>
            </div>
            <button
              onClick={() => setMaintenanceMode(v => !v)}
              className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${maintenanceMode ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${maintenanceMode ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>

          {maintenanceMode && (
            <div className="mt-4">
              <label className="block text-xs text-slate-400 mb-2 uppercase tracking-wider">Мэдэгдлийн текст</label>
              <textarea
                value={maintenanceMsg}
                onChange={e => setMaintenanceMsg(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-accent/50 resize-none"
                placeholder="Хэрэглэгчид харагдах мэдэгдэл..."
              />
            </div>
          )}
        </div>

        {maintenanceMode && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
            <p className="text-amber-400 text-sm font-medium">Урдчилж харах:</p>
            <p className="text-amber-300/80 text-sm mt-1">{maintenanceMsg || 'Системд засвар хийгдэж байна...'}</p>
          </div>
        )}

        <button onClick={handleSave} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-hover text-slate-950 font-bold text-sm rounded-xl transition-all disabled:opacity-50">
          <Save className="w-4 h-4" />
          {saving ? 'Хадгалж байна...' : saved ? 'Хадгалсан ✓' : 'Хадгалах'}
        </button>
      </div>
    </div>
  );
}
