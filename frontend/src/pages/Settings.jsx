import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { User, Palette, Globe, Bell, Shield, CreditCard, AlertTriangle } from "lucide-react";

export function SettingsPage() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("profile");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  useEffect(() => {
    if (location.state?.activeTab) {
      setActiveTab(location.state.activeTab);
    }
  }, [location.state]);

  // Form states
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('app_profile');
    return saved ? JSON.parse(saved) : { name: "Bayartsetseg", email: "bayartsetsegley@gmail.com", avatar: null, age: "", gender: "other", phone: "" };
  });
  const [appearance, setAppearance] = useState(() => {
    const saved = localStorage.getItem('app_appearance');
    return saved ? JSON.parse(saved) : { theme: "dark" };
  });
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('app_preferences');
    return saved ? JSON.parse(saved) : { language: "mn", currency: "USD", timezone: "Asia/Ulaanbaatar" };
  });
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('app_notifications');
    return saved ? JSON.parse(saved) : { email: true, push: false, tradeAlerts: true };
  });

  // Auto-save effects
  useEffect(() => {
    localStorage.setItem('app_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('app_appearance', JSON.stringify(appearance));
    window.dispatchEvent(new Event('theme-changed'));
  }, [appearance]);

  useEffect(() => {
    localStorage.setItem('app_preferences', JSON.stringify(preferences));
    // Dispatch a custom event for language change if needed globally
    window.dispatchEvent(new Event('language-changed'));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem('app_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, avatar: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfile({ ...profile, avatar: null });
  };

  const handleDeleteData = () => {
    // Implement actual deletion logic here
    console.log("Deleting all data...");
    setShowDeleteModal(false);
    // Optional: show a success toast
  };

  const t = {
    mn: {
      settings: "Тохиргоо",
      settingsDesc: "Бүртгэл болон системийн тохиргоо",
      profile: "Профайл",
      appearance: "Харагдах байдал",
      preferences: "Тохиргоо",
      notifications: "Мэдэгдэл",
      privacy: "Нууцлал",
      plan: "План & Төлбөр",
      profileInfo: "Профайл мэдээлэл",
      changePhoto: "Зураг солих",
      remove: "Устгах",
      name: "Нэр",
      email: "И-мэйл хаяг",
      phone: "Утасны дугаар",
      age: "Нас",
      gender: "Хүйс",
      male: "Эрэгтэй",
      female: "Эмэгтэй",
      other: "Бусад",
      theme: "Загвар (Theme)",
      language: "Хэл",
      currency: "Үндсэн мөнгөн тэмдэгт",
      timezone: "Цагийн бүс",
      emailNotif: "И-мэйл мэдэгдэл",
      emailNotifDesc: "Долоо хоногийн тайлан болон зөвлөмжүүд",
      tradeAlerts: "Арилжааны анхааруулга",
      tradeAlertsDesc: "Алдаа гаргах эрсдэлтэй үед AI анхааруулах",
      dataPrivacy: "Өгөгдөл ба Нууцлал",
      dataPrivacyDesc: "Таны өгөгдөл найдвартай хадгалагдаж байгаа бөгөөд AI анализ зөвхөн таны зөвшөөрөлтэйгөөр хийгдэнэ. Бид таны мэдээллийг гуравдагч этгээдэд дамжуулахгүй.",
      dangerZone: "Аюултай бүс",
      dangerZoneDesc: "Энэ үйлдэл нь буцаах боломжгүй бөгөөд таны бүх арилжааны түүх, тохиргоо устгагдах болно.",
      deleteAll: "Бүх өгөгдлөө устгах",
      planActive: "Идэвхтэй байна",
      nextPayment: "Дараагийн төлбөр: 2026 оны 5 сарын 5",
      updatePayment: "Төлбөрийн мэдээлэл шинэчлэх",
      deleteConfirmTitle: "Бүх өгөгдлийг устгах уу?",
      deleteConfirmDesc: "Та өөрийн бүх арилжааны түүх, тохиргоо, профайл мэдээллээ устгах гэж байна. Энэ үйлдэл нь буцаах боломжгүй бөгөөд таны бүх мэдээлэл бүрмөсөн устах болно.",
      cancel: "Цуцлах",
      yesDelete: "Тийм, устгах"
    },
    en: {
      settings: "Settings",
      settingsDesc: "Account and system preferences",
      profile: "Profile",
      appearance: "Appearance",
      preferences: "Preferences",
      notifications: "Notifications",
      privacy: "Privacy",
      plan: "Plan & Billing",
      profileInfo: "Profile Information",
      changePhoto: "Change Photo",
      remove: "Remove",
      name: "Name",
      email: "Email Address",
      phone: "Phone Number",
      age: "Age",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      theme: "Theme",
      language: "Language",
      currency: "Base Currency",
      timezone: "Timezone",
      emailNotif: "Email Notifications",
      emailNotifDesc: "Weekly reports and recommendations",
      tradeAlerts: "Trading Alerts",
      tradeAlertsDesc: "AI warnings when at risk of making mistakes",
      dataPrivacy: "Data & Privacy",
      dataPrivacyDesc: "Your data is securely stored and AI analysis is only performed with your permission. We do not share your information with third parties.",
      dangerZone: "Danger Zone",
      dangerZoneDesc: "This action cannot be undone. All your trading history and settings will be deleted.",
      deleteAll: "Delete All Data",
      planActive: "Active",
      nextPayment: "Next payment: May 5, 2026",
      updatePayment: "Update Payment Info",
      deleteConfirmTitle: "Delete all data?",
      deleteConfirmDesc: "You are about to delete all your trading history, settings, and profile information. This action cannot be undone and all your data will be permanently lost.",
      cancel: "Cancel",
      yesDelete: "Yes, delete"
    }
  };

  const lang = preferences.language || 'mn';
  const text = t[lang];

  const tabs = [
    { id: "profile", label: text.profile, icon: User },
    { id: "appearance", label: text.appearance, icon: Palette },
    { id: "preferences", label: text.preferences, icon: Globe },
    { id: "notifications", label: text.notifications, icon: Bell },
    { id: "privacy", label: text.privacy, icon: Shield },
    { id: "plan", label: text.plan, icon: CreditCard },
  ];

  return (
    <div className="p-8 max-w-[1200px] mx-auto w-full flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">{text.settings}</h1>
        <p className="text-sm text-slate-400 mt-1">{text.settingsDesc}</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive ? "bg-accent/10 text-accent translate-x-1" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 hover:translate-x-1"
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "scale-110" : ""}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-accent/5 blur-[100px] rounded-full pointer-events-none" />

          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Профайл мэдээлэл</h2>
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-2xl font-bold text-slate-300 overflow-hidden relative group shadow-lg">
                  {profile.avatar ? (
                    <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    profile.name.charAt(0)
                  )}
                  {profile.avatar && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm">
                      <button onClick={handleRemoveImage} className="text-white text-xs font-medium hover:text-rose-400 transition-colors">Устгах</button>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-colors border border-slate-700 cursor-pointer text-center shadow-sm hover:shadow-md">
                    Зураг солих
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  </label>
                </div>
              </div>
              <div className="grid gap-5 max-w-md mt-2">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Нэр</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">И-мэйл хаяг</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Утасны дугаар</label>
                  <input
                    type="tel"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                  />
                </div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Нас</label>
                    <input
                      type="number"
                      value={profile.age || ''}
                      onChange={(e) => setProfile({ ...profile, age: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-400 mb-1.5">Хүйс</label>
                    <select
                      value={profile.gender || 'other'}
                      onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                    >
                      <option value="male">Эрэгтэй</option>
                      <option value="female">Эмэгтэй</option>
                      <option value="other">Бусад</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Харагдах байдал</h2>
              <div className="grid gap-6 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-3">Загвар (Theme)</label>
                  <div className="flex gap-3 p-1 bg-slate-950/50 rounded-xl border border-slate-800/50">
                    {["dark", "light", "system"].map((t) => (
                      <button
                        key={t}
                        onClick={() => setAppearance({ ...appearance, theme: t })}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium capitalize transition-all duration-300 ${
                          appearance.theme === t
                            ? "bg-slate-800 text-accent shadow-md"
                            : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Тохиргоо</h2>
              <div className="grid gap-5 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Хэл</label>
                  <select
                    value={preferences.language}
                    onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                  >
                    <option value="mn">Монгол</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Үндсэн мөнгөн тэмдэгт</label>
                  <select
                    value={preferences.currency}
                    onChange={(e) => setPreferences({ ...preferences, currency: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="MNT">MNT (₮)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">Цагийн бүс</label>
                  <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all shadow-inner appearance-none"
                  >
                    <option value="Asia/Ulaanbaatar">Asia/Ulaanbaatar (ULAT)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Мэдэгдэл</h2>
              <div className="grid gap-6 max-w-md">
                <label className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">И-мэйл мэдэгдэл</div>
                    <div className="text-xs text-slate-500 mt-1">Долоо хоногийн тайлан болон зөвлөмжүүд</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifications.email ? 'bg-accent' : 'bg-slate-800'}`} onClick={() => setNotifications({...notifications, email: !notifications.email})}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${notifications.email ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer group p-3 -mx-3 rounded-xl hover:bg-slate-800/30 transition-colors">
                  <div>
                    <div className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">Арилжааны анхааруулга</div>
                    <div className="text-xs text-slate-500 mt-1">Алдаа гаргах эрсдэлтэй үед AI анхааруулах</div>
                  </div>
                  <div className={`w-12 h-6 rounded-full transition-colors duration-300 relative ${notifications.tradeAlerts ? 'bg-accent' : 'bg-slate-800'}`} onClick={() => setNotifications({...notifications, tradeAlerts: !notifications.tradeAlerts})}>
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform duration-300 shadow-sm ${notifications.tradeAlerts ? 'left-7' : 'left-1'}`} />
                  </div>
                </label>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">Өгөгдөл ба Нууцлал</h2>
              <div className="bg-slate-800/30 border border-slate-800 rounded-xl p-5">
                <p className="text-sm text-slate-300 leading-relaxed">
                  Таны өгөгдөл найдвартай хадгалагдаж байгаа бөгөөд AI анализ зөвхөн таны зөвшөөрөлтэйгөөр хийгдэнэ. Бид таны мэдээллийг гуравдагч этгээдэд дамжуулахгүй.
                </p>
              </div>
              <div className="pt-6 mt-2 border-t border-slate-800">
                <h3 className="text-sm font-medium text-white mb-2">Аюултай бүс</h3>
                <p className="text-xs text-slate-500 mb-4">Энэ үйлдэл нь буцаах боломжгүй бөгөөд таны бүх арилжааны түүх, тохиргоо устгагдах болно.</p>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-sm font-medium rounded-xl transition-colors border border-rose-500/20"
                >
                  Бүх өгөгдлөө устгах
                </button>
              </div>
            </div>
          )}

          {activeTab === "plan" && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-lg font-semibold text-white">План & Төлбөр</h2>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl p-8 relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 blur-3xl rounded-full" />
                <div className="flex items-center justify-between mb-6 relative z-10">
                  <div>
                    <span className="text-xs font-bold text-slate-900 bg-accent uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">Pro Plan</span>
                    <h3 className="text-2xl font-bold text-white mt-3">Идэвхтэй байна</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">$19<span className="text-base text-slate-400 font-normal">/сар</span></div>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-8 relative z-10">Дараагийн төлбөр: 2026 оны 5 сарын 5</p>
                <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium rounded-xl transition-all border border-slate-600 hover:border-slate-500 shadow-sm relative z-10">
                  Төлбөрийн мэдээлэл шинэчлэх
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-4 mb-4 text-rose-400">
              <div className="w-12 h-12 rounded-full bg-rose-400/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Бүх өгөгдлийг устгах уу?</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Та өөрийн бүх арилжааны түүх, тохиргоо, профайл мэдээллээ устгах гэж байна. Энэ үйлдэл нь <strong className="text-white">буцаах боломжгүй</strong> бөгөөд таны бүх мэдээлэл бүрмөсөн устах болно.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowDeleteModal(false)}
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Цуцлах
              </button>
              <button 
                onClick={handleDeleteData}
                className="px-5 py-2.5 rounded-xl text-sm font-medium bg-rose-500 hover:bg-rose-600 text-white transition-colors shadow-lg shadow-rose-500/20"
              >
                Тийм, устгах
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
