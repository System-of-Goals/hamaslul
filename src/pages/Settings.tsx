import { useEffect, useState } from 'react';
import { Fingerprint, Lock, Palette, Settings as SettingsIcon } from 'lucide-react';
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

        <ComingSoon step={8} items={[
          'לוח שבועות: בית / מילואים · ימי חופש',
          'לו"ז ויעדים',
          'משפט היום · אנשי קשר · קישורים',
          'גיבוי לקובץ וטעינה מקובץ',
        ]} />
      </div>
    </main>
  );
}
