import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AIChatbot } from "../features/ai/AIChatbot";
import { MaintenanceBanner } from "../MaintenanceBanner";

export function DashboardLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-accent/30">
      <Sidebar />
      <main className="pl-64 min-h-screen flex flex-col">
        <MaintenanceBanner />
        <div key={location.pathname} className="flex-1 flex flex-col animate-page-enter">
          <Outlet />
        </div>
      </main>
      <AIChatbot />
    </div>
  );
}