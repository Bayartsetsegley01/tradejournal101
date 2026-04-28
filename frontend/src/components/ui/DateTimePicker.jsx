import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// value: ISO string | null
// onChange: (isoString | null) => void
export function DateTimePicker({ value, onChange, className = '' }) {
  const selected = value ? new Date(value) : null;

  return (
    <DatePicker
      selected={selected}
      onChange={(date) => onChange(date ? date.toISOString() : null)}
      showTimeSelect
      timeFormat="HH:mm"
      timeIntervals={15}
      dateFormat="yyyy.MM.dd HH:mm"
      placeholderText="Огноо сонгох"
      autoFocus
      className={[
        'bg-slate-950 border border-accent/60 rounded-lg px-3 py-1.5 text-white text-sm',
        'outline-none focus:ring-1 focus:ring-accent/30 w-44',
        className,
      ].filter(Boolean).join(' ')}
      popperPlacement="bottom-start"
      popperModifiers={[{ name: 'offset', options: { offset: [0, 4] } }]}
    />
  );
}
