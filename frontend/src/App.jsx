import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AnalyticsPage } from "./pages/Analytics";
import { LandingPage } from "./pages/Landing";
import { JournalPage } from "./pages/Journal";
import { SettingsPage } from "./pages/Settings";
import { AIAdvisorPage } from "./pages/AIAdvisor";
import { LoginPage } from "./pages/auth/Login";
import { RegisterPage } from "./pages/auth/Register";
import { MistakesPage } from "./pages/Mistakes";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default function App() {
  useEffect(() => {
    const applyTheme = () => {
      const savedAppearance = localStorage.getItem('app_appearance');
      let theme = 'dark';
      if (savedAppearance) {
        try {
          theme = JSON.parse(savedAppearance).theme;
        } catch (e) {
          console.warn("Failed to parse appearance settings", e);
        }
      }
      
      if (theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    };

    applyTheme();
    window.addEventListener('storage', applyTheme);
    window.addEventListener('theme-changed', applyTheme);
    
    return () => {
      window.removeEventListener('storage', applyTheme);
      window.removeEventListener('theme-changed', applyTheme);
    };
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/app" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="analytics" replace />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="journal" element={<JournalPage />} />
            <Route path="mistakes" element={<MistakesPage />} />
            <Route path="ai-advisor" element={<AIAdvisorPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
