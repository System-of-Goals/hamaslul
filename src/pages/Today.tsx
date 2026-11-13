import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Compass, FileUp, Home, Moon, Shield, Sun } from 'lucide-react';
import { addDays, dayName, greeting, hebrewDate, iso, shortDate } from '../lib/dates';
import { dayOff, isDone, progress, streak, tasksFor, weekProgress, weekTypeOf } from '../lib/schedule';
import { coursePace, dueToday } from '../lib/course';
import { pickFile, useStore } from '../lib/store';
import type { DayTask, Mode, PlanItem } from '../lib/types';
import QuoteCard from '../components/today/QuoteCard';
import ModeToggle from '../components/today/ModeToggle';
import StatsBento from '../components/today/StatsBento';
import Timeline from '../components/today/Timeline';
import AddTask from '../components/today/AddTask';
import CarryOver from '../components/today/CarryOver';

const NOT_MOVABLE = new Set(['wake', 'sleep', 'study', 'zoom', 'review']);
const uid = () => Math.random().toString(36).slice(2, 9);

export default function Today() {
  const { data, logs, meta, logFor, updateLog, setData, setMeta, importAll } = useStore();
  const [now, setNow] = useState(new Date());
  const [importMsg, setImportMsg] = useState('');
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const day = iso(now);
  const log = logFor(day);
  const mode: Mode = log.mode ?? 'full';
  const tasks = useMemo(() => tasksFor(now, data, log, mode), [now, data, log, mode]);
  const off = dayOff(now, data);
  const wt = weekTypeOf(now, data);
  const night = now.getHours() >= 19 || now.getHours() < 5;

  // unfinished tasks from the most recent past day that wasn't reviewed yet
  const carry = useMemo(() => {
    for (let d = addDays(now, -1), i = 0; i < 7 && iso(d) >= meta.firstUse; d = addDays(d, -1), i++) {
      const key = iso(d);
      if (meta.reviewed[key]) continue;
      const l = logs[key];
      const left = tasksFor(d, data, l ?? { done: {}, studyMin: 0, extras: [], skipped: {} }, l?.mode)
        .filter((t) => !t.optional && !NOT_MOVABLE.has(t.category) && !isDone(t, l ?? { done: {}, studyMin: 0, extras: [], skipped: {} })
          && !meta.reviewed[`${key}:${t.id}`]);
      if (left.length) return { key, date: d, left };
    }
    return null;
  }, [now, data, logs, meta]);

  function moveTask(t: DayTask, to: 'today' | 'friday' | 'drop') {
    if (!carry) return;
    if (to !== 'drop') {
      let target = now;
      if (to === 'friday') { target = new Date(now); while (target.getDay() !== 5) target = addDays(target, 1); }
      updateLog(iso(target), (l) => ({ ...l, extras: [...l.extras, { id: `x-${uid()}`, title: t.title, category: t.category, fromDate: carry.key }] }));
    }
    setMeta((m) => ({ ...m, reviewed: { ...m.reviewed, [`${carry.key}:${t.id}`]: true } }));
  }

  function onStudy(action: 'start' | 'stop' | 'add30') {
    updateLog(day, (l) => {
      if (action === 'start') return { ...l, timerStart: Date.now() };
      if (action === 'stop') {
        const add = l.timerStart ? Math.round((Date.now() - l.timerStart) / 60000) : 0;
        return { ...l, studyMin: l.studyMin + add, timerStart: undefined };
      }
      return { ...l, studyMin: l.studyMin + 30 };
    });
  }

  function onLesson(it: PlanItem) {
    setData((d) => ({
      ...d,
      lessons: d.lessons.map((l) => l.n === it.lesson ? { ...l, done: { ...l.done, [it.step]: !l.done[it.step] } } : l),
    }));
  }

  async function loadData() {
    try {
      const kind = await importAll(await pickFile());
      setImportMsg(kind === 'backup' ? 'הגיבוי נטען ✔' : 'הנתונים נטענו ✔');
    } catch {
      setImportMsg('הקובץ לא תקין – נסה קובץ אחר');
    }
  }

  return (
    <main className="page">
      <div className="today-top">
        <span className="muted">{dayName(now)} · {shortDate(now)} · {hebrewDate(now)}</span>
        {data && (
          <span className="chip">{wt === 'home' ? <><Home size={14} /> שבוע בית</> : <><Shield size={14} /> שבוע מילואים</>}</span>
        )}
      </div>
      <h1 className="greeting">
        {night ? <Moon className="greet-icon" size={34} /> : <Sun className="greet-icon sun" size={36} />}
        {greeting(now)}
      </h1>

      {!data ? (
        <section className="glass onboard">
          <h2>ברוך הבא ל״המסלול שלי״ 👋</h2>
          <p className="muted">כדי להתחיל, טען את קובץ הנתונים האישי שלך (my-data.json). הנתונים נשמרים רק בטלפון הזה.</p>
          <button className="btn btn-gold" onClick={loadData}><FileUp size={18} /> טען את הנתונים שלי</button>
          {importMsg && <p className="small">{importMsg}</p>}
        </section>
      ) : (
        <div className="stack">
          <StatsBento
            today={progress(tasks, log)}
            week={weekProgress(now, data, logs)}
            streak={streak(now, data, logs, meta.firstUse)}
            pace={coursePace(data, day)}
          />
          <QuoteCard date={now} />

          {off ? (
            <section className="glass rest">
              <h2>{off === 'שבת' ? 'שבת שלום 🕯️' : `${off} 🌿`}</h2>
              <p className="muted">היום אין משימות. מנוחה, משפחה וזמן לעצמך.</p>
            </section>
          ) : (
            <>
              <ModeToggle mode={mode} onChange={(m) => updateLog(day, (l) => ({ ...l, mode: m }))} />
              {carry && (
                <CarryOver
                  dayLabel={`יום ${dayName(carry.date)}`}
                  tasks={carry.left}
                  onMove={moveTask}
                  onClose={() => setMeta((m) => ({ ...m, reviewed: { ...m.reviewed, [carry.key]: true } }))}
                />
              )}
              <section>
                <h2 className="list-h">המשימות שלי</h2>
                {tasks.length === 0 && <p className="muted">אין משימות מתוכננות להיום.</p>}
                <Timeline
                  tasks={tasks}
                  log={log}
                  isToday
                  lessonItems={dueToday(data, day)}
                  lessons={data.lessons}
                  onToggle={(id) => updateLog(day, (l) => ({ ...l, done: { ...l.done, [id]: !isDone(tasks.find((t) => t.id === id)!, l) } }))}
                  onStudy={onStudy}
                  onLesson={onLesson}
                  onRemoveExtra={(id) => updateLog(day, (l) => ({ ...l, extras: l.extras.filter((x) => x.id !== id) }))}
                />
                <AddTask onAdd={(title, start) => updateLog(day, (l) => ({ ...l, extras: [...l.extras, { id: `x-${uid()}`, title, start, category: 'other' }] }))} />
              </section>
            </>
          )}

          <Link to="/back-on-track" className="glass back-btn"><Compass size={22} className="compass" /> בוא נחזור למסלול</Link>
        </div>
      )}
    </main>
  );
}

