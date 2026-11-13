import { NotebookPen } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function Summary() {
  return (
    <main className="page">
      <PageTitle Icon={NotebookPen}>סיכום שבועי</PageTitle>
      <ComingSoon step={7} items={['המספרים של השבוע', 'הצלחות · מה נדחה · רמת לחץ · תודה', 'תכנון השבוע הבא']} />
    </main>
  );
}
