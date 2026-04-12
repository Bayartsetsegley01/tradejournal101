import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "detailed", label: "Detailed Reports" },
  { id: "mistakes", label: "Mistakes & Psych" },
  { id: "calendar", label: "Calendar" },
];

export function AnalyticsTabs({ activeTab, onChange }) {
  return (
    <div className="flex items-center gap-6 border-b border-slate-800 mb-6 relative">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "pb-3 text-sm font-medium transition-colors relative",
            activeTab === tab.id
              ? "text-accent"
              : "text-slate-400 hover:text-slate-200"
          )}
        >
          {tab.label}
          {activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-t-full animate-in slide-in-from-left-2 duration-300" />
          )}
        </button>
      ))}
    </div>
  );
}
