import { useState } from 'react';
import { ClipboardPaste } from 'lucide-react';
import { useStore } from '../lib/store';

/** Second way to load data: paste the JSON text (e.g. copied from GitHub's "Copy raw file"). */
export default function PasteData({ onDone }: { onDone: (msg: string) => void }) {
  const { importAll } = useStore();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');

  async function load(raw: string) {
    try {
      const kind = await importAll(raw.trim());
      onDone(kind === 'backup' ? 'הגיבוי נטען ✔' : 'הנתונים נטענו ✔');
      setOpen(false); setText('');
    } catch {
      onDone('הטקסט שהודבק לא תקין – ודא שהעתקת את כל הקובץ');
    }
  }

  async function fromClipboard() {
    try {
      const t = await navigator.clipboard.readText();
      if (t.trim().startsWith('{')) return load(t);
    } catch { /* clipboard blocked → manual paste */ }
    setOpen(true);
  }

  return (
    <div className="paste-data">
      <button className="btn" onClick={fromClipboard}><ClipboardPaste size={18} /> הדבק נתונים שהעתקתי</button>
      {open && (
        <div className="stack" style={{ marginTop: 10 }}>
          <textarea dir="ltr" rows={4} placeholder="לחץ לחיצה ארוכה כאן ← הדבק" value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn btn-gold" disabled={!text.trim()} onClick={() => load(text)}>טען</button>
        </div>
      )}
    </div>
  );
}
