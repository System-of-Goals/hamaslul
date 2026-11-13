import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Bot, Check, ChefHat, ChevronLeft, ChevronRight, Clock, Dumbbell, Moon, Plus, Search, Sparkles } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import RecipeSheet from '../components/RecipeSheet';
import RecipeForm from '../components/RecipeForm';
import { addDays, dayName, fromIso, iso, shortDate, weekStart } from '../lib/dates';
import { emptyLog, isDone, tasksFor } from '../lib/schedule';
import { EASY_TO_LEVEL_UP, FIT_STAGES, applyFitStage, bedAxis, easyCount } from '../lib/habits';
import { RECIPE_CATS, allRecipes, findRecipe } from '../lib/recipes';
import { useStore } from '../lib/store';
import type { DayTask, Recipe, Workout } from '../lib/types';

type Tab = 'fit' | 'sleep' | 'cook' | 'clean';
const ROOMS = ['מטבח', 'מקרר', 'סלון', 'חדר שינה', 'מקלחת ושירותים', 'מרפסת'];
const RATING: Record<Workout['rating'], string> = { easy: '😌 קל', ok: '🙂 בסדר', hard: '😮‍💨 קשה' };

export default function Habits() {
  const { data, logs, logFor, updateLog, setData } = useStore();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) || 'fit';
  const setTab = (t: Tab) => setParams({ tab: t }, { replace: true });
  const today = new Date();
  const todayIso = iso(today);

  // fitness
  const [rating, setRating] = useState(false);
  const [km, setKm] = useState('');
  const [mins, setMins] = useState('');
  const [hideLevelUp, setHideLevelUp] = useState(false);
  // sleep
  const month = todayIso.slice(0, 7);
  const target = data?.sleepTargets[month] ?? '00:00';
  const [bed, setBed] = useState(data?.sleepLog?.[todayIso]?.bed ?? target);
  const [wake, setWake] = useState(data?.sleepLog?.[todayIso]?.wake ?? '06:00');
  // cooking
  const [cat, setCat] = useState<string>('הכול');
  const [q, setQ] = useState('');
  const [openRecipe, setOpenRecipe] = useState<Recipe | null>(null);
  const [pickFor, setPickFor] = useState<string | null>(null);
  const [newRecipe, setNewRecipe] = useState(false);

  const ws = weekStart(today);
  const week = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = addDays(ws, i);
    const log = logs[iso(d)] ?? emptyLog();
    return { d, log, tasks: tasksFor(d, data, log, log.mode) };
  }), [ws, data, logs]);

  if (!data) {
    return <main className="page"><PageTitle Icon={Dumbbell}>הרגלים</PageTitle><p className="glass muted">טען קודם את קובץ הנתונים בדף ״היום״.</p></main>;
  }

  const stage = data.fitnessStage ?? 0;
  const st = FIT_STAGES[stage];
  const easy = easyCount(data, stage);
  const fitWeek = week.flatMap((w) => w.tasks.filter((t) => t.category === 'fitness' || t.category === 'run').map((t) => ({ t, done: isDone(t, w.log), d: w.d })));
  const workouts = [...(data.workouts ?? [])].reverse().slice(0, 5);

  function logWorkout(r: Workout['rating']) {
    const todayTasks = tasksFor(today, data, logFor(todayIso));
    const prefer = st.kind === 'run' ? 'run' : 'fitness';
    const task = todayTasks.find((t) => t.category === prefer) ?? todayTasks.find((t) => t.category === 'fitness' || t.category === 'run');
    if (task) updateLog(todayIso, (l) => ({ ...l, done: { ...l.done, [task.id]: true } }));
    setData((d) => ({ ...d, workouts: [...(d.workouts ?? []), { date: todayIso, stage, rating: r, km: Number(km) || undefined, minutes: Number(mins) || undefined }] }));
    setRating(false); setKm(''); setMins('');
  }

  const sleepNights = Array.from({ length: 7 }, (_, i) => iso(addDays(today, -i))).map((k) => ({ k, v: data.sleepLog?.[k] }));
  const cookDays = week.flatMap((w) => w.tasks.filter((t) => t.category === 'cook').map((t) => ({ w, t })));
  const cleanTasks = week.flatMap((w) => w.tasks.filter((t) => (t.category === 'clean' || t.category === 'robot') && t.id !== 'deep-clean').map((t) => ({ w, t })));
  const recipes = allRecipes(data).filter((r) => (cat === 'הכול' || r.cat === cat) && (!q || r.name.includes(q)));

  let nextDeep = new Date(today.getFullYear(), today.getMonth(), 1);
  const firstFri = (m: Date) => { const x = new Date(m); while (x.getDay() !== 5) x.setDate(x.getDate() + 1); return x; };
  nextDeep = firstFri(nextDeep);
  if (iso(nextDeep) < todayIso) nextDeep = firstFri(new Date(today.getFullYear(), today.getMonth() + 1, 1));
  const deepKey = iso(nextDeep).slice(0, 7);
  const roomsDone = data.deepClean?.[deepKey] ?? [];

  const toggleTask = (d: Date, t: DayTask) => updateLog(iso(d), (l) => ({ ...l, done: { ...l.done, [t.id]: !l.done[t.id] } }));

  return (
    <main className="page">
      <PageTitle Icon={Dumbbell}>הרגלים</PageTitle>
      <div className="segmented tabs4">
        <button className={tab === 'fit' ? 'on' : ''} onClick={() => setTab('fit')}>כושר</button>
        <button className={tab === 'sleep' ? 'on' : ''} onClick={() => setTab('sleep')}>שינה</button>
        <button className={tab === 'cook' ? 'on' : ''} onClick={() => setTab('cook')}>בישול</button>
        <button className={tab === 'clean' ? 'on' : ''} onClick={() => setTab('clean')}>ניקיון</button>
      </div>

      {tab === 'fit' && (
        <div className="stack">
          <section className="glass">
            <div className="ch-row">
              <h2 className="section-h" style={{ margin: 0 }}><Dumbbell size={18} /> השלב שלי</h2>
              <div className="stage-nav">
                <button className="icon-btn sm" disabled={stage === 0} onClick={() => setData((d) => applyFitStage(d, stage - 1))} aria-label="שלב קודם"><ChevronRight size={16} /></button>
                <span className="muted small" style={{ margin: 0 }}>{stage + 1}/{FIT_STAGES.length}</span>
                <button className="icon-btn sm" disabled={stage === FIT_STAGES.length - 1} onClick={() => setData((d) => applyFitStage(d, stage + 1))} aria-label="שלב הבא"><ChevronLeft size={16} /></button>
              </div>
            </div>
            <p className="fit-stage">{st.title}</p>
            <div className="fit-path">{FIT_STAGES.map((_, i) => <span key={i} className={i < stage ? 'done' : i === stage ? 'cur' : ''} />)}</div>
            <p className="muted small">השבוע: {fitWeek.filter((x) => x.done).length} מתוך {fitWeek.length} אימונים · {easy}/{EASY_TO_LEVEL_UP} אימונים "קל" בשלב הזה</p>

            {!rating ? (
              <button className="btn btn-gold" style={{ width: '100%', marginTop: 12 }} onClick={() => setRating(true)}><Check size={18} /> סיימתי אימון</button>
            ) : (
              <div className="stack" style={{ marginTop: 12 }}>
                {st.kind === 'run' && (
                  <div className="field-row">
                    <label className="field"><span className="field-label">ק״מ</span><input type="number" inputMode="decimal" value={km} onChange={(e) => setKm(e.target.value)} /></label>
                    <label className="field"><span className="field-label">דקות</span><input type="number" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value)} /></label>
                  </div>
                )}
                <p className="field-label" style={{ margin: 0 }}>איך היה?</p>
                <div className="rate-row">
                  {(Object.keys(RATING) as Workout['rating'][]).map((r) => <button key={r} className="pill" onClick={() => logWorkout(r)}>{RATING[r]}</button>)}
                </div>
              </div>
            )}
          </section>

          {easy >= EASY_TO_LEVEL_UP && stage < FIT_STAGES.length - 1 && !hideLevelUp && (
            <section className="glass level-up">
              <p>💡 {EASY_TO_LEVEL_UP} אימונים הרגישו קל. לעלות ל<strong>{FIT_STAGES[stage + 1].title}</strong>?</p>
              <div className="rate-row">
                <button className="pill gold" onClick={() => setData((d) => applyFitStage(d, stage + 1))}>כן, לעלות שלב</button>
                <button className="pill" onClick={() => setHideLevelUp(true)}>עוד לא</button>
              </div>
            </section>
          )}

          <section className="glass">
            <h2 className="section-h">אימונים אחרונים</h2>
            {workouts.length === 0 ? <p className="muted small" style={{ margin: 0 }}>עוד אין אימונים.</p> : (
              <ul className="plain-list">
                {workouts.map((w, i) => (
                  <li key={i}><span>{shortDate(fromIso(w.date))}</span><span className="muted">{FIT_STAGES[w.stage]?.title}</span><span>{w.km ? `${w.km} ק״מ ` : ''}{RATING[w.rating]}</span></li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      {tab === 'sleep' && (
        <div className="stack">
          <section className="glass">
            <h2 className="section-h"><Moon size={18} /> יעד החודש</h2>
            <div className="sum-grid two">
              <div><strong><bdi dir="ltr">{target}</bdi></strong><span>שינה</span></div>
              <div><strong><bdi dir="ltr">06:00</bdi></strong><span>קימה</span></div>
            </div>
          </section>
          <section className="glass">
            <h2 className="section-h">הלילה שעבר</h2>
            <div className="field-row">
              <label className="field"><span className="field-label">נרדמתי ב-</span><input type="time" value={bed} onChange={(e) => setBed(e.target.value)} /></label>
              <label className="field"><span className="field-label">קמתי ב-</span><input type="time" value={wake} onChange={(e) => setWake(e.target.value)} /></label>
            </div>
            <button className="btn btn-gold" style={{ width: '100%' }} onClick={() => setData((d) => ({ ...d, sleepLog: { ...d.sleepLog, [todayIso]: { bed, wake } } }))}>
              <Check size={18} /> {data.sleepLog?.[todayIso] ? 'עדכן' : 'שמור'}
            </button>
          </section>
          <section className="glass">
            <h2 className="section-h">7 הלילות האחרונים</h2>
            <ul className="plain-list">
              {sleepNights.map(({ k, v }) => {
                const t = data.sleepTargets[k.slice(0, 7)] ?? target;
                const late = v ? bedAxis(v.bed) - bedAxis(t) : 0;
                return (
                  <li key={k}>
                    <span>{dayName(fromIso(k))} {shortDate(fromIso(k))}</span>
                    <span className="muted">{v ? <bdi dir="ltr">{v.bed} → {v.wake}</bdi> : '—'}</span>
                    <span className={v ? (late <= 15 ? 'ok-text' : 'late-text') : 'muted'}>{!v ? '' : late <= 15 ? '✓ בזמן' : `⏰ +${late} דק׳`}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      {tab === 'cook' && (
        <div className="stack">
          <section className="glass">
            <h2 className="section-h"><ChefHat size={18} /> ימי בישול השבוע</h2>
            {cookDays.length === 0 && <p className="muted small" style={{ margin: 0 }}>אין ימי בישול השבוע.</p>}
            <div className="stack">
              {cookDays.map(({ w, t }) => {
                const r = findRecipe(data, w.log.recipe);
                const done = isDone(t, w.log);
                return (
                  <div key={iso(w.d)} className={`cook-day ${done ? 'done' : ''}`}>
                    <button className={`mini-check ${done ? 'ok' : ''}`} onClick={() => toggleTask(w.d, t)} aria-pressed={done}>{done ? <Check size={13} strokeWidth={3} /> : null}</button>
                    <span className="cook-when">{dayName(w.d)} {shortDate(w.d)}</span>
                    {r ? <button className="pill gold" onClick={() => setOpenRecipe(r)}>{r.name}</button>
                      : <button className="pill" onClick={() => setPickFor(iso(w.d))}>מה מבשלים?</button>}
                    {r && <button className="link-btn" style={{ margin: 0 }} onClick={() => setPickFor(iso(w.d))}>החלף</button>}
                  </div>
                );
              })}
            </div>
          </section>

          <section className="glass">
            <div className="ch-row">
              <h2 className="section-h" style={{ margin: 0 }}>{pickFor ? `בחר מתכון ליום ${dayName(fromIso(pickFor))}` : 'מאגר המתכונים'}</h2>
              {pickFor ? <button className="link-btn" style={{ margin: 0 }} onClick={() => setPickFor(null)}>ביטול</button>
                : <button className="icon-btn sm" onClick={() => setNewRecipe(true)} aria-label="מתכון חדש"><Plus size={16} /></button>}
            </div>
            <div className="search"><Search size={16} className="muted" /><input placeholder="חיפוש מתכון" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            <div className="cat-chips">
              {['הכול', ...RECIPE_CATS].map((c) => <button key={c} className={`pill ${cat === c ? 'gold' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
            </div>
            <div className="recipe-list">
              {recipes.map((r) => (
                <button key={r.id} className="recipe-card" onClick={() => setOpenRecipe(r)}>
                  <span className="rc-name">{r.name}</span>
                  <span className="muted small rc-meta"><Clock size={12} /> {r.time} דק׳ · {r.kind === 'meat' ? 'בשרי' : 'פרווה'}</span>
                </button>
              ))}
              {recipes.length === 0 && <p className="muted small">לא נמצאו מתכונים.</p>}
            </div>
          </section>
        </div>
      )}

      {tab === 'clean' && (
        <div className="stack">
          <section className="glass">
            <h2 className="section-h"><Sparkles size={18} /> השבוע</h2>
            <div className="stack">
              {cleanTasks.map(({ w, t }) => {
                const done = isDone(t, w.log);
                return (
                  <div key={iso(w.d) + t.id} className={`cook-day ${done ? 'done' : ''}`}>
                    <button className={`mini-check ${done ? 'ok' : ''}`} onClick={() => toggleTask(w.d, t)} aria-pressed={done}>{done ? <Check size={13} strokeWidth={3} /> : null}</button>
                    <span className="cook-when">{dayName(w.d)}</span>
                    <span>{t.category === 'robot' ? <><Bot size={14} /> </> : null}{t.title}</span>
                  </div>
                );
              })}
              {cleanTasks.length === 0 && <p className="muted small" style={{ margin: 0 }}>אין משימות ניקיון השבוע.</p>}
            </div>
          </section>
          <section className="glass">
            <h2 className="section-h">🧽 ניקיון יסודי – שישי {shortDate(nextDeep)}</h2>
            <div className="rooms">
              {ROOMS.map((room) => {
                const ok = roomsDone.includes(room);
                return (
                  <button key={room} className={`lesson-chip ${ok ? 'ok' : ''}`} onClick={() => setData((d) => ({
                    ...d, deepClean: { ...d.deepClean, [deepKey]: ok ? roomsDone.filter((x) => x !== room) : [...roomsDone, room] },
                  }))}>
                    {ok ? <Check size={14} /> : <span className="box" />} {room}
                  </button>
                );
              })}
            </div>
            <p className="muted small">{roomsDone.length}/{ROOMS.length} חדרים</p>
          </section>
        </div>
      )}

      {openRecipe && (
        <RecipeSheet recipe={openRecipe} onClose={() => setOpenRecipe(null)}
          pickLabel={pickFor ? `🍳 לבשל את זה ביום ${dayName(fromIso(pickFor))}` : undefined}
          onPick={pickFor ? () => { updateLog(pickFor, (l) => ({ ...l, recipe: openRecipe.id })); setPickFor(null); setOpenRecipe(null); } : undefined} />
      )}
      {newRecipe && <RecipeForm onClose={() => setNewRecipe(false)} />}
    </main>
  );
}

