import { History } from 'lucide-react';
import type { DayTask } from '../../lib/types';

export default function CarryOver({ dayLabel, tasks, onMove, onClose }: {
  dayLabel: string;
  tasks: DayTask[];
  onMove: (t: DayTask, to: 'today' | 'friday' | 'drop') => void;
  onClose: () => void;
}) {
  return (
    <section className="glass carry">
      <h2 className="section-h"><History size={18} /> נשאר מ{dayLabel}</h2>
      <ul>
        {tasks.map((t) => (
          <li key={t.id}>
            <span>{t.title}</span>
            <div className="carry-btns">
              <button className="pill gold" onClick={() => onMove(t, 'today')}>להיום</button>
              <button className="pill" onClick={() => onMove(t, 'friday')}>לשישי</button>
              <button className="pill" onClick={() => onMove(t, 'drop')}>לוותר</button>
            </div>
          </li>
        ))}
      </ul>
      <button className="link-btn" onClick={onClose}>סגור</button>
    </section>
  );
}
