import { useState, useEffect } from "react";
import { Target, Edit2, Image as ImageIcon, Save, X } from "lucide-react";

export function MyGoalPanel() {
  const [isEditing, setIsEditing] = useState(false);
  const [goalData, setGoalData] = useState({
    text: "Санхүүгийн эрх чөлөөнд хүрч, гэр бүлдээ илүү их цаг зарцуулах.",
    imageUrl: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"
  });

  const [editForm, setEditForm] = useState({ ...goalData });

  useEffect(() => {
    const saved = localStorage.getItem('my_trading_goal');
    if (saved) {
      try {
        setGoalData(JSON.parse(saved));
        setEditForm(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  const handleSave = () => {
    setGoalData(editForm);
    localStorage.setItem('my_trading_goal', JSON.stringify(editForm));
    setIsEditing(false);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditForm({ ...editForm, imageUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  if (isEditing) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-accent" />
            Зорилгоо засах
          </h3>
          <button onClick={() => setIsEditing(false)} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Зорилгын зураг</label>
            <div className="relative h-32 rounded-xl overflow-hidden border-2 border-dashed border-slate-700 hover:border-accent/50 transition-colors flex items-center justify-center bg-slate-950">
              {editForm.imageUrl ? (
                <>
                  <img src={editForm.imageUrl} alt="Goal" className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <label className="cursor-pointer bg-slate-900/80 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 backdrop-blur-sm transition-colors">
                      <ImageIcon className="w-4 h-4" /> Зураг солих
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </>
              ) : (
                <label className="cursor-pointer text-slate-400 hover:text-accent flex flex-col items-center gap-2 transition-colors">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-sm font-medium">Зураг оруулах</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Зорилгын текст</label>
            <textarea 
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-none transition-all"
              placeholder="Таны хамгийн том зорилго юу вэ?"
              value={editForm.text}
              onChange={(e) => setEditForm({ ...editForm, text: e.target.value })}
            />
          </div>
          
          <button 
            onClick={handleSave}
            className="w-full bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-[0_0_15px_rgba(200,240,122,0.2)] flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Хадгалах
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden relative group min-h-[200px]">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={goalData.imageUrl} alt="My Goal" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/40" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/50 border border-slate-800/50 backdrop-blur-md">
            <Target className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Миний зорилго</span>
          </div>
          <button 
            onClick={() => setIsEditing(true)}
            className="w-8 h-8 rounded-full bg-slate-950/50 border border-slate-800/50 backdrop-blur-md flex items-center justify-center text-slate-300 hover:text-white hover:bg-accent/20 hover:border-accent/50 transition-all opacity-0 group-hover:opacity-100 translate-y-[-10px] group-hover:translate-y-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
        
        <div className="mt-8">
          <p className="text-lg sm:text-xl font-medium text-white leading-relaxed text-shadow-sm">
            "{goalData.text}"
          </p>
        </div>
      </div>
    </div>
  );
}
