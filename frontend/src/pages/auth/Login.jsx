import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BarChart2, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [animState, setAnimState] = useState('idle'); // 'idle' | 'out' | 'in'
  const [visibleMode, setVisibleMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'google_auth_failed') {
      setError('Google нэвтрэлт амжилтгүй боллоо. Дахин оролдоно уу.');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setError(''); };

  const afterAuth = (data) => {
    if (!data.user?.onboarding_completed) navigate('/onboarding', { replace: true });
    else navigate('/app', { replace: true });
  };

  const switchMode = (m) => {
    if (m === mode || animState !== 'idle') return;
    setError('');
    setAnimState('out');
    setTimeout(() => {
      setMode(m);
      setVisibleMode(m);
      setForm({ name: '', email: '', password: '', confirmPassword: '' });
      setShowPassword(false);
      setAnimState('in');
      setTimeout(() => setAnimState('idle'), 280);
    }, 200);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.email.trim()) return setError('И-мэйл хаягаа оруулна уу.');
    if (!form.password) return setError('Нууц үгээ оруулна уу.');
    if (mode === 'register') {
      if (!form.name.trim()) return setError('Нэрээ оруулна уу.');
      if (form.password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      if (form.password !== form.confirmPassword) return setError('Нууц үг таарахгүй байна.');
    }
    setIsLoading(true);
    try {
      const data = mode === 'login'
        ? await login(form.email, form.password)
        : await register(form.name, form.email, form.password);
      afterAuth(data);
    } catch (err) {
      const msg = err.message || 'Алдаа гарлаа.';
      if (msg.includes('буруу') || msg === 'Invalid credentials') setError('И-мэйл эсвэл нууц үг буруу байна.');
      else if (msg.includes('бүртгэлтэй')) setError('Энэ и-мэйл аль хэдийн бүртгэлтэй байна.');
      else if (msg.includes('Google')) setError('Энэ и-мэйл Google-ээр бүртгүүлсэн. Google-ээр нэвтэрнэ үү.');
      else if (msg.includes('Database')) setError('Мэдээллийн сантай холбогдож чадсангүй.');
      else setError(msg);
    } finally { setIsLoading(false); }
  };

  const animClass = animState === 'out'
    ? 'animate-fade-slide-out pointer-events-none'
    : animState === 'in'
    ? 'animate-fade-slide-in'
    : '';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">

      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
        <div className="animate-float absolute top-[15%] left-[20%] w-[420px] h-[420px] rounded-full bg-accent/5 blur-[130px]" style={{ animationDelay: '0s', animationDuration: '7s' }} />
        <div className="animate-float absolute bottom-[15%] right-[15%] w-[360px] h-[360px] rounded-full bg-emerald-500/5 blur-[110px]" style={{ animationDelay: '2.5s', animationDuration: '9s' }} />
        <div className="animate-float absolute top-[55%] left-[55%] w-[280px] h-[280px] rounded-full bg-blue-500/4 blur-[90px]" style={{ animationDelay: '1.2s', animationDuration: '11s' }} />
      </div>

      <div className="w-full max-w-md relative z-10">

        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_24px_rgba(200,240,122,0.35)] group-hover:shadow-[0_0_36px_rgba(200,240,122,0.55)] group-hover:scale-105 transition-all duration-300">
            <BarChart2 className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">TradeJournal</span>
        </Link>

        <div className="bg-slate-900/60 backdrop-blur-2xl border border-slate-800/60 rounded-3xl p-8 shadow-[0_32px_64px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]">

          {/* Tab switcher with sliding indicator */}
          <div className="relative flex p-1 bg-slate-950/60 rounded-xl border border-slate-800/40 mb-7">
            <div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-lg shadow-lg transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
              style={{ left: mode === 'register' ? 'calc(50% + 4px)' : '4px' }}
            />
            <button
              onClick={() => switchMode('login')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${mode === 'login' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Нэвтрэх
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors duration-200 ${mode === 'register' ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Бүртгүүлэх
            </button>
          </div>

          {/* Animated form area */}
          <div className={animClass}>

            <div className="mb-6">
              <h1 className="text-xl font-bold text-white">
                {visibleMode === 'login' ? 'Тавтай морил 👋' : 'Шинэ бүртгэл үүсгэх ✨'}
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {visibleMode === 'login' ? 'Арилжааны тэмдэглэлдээ нэвтрэх' : 'Үнэгүй бүртгүүлж эхлээрэй'}
              </p>
            </div>

            {error && (
              <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-sm text-rose-400 flex items-start gap-2">
                <span className="shrink-0 mt-0.5">⚠️</span><span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">

              {visibleMode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Нэр</label>
                  <div className="relative group">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors duration-200" />
                    <input
                      type="text" value={form.name} onChange={set('name')} placeholder="Таны нэр" autoFocus
                      className="w-full bg-slate-950/70 border border-slate-800 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all duration-200 text-sm"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">И-мэйл</label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors duration-200" />
                  <input
                    type="email" value={form.email} onChange={set('email')} placeholder="name@example.com" autoComplete="email"
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all duration-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Нууц үг</label>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors duration-200" />
                  <input
                    type={showPassword ? 'text' : 'password'} value={form.password} onChange={set('password')}
                    placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    className="w-full bg-slate-950/70 border border-slate-800 focus:border-accent/50 focus:ring-2 focus:ring-accent/10 rounded-xl pl-10 pr-11 py-3 text-white placeholder-slate-600 outline-none transition-all duration-200 text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {visibleMode === 'register' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Нууц үг давтах</label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-accent transition-colors duration-200" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={set('confirmPassword')}
                      placeholder="••••••••"
                      className={`w-full bg-slate-950/70 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all duration-200 text-sm ${
                        form.confirmPassword && form.password !== form.confirmPassword
                          ? 'border-rose-500/50 focus:border-rose-500/60 focus:ring-2 focus:ring-rose-500/10'
                          : 'border-slate-800 focus:border-accent/50 focus:ring-2 focus:ring-accent/10'
                      }`}
                    />
                  </div>
                  {form.confirmPassword && form.password !== form.confirmPassword && (
                    <p className="text-xs text-rose-400 mt-1.5 ml-1">Нууц үг таарахгүй байна</p>
                  )}
                </div>
              )}

              <button
                type="submit" disabled={isLoading}
                className="w-full mt-2 bg-accent hover:bg-accent-hover disabled:opacity-50 text-slate-950 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-[0_0_20px_rgba(200,240,122,0.2)] hover:shadow-[0_0_32px_rgba(200,240,122,0.4)] hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><span>{visibleMode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-slate-800/80" />
              <span className="text-xs text-slate-600 uppercase tracking-wider">эсвэл</span>
              <div className="flex-1 h-px bg-slate-800/80" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = `${BACKEND_URL}/api/auth/google/redirect`; }}
              className="w-full bg-white hover:bg-gray-50 text-slate-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 border border-gray-200/80 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google-ээр {visibleMode === 'login' ? 'нэвтрэх' : 'бүртгүүлэх'}
            </button>

            <p className="text-center text-sm text-slate-500 mt-6">
              {visibleMode === 'login' ? (
                <>Бүртгэл байхгүй юу?{' '}
                  <button onClick={() => switchMode('register')} className="text-accent hover:text-accent-hover font-medium transition-colors">
                    Үнэгүй бүртгүүлэх
                  </button>
                </>
              ) : (
                <>Бүртгэл байна уу?{' '}
                  <button onClick={() => switchMode('login')} className="text-accent hover:text-accent-hover font-medium transition-colors">
                    Нэвтрэх
                  </button>
                </>
              )}
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}
