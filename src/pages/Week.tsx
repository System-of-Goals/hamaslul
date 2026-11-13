import { useMemo, useState } from 'react';
import { BookOpen, CalendarDays, ChevronLeft, ChevronRight, Clock, Dumbbell, Home, Moon, Palmtree, Shield, Undo2 } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import Timeline from '../components/today/Timeline';
import AddTask from '../components/today/AddTask';
import TaskSheet from '../components/TaskSheet';
import { addDays, dayName, fmtDur, iso, restDay, shortDate, toMin, weekStart } from '../lib/dates';
import { dayOff, nextWorkingDay, progress, tasksFor, weekProgress, weekStats, weekTypeOf } from '../lib/schedule';
import { dueToday } from '../lib/course';
import { useStore } from '../lib/store';
import type { DayTask, PlanItem } from '../lib/types';

const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const AFTER_WORK_SKIP = new Set(['sleep', 'zoom', 'study', 'wake', 'review']);
const uid = () => Math.random().toString(36).slice(2, 9);

export default function Week() {
  const { data, logs, logFor, updateLog, setData } = useStore();
  const today = new Date();
  const [ws, setWs] = useState(() => weekStart(today));
  const [sel, setSel] = useState(() => today.getDay());
  const [editing, setEditing] = useState<DayTask | null>(null);
  const [shift, setShift] = useState<'none' | 'long' | 'noon'>('none');
  const [shiftEnd, setShiftEnd] = useState('18:00');

  const date = addDays(ws, sel);
  const day = iso(date);
  const log = logFor(day);
  const tasks = useMemo(() => tasksFor(date, data, log, log.mode), [date, data, log]);
  const wt = weekTypeOf(ws, data);
  const off = dayOff(date, data);
  const isVacation = !!data?.vacations.includes(day);
  const stats = weekStats(ws, data, logs);
  const isCurrentWeek = iso(ws) === iso(weekStart(today));

  if (!data) {
    return (
      <main className="page">
        <PageTitle Icon={CalendarDays}>שבוע</PageTitle>
        <p className="glass muted">טען קודם את קובץ הנתונים בדף ״היום״.</p>
      </main>
    );
  }

  const setWeekType = (t: 'home' | 'reserve') =>
    setData((d) => ({ ...d, weekTypes: { ...d.weekTypes, [iso(ws)]: t } }));
  const toggleVacation = () =>
    setData((d) => ({ ...d, vacations: isVacation ? d.vacations.filter((v) => v !== day) : [...d.vacations, day] }));

  const moveTask = (t: DayTask, target: Date) => {
    updateLog(iso(target), (l) => ({ ...l, extras: [...l.extras, { id: `x-${uid()}`, title: t.title, start: t.start, category: t.category, fromDate: day }] }));
    if (t.extra) updateLog(day, (l) => ({ ...l, extras: l.extras.filter((x) => x.id !== t.id) }));
    else updateLog(day, (l) => ({ ...l, skipped: { ...l.skipped, [t.id]: true } }));
  };
  const skipTask = (t: DayTask) => updateLog(day, (l) => ({ ...l, skipped: { ...l.skipped, [t.id]: true } }));
  const shiftTime = (t: DayTask, to: string) =>
    updateLog(day, (l) => ({ ...l, overrides: { ...l.overrides, [t.id]: { ...l.overrides?.[t.id], start: to } } }));

  const afterWork = tasks.filter((t) => t.start && toMin(t.start) >= toMin('16:00') && !AFTER_WORK_SKIP.has(t.category));
  const affectedLong = afterWork.filter((t) => toMin(t.start!) < toMin(shiftEnd));
  const nextDay = nextWorkingDay(date, data);
  const hasOverrides = Object.keys(log.skipped).length > 0 || Object.keys(log.overrides ?? {}).length > 0;

  return (
    <main className="page">
      <PageTitle Icon={CalendarDays}>שבוע</PageTitle>

      <div className="week-nav glass">
        <button className="icon-btn" onClick={() => { setWs(addDays(ws, -7)); setShift('none'); }} aria-label="שבוע קודם"><ChevronRight /></button>
        <div className="week-range">
          <strong>{shortDate(ws)} – {shortDate(addDays(ws, 6))}</strong>
          {!isCurrentWeek && <button className="link-btn" onClick={() => { setWs(weekStart(today)); setSel(today.getDay()); }}>לשבוע הנוכחי</button>}
        </div>
        <button className="icon-btn" onClick={() => { setWs(addDays(ws, 7)); setShift('none'); }} aria-label="שבוע הבא"><ChevronLeft /></button>
      </div>

      <div className="segmented week-type">
        <button className={wt === 'home' ? 'on' : ''} onClick={() => setWeekType('home')}><Home size={16} /> שבוע בית</button>
        <button className={wt === 'reserve' ? 'on' : ''} onClick={() => setWeekType('reserve')}><Shield size={16} /> שבוע מילואים</button>
      </div>

      <div className="day-strip">
        {LETTERS.map((l, i) => {
          const d = addDays(ws, i);
          const dl = logs[iso(d)];
          const offD = dayOff(d, data);
          const pct = d <= today ? progress(tasksFor(d, data, dl ?? { done: {}, studyMin: 0, extras: [], skipped: {} }, dl?.mode), dl ?? { done: {}, studyMin: 0, extras: [], skipped: {} }) : null;
          const mark = restDay(d) ? '🕯️' : offD ? '🌴' : pct !== null ? `${pct}%` : '•';
          return (
            <button key={i} className={`day-chip ${i === sel ? 'sel' : ''} ${iso(d) === iso(today) ? 'today' : ''}`} onClick={() => { setSel(i); setShift('none'); }}>
              <span className="dl">{l}</span>
              <span className="dd">{d.getDate()}</span>
              <span className="dm">{mark}</span>
            </button>
          );
        })}
      </div>

      <section className="stack" style={{ marginTop: 14 }}>
        <div className="day-head">
          <h2>יום {dayName(date)} · {shortDate(date)}</h2>
          {restDay(date) ? null : (
            <button className={`pill ${isVacation ? 'gold' : ''}`} onClick={toggleVacation}>
              <Palmtree size={15} /> {isVacation ? 'בטל יום חופש' : 'יום חופש'}
            </button>
          )}
        </div>

        {off ? (
          <div className="glass rest"><h2>{off === 'שבת' ? 'שבת שלום 🕯️' : `${off} 🌴`}</h2><p className="muted">אין משימות ביום הזה.</p></div>
        ) : (
          <>
            {wt === 'home' && (
              <div className="shift-tools">
                <button className={`pill ${shift === 'long' ? 'gold' : ''}`} onClick={() => setShift(shift === 'long' ? 'none' : 'long')}><Clock size={15} /> משמרת ארוכה</button>
                <button className={`pill ${shift === 'noon' ? 'gold' : ''}`} onClick={() => setShift(shift === 'noon' ? 'none' : 'noon')}><Moon size={15} /> משמרת צהריים</button>
                {hasOverrides && (
                  <button className="pill" onClick={() => updateLog(day, (l) => ({ ...l, skipped: {}, overrides: {} }))}><Undo2 size={15} /> בטל שינויים ביום</button>
                )}
              </div>
            )}

            {wt === 'home' && shift === 'long' && (
              <div className="glass shift-box">
                <label className="field-row-inline">המשמרת נגמרת ב-
                  <input type="time" value={shiftEnd} onChange={(e) => setShiftEnd(e.target.value)} />
                </label>
                {affectedLong.length === 0 ? <p className="muted small">אין משימות שמתנגשות.</p> : affectedLong.map((t) => (
                  <div key={t.id} className="shift-row">
                    <span>{t.start} · {t.title}</span>
                    <div className="carry-btns">
                      <button className="pill gold" onClick={() => shiftTime(t, shiftEnd)}>להזיז ל-{shiftEnd}</button>
                      <button className="pill" onClick={() => moveTask(t, nextDay)}>ליום {dayName(nextDay)}</button>
                      <button className="pill" onClick={() => skipTask(t)}>לוותר היום</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {wt === 'home' && shift === 'noon' && (
              <div className="glass shift-box">
                <p style={{ margin: 0 }}>משמרת <bdi dir="ltr">11:00-23:00</bdi>: {afterWork.length ? `${afterWork.length} משימות אחרי העבודה יעברו ליום אחר.` : 'אין משימות אחרי העבודה.'}</p>
                {afterWork.length > 0 && (
                  <button className="btn btn-gold" onClick={() => { afterWork.forEach((t) => moveTask(t, nextDay)); setShift('none'); }}>
                    העבר הכול ליום {dayName(nextDay)} {shortDate(nextDay)}
                  </button>
                )}
              </div>
            )}

            <Timeline
              tasks={tasks}
              log={log}
              isToday={day === iso(today)}
              lessonItems={dueToday(data, day)}
              lessons={data.lessons}
              onToggle={(id) => updateLog(day, (l) => ({ ...l, done: { ...l.done, [id]: !l.done[id] } }))}
              onStudy={(a) => updateLog(day, (l) => a === 'add30' ? { ...l, studyMin: l.studyMin + 30 } : l)}
              onLesson={(it: PlanItem) => setData((d) => ({ ...d, lessons: d.lessons.map((l) => l.n === it.lesson ? { ...l, done: { ...l.done, [it.step]: !l.done[it.step] } } : l) }))}
              onRemoveExtra={(id) => updateLog(day, (l) => ({ ...l, extras: l.extras.filter((x) => x.id !== id) }))}
              onEdit={setEditing}
            />
            <AddTask
              allowRepeat
              onAdd={(title, start, repeat) => {
                if (repeat) {
                  setData((d) => ({ ...d, templates: [...d.templates, { id: `t-${uid()}`, title, start, category: 'other', days: [date.getDay()], weekType: wt }] }));
                } else {
                  updateLog(day, (l) => ({ ...l, extras: [...l.extras, { id: `x-${uid()}`, title, start, category: 'other' }] }));
                }
              }}
            />
          </>
        )}
      </section>

      <section className="glass week-sum">
        <h2 className="section-h">סיכום השבוע</h2>
        <div className="sum-grid">
          <div><BookOpen size={20} /><strong>{fmtDur(stats.studyMin)}</strong><span>מתוך {Math.round(stats.studyTarget / 60)} ש׳ לימוד</span></div>
          <div><Dumbbell size={20} /><strong>{stats.fitDone}/{stats.fitPlan}</strong><span>כושר</span></div>
          <div><span className="sum-pct">✅</span><strong>{ws > today ? '—' : `${weekProgress(addDays(ws, 6) < today ? addDays(ws, 6) : today, data, logs) ?? '—'}%`}</strong><span>ביצוע</span></div>
        </div>
      </section>

      {editing && <TaskSheet task={editing} date={date} onClose={() => setEditing(null)} />}
    </main>
  );
}
