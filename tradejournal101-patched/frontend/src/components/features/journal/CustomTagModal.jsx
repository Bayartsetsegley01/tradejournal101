import { useState } from "react";
import { X, Plus, Check } from "lucide-react";

const COMMON_EMOJIS = ["🤑", "😎", "🤔", "😰", "😡", "😭", "😴", "🤡", "🚀", "💎", "📉", "📈", "🔥", "🧊", "🎯", "🎲"];
const TAG_COLORS = [
  { id: 'emerald', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
  { id: 'blue', bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400' },
  { id: 'indigo', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
  { id: 'purple', bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-400' },
  { id: 'pink', bg: 'bg-pink-500/10', border: 'border-pink-500/20', text: 'text-pink-400' },
  { id: 'rose', bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
  { id: 'orange', bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400' },
  { id: 'amber', bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' },
];

export function CustomTagModal({ type, onClose, onSave }) {
  const [label, setLabel] = useState("");
  const [emoji, setEmoji] = useState("");
  const [selectedColor, setSelectedColor] = useState(type === 'mistake' ? 'rose' : 'emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmotion = type === 'emotion';

  const handleSave = async () => {
    if (!label.trim()) return;
    if (isEmotion && !emoji.trim()) return;
    
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 400));
    
    onSave({
      id: `custom-${type}-${Date.now()}`,
      label: label.trim(),
      color: selectedColor,
      isCustom: true,
      ...(isEmotion && { emoji: emoji.trim() })
    });
    
    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <h2 className="text-lg font-bold text-white">
            {isEmotion ? 'Шинэ сэтгэл зүй нэмэх' : 'Шинэ таг нэмэх'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {isEmotion && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Emoji сонгох</label>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {COMMON_EMOJIS.map(e => (
                  <button
                    key={e}
                    onClick={() => setEmoji(e)}
                    className={`text-xl p-1.5 rounded-lg transition-all ${emoji === e ? 'bg-slate-700 scale-110' : 'hover:bg-slate-800 hover:scale-110'}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <div className="text-sm text-slate-500">Эсвэл өөрөө оруулах:</div>
                <input 
                  type="text" 
                  maxLength={2}
                  placeholder="😀"
                  className="w-16 bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-white focus:outline-none focus:border-accent/50 text-xl text-center"
                  value={emoji}
                  onChange={e => setEmoji(e.target.value)}
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Нэр (Label)</label>
            <input 
              type="text" 
              placeholder={isEmotion ? "Жишээ нь: Шунасан" : "Жишээ нь: Мэдээний үеэр орсон"}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-accent/50"
              value={label}
              onChange={e => setLabel(e.target.value)}
              autoFocus
            />
          </div>

          {!isEmotion && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">Өнгө сонгох</label>
              <div className="flex flex-wrap gap-3">
                {TAG_COLORS.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelectedColor(c.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${c.bg} ${c.border} border ${selectedColor === c.id ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-slate-400 scale-110' : 'hover:scale-110'}`}
                  >
                    {selectedColor === c.id && <Check className={`w-4 h-4 ${c.text}`} />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-800 bg-slate-950/50 rounded-b-2xl flex gap-3">
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-50"
          >
            Цуцлах
          </button>
          <button 
            onClick={handleSave}
            disabled={!label.trim() || (isEmotion && !emoji.trim()) || isSubmitting}
            className="flex-1 bg-accent hover:bg-accent-hover text-slate-950 text-sm font-bold py-2.5 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
            ) : (
              'Хадгалах'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
