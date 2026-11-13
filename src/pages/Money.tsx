import { Check, ExternalLink, PiggyBank, Target, Wallet } from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import { fromIso, iso, weekStart } from '../lib/dates';
import { useStore } from '../lib/store';

const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
const monthLabel = (ym: string) => { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
const fmt = (n: number) => n.toLocaleString('he-IL');

/** Savings planned from the plan's start up to (and including) `untilYm`. */
function planned(savings: { from: string; amount: number }[], untilYm: string) {
  let total = 0;
  const sorted = [...savings].sort((a, b) => a.from.localeCompare(b.from));
  if (!sorted.length) return 0;
  let [y, m] = sorted[0].from.split('-').map(Number);
  for (;;) {
    const ym = `${y}-${String(m).padStart(2, '0')}`;
    if (ym > untilYm) break;
    total += sorted.filter((s) => s.from <= ym).at(-1)?.amount ?? 0;
    m++; if (m > 12) { m = 1; y++; }
  }
  return total;
}

export default function Money() {
  const { data, setData } = useStore();
  if (!data?.money) {
    return <main className="page"><PageTitle Icon={Wallet}>כסף</PageTitle><p className="glass muted">טען את קובץ הנתונים המעודכן בהגדרות כדי לראות את היעדים.</p></main>;
  }
  const { loanDue, financeUrl, savings } = data.money;
  const today = new Date();
  const due = fromIso(loanDue);
  const days = Math.max(0, Math.ceil((due.getTime() - today.getTime()) / 86_400_000));
  const months = Math.max(0, (due.getFullYear() - today.getFullYear()) * 12 + due.getMonth() - today.getMonth());
  const nowYm = iso(today).slice(0, 7);
  const started = savings.some((s) => s.from <= nowYm);
  const endYear = `${due.getFullYear()}-12`;
  const wk = iso(weekStart(today));
  const checked = !!data.summaries?.[wk]?.financeChecked;
  const safeUrl = financeUrl && /^https:\/\//.test(financeUrl) ? financeUrl : undefined;

  return (
    <main className="page">
      <PageTitle Icon={Wallet}>כסף</PageTitle>
      <div className="stack">
        <section className="glass money-hero">
          <span className="vision-tag"><Target size={16} /> יעד: החזר כל ההלוואות</span>
          <strong className="money-big">{monthLabel(loanDue.slice(0, 7))}</strong>
          <span className="muted">⏳ עוד {months} חודשים · {fmt(days)} ימים</span>
        </section>

        <section className="glass">
          <h2 className="section-h"><PiggyBank size={18} /> תוכנית חיסכון</h2>
          <ul className="plain-list">
            {[...savings].sort((a, b) => a.from.localeCompare(b.from)).map((s, i, arr) => (
              <li key={s.from} className={nowYm >= s.from && (!arr[i + 1] || nowYm < arr[i + 1].from) ? 'cur-plan' : ''}>
                <span>מ{monthLabel(s.from)}</span>
                <span className="muted">{arr[i + 1] ? `עד ${monthLabel(arr[i + 1].from)}` : 'והלאה'}</span>
                <strong>{fmt(s.amount)} ₪ לחודש</strong>
              </li>
            ))}
          </ul>
          <p className="muted small">
            {started ? `לפי התוכנית נחסכו עד עכשיו כ-${fmt(planned(savings, nowYm))} ₪.` : `החיסכון מתחיל ב${monthLabel(savings[0]?.from ?? nowYm)}.`}
            {' '}צפי לסוף {due.getFullYear()}: <strong>{fmt(planned(savings, endYear))} ₪</strong>.
          </p>
        </section>

        <section className="glass">
          <h2 className="section-h">📋 בדיקה שבועית (15 דק׳)</h2>
          <button className={`check-row ${checked ? 'on' : ''}`} onClick={() => setData((d) => {
            const cur = d.summaries?.[wk];
            const base = cur ?? { wins: [], postponed: '', stress: 0, gratitude: '', financeChecked: false, nextFocus: '', savedAt: '' };
            return { ...d, summaries: { ...d.summaries, [wk]: { ...base, financeChecked: !checked } } };
          })}>
            <span className={`mini-check ${checked ? 'ok' : ''}`}>{checked ? <Check size={13} strokeWidth={3} /> : null}</span>
            בדקתי השבוע את ההכנסות וההוצאות
          </button>
          {safeUrl && (
            <a className="btn btn-gold" style={{ width: '100%', marginTop: 12 }} href={safeUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={18} /> פתח את האתר הפיננסי
            </a>
          )}
        </section>
      </div>
    </main>
  );
}
