import { useEffect, useState } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, Dumbbell, Flame, Home, Moon, NotebookPen, Shield } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import StressChart from '../components/StressChart';
import { addDays, dayName, fmtDur, fromIso, iso, shortDate, weekStart } from '../lib/dates';
import { bedAxis } from '../lib/habits';
import { streak, weekProgress, weekStats, weekTypeOf } from '../lib/schedule';
import { useStore } from '../lib/store';
import type { WeekSummary } from '../lib/types';

const empty = (): WeekSummary => ({ wins: ['', '', ''], postponed: '', stress: 0, gratitude: '', financeChecked: false, nextFocus: '', savedAt: '' });
const fromAxis = (v: number) => { const m = v % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

export default function Summary() {
  const { data, logs, meta, setData } = useStore();
  const today = new Date();
  const [ws, setWs] = useState(() => weekStart(today));
  const key = iso(ws);
  const saved = data?.summaries?.[key];
  const [f, setF] = useState<WeekSummary>(saved?.savedAt ? { ...saved, wins: [...saved.wins, '', '', ''].slice(0, 3) } : { ...empty(), financeChecked: !!saved?.financeChecked });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    const s = data?.summaries?.[key];
    setF(s?.savedAt ? { ...s, wins: [...s.wins, '', '', ''].slice(0, 3) } : { ...empty(), financeChecked: !!s?.financeChecked });
    setMsg('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (!data) {
    return <main className="page"><PageTitle Icon={NotebookPen}>סיכום שבועי</PageTitle><p className="glass muted">טען קודם את קובץ הנתונים בדף ״היום״.</p></main>;
  }

  const next = addDays(ws, 7);
  const nextKey = iso(next);
  const stats = weekStats(ws, data, logs);
  const end = addDays(ws, 6) < today ? addDays(ws, 6) : today;
  const pct = ws > today ? null : weekProgress(end, data, logs);
  const beds = Array.from({ length: 7 }, (_, i) => data.sleepLog?.[iso(addDays(ws, i))]?.bed).filter(Boolean) as string[];
  const avgBed = beds.length ? fromAxis(Math.round(beds.reduce((a, b) => a + bedAxis(b), 0) / beds.length)) : '—';
  const lessonsDone = data.lessons.filter((l) => l.steps.every((s) => l.done[s])).length;
  const nextType = weekTypeOf(next, data);
  const nextDays = Array.from({ length: 6 }, (_, i) => addDays(next, i));

  const save = () => {
    const s: WeekSummary = { ...f, wins: f.wins.map((w) => w.trim()).filter(Boolean), savedAt: new Date().toISOString() };
    setData((d) => ({ ...d, summaries: { ...d.summaries, [key]: s } }));
    setMsg('הסיכום נשמר ✔ שבוע טוב!');
  };
  const history = Object.entries(data.summaries ?? {}).filter(([k, s]) => k !== key && s.savedAt).sort(([a], [b]) => b.localeCompare(a));

  return (
    <main className="page">
      <PageTitle Icon={NotebookPen}>סיכום שבועי</PageTitle>
      <div className="week-nav glass">
        <button className="icon-btn" onClick={() => setWs(addDays(ws, -7))} aria-label="שבוע קודם"><ChevronRight /></button>
        <div className="week-range"><strong>{shortDate(ws)} – {shortDate(addDays(ws, 6))}</strong></div>
        <button className="icon-btn" disabled={iso(ws) >= iso(weekStart(today))} onClick={() => setWs(addDays(ws, 7))} aria-label="שבוע הבא"><ChevronLeft /></button>
      </div>

      <div className="stack" style={{ marginTop: 12 }}>
        <section className="glass">
          <h2 className="section-h">📊 המספרים של השבוע</h2>
          <div className="sum-grid three">
            <div><BookOpen size={20} /><strong><bdi dir="ltr">{fmtDur(stats.studyMin)}</bdi></strong><span>מתוך {Math.round(stats.studyTarget / 60)} ש׳</span></div>
            <div><span className="sum-pct">✅</span><strong>{pct ?? '—'}%</strong><span>ביצוע</span></div>
            <div><Flame size={20} /><strong>{streak(today, data, logs, meta.firstUse)}</strong><span>רצף</span></div>
            <div><Dumbbell size={20} /><strong>{stats.fitDone}/{stats.fitPlan}</strong><span>כושר</span></div>
            <div><Moon size={20} /><strong><bdi dir="ltr">{avgBed}</bdi></strong><span>שינה ממוצעת</span></div>
            <div><GradIcon /><strong>{lessonsDone}/14</strong><span>שיעורים הושלמו</span></div>
          </div>
        </section>

        <section className="glass form-card">
          <h2 className="section-h">🏆 3 דברים שהצלחתי בהם</h2>
          {f.wins.map((w, i) => (
            <input key={i} placeholder={`הצלחה ${i + 1}`} value={w} onChange={(e) => setF({ ...f, wins: f.wins.map((x, j) => (j === i ? e.target.value : x)) })} />
          ))}
          <h2 className="section-h">⏭️ מה נדחה – ולמה?</h2>
          <textarea rows={2} value={f.postponed} onChange={(e) => setF({ ...f, postponed: e.target.value })} />
          <h2 className="section-h">🧘 רמת לחץ השבוע</h2>
          <div className="stress-pick" role="radiogroup" aria-label="רמת לחץ">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} role="radio" aria-checked={f.stress === n} className={f.stress === n ? 'on' : ''} onClick={() => setF({ ...f, stress: n })}>{n}</button>
            ))}
          </div>
          <div className="stress-legend muted small"><span>1 רגוע</span><span>5 לחוץ מאוד</span></div>
          <h2 className="section-h">🙏 על מה אני מודה השבוע</h2>
          <textarea rows={2} value={f.gratitude} onChange={(e) => setF({ ...f, gratitude: e.target.value })} />
          <button className="check-row" onClick={() => setF({ ...f, financeChecked: !f.financeChecked })}>
            <span className={`mini-check ${f.financeChecked ? 'ok' : ''}`}>{f.financeChecked ? '✓' : null}</span> 💰 בדקתי את האתר הפיננסי
          </button>
        </section>

        <section className="glass form-card">
          <h2 className="section-h">📅 השבוע הבא · {shortDate(next)}</h2>
          <div className="segmented week-type" style={{ margin: 0 }}>
            <button className={nextType === 'home' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, weekTypes: { ...d.weekTypes, [nextKey]: 'home' } }))}><Home size={16} /> בית</button>
            <button className={nextType === 'reserve' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, weekTypes: { ...d.weekTypes, [nextKey]: 'reserve' } }))}><Shield size={16} /> מילואים</button>
          </div>
          <input placeholder="⭐ המשימה הכי חשובה בשבוע הבא" value={f.nextFocus} onChange={(e) => setF({ ...f, nextFocus: e.target.value })} />
          <p className="field-label" style={{ margin: 0 }}>🌴 ימי חופש בשבוע הבא</p>
          <div className="rooms">
            {nextDays.map((d) => {
              const on = data.vacations.includes(iso(d));
              return (
                <button key={iso(d)} className={`lesson-chip ${on ? 'ok' : ''}`} onClick={() => setData((x) => ({ ...x, vacations: on ? x.vacations.filter((v) => v !== iso(d)) : [...x.vacations, iso(d)] }))}>
                  {on ? '🌴' : <span className="box" />} {dayName(d)}
                </button>
              );
            })}
          </div>
        </section>

        <button className="btn btn-gold" onClick={save}>{saved?.savedAt ? 'עדכן סיכום ✔' : 'שמור סיכום ✔'}</button>
        {msg && <p className="center ok-text">{msg}</p>}

        <section className="glass">
          <h2 className="section-h">📈 רמת לחץ לאורך השבועות</h2>
          <StressChart summaries={data.summaries ?? {}} />
        </section>

        {history.length > 0 && (
          <section className="glass">
            <h2 className="section-h">🗂️ סיכומים קודמים</h2>
            <div className="stack">
              {history.map(([k, s]) => (
                <details key={k} className="hist">
                  <summary>שבוע {shortDate(fromIso(k))} · לחץ {s.stress || '—'}/5</summary>
                  {s.wins.length > 0 && <p>🏆 {s.wins.join(' · ')}</p>}
                  {s.postponed && <p>⏭️ {s.postponed}</p>}
                  {s.gratitude && <p>🙏 {s.gratitude}</p>}
                  {s.nextFocus && <p>⭐ {s.nextFocus}</p>}
                </details>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function GradIcon() {
  return <span className="sum-pct">🎓</span>;
}
