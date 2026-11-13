import { Target } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function Goals() {
  return (
    <main className="page">
      <PageTitle Icon={Target}>מטרות</PageTitle>
      <ComingSoon step={5} items={['החזון שלי', '4 תחומים עם התקדמות', 'מפת שלבים לכל תחום', 'למה זה חשוב לי']} />
    </main>
  );
}
