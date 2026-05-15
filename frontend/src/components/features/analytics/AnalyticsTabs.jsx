import { cn } from "@/lib/utils";
import { useLang } from "@/contexts/LanguageContext";
import { LayoutDashboard, TrendingUp, Brain, CalendarDays } from "lucide-react";

export function AnalyticsTabs({ activeTab, onChange }) {
  const { t } = useLang();

  const tabs = [
    { id: "overview",  label: t('tabOverview'),  icon: LayoutDashboard },
    { id: "detailed",  label: t('tabDetailed'),  icon: TrendingUp },
    { id: "mistakes",  label: t('tabMistakes'),  icon: Brain },
    { id: "calendar",  label: t('tabCalendar'),  icon: CalendarDays },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-900/80 border border-slate-800/60 rounded-xl p-1 w-fit">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              isActive
                ? "bg-accent text-slate-950 shadow-sm"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
