import { Link } from 'react-router-dom';
import { ChevronLeft, Compass, Dumbbell, MoreHorizontal, NotebookPen, Settings, Wallet } from 'lucide-react';
import { PageTitle } from '../components/PageShell';

const links = [
  { to: '/habits', label: 'הרגלים', sub: 'כושר · שינה · בישול · ניקיון', Icon: Dumbbell },
  { to: '/money', label: 'כסף', sub: 'יעדים וקישור לאתר הפיננסי', Icon: Wallet },
  { to: '/summary', label: 'סיכום שבועי', sub: 'חמישי 15:00', Icon: NotebookPen },
  { to: '/back-on-track', label: 'חזרה למסלול', sub: 'כשצריך לעצור ולחזור', Icon: Compass },
  { to: '/settings', label: 'הגדרות', sub: 'מראה · נעילה · גיבוי', Icon: Settings },
];

export default function More() {
  return (
    <main className="page">
      <PageTitle Icon={MoreHorizontal}>עוד</PageTitle>
      <div className="stack">
        {links.map(({ to, label, sub, Icon }) => (
          <Link key={to} to={to} className="glass menu-row">
            <span className="menu-icon"><Icon size={22} strokeWidth={1.75} /></span>
            <span className="menu-text"><strong>{label}</strong><small className="muted">{sub}</small></span>
            <ChevronLeft size={20} className="muted" />
          </Link>
        ))}
      </div>
    </main>
  );
}
