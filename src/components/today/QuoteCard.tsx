import { useState } from 'react';
import { BookOpenText, Rocket } from 'lucide-react';
import { quoteOfDay } from '../../lib/quotes';

export default function QuoteCard({ date }: { date: Date }) {
  const [open, setOpen] = useState(false);
  const q = quoteOfDay(date);
  const Icon = q.type === 'faith' ? BookOpenText : Rocket;
  return (
    <button className="glass quote" onClick={() => setOpen(!open)} aria-expanded={open}>
      <span className="quote-tag"><Icon size={14} /> {q.type === 'faith' ? 'אמונה' : 'מוטיבציה'}</span>
      <span className="quote-text">״{q.text}״</span>
      {q.source && <span className="quote-src">{q.source}</span>}
      {open
        ? <span className="quote-explain">{q.explain}</span>
        : <span className="quote-hint">לחץ להסבר</span>}
    </button>
  );
}
