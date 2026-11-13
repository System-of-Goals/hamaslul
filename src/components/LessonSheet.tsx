import { useState } from 'react';
import { ExternalLink, Flag, X } from 'lucide-react';
import { STEP_LABEL } from '../lib/course';
import { useStore } from '../lib/store';
import type { Lesson } from '../lib/types';

const safeUrl = (u?: string) => (u && /^https?:\/\//i.test(u) ? u : undefined);

export default function LessonSheet({ lesson, onClose }: { lesson: Lesson; onClose: () => void }) {
  const { setData } = useStore();
  const [notes, setNotes] = useState(lesson.notes ?? '');
  const [link, setLink] = useState(lesson.link ?? '');
  const [recLink, setRecLink] = useState(lesson.recLink ?? '');
  const [minutes, setMinutes] = useState(String(lesson.minutes ?? ''));
  const [review, setReview] = useState(!!lesson.review);
  const [done, setDone] = useState(lesson.done);

  const save = () => {
    setData((d) => ({
      ...d,
      lessons: d.lessons.map((l) => l.n === lesson.n ? {
        ...l, done, notes: notes || undefined, link: link || undefined, recLink: recLink || undefined,
        minutes: Number(minutes) || undefined, review,
      } : l),
    }));
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet glass" role="dialog" aria-label={`שיעור ${lesson.n}`} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>שיעור {lesson.n} <small className="muted">· {lesson.group}</small></h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={20} /></button>
        </div>

        <div className="lesson-items" style={{ margin: '12px 0' }}>
          {lesson.steps.map((s) => (
            <button key={s} className={`lesson-chip ${done[s] ? 'ok' : ''}`} onClick={() => setDone({ ...done, [s]: !done[s] })}>
              {done[s] ? '✓' : <span className="box" />} {STEP_LABEL[s]}
            </button>
          ))}
        </div>

        <label className="field"><span className="field-label">הסיכום שלי</span>
          <textarea rows={7} value={notes} placeholder="כתוב כאן את הנקודות החשובות מהשיעור…" onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className="field"><span className="field-label">קישור לסיכום חיצוני (Word / Drive)</span>
          <div className="link-field">
            <input dir="ltr" value={link} placeholder="https://" onChange={(e) => setLink(e.target.value)} />
            {safeUrl(link) && <a className="icon-btn" href={safeUrl(link)} target="_blank" rel="noreferrer" aria-label="פתח"><ExternalLink size={18} /></a>}
          </div>
        </label>
        <label className="field"><span className="field-label">קישור להקלטה</span>
          <div className="link-field">
            <input dir="ltr" value={recLink} placeholder="https://" onChange={(e) => setRecLink(e.target.value)} />
            {safeUrl(recLink) && <a className="icon-btn" href={safeUrl(recLink)} target="_blank" rel="noreferrer" aria-label="פתח"><ExternalLink size={18} /></a>}
          </div>
        </label>
        <div className="field-row">
          <label className="field"><span className="field-label">דקות שלמדתי על השיעור</span>
            <input type="number" inputMode="numeric" min={0} value={minutes} onChange={(e) => setMinutes(e.target.value)} />
          </label>
          <button className={`btn review-btn ${review ? 'on' : ''}`} onClick={() => setReview(!review)}>
            <Flag size={16} /> {review ? 'מסומן לחזרה' : 'צריך חזרה'}
          </button>
        </div>
        <button className="btn btn-gold" style={{ width: '100%' }} onClick={save}>שמור</button>
      </div>
    </div>
  );
}
