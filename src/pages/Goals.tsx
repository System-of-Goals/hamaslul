import { useState } from 'react';
import { ChevronLeft, Pencil, Plus, Sparkles, Target } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import GoalIcon from '../components/GoalIcon';
import GoalSheet from '../components/GoalSheet';
import { activeStage, goalProgress, nextStage } from '../lib/goals';
import { useStore } from '../lib/store';

const uid = () => Math.random().toString(36).slice(2, 9);

export default function Goals() {
  const { data, setData } = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const [editVision, setEditVision] = useState(false);
  const [adding, setAdding] = useState('');

  if (!data) {
    return <main className="page"><PageTitle Icon={Target}>מטרות</PageTitle><p className="glass muted">טען קודם את קובץ הנתונים בדף ״היום״.</p></main>;
  }
  const goals = data.goals ?? [];

  return (
    <main className="page">
      <PageTitle Icon={Target}>מטרות</PageTitle>

      <section className="glass vision">
        <div className="ch-row">
          <span className="vision-tag"><Sparkles size={16} /> החזון שלי</span>
          <button className="tl-remove" onClick={() => setEditVision(!editVision)} aria-label="עריכת החזון"><Pencil size={15} /></button>
        </div>
        {editVision ? (
          <textarea className="vision-edit" rows={3} autoFocus value={data.vision ?? ''} onBlur={() => setEditVision(false)}
            onChange={(e) => setData((d) => ({ ...d, vision: e.target.value }))} />
        ) : (
          <p className="vision-text">{data.vision || 'לחץ על העיפרון כדי לכתוב את החזון שלך.'}</p>
        )}
      </section>

      {goals.length === 0 && (
        <p className="glass muted">אין עדיין מטרות. טען את קובץ הנתונים המעודכן בהגדרות, או הוסף מטרה למטה.</p>
      )}

      <div className="stack" style={{ marginTop: 14 }}>
        {goals.map((g) => {
          const pct = goalProgress(g, data);
          const act = activeStage(g);
          const nxt = nextStage(g);
          return (
            <button key={g.id} className="glass goal-card" onClick={() => setOpen(g.id)}>
              <div className="ch-row">
                <span className="goal-name"><span className="menu-icon"><GoalIcon icon={g.icon} /></span>{g.title}</span>
                {g.metric !== 'stress' && <strong className="goal-pct">{pct ?? 0}%</strong>}
                <ChevronLeft size={18} className="muted" />
              </div>
              {g.metric === 'stress' ? (
                (() => {
                  const last = Object.entries(data.summaries ?? {}).filter(([, v]) => v.savedAt && v.stress).sort(([a], [b]) => b.localeCompare(a))[0];
                  return last
                    ? <p className="goal-line">🧘 רמת לחץ בסיכום האחרון: <strong>{last[1].stress}/5</strong></p>
                    : <p className="goal-line muted">🧘 רמת לחץ שבועית – תתמלא מהסיכום השבועי.</p>;
                })()
              ) : (
                <>
                  <div className="bar"><span style={{ width: `${pct ?? 0}%` }} /></div>
                  {act && <p className="goal-line"><span className="muted">עכשיו:</span> {act.title}</p>}
                  {nxt && <p className="goal-line muted">הבא: {nxt.title}</p>}
                  {!act && g.stages.every((s) => s.status === 'done') && g.stages.length > 0 && <p className="goal-line">🎉 כל השלבים הושלמו!</p>}
                </>
              )}
            </button>
          );
        })}

        <form className="glass inline-add goal-add" onSubmit={(e) => {
          e.preventDefault();
          if (!adding.trim()) return;
          setData((d) => ({ ...d, goals: [...(d.goals ?? []), { id: uid(), title: adding.trim(), icon: 'star', stages: [{ id: uid(), title: 'שלב ראשון', status: 'active', tasks: [] }] }] }));
          setAdding('');
        }}>
          <Plus size={18} className="muted" />
          <input placeholder="הוסף תחום / מטרה חדשה" value={adding} onChange={(e) => setAdding(e.target.value)} />
        </form>
      </div>

      {open && <GoalSheet goalId={open} onClose={() => setOpen(null)} />}
    </main>
  );
}
