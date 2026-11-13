import { useState } from 'react';
import { ArrowLeftRight, Trash2, X } from 'lucide-react';
import { addDays, dayName, iso, shortDate, weekStart } from '../lib/dates';
import { useStore } from '../lib/store';
import type { DayTask } from '../lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);

/** Bottom sheet for editing / moving / deleting a task on a specific day. */
export default function TaskSheet({ task, date, onClose }: { task: DayTask; date: Date; onClose: () => void }) {
  const { data, setData, updateLog } = useStore();
  const day = iso(date);
  const tpl = task.extra ? undefined : data?.templates.find((t) => t.id === task.id);
  const [title, setTitle] = useState(tpl?.title ?? task.title);
  const [start, setStart] = useState(task.start ?? '');
  const [end, setEnd] = useState(task.end ?? '');
  const [minTitle, setMinTitle] = useState(tpl?.minTitle ?? '');
  const [moving, setMoving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  const saveDay = () => {
    if (task.extra) {
      updateLog(day, (l) => ({ ...l, extras: l.extras.map((x) => x.id === task.id ? { ...x, title, start: start || undefined } : x) }));
    } else {
      updateLog(day, (l) => ({ ...l, overrides: { ...l.overrides, [task.id]: { title, start: start || undefined, end: end || undefined } } }));
    }
    onClose();
  };

  const saveAll = () => {
    setData((d) => ({
      ...d,
      templates: d.templates.map((t) => t.id === task.id
        ? { ...t, title, start: start || undefined, end: end || undefined, minTitle: minTitle || undefined }
        : t),
    }));
    onClose();
  };

  const moveTo = (target: Date) => {
    updateLog(iso(target), (l) => ({ ...l, extras: [...l.extras, { id: `x-${uid()}`, title: task.title, start: task.start, category: task.category, fromDate: day }] }));
    if (task.extra) updateLog(day, (l) => ({ ...l, extras: l.extras.filter((x) => x.id !== task.id) }));
    else updateLog(day, (l) => ({ ...l, skipped: { ...l.skipped, [task.id]: true } }));
    onClose();
  };

  const deleteDay = () => {
    if (task.extra) updateLog(day, (l) => ({ ...l, extras: l.extras.filter((x) => x.id !== task.id) }));
    else updateLog(day, (l) => ({ ...l, skipped: { ...l.skipped, [task.id]: true } }));
    onClose();
  };

  const deleteAll = () => {
    setData((d) => ({ ...d, templates: d.templates.filter((t) => t.id !== task.id) }));
    onClose();
  };

  const ws = weekStart(date);
  const days = Array.from({ length: 13 }, (_, i) => addDays(ws, i)).filter((d) => iso(d) !== day && d.getDay() !== 6);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet glass" role="dialog" aria-label="עריכת משימה" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>עריכת משימה</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={20} /></button>
        </div>
        <p className="muted small" style={{ marginTop: 0 }}>{dayName(date)} {shortDate(date)}</p>

        {moving ? (
          <>
            <p className="field-label">להעביר לאיזה יום?</p>
            <div className="day-pick">
              {days.map((d) => (
                <button key={iso(d)} className="pill" onClick={() => moveTo(d)}>{dayName(d)} {shortDate(d)}</button>
              ))}
            </div>
            <button className="link-btn" onClick={() => setMoving(false)}>חזרה</button>
          </>
        ) : (
          <>
            <label className="field"><span className="field-label">שם</span>
              <input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
            <div className="field-row">
              <label className="field"><span className="field-label">התחלה</span>
                <input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></label>
              {!task.extra && (
                <label className="field"><span className="field-label">סיום</span>
                  <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></label>
              )}
            </div>
            {tpl && (
              <label className="field"><span className="field-label">גרסת מינימום 🌱</span>
                <input value={minTitle} placeholder="למשל: 10 דק׳ בלבד" onChange={(e) => setMinTitle(e.target.value)} /></label>
            )}

            <div className="sheet-actions">
              <button className="btn btn-gold" onClick={saveDay}>{task.extra ? 'שמור' : 'שמור – רק ביום הזה'}</button>
              {tpl && <button className="btn" onClick={saveAll}>שמור – בכל השבועות</button>}
              <button className="btn" onClick={() => setMoving(true)}><ArrowLeftRight size={18} /> העבר ליום אחר</button>
              {!confirmDel ? (
                <button className="btn danger" onClick={() => setConfirmDel(true)}><Trash2 size={18} /> מחיקה</button>
              ) : (
                <div className="confirm">
                  <button className="btn danger" onClick={deleteDay}>{task.extra ? 'מחק' : 'מחק רק ביום הזה'}</button>
                  {tpl && <button className="btn danger" onClick={deleteAll}>מחק מהלו״ז לגמרי</button>}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
