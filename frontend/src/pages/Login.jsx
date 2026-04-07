import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { BarChart2, Mail, Phone, ArrowRight, Loader2, CheckCircle2 } from "lucide-react";

export function LoginPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('email'); // 'email' or 'phone'
  const [step, setStep] = useState('input'); // 'input' or 'verify'
  const [isLoading, setIsLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [code, setCode] = useState('');

  const handleSendCode = (e) => {
    e.preventDefault();
    if (!inputValue) return;
    setIsLoading(true);
    // Simulate sending code
    setTimeout(() => {
      setIsLoading(false);
      setStep('verify');
    }, 1500);
  };

  const handleVerify = (e) => {
    e.preventDefault();
    if (!code || code.length < 4) return;
    setIsLoading(true);
    // Simulate verification
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('auth_token', 'mock-token-123');
      navigate('/app');
    }, 1500);
  };

  const handleGoogleLogin = () => {
    setIsLoading(true);
    // Simulate Google Login
    setTimeout(() => {
      setIsLoading(false);
      localStorage.setItem('auth_token', 'mock-token-google');
      navigate('/app');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <Link to="/" className="flex items-center justify-center gap-3 mb-10 group">
          <div className="w-10 h-10 bg-accent rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(200,240,122,0.3)] group-hover:shadow-[0_0_30px_rgba(200,240,122,0.5)] transition-all">
            <BarChart2 className="w-6 h-6 text-slate-950" />
          </div>
          <span className="text-2xl font-bold text-white tracking-tight">TradeJournal</span>
        </Link>

        {/* Card */}
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">
              {step === 'input' ? 'Тавтай морил' : 'Код баталгаажуулах'}
            </h1>
            <p className="text-slate-400 text-sm">
              {step === 'input' 
                ? 'Арилжааны тэмдэглэлээ хөтөлж эхлээрэй' 
                : `${inputValue} хаяг руу илгээсэн 4 оронтой кодыг оруулна уу`}
            </p>
          </div>

          {step === 'input' ? (
            <div className="space-y-6">
              {/* Method Toggle */}
              <div className="flex p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  onClick={() => { setMethod('email'); setInputValue(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    method === 'email' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Mail className="w-4 h-4" /> И-мэйл
                </button>
                <button
                  onClick={() => { setMethod('phone'); setInputValue(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    method === 'phone' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  <Phone className="w-4 h-4" /> Утас
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSendCode} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {method === 'email' ? 'И-мэйл хаяг' : 'Утасны дугаар'}
                  </label>
                  <input
                    type={method === 'email' ? 'email' : 'tel'}
                    required
                    placeholder={method === 'email' ? 'name@example.com' : '99112233'}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-medium"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !inputValue}
                  className="w-full bg-accent hover:bg-accent-hover text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] hover:shadow-[0_0_25px_rgba(200,240,122,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Код авах'}
                </button>
              </form>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-xs font-medium uppercase">Эсвэл</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* Google Login */}
              <button
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full bg-white hover:bg-gray-100 text-slate-900 font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google-ээр нэвтрэх
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2 text-center">
                  4 оронтой код
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  placeholder="0000"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-center text-2xl text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all font-mono tracking-[1em]"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                />
              </div>
              <button
                type="submit"
                disabled={isLoading || code.length < 4}
                className="w-full bg-accent hover:bg-accent-hover text-slate-950 font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] hover:shadow-[0_0_25px_rgba(200,240,122,0.4)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>Баталгаажуулах <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
              <button
                type="button"
                onClick={() => setStep('input')}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                Буцах
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
