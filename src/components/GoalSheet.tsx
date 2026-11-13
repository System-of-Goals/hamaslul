import { useState } from 'react';
import { Check, Lock, PartyPopper, Plus, X } from 'lucide-react';
import GoalIcon from './GoalIcon';
import Confetti from './Confetti';
import { autoProgress, goalProgress, stageTaskDone } from '../lib/goals';
import { fromIso, shortDate } from '../lib/dates';
import { useStore } from '../lib/store';
import type { Goal, Stage } from '../lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);
const LETTERS = 'אבגדהוזחטי';

export default function GoalSheet({ goalId, onClose }: { goalId: string; onClose: () => void }) {
  const { data, setData } = useStore();
  const goal = data?.goals?.find((g) => g.id === goalId);
  const [party, setParty] = useState(false);
  const [openStage, setOpenStage] = useState<string | undefined>(goal?.stages.find((s) => s.status === 'active')?.id);
  const [newTask, setNewTask] = useState('');
  const [newStage, setNewStage] = useState('');
  if (!data || !goal) return null;

  const update = (fn: (g: Goal) => Goal) =>
    setData((d) => ({ ...d, goals: (d.goals ?? []).map((g) => (g.id === goalId ? fn(g) : g)) }));
  const updateStage = (sid: string, fn: (s: Stage) => Stage) =>
    update((g) => ({ ...g, stages: g.stages.map((s) => (s.id === sid ? fn(s) : s)) }));

  const toggleTask = (s: Stage, tid: string) => {
    const t = s.tasks.find((x) => x.id === tid)!;
    if (t.ref) {
      const { lesson, step } = t.ref;
      setData((d) => ({ ...d, lessons: d.lessons.map((l) => l.n === lesson ? { ...l, done: { ...l.done, [step]: !l.done[step] } } : l) }));
    } else {
      updateStage(s.id, (st) => ({ ...st, tasks: st.tasks.map((x) => x.id === tid ? { ...x, done: !x.done } : x) }));
    }
  };

  const completeStage = (sid: string) => {
    update((g) => {
      const i = g.stages.findIndex((s) => s.id === sid);
      return {
        ...g,
        stages: g.stages.map((s, j) => j === i ? { ...s, status: 'done' } : j === i + 1 && s.status === 'locked' ? { ...s, status: 'active' } : s),
      };
    });
    const next = goal.stages[goal.stages.findIndex((s) => s.id === sid) + 1];
    setOpenStage(next?.id);
    setParty(true);
    setTimeout(() => setParty(false), 3200);
  };

  const pct = goalProgress(goal, data);
  const auto = autoProgress(goal, data);

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      {party && <Confetti />}
      <div className="sheet glass" role="dialog" aria-label={goal.title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2 className="goal-title"><span className="menu-icon"><GoalIcon icon={goal.icon} /></span>{goal.title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={20} /></button>
        </div>

        <label className="field" style={{ marginTop: 14 }}><span className="field-label">💛 למה זה חשוב לי</span>
          <textarea rows={2} value={goal.why ?? ''} onChange={(e) => update((g) => ({ ...g, why: e.target.value }))} />
        </label>

        {goal.stages.length > 0 && (
          <>
            <div className="stage-map" aria-label="מפת שלבים">
              {goal.stages.map((s, i) => (
                <button key={s.id} className={`sm-dot ${s.status} ${openStage === s.id ? 'open' : ''}`} onClick={() => setOpenStage(s.id)}>
                  <span className="sm-circle">{s.status === 'done' ? <Check size={16} strokeWidth={3} /> : s.status === 'locked' ? <Lock size={13} /> : LETTERS[i]}</span>
                  <span className="sm-letter">{LETTERS[i]}</span>
                </button>
              ))}
            </div>

            <div className="stages">
              {goal.stages.map((s, i) => {
                const doneN = s.tasks.filter((t) => stageTaskDone(t, data)).length;
                const isOpen = openStage === s.id;
                return (
                  <div key={s.id} className={`stage ${s.status} ${isOpen ? 'open' : ''}`}>
                    <button className="stage-head" onClick={() => setOpenStage(isOpen ? undefined : s.id)}>
                      <span className="stage-letter">{LETTERS[i]}</span>
                      <span className="stage-title">{s.title}</span>
                      <span className="muted small" style={{ margin: 0 }}>{s.tasks.length ? `${doneN}/${s.tasks.length}` : ''}</span>
                    </button>
                    {isOpen && (
                      <div className="stage-body">
                        <label className="field-row-inline small-field">יעד:
                          <input type="date" value={s.due ?? ''} onChange={(e) => updateStage(s.id, (st) => ({ ...st, due: e.target.value || undefined }))} />
                          {s.due && <span className="muted">{shortDate(fromIso(s.due))}</span>}
                        </label>
                        <ul className="stage-tasks">
                          {s.tasks.map((t) => {
                            const ok = stageTaskDone(t, data);
                            return (
                              <li key={t.id}>
                                <button className={`mini-check ${ok ? 'ok' : ''}`} onClick={() => toggleTask(s, t.id)} aria-pressed={ok}>
                                  {ok ? <Check size={13} strokeWidth={3} /> : null}
                                </button>
                                <span className={ok ? 'struck' : ''}>{t.text}</span>
                                {t.ref && <span className="link-tag">לימודים</span>}
                              </li>
                            );
                          })}
                        </ul>
                        <form className="inline-add" onSubmit={(e) => {
                          e.preventDefault();
                          if (!newTask.trim()) return;
                          updateStage(s.id, (st) => ({ ...st, tasks: [...st.tasks, { id: uid(), text: newTask.trim() }] }));
                          setNewTask('');
                        }}>
                          <input placeholder="+ משימה קטנה" value={newTask} onChange={(e) => setNewTask(e.target.value)} />
                        </form>
                        {s.status === 'active' && (
                          <button className="btn btn-gold" onClick={() => completeStage(s.id)}><PartyPopper size={18} /> סיימתי את השלב!</button>
                        )}
                        {s.status === 'locked' && (
                          <button className="btn" onClick={() => updateStage(s.id, (st) => ({ ...st, status: 'active' }))}>להתחיל את השלב עכשיו</button>
                        )}
                        {s.status === 'done' && (
                          <button className="link-btn" onClick={() => updateStage(s.id, (st) => ({ ...st, status: 'active' }))}>להחזיר לשלב פעיל</button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <form className="inline-add" onSubmit={(e) => {
              e.preventDefault();
              if (!newStage.trim()) return;
              update((g) => ({ ...g, stages: [...g.stages, { id: uid(), title: newStage.trim(), status: g.stages.some((s) => s.status === 'active') ? 'locked' : 'active', tasks: [] }] }));
              setNewStage('');
            }}>
              <input placeholder="+ שלב חדש" value={newStage} onChange={(e) => setNewStage(e.target.value)} />
            </form>

            <div className="manual">
              <div className="ch-row">
                <span className="field-label">התקדמות: <strong>{pct ?? 0}%</strong> {goal.manualProgress !== undefined ? '(ידני)' : '(אוטומטי)'}</span>
                {goal.manualProgress !== undefined && (
                  <button className="link-btn" style={{ margin: 0 }} onClick={() => update((g) => ({ ...g, manualProgress: undefined }))}>חזרה לאוטומטי ({auto}%)</button>
                )}
              </div>
              <input type="range" min={0} max={100} step={5} value={pct ?? 0} aria-label="שינוי ידני של ההתקדמות"
                onChange={(e) => update((g) => ({ ...g, manualProgress: Number(e.target.value) }))} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
