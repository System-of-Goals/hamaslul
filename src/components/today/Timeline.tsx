import { useEffect, useState, type ReactNode } from 'react';
import { Check, Pause, Pencil, Play, Plus, Trash2 } from 'lucide-react';
import { CATEGORY_ICON } from '../icons';
import { fmtDur, nowMin, toMin } from '../../lib/dates';
import { isDone } from '../../lib/schedule';
import { STEP_LABEL } from '../../lib/course';
import type { DayLog, DayTask, Lesson, PlanItem } from '../../lib/types';

interface Props {
  tasks: DayTask[];
  log: DayLog;
  isToday: boolean;
  lessonItems: PlanItem[];
  lessons: Lesson[];
  onToggle: (id: string) => void;
  onStudy: (action: 'start' | 'stop' | 'add30') => void;
  onLesson: (item: PlanItem) => void;
  onRemoveExtra: (id: string) => void;
  onEdit?: (t: DayTask) => void;
  notes?: Record<string, ReactNode>;
}

function currentId(tasks: DayTask[], now: number) {
  let cur: string | undefined;
  for (const t of tasks) {
    if (!t.start) continue;
    const s = toMin(t.start);
    const e = t.end ? toMin(t.end) : s + 45;
    if (now >= s && now < e) cur = t.id;
  }
  return cur;
}

export default function Timeline(p: Props) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), p.log.timerStart ? 1000 : 30_000);
    return () => clearInterval(t);
  }, [p.log.timerStart]);
  const cur = p.isToday ? currentId(p.tasks, nowMin(new Date(now))) : undefined;

  return (
    <ol className="timeline">
      {p.tasks.map((t) => {
        const done = isDone(t, p.log);
        const Icon = CATEGORY_ICON[t.category];
        const study = t.category === 'study';
        const running = study && !!p.log.timerStart;
        const studied = p.log.studyMin + (running ? (now - p.log.timerStart!) / 60000 : 0);
        return (
          <li key={t.id} className={`tl-item ${done ? 'done' : ''} ${cur === t.id ? 'current' : ''} ${t.optional ? 'optional' : ''}`}>
            <button className="tl-dot" onClick={() => p.onToggle(t.id)} aria-label={done ? 'בטל סימון' : 'סמן כבוצע'} aria-pressed={done}>
              {done ? <Check size={16} strokeWidth={3} /> : null}
            </button>
            <div className="tl-body glass">
              <div className="tl-head">
                <Icon size={18} className="tl-icon" />
                <span className="tl-title">{t.title}</span>
                {p.onEdit ? (
                  <button className="tl-remove" onClick={() => p.onEdit!(t)} aria-label="עריכת משימה"><Pencil size={15} /></button>
                ) : t.extra && (
                  <button className="tl-remove" onClick={() => p.onRemoveExtra(t.id)} aria-label="מחק משימה"><Trash2 size={15} /></button>
                )}
              </div>
              {(t.start || t.optional) && (
                <span className="tl-time">
                  {t.start}{t.end ? `–${t.end}` : ''}{t.optional ? ' · רשות' : ''}
                </span>
              )}
              {p.notes?.[t.id]}
              {study && !!t.targetMin && (
                <div className="study">
                  <div className="bar"><span style={{ width: `${Math.min(100, (studied / t.targetMin) * 100)}%` }} /></div>
                  <div className="study-row">
                    <span className={`study-time ${running ? 'running' : ''}`}>למדתי <bdi dir="ltr">{fmtDur(studied)} / {fmtDur(t.targetMin)}</bdi></span>
                    <div className="study-btns">
                      {p.isToday && (
                        <button className="pill gold" onClick={() => p.onStudy(running ? 'stop' : 'start')}>
                          {running ? <><Pause size={15} /> עצרתי</> : <><Play size={15} /> התחלתי</>}
                        </button>
                      )}
                      <button className="pill" onClick={() => p.onStudy('add30')}><Plus size={15} /> 30 דק׳</button>
                    </div>
                  </div>
                  {p.lessonItems.length > 0 && (
                    <div className="lesson-items">
                      {p.lessonItems.map((it) => {
                        const ok = !!p.lessons.find((l) => l.n === it.lesson)?.done[it.step];
                        return (
                          <button key={`${it.lesson}-${it.step}`} className={`lesson-chip ${ok ? 'ok' : ''}`} onClick={() => p.onLesson(it)}>
                            {ok ? <Check size={14} /> : <span className="box" />} שיעור {it.lesson} · {STEP_LABEL[it.step]}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
