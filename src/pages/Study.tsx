import { useState } from 'react';
import { Check, ChevronLeft, Flag, GraduationCap, HelpCircle, Plus, Trash2, Users } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import LessonSheet from '../components/LessonSheet';
import HoursChart from '../components/HoursChart';
import { STEP_LABEL, coursePace } from '../lib/course';
import { iso, shortDate, fromIso } from '../lib/dates';
import { useStore } from '../lib/store';
import type { Lesson } from '../lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);
const isComplete = (l: Lesson) => l.steps.every((s) => l.done[s]);

export default function Study() {
  const { data, setData } = useStore();
  const [open, setOpen] = useState<Lesson | null>(null);
  const [tab, setTab] = useState<'lessons' | 'friend' | 'questions'>('lessons');
  const [entry, setEntry] = useState({ topic: '', learned: '', caseNote: '' });
  const [q, setQ] = useState('');

  if (!data) {
    return <main className="page"><PageTitle Icon={GraduationCap}>לימודים</PageTitle><p className="glass muted">טען קודם את קובץ הנתונים בדף ״היום״.</p></main>;
  }

  const complete = data.lessons.filter(isComplete).length;
  const pace = coursePace(data, iso(new Date()));
  const groups = [...new Set(data.lessons.map((l) => l.group))];
  const toggle = (n: number, step: keyof Lesson['done']) =>
    setData((d) => ({ ...d, lessons: d.lessons.map((l) => l.n === n ? { ...l, done: { ...l.done, [step]: !l.done[step] } } : l) }));
  const journal = data.journal ?? [];
  const questions = data.questions ?? [];
  const openQs = questions.filter((x) => !x.answered).length;

  return (
    <main className="page">
      <PageTitle Icon={GraduationCap}>לימודים</PageTitle>

      <section className="glass course-head">
        <div className="ch-row">
          <strong>הקורס</strong>
          <span className={`chip pace-chip pace-${pace?.status ?? 'none'}`}>
            {!pace ? '—' : pace.status === 'behind' ? `מפגר ב-${pace.n} שיעורים` : pace.status === 'ahead' ? `מקדים ב-${pace.n}` : 'בזמן ✓'}
          </span>
        </div>
        <div className="bar big"><span style={{ width: `${(complete / data.lessons.length) * 100}%` }} /></div>
        <span className="muted small">{complete} מתוך {data.lessons.length} שיעורים הושלמו (כל השלבים)</span>
        {data.links?.zoom && /^https:\/\//.test(data.links.zoom) && (
          <a className="btn" href={data.links.zoom} target="_blank" rel="noreferrer" style={{ color: 'var(--text)' }}>📹 הקלטות הקורס בזום</a>
        )}
      </section>

      <div className="segmented tabs3">
        <button className={tab === 'lessons' ? 'on' : ''} onClick={() => setTab('lessons')}>שיעורים</button>
        <button className={tab === 'friend' ? 'on' : ''} onClick={() => setTab('friend')}>יומן החבר</button>
        <button className={tab === 'questions' ? 'on' : ''} onClick={() => setTab('questions')}>שאלות{openQs ? ` (${openQs})` : ''}</button>
      </div>

      {tab === 'lessons' && (
        <div className="stack">
          {groups.map((g) => (
            <section key={g} className="glass lesson-group">
              <h2 className="section-h">{g}</h2>
              {data.lessons.filter((l) => l.group === g).map((l) => (
                <div key={l.n} className={`lesson-row ${isComplete(l) ? 'complete' : ''}`}>
                  <button className="lesson-open" onClick={() => setOpen(l)} aria-label={`פרטי שיעור ${l.n}`}>
                    <span className="lesson-num">{l.n}</span>
                    {l.review && <Flag size={14} className="review-flag" />}
                    {l.notes && <span className="has-notes" title="יש סיכום">📝</span>}
                    <ChevronLeft size={16} className="muted" />
                  </button>
                  <div className="lesson-steps">
                    {l.steps.map((s) => (
                      <button key={s} className={`step ${l.done[s] ? 'ok' : ''}`} onClick={() => toggle(l.n, s)} aria-pressed={!!l.done[s]}>
                        {l.done[s] ? <Check size={13} strokeWidth={3} /> : null}{STEP_LABEL[s]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}
          <section className="glass">
            <h2 className="section-h">שעות לימוד לפי שבוע</h2>
            <HoursChart />
          </section>
        </div>
      )}

      {tab === 'friend' && (
        <div className="stack">
          <form className="glass add-form" onSubmit={(e) => {
            e.preventDefault();
            if (!entry.topic.trim()) return;
            setData((d) => ({ ...d, journal: [{ id: uid(), date: iso(new Date()), ...entry }, ...(d.journal ?? [])] }));
            setEntry({ topic: '', learned: '', caseNote: '' });
          }}>
            <h2 className="section-h"><Users size={18} /> מפגש חדש</h2>
            <input placeholder="נושא" value={entry.topic} onChange={(e) => setEntry({ ...entry, topic: e.target.value })} />
            <textarea rows={3} placeholder="מה למדתי?" value={entry.learned} onChange={(e) => setEntry({ ...entry, learned: e.target.value })} />
            <input placeholder="תיק שדיברנו עליו (בלי פרטים מזהים)" value={entry.caseNote} onChange={(e) => setEntry({ ...entry, caseNote: e.target.value })} />
            <button className="btn btn-gold" type="submit"><Plus size={18} /> שמור ביומן</button>
          </form>
          {journal.length === 0 && <p className="muted center">עוד אין מפגשים ביומן.</p>}
          {journal.map((j) => (
            <article key={j.id} className="glass journal">
              <div className="ch-row">
                <strong>{j.topic}</strong>
                <span className="muted small" style={{ margin: 0 }}>{shortDate(fromIso(j.date))}</span>
              </div>
              {j.learned && <p>{j.learned}</p>}
              {j.caseNote && <p className="muted">📁 {j.caseNote}</p>}
              <button className="tl-remove" onClick={() => setData((d) => ({ ...d, journal: (d.journal ?? []).filter((x) => x.id !== j.id) }))} aria-label="מחק"><Trash2 size={15} /></button>
            </article>
          ))}
        </div>
      )}

      {tab === 'questions' && (
        <div className="stack">
          <form className="glass q-form" onSubmit={(e) => {
            e.preventDefault();
            if (!q.trim()) return;
            setData((d) => ({ ...d, questions: [...(d.questions ?? []), { id: uid(), text: q.trim(), answered: false }] }));
            setQ('');
          }}>
            <HelpCircle size={20} className="tl-icon" />
            <input placeholder="שאלה לשאול את החבר…" value={q} onChange={(e) => setQ(e.target.value)} />
            <button className="icon-btn" type="submit" aria-label="הוסף"><Plus size={18} /></button>
          </form>
          {questions.length === 0 && <p className="muted center">אין שאלות פתוחות.</p>}
          {[...questions].sort((a, b) => Number(a.answered) - Number(b.answered)).map((x) => (
            <div key={x.id} className={`glass q-row ${x.answered ? 'answered' : ''}`}>
              <button className="tl-dot" onClick={() => setData((d) => ({ ...d, questions: (d.questions ?? []).map((y) => y.id === x.id ? { ...y, answered: !y.answered } : y) }))}
                aria-label={x.answered ? 'סמן כפתוחה' : 'סמן שקיבלתי תשובה'}>
                {x.answered ? <Check size={16} strokeWidth={3} /> : null}
              </button>
              <div className="q-body">
                <span>{x.text}</span>
                {x.answered && (
                  <input className="q-answer" placeholder="מה התשובה? (לא חובה)" value={x.answer ?? ''}
                    onChange={(e) => setData((d) => ({ ...d, questions: (d.questions ?? []).map((y) => y.id === x.id ? { ...y, answer: e.target.value } : y) }))} />
                )}
              </div>
              <button className="tl-remove" onClick={() => setData((d) => ({ ...d, questions: (d.questions ?? []).filter((y) => y.id !== x.id) }))} aria-label="מחק"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      {open && <LessonSheet lesson={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
