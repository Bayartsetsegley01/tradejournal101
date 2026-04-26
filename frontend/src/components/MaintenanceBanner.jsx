import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

const API = (import.meta.env.VITE_API_URL || '') + '/api';

export function MaintenanceBanner() {
  const [info, setInfo] = useState(null);

  useEffect(() => {
    fetch(`${API}/status`)
      .then(r => r.json())
      .then(data => { if (data.maintenance) setInfo(data.message); })
      .catch(() => {});
  }, []);

  if (!info) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center gap-3">
      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
      <p className="text-amber-300 text-sm">{info}</p>
    </div>
  );
}
