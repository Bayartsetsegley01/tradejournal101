import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { AIChatbot } from "../features/ai/AIChatbot";
import { MaintenanceBanner } from "../MaintenanceBanner";

export function DashboardLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-300 font-sans selection:bg-accent/30">
      <Sidebar />
      <main className="pl-64 min-h-screen flex flex-col">
        <MaintenanceBanner />
        <Outlet />
      </main>
      <AIChatbot />
    </div>
  );
}