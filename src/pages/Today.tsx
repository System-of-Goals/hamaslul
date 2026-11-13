import { useEffect, useState } from 'react';
import { Home, Sun, Moon } from 'lucide-react';
import { dayName, greeting, hebrewDate, shortDate } from '../lib/dates';
import { ComingSoon } from '../components/PageShell';

export default function Today() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const night = now.getHours() >= 19 || now.getHours() < 5;

  return (
    <main className="page">
      <div className="today-top">
        <span className="muted">{dayName(now)} · {shortDate(now)} · {hebrewDate(now)}</span>
        <span className="chip"><Home size={14} /> שבוע בית</span>
      </div>
      <h1 className="greeting">
        {night ? <Moon className="greet-icon" size={34} /> : <Sun className="greet-icon sun" size={36} />}
        {greeting(now)}
      </h1>
      <ComingSoon step={2} items={[
        'משפט היום – אמונה / מוטיבציה',
        'בחירת מצב: 💪 עם כוח / 🌱 מינימום',
        'הקצב שלי: קורס · ביצוע · רצף',
        'המשימות של היום על ציר זמן',
        'כפתור "בוא נחזור למסלול"',
      ]} />
    </main>
  );
}
