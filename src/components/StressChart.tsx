import { useState } from 'react';
import { fromIso, shortDate } from '../lib/dates';
import type { WeekSummary } from '../lib/types';

const WORD = ['', 'רגוע מאוד', 'רגוע', 'בינוני', 'לחוץ', 'לחוץ מאוד'];

/** Weekly stress level (1–5) – single series, tap a bar for its value. */
export default function StressChart({ summaries }: { summaries: Record<string, WeekSummary> }) {
  const weeks = Object.entries(summaries).filter(([, s]) => s.stress > 0).sort(([a], [b]) => a.localeCompare(b)).slice(-10);
  const [sel, setSel] = useState(weeks.length - 1);
  if (!weeks.length) return <p className="muted small" style={{ margin: 0 }}>הגרף יתמלא אחרי הסיכום השבועי הראשון.</p>;
  const idx = sel < 0 || sel >= weeks.length ? weeks.length - 1 : sel;
  const cur = weeks[idx];
  const cols = { gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 48px))` };
  return (
    <div className="hours-chart">
      <div className="hc-readout"><strong>{cur[1].stress}/5</strong> <span className="muted">{WORD[cur[1].stress]} · שבוע {shortDate(fromIso(cur[0]))}</span></div>
      <div className="hc-plot stress" style={cols} role="img" aria-label="רמת לחץ לפי שבוע">
        {weeks.map(([k, s], i) => (
          <button key={k} className={`hc-col ${i === idx ? 'sel' : ''}`} onClick={() => setSel(i)} aria-label={`שבוע ${shortDate(fromIso(k))}: לחץ ${s.stress} מתוך 5`}>
            <span className="hc-bar teal" style={{ height: `${(s.stress / 5) * 100}%` }} />
          </button>
        ))}
      </div>
      <div className="hc-axis" style={cols}>{weeks.map(([k], i) => <span key={k} className={i === idx ? 'sel' : ''}>{shortDate(fromIso(k))}</span>)}</div>
    </div>
  );
}
