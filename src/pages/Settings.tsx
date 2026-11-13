import { useEffect, useState } from 'react';
import { Bell, Database, Download, FileUp, Fingerprint, Lock, Palette, Settings as SettingsIcon } from 'lucide-react';
import { downloadText, pickFile, useStore } from '../lib/store';
import { iso } from '../lib/dates';
import PasteData from '../components/PasteData';
import { PageTitle, ComingSoon } from '../components/PageShell';
import type { ThemeMode } from '../lib/theme';
import { enrollFingerprint, fingerprintAvailable, hasFingerprint, removeFingerprint } from '../lib/lock';

const modes: { v: ThemeMode; label: string }[] = [
  { v: 'auto', label: 'אוטומטי' },
  { v: 'light', label: 'בהיר' },
  { v: 'dark', label: 'כהה' },
];

export default function Settings({ mode, setMode, onLock, onChangePin }: {
  mode: ThemeMode; setMode: (m: ThemeMode) => void; onLock: () => void; onChangePin: () => void;
}) {
  const { exportAll, importAll, data } = useStore();
  const [msg, setMsg] = useState('');
  const [perm, setPerm] = useState<string>('Notification' in window ? Notification.permission : 'unsupported');
  const [fpAvail, setFpAvail] = useState(false);
  const [fpOn, setFpOn] = useState(false);
  useEffect(() => {
    fingerprintAvailable().then(setFpAvail);
    hasFingerprint().then(setFpOn);
  }, []);

  async function toggleFp() {
    if (fpOn) { await removeFingerprint(); setFpOn(false); return; }
    try { await enrollFingerprint(); setFpOn(true); } catch { /* cancelled */ }
  }

  async function load() {
    try {
      const kind = await importAll(await pickFile());
      setMsg(kind === 'backup' ? 'הגיבוי נטען ✔' : 'הנתונים נטענו ✔');
    } catch { setMsg('הקובץ לא תקין'); }
  }

  async function askNotify() {
    if (!('Notification' in window)) return;
    setPerm(await Notification.requestPermission());
  }

  return (
    <main className="page">
      <PageTitle Icon={SettingsIcon}>הגדרות</PageTitle>
      <div className="stack">
        <section className="glass">
          <h2 className="section-h"><Palette size={18} /> מראה</h2>
          <div className="segmented">
            {modes.map(({ v, label }) => (
              <button key={v} className={mode === v ? 'on' : ''} onClick={() => setMode(v)}>{label}</button>
            ))}
          </div>
          <p className="muted small">אוטומטי: בהיר ביום, כהה מהשקיעה (זמני ירושלים).</p>
        </section>

        <section className="glass">
          <h2 className="section-h"><Lock size={18} /> נעילה</h2>
          <div className="stack">
            <button className="btn" onClick={onChangePin}>שינוי קוד</button>
            {fpAvail && (
              <button className="btn" onClick={toggleFp}>
                <Fingerprint size={18} /> {fpOn ? 'כיבוי טביעת אצבע' : 'הפעלת טביעת אצבע'}
              </button>
            )}
            <button className="btn btn-gold" onClick={onLock}><Lock size={18} /> נעל עכשיו</button>
          </div>
        </section>

        <section className="glass">
          <h2 className="section-h"><Bell size={18} /> התראות</h2>
          {perm === 'granted' && <p className="muted small">✔ התראות פעילות – מגיעות כשהאפליקציה פתוחה.</p>}
          {perm === 'default' && <button className="btn" onClick={askNotify}><Bell size={18} /> הפעל התראות</button>}
          {perm === 'denied' && <p className="muted small">ההתראות חסומות. אפשר להפעיל בהגדרות האתר ב-Chrome.</p>}
          {perm === 'unsupported' && <p className="muted small">הדפדפן לא תומך בהתראות.</p>}
        </section>

        <section className="glass">
          <h2 className="section-h"><Database size={18} /> הנתונים שלי</h2>
          <p className="muted small" style={{ marginTop: 0 }}>הכול נשמר רק בטלפון הזה.{data ? '' : ' עדיין לא נטענו נתונים.'}</p>
          <div className="stack" style={{ marginTop: 12 }}>
            <button className="btn btn-gold" onClick={() => downloadText(`hamaslul-backup-${iso(new Date())}.json`, exportAll())}>
              <Download size={18} /> שמור גיבוי לטלפון
            </button>
            <button className="btn" onClick={load}><FileUp size={18} /> טען נתונים / גיבוי מקובץ</button>
            <PasteData onDone={setMsg} />
            {msg && <p className="small">{msg}</p>}
          </div>
        </section>

        <ComingSoon step={8} items={[
          'לוח שבועות: בית / מילואים · ימי חופש',
          'לו"ז ויעדים',
          'משפט היום · אנשי קשר · קישורים',
        ]} />
      </div>
    </main>
  );
}
