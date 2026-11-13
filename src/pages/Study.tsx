import { GraduationCap } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function Study() {
  return (
    <main className="page">
      <PageTitle Icon={GraduationCap}>לימודים</PageTitle>
      <ComingSoon step={4} items={['14 שיעורי הקורס – 4 סימונים לכל שיעור', 'סיכומים + קישורים', 'שעות לימוד מול היעד', 'יומן עם החבר · שאלות פתוחות']} />
    </main>
  );
}
