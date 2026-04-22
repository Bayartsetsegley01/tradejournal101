import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BarChart2, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register, googleLogin } = useAuth();
  const [mode, setMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  const set = (field) => (e) => { setForm(prev => ({ ...prev, [field]: e.target.value })); setError(''); };

  // Initialize Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleResponse,
          auto_select: true,
          itp_support: true,
        });
        window.google.accounts.id.renderButton(
          document.getElementById('google-signin-btn'),
          { theme: 'filled_black', size: 'large', width: '100%', text: 'continue_with', shape: 'pill', logo_alignment: 'center' }
        );
      }
    };
    document.head.appendChild(script);
    return () => { try { document.head.removeChild(script); } catch {} };
  }, []);

  const handleGoogleResponse = useCallback(async (response) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    setError('');
    try {
      // Decode JWT to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      await googleLogin({
        credential: response.credential,
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      });
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Google нэвтрэлт амжилтгүй боллоо.');
    } finally {
      setGoogleLoading(false);
    }
  }, [googleLogin, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (mode === 'register') {
      if (!form.name.trim()) return setError('Нэрээ оруулна уу.');
      if (form.password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгт.');
      if (form.password !== form.confirmPassword) return setError('Нууц үг тохирохгүй байна.');
    }
    setIsLoading(true);
    try {
      if (mode === 'login') { await login(form.email, form.password); }
      else { await register(form.name, form.email, form.password); }
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Алдаа гарлаа.');
    } finally { setIsLoading(false); }
  };

  const switchMode = (m) => { setMode(m); setError(''); setForm({ name: '', email: '', password: '', confirmPassword: '' }); };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(200,240,122,0.3)]">
            <BarChart2 className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">TradeJournal</span>
        </Link>

        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          {/* Mode Toggle */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-7">
            <button onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}>
              Нэвтрэх
            </button>
            <button onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${mode === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'}`}>
              Бүртгүүлэх
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Тавтай морил 👋' : 'Шинэ бүртгэл үүсгэх'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login' ? 'Арилжааны тэмдэглэлдээ нэвтрэх' : 'Үнэгүй бүртгүүлж эхлээрэй'}
            </p>
          </div>

          {/* Google Sign-In */}
          {GOOGLE_CLIENT_ID ? (
            <>
              <div id="google-signin-btn" className="w-full mb-4" />
              {googleLoading && (
                <div className="flex items-center justify-center py-2 mb-4">
                  <Loader2 className="w-5 h-5 animate-spin text-accent" />
                  <span className="ml-2 text-sm text-slate-400">Google-ээр нэвтэрч байна...</span>
                </div>
              )}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-500 uppercase">эсвэл</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
            </>
          ) : (
            <button
              onClick={() => setError('Google Client ID тохируулаагүй байна. .env файлд VITE_GOOGLE_CLIENT_ID нэмнэ үү.')}
              className="w-full flex items-center justify-center gap-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-3 px-4 rounded-xl transition-colors mb-4 border border-slate-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Google-ээр нэвтрэх
            </button>
          )}

          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-sm text-rose-400 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span><span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Нэр</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="text" required value={form.name} onChange={set('name')} placeholder="Таны нэр"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm" />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">И-мэйл</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="email" required value={form.email} onChange={set('email')} placeholder="name@example.com" autoComplete="email"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Нууц үг</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type={showPassword ? 'text' : 'password'} required value={form.password} onChange={set('password')} placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 rounded-xl pl-10 pr-11 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Нууц үг давтах</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type={showPassword ? 'text' : 'password'} required value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••"
                    className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm ${form.confirmPassword && form.password !== form.confirmPassword ? 'border-rose-500/50' : 'border-slate-800 focus:border-accent/60'}`} />
                </div>
              </div>
            )}

            <button type="submit" disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] flex items-center justify-center gap-2 mt-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{mode === 'login' ? 'Нэвтрэх' : 'Үнэгүй бүртгүүлэх'}<ArrowRight className="w-4 h-4" /></>}
            </button>
          </form>

          <p className="text-center text-xs text-slate-600 mt-5">
            {mode === 'login' ? (<>Бүртгэл байхгүй юу? <button onClick={() => switchMode('register')} className="text-accent hover:text-accent-hover">Үнэгүй бүртгүүлэх</button></>) :
              (<>Бүртгэл байна уу? <button onClick={() => switchMode('login')} className="text-accent hover:text-accent-hover">Нэвтрэх</button></>)}
          </p>
        </div>
      </div>
    </div>
  );
}
