import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BarChart2, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function LoginPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();

  // 'login' | 'register'
  const [mode, setMode] = useState('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rememberMe: false,
  });

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (mode === 'register') {
      if (!form.name.trim()) return setError('Нэрээ оруулна уу.');
      if (form.password.length < 6) return setError('Нууц үг хамгийн багадаа 6 тэмдэгт байх ёстой.');
      if (form.password !== form.confirmPassword) return setError('Нууц үг тохирохгүй байна.');
    }

    setIsLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password);
      }
      navigate('/app');
    } catch (err) {
      setError(err.message || 'Алдаа гарлаа. Дахин оролдоно уу.');
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setError('');
    setForm({ name: '', email: '', password: '', confirmPassword: '', rememberMe: false });
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-8 group">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(200,240,122,0.3)] group-hover:shadow-[0_0_30px_rgba(200,240,122,0.5)] transition-all">
            <BarChart2 className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">TradeJournal</span>
        </Link>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">

          {/* Mode Toggle */}
          <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800 mb-7">
            <button
              onClick={() => switchMode('login')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Нэвтрэх
            </button>
            <button
              onClick={() => switchMode('register')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                mode === 'register' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              Бүртгүүлэх
            </button>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-white">
              {mode === 'login' ? 'Тавтай морил 👋' : 'Шинэ бүртгэл үүсгэх'}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {mode === 'login'
                ? 'Арилжааны тэмдэглэлдээ нэвтрэх'
                : 'Өнөөдрөөс арилжаагаа бүртгэж эхэл'}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 text-sm text-rose-400 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name — register only */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Нэр
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={set('name')}
                    placeholder="Таны нэр"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                И-мэйл
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={set('email')}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                Нууц үг
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30 rounded-xl pl-10 pr-11 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password — register only */}
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5 uppercase tracking-wider">
                  Нууц үг давтах
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    className={`w-full bg-slate-950 border rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-600 outline-none transition-all text-sm ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? 'border-rose-500/50 focus:border-rose-500/70'
                        : 'border-slate-800 focus:border-accent/60 focus:ring-1 focus:ring-accent/30'
                    }`}
                  />
                </div>
              </div>
            )}

            {/* Remember Me — login only */}
            {mode === 'login' && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={form.rememberMe}
                    onChange={set('rememberMe')}
                    className="w-4 h-4 accent-accent bg-slate-950 border-slate-700 rounded"
                  />
                  <span className="text-sm text-slate-400">Намайг санах</span>
                </label>
                <button
                  type="button"
                  className="text-sm text-accent hover:text-accent-hover transition-colors"
                  onClick={() => {/* Could add forgot password flow */}}
                >
                  Нууц үг мартсан?
                </button>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] hover:shadow-[0_0_25px_rgba(200,240,122,0.4)] flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Нэвтрэх' : 'Бүртгүүлэх'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="text-center text-xs text-slate-600 mt-5">
            {mode === 'login' ? (
              <>Бүртгэл байхгүй юу?{' '}
                <button onClick={() => switchMode('register')} className="text-accent hover:text-accent-hover transition-colors">
                  Бүртгүүлэх
                </button>
              </>
            ) : (
              <>Бүртгэл байна уу?{' '}
                <button onClick={() => switchMode('login')} className="text-accent hover:text-accent-hover transition-colors">
                  Нэвтрэх
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
