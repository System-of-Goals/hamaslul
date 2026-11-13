import { Compass } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function BackOnTrack() {
  return (
    <main className="page">
      <PageTitle Icon={Compass}>חזרה למסלול</PageTitle>
      <ComingSoon step={7} items={['מעבר למצב מינימום', 'רגע של אמונה', 'להתקשר למישהו קרוב', 'תהילים או הליכה']} />
    </main>
  );
}
