import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function AddTask({ onAdd, allowRepeat }: { onAdd: (title: string, start?: string, repeat?: boolean) => void; allowRepeat?: boolean }) {
  const [repeat, setRepeat] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  if (!open) {
    return <button className="btn add-btn" onClick={() => setOpen(true)}><Plus size={18} /> {allowRepeat ? 'משימה' : 'משימה חד-פעמית'}</button>;
  }
  return (
    <form className="glass add-form" onSubmit={(e) => {
      e.preventDefault();
      if (!title.trim()) return;
      onAdd(title.trim(), time || undefined, repeat);
      setTitle(''); setTime(''); setRepeat(false); setOpen(false);
    }}>
      <input autoFocus placeholder="מה צריך לעשות?" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="שעה (לא חובה)" />
      {allowRepeat && (
        <label className="check-line"><input type="checkbox" checked={repeat} onChange={(e) => setRepeat(e.target.checked)} /> חוזרת כל שבוע ביום הזה</label>
      )}
      <div className="add-actions">
        <button type="submit" className="btn btn-gold">הוסף</button>
        <button type="button" className="btn" onClick={() => setOpen(false)}>ביטול</button>
      </div>
    </form>
  );
}
