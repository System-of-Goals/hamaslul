import { CalendarDays } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function Week() {
  return (
    <main className="page">
      <PageTitle Icon={CalendarDays}>שבוע</PageTitle>
      <ComingSoon step={3} items={['המערכת השבועית – טלפון: פס ימים', 'מתג שבוע בית / מילואים', 'יום חופש · משמרת ארוכה', 'סיכום השבוע']} />
    </main>
  );
}
