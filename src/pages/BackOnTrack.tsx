import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, Phone, Sprout } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import { QUOTES } from '../lib/quotes';
import { PSALMS } from '../lib/psalms';
import { iso } from '../lib/dates';
import { useStore } from '../lib/store';

const STEPS = ['🌱 מינימום', '🙏 אמונה', '🏆 הצלחה', '📞 שיחה', '✨ החזון', '🌿 רוגע', '⏱️ צעד קטן'];

export default function BackOnTrack() {
  const { data, setData, logFor, updateLog } = useStore();
  const [step, setStep] = useState(-1);
  const today = iso(new Date());
  const faith = useMemo(() => QUOTES.filter((q) => q.type === 'faith'), []);
  const [qi, setQi] = useState(() => Math.floor(Math.random() * faith.length));
  const [win, setWin] = useState('');
  const [calm, setCalm] = useState<'psalm' | 'walk' | null>(null);
  const [pi, setPi] = useState(0);
  const [timer, setTimer] = useState<number | null>(null); // seconds left
  const [editPhone, setEditPhone] = useState<string | null>(null);
  const [phone, setPhone] = useState('');

  useEffect(() => {
    if (timer === null || timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const minOn = logFor(today).mode === 'min';
  const pastWins = useMemo(() => [
    ...(data?.wins ?? []).map((w) => w.text),
    ...Object.values(data?.summaries ?? {}).flatMap((s) => s.wins),
  ].filter(Boolean), [data]);
  const shownWin = pastWins.length ? pastWins[Math.floor(Math.random() * pastWins.length)] : null;

  const finish = () => {
    setData((d) => ({ ...d, backOnTrackLog: [...(d.backOnTrackLog ?? []), today] }));
    setStep(STEPS.length);
  };
  const nextStep = () => (step + 1 >= STEPS.length ? finish() : setStep(step + 1));
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  return (
    <main className="page">
      <PageTitle Icon={Compass}>חזרה למסלול</PageTitle>

      {step === -1 && (
        <section className="glass bot-intro">
          <Compass size={48} className="bot-compass" />
          <h2>עוצרים רגע, נושמים – וחוזרים למסלול.</h2>
          <p className="muted">7 צעדים קצרים. אפשר לדלג על כל צעד. אין כאן "נכשלתי" – רק "חוזר".</p>
          <button className="btn btn-gold" onClick={() => setStep(0)}>בוא נתחיל</button>
        </section>
      )}

      {step >= 0 && step < STEPS.length && (
        <>
          <div className="bot-dots">{STEPS.map((s, i) => <span key={s} className={i < step ? 'done' : i === step ? 'cur' : ''} />)}</div>
          <p className="muted small center" style={{ marginTop: 6 }}>צעד {step + 1} מתוך {STEPS.length} · {STEPS[step]}</p>

          <section className="glass bot-step" key={step}>
            {step === 0 && (
              <>
                <h2><Sprout size={22} className="ok-text" /> עוברים למצב מינימום</h2>
                <p>היום לא צריך הכול. 30 דקות לימוד ועוד משימה אחת – והרצף נשמר.</p>
                <button className={`btn ${minOn ? '' : 'btn-gold'}`} disabled={minOn} onClick={() => updateLog(today, (l) => ({ ...l, mode: 'min' }))}>
                  {minOn ? '✓ מצב מינימום פעיל היום' : '🌱 הפעל מינימום להיום'}
                </button>
              </>
            )}
            {step === 1 && (
              <>
                <h2>🙏 רגע של אמונה</h2>
                <p className="quote-text">״{faith[qi].text}״</p>
                <p className="muted small">{faith[qi].source}</p>
                <p>{faith[qi].explain}</p>
                <button className="link-btn" onClick={() => setQi((qi + 1) % faith.length)}>עוד אחד</button>
              </>
            )}
            {step === 2 && (
              <>
                <h2>🏆 הצלחה אחת שלי</h2>
                {shownWin ? <p className="bot-win">״{shownWin}״ – עשית את זה. אתה יכול שוב.</p> : <p>חשוב על דבר אחד שהצלחת בו לאחרונה – גם קטן.</p>}
                <input className="bot-input" placeholder="הצלחה אחת שלי (לא חובה)" value={win} onChange={(e) => setWin(e.target.value)} />
                {win.trim() && (
                  <button className="btn" onClick={() => { setData((d) => ({ ...d, wins: [...(d.wins ?? []), { date: today, text: win.trim() }] })); setWin(''); }}>שמור</button>
                )}
              </>
            )}
            {step === 3 && (
              <>
                <h2><Phone size={20} /> להתקשר למישהו קרוב</h2>
                <p className="muted">שיחה קצרה עם אדם שאוהב אותך מחזירה כוחות.</p>
                <div className="contacts">
                  {(data?.contacts ?? []).map((c) => (
                    c.phone ? (
                      <a key={c.name} className="btn" href={`tel:${c.phone.replace(/[^\d+]/g, '')}`}><Phone size={16} /> {c.name}</a>
                    ) : editPhone === c.name ? (
                      <form key={c.name} className="phone-form" onSubmit={(e) => {
                        e.preventDefault();
                        if (!phone.trim()) return;
                        setData((d) => ({ ...d, contacts: (d.contacts ?? []).map((x) => x.name === c.name ? { ...x, phone: phone.trim() } : x) }));
                        setEditPhone(null); setPhone('');
                      }}>
                        <input dir="ltr" type="tel" autoFocus placeholder={`הטלפון של ${c.name}`} value={phone} onChange={(e) => setPhone(e.target.value)} />
                        <button className="pill gold" type="submit">שמור</button>
                      </form>
                    ) : (
                      <button key={c.name} className="btn dashed" onClick={() => { setEditPhone(c.name); setPhone(''); }}>+ {c.name}</button>
                    )
                  ))}
                  {!data?.contacts?.length && <p className="muted small">אפשר להוסיף אנשי קשר בהגדרות.</p>}
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <h2>✨ למה אני עושה את זה</h2>
                {data?.vision && <p className="vision-text">{data.vision}</p>}
                <ul className="why-list">
                  {(data?.goals ?? []).filter((g) => g.why).map((g) => <li key={g.id}><strong>{g.title}:</strong> {g.why}</li>)}
                </ul>
              </>
            )}
            {step === 5 && (
              <>
                <h2>🌿 להירגע</h2>
                <div className="rate-row">
                  <button className={`pill ${calm === 'psalm' ? 'gold' : ''}`} onClick={() => setCalm('psalm')}>📖 פרק תהילים</button>
                  <button className={`pill ${calm === 'walk' ? 'gold' : ''}`} onClick={() => { setCalm('walk'); setTimer(600); }}>🚶 הליכה 10 דק׳</button>
                </div>
                {calm === 'psalm' && (
                  <div className="psalm">
                    <h3>{PSALMS[pi].title}</h3>
                    <p>{PSALMS[pi].text}</p>
                    <button className="link-btn" onClick={() => setPi((pi + 1) % PSALMS.length)}>פרק אחר</button>
                  </div>
                )}
                {calm === 'walk' && timer !== null && (
                  <div className="walk">
                    <strong className="walk-time"><bdi dir="ltr">{mmss(timer)}</bdi></strong>
                    <p className="muted">{timer > 0 ? 'צא להליכה קצרה. בלי טלפון ביד – רק אוויר ונשימה.' : 'כל הכבוד! 🌿'}</p>
                  </div>
                )}
              </>
            )}
            {step === 6 && (
              <>
                <h2>⏱️ צעד אחד קטן – עכשיו</h2>
                <p>בחר דבר אחד של 10 דקות ותעשה אותו עכשיו. למשל: 10 דקות של סיכום, או לסדר את השולחן.</p>
                {timer !== null && calm !== 'walk' ? (
                  <div className="walk"><strong className="walk-time"><bdi dir="ltr">{mmss(timer)}</bdi></strong></div>
                ) : (
                  <button className="btn btn-gold" onClick={() => { setCalm(null); setTimer(600); }}>▶ הפעל טיימר 10 דקות</button>
                )}
              </>
            )}
          </section>

          <div className="bot-nav">
            <button className="btn" onClick={nextStep}>דלג</button>
            <button className="btn btn-gold" onClick={() => { if (step === 5) setTimer(null); nextStep(); }}>{step === STEPS.length - 1 ? 'סיימתי' : 'הבא ←'}</button>
          </div>
        </>
      )}

      {step === STEPS.length && (
        <section className="glass bot-intro">
          <span className="bot-done">💪</span>
          <h2>חזרת למסלול.</h2>
          <p className="muted">״כִּי נָפַלְתִּי – קָמְתִּי״. עכשיו – צעד אחד, ואחריו עוד אחד.</p>
          <Link to="/" className="btn btn-gold">לדף היום</Link>
        </section>
      )}
    </main>
  );
}
