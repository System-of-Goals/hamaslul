import { useState } from 'react';
import { addDays, fmtDur, fromIso, iso, shortDate, weekStart } from '../lib/dates';
import { weekStats } from '../lib/schedule';
import { useStore } from '../lib/store';

/** Study hours per week (last 8 weeks) vs the weekly target. Single series → no legend; tap a bar for its value. */
export default function HoursChart() {
  const { data, logs, meta } = useStore();
  const ws = weekStart(new Date());
  const first = iso(weekStart(fromIso(meta.firstUse)));
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(ws, (i - 7) * 7)).filter((w) => iso(w) >= first).map((w) => {
    const s = weekStats(w, data, logs);
    return { w, min: s.studyMin, target: s.studyTarget };
  });
  const [sel, setSel] = useState(weeks.length - 1);
  const max = Math.max(60, ...weeks.map((x) => Math.max(x.min, x.target)));
  const idx = sel < 0 || sel >= weeks.length ? weeks.length - 1 : sel;
  const cur = weeks[idx];

  if (!cur) return null;
  return (
    <div className="hours-chart">
      <div className="hc-readout" aria-live="polite">
        <strong><bdi dir="ltr">{fmtDur(cur.min)}</bdi></strong>
        <span className="muted"> מתוך {Math.round(cur.target / 60)} ש׳ · שבוע {shortDate(cur.w)}</span>
      </div>
      <div className="hc-plot" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 60px))` }} role="img" aria-label="שעות לימוד בשמונת השבועות האחרונים">
        {weeks.map((x, i) => (
          <button key={iso(x.w)} className={`hc-col ${i === idx ? 'sel' : ''}`} onClick={() => setSel(i)}
            aria-label={`שבוע ${shortDate(x.w)}: ${fmtDur(x.min)} מתוך ${Math.round(x.target / 60)} שעות`}>
            {x.target > 0 && <span className="hc-target" style={{ bottom: `${(x.target / max) * 100}%` }} />}
            <span className="hc-bar" style={{ height: `${Math.max(2, (x.min / max) * 100)}%` }} />
          </button>
        ))}
      </div>
      <div className="hc-axis" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 60px))` }}>
        {weeks.map((x, i) => <span key={iso(x.w)} className={i === idx ? 'sel' : ''}>{shortDate(x.w)}</span>)}
      </div>
      <p className="muted small hc-key"><span className="hc-key-line" /> קו = היעד של אותו שבוע</p>
      <table className="sr-only">
        <caption>שעות לימוד לפי שבוע</caption>
        <thead><tr><th>שבוע</th><th>שעות</th><th>יעד</th></tr></thead>
        <tbody>{weeks.map((x) => <tr key={iso(x.w)}><td>{shortDate(x.w)}</td><td>{fmtDur(x.min)}</td><td>{Math.round(x.target / 60)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
