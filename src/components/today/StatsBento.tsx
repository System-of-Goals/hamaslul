import { BookOpen, Flame } from 'lucide-react';

type Pace = { status: 'behind' | 'ahead' | 'on'; n: number } | null;

export default function StatsBento({ today, week, streak, pace }: {
  today: number | null; week: number | null; streak: number; pace: Pace;
}) {
  const pct = today ?? 0;
  const r = 44, c = 2 * Math.PI * r;
  const paceText = !pace ? '—'
    : pace.status === 'behind' ? `מפגר ${pace.n}`
    : pace.status === 'ahead' ? `מקדים ${pace.n}` : 'בזמן';
  return (
    <div className="bento">
      <div className="glass ring-card">
        <svg viewBox="0 0 100 100" className="ring" aria-hidden>
          <circle cx="50" cy="50" r={r} className="ring-bg" />
          <circle cx="50" cy="50" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} />
        </svg>
        <div className="ring-label">
          <strong>{today === null ? '—' : `${pct}%`}</strong>
          <span>היום</span>
          <small className="muted">שבוע {week === null ? '—' : `${week}%`}</small>
        </div>
      </div>
      <div className="glass stat">
        <Flame className={`flame ${streak > 0 ? 'lit' : ''}`} size={26} />
        <div><strong>{streak}</strong><span>ימים ברצף</span></div>
      </div>
      <div className={`glass stat pace-${pace?.status ?? 'none'}`}>
        <BookOpen size={24} />
        <div><strong>{paceText}</strong><span>קורס{pace?.status === 'behind' ? ' · שיעורים' : ''}</span></div>
      </div>
    </div>
  );
}
