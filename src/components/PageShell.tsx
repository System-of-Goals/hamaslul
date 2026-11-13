import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Construction } from 'lucide-react';

export function PageTitle({ Icon, children }: { Icon: LucideIcon; children: ReactNode }) {
  return <h1 className="page-title"><Icon size={26} strokeWidth={1.75} />{children}</h1>;
}

/** Placeholder card for pages that will be built in a later step of the plan. */
export function ComingSoon({ step, items }: { step: number; items: string[] }) {
  return (
    <div className="glass">
      <div className="chip"><Construction size={14} /> בבנייה · שלב {step}</div>
      <ul className="soon-list">
        {items.map((i) => <li key={i}>{i}</li>)}
      </ul>
    </div>
  );
}
