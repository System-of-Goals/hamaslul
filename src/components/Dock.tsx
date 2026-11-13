import { NavLink } from 'react-router-dom';
import { CalendarDays, GraduationCap, MoreHorizontal, Sun, Target } from 'lucide-react';

const items = [
  { to: '/', label: 'היום', Icon: Sun },
  { to: '/week', label: 'שבוע', Icon: CalendarDays },
  { to: '/study', label: 'לימודים', Icon: GraduationCap },
  { to: '/goals', label: 'מטרות', Icon: Target },
  { to: '/more', label: 'עוד', Icon: MoreHorizontal },
];

export default function Dock() {
  return (
    <nav className="dock glass" aria-label="ניווט ראשי">
      {items.map(({ to, label, Icon }) => (
        <NavLink key={to} to={to} end={to === '/'}>
          <Icon size={22} strokeWidth={1.75} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
