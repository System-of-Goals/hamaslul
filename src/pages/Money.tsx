import { Wallet } from 'lucide-react';
import { ComingSoon, PageTitle } from '../components/PageShell';

export default function Money() {
  return (
    <main className="page">
      <PageTitle Icon={Wallet}>כסף</PageTitle>
      <ComingSoon step={7} items={['יעד: החזר הלוואות – מאי 2027', 'תוכנית חיסכון', 'קישור לאתר הפיננסי']} />
    </main>
  );
}
