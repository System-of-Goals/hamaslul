import { Dumbbell } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function Habits() {
  return (
    <main className="page">
      <PageTitle Icon={Dumbbell}>הרגלים</PageTitle>
      <ComingSoon step={6} items={['מסלול הכושר', 'יומן שינה', 'בישול + מאגר מתכונים', 'ניקיון']} />
    </main>
  );
}
