import { useEffect, useState, type ReactNode } from 'react';
import {
  Bell, CalendarRange, Clock, Database, Download, FileUp, Fingerprint, Link2, Lock, Palette, Phone, Plus, Quote, Settings as SettingsIcon, Target, Trash2,
} from 'lucide-react';
import { PageTitle } from '../components/PageShell';
import TemplateSheet from '../components/TemplateSheet';
import PasteData from '../components/PasteData';
import type { ThemeMode } from '../lib/theme';
import { enrollFingerprint, fingerprintAvailable, hasFingerprint, removeFingerprint } from '../lib/lock';
import { downloadText, pickFile, useStore } from '../lib/store';
import { addDays, dayName, fromIso, iso, shortDate, weekStart } from '../lib/dates';
import type { CustomQuote, TaskTemplate } from '../lib/types';

const modes: { v: ThemeMode; label: string }[] = [{ v: 'auto', label: 'אוטומטי' }, { v: 'light', label: 'בהיר' }, { v: 'dark', label: 'כהה' }];
const LETTERS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
const MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function Section({ icon, title, children, open }: { icon: ReactNode; title: string; children: ReactNode; open?: boolean }) {
  return (
    <details className="glass set-sec" open={open}>
      <summary className="section-h">{icon} {title}</summary>
      <div className="set-body">{children}</div>
    </details>
  );
}

export default function Settings({ mode, setMode, onLock, onChangePin }: {
  mode: ThemeMode; setMode: (m: ThemeMode) => void; onLock: () => void; onChangePin: () => void;
}) {
  const { exportAll, importAll, data, setData } = useStore();
  const [msg, setMsg] = useState('');
  const [perm, setPerm] = useState<string>('Notification' in window ? Notification.permission : 'unsupported');
  const [fpAvail, setFpAvail] = useState(false);
  const [fpOn, setFpOn] = useState(false);
  const [editTpl, setEditTpl] = useState<TaskTemplate | 'new' | null>(null);
  const [vac, setVac] = useState('');
  const [cq, setCq] = useState<CustomQuote>({ type: 'faith', text: '', source: '', explain: '' });
  const [newContact, setNewContact] = useState('');

  useEffect(() => {
    fingerprintAvailable().then(setFpAvail);
    hasFingerprint().then(setFpOn);
  }, []);

  async function toggleFp() {
    if (fpOn) { await removeFingerprint(); setFpOn(false); return; }
    try { await enrollFingerprint(); setFpOn(true); } catch { /* cancelled */ }
  }
  async function load() {
    try { const kind = await importAll(await pickFile()); setMsg(kind === 'backup' ? 'הגיבוי נטען ✔' : 'הנתונים נטענו ✔'); } catch { setMsg('הקובץ לא תקין'); }
  }

  const today = new Date();
  const weeks = Array.from({ length: 12 }, (_, i) => addDays(weekStart(today), i * 7));
  const months = Array.from({ length: 8 }, (_, i) => { const d = new Date(today.getFullYear(), today.getMonth() + i, 1); return iso(d).slice(0, 7); });
  const groups: [string, (t: TaskTemplate) => boolean][] = [
    ['🏠 שבוע בית', (t) => t.weekType === 'home'],
    ['🪖 שבוע מילואים', (t) => t.weekType === 'reserve'],
    ['📆 כל השבועות', (t) => t.weekType === 'both'],
  ];

  return (
    <main className="page">
      <PageTitle Icon={SettingsIcon}>הגדרות</PageTitle>
      <div className="stack">
        <Section icon={<Palette size={18} />} title="מראה" open>
          <div className="segmented">
            {modes.map(({ v, label }) => <button key={v} className={mode === v ? 'on' : ''} onClick={() => setMode(v)}>{label}</button>)}
          </div>
          <p className="muted small">אוטומטי: בהיר ביום, כהה מהשקיעה (זמני ירושלים).</p>
        </Section>

        <Section icon={<Lock size={18} />} title="נעילה">
          <div className="stack">
            <button className="btn" onClick={onChangePin}>שינוי קוד</button>
            {fpAvail && <button className="btn" onClick={toggleFp}><Fingerprint size={18} /> {fpOn ? 'כיבוי טביעת אצבע' : 'הפעלת טביעת אצבע'}</button>}
            <button className="btn btn-gold" onClick={onLock}><Lock size={18} /> נעל עכשיו</button>
          </div>
        </Section>

        <Section icon={<Bell size={18} />} title="התראות">
          {perm === 'granted' && <p className="muted small" style={{ margin: 0 }}>✔ התראות פעילות – מגיעות כשהאפליקציה פתוחה, בתחילת כל משימה ובסוף זמן הלימוד. בשבת ובחג אין התראות.</p>}
          {perm === 'default' && <button className="btn" onClick={async () => setPerm(await Notification.requestPermission())}><Bell size={18} /> הפעל התראות</button>}
          {perm === 'denied' && <p className="muted small" style={{ margin: 0 }}>ההתראות חסומות. אפשר להפעיל בהגדרות האתר ב-Chrome.</p>}
          {perm === 'unsupported' && <p className="muted small" style={{ margin: 0 }}>הדפדפן לא תומך בהתראות.</p>}
        </Section>

        {data && (
          <>
            <Section icon={<CalendarRange size={18} />} title="לוח שבועות וימי חופש">
              <p className="field-label" style={{ margin: 0 }}>סוג כל שבוע (12 השבועות הקרובים)</p>
              <ul className="plain-list weeks-list">
                {weeks.map((w) => {
                  const k = iso(w);
                  const t = data.weekTypes[k] ?? 'home';
                  return (
                    <li key={k}>
                      <span>{shortDate(w)}</span>
                      <div className="segmented mini">
                        <button className={t === 'home' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, weekTypes: { ...d.weekTypes, [k]: 'home' } }))}>🏠 בית</button>
                        <button className={t === 'reserve' ? 'on' : ''} onClick={() => setData((d) => ({ ...d, weekTypes: { ...d.weekTypes, [k]: 'reserve' } }))}>🪖 מילואים</button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <p className="field-label">🌴 ימי חופש</p>
              <div className="inline-row">
                <input type="date" value={vac} onChange={(e) => setVac(e.target.value)} />
                <button className="pill gold" disabled={!vac} onClick={() => { if (vac && !data.vacations.includes(vac)) setData((d) => ({ ...d, vacations: [...d.vacations, vac].sort() })); setVac(''); }}>הוסף</button>
              </div>
              <div className="rooms" style={{ marginTop: 8 }}>
                {data.vacations.filter((v) => v >= iso(today)).map((v) => (
                  <button key={v} className="lesson-chip ok" onClick={() => setData((d) => ({ ...d, vacations: d.vacations.filter((x) => x !== v) }))}>
                    🌴 {dayName(fromIso(v))} {shortDate(fromIso(v))} ✕
                  </button>
                ))}
                {!data.vacations.some((v) => v >= iso(today)) && <span className="muted small">אין ימי חופש מתוכננים.</span>}
              </div>
            </Section>

            <Section icon={<Clock size={18} />} title='הלו"ז הקבוע'>
              {groups.map(([label, fn]) => (
                <div key={label} className="tpl-group">
                  <p className="field-label">{label}</p>
                  {data.templates.filter(fn).sort((a, b) => (a.start ?? '99').localeCompare(b.start ?? '99')).map((t) => (
                    <button key={t.id} className={`tpl-row ${t.active === false ? 'off' : ''}`} onClick={() => setEditTpl(t)}>
                      <span className="tpl-time"><bdi dir="ltr">{t.sleepFromTargets ? 'יעד' : t.start ?? '—'}</bdi></span>
                      <span className="tpl-title">{t.title}{t.active === false ? ' · כבויה' : ''}</span>
                      <span className="tpl-days">{t.days.map((d) => LETTERS[d]).join(' ')}</span>
                    </button>
                  ))}
                </div>
              ))}
              <button className="btn dashed" onClick={() => setEditTpl('new')}><Plus size={16} /> משימה קבועה חדשה</button>
            </Section>

            <Section icon={<Target size={18} />} title="יעדי שינה לפי חודש">
              <ul className="plain-list">
                {months.map((m) => {
                  const [y, mm] = m.split('-').map(Number);
                  return (
                    <li key={m} className="two-col">
                      <span>{MONTHS[mm - 1]} {y}</span>
                      <input type="time" value={data.sleepTargets[m] ?? ''} onChange={(e) => setData((d) => ({ ...d, sleepTargets: { ...d.sleepTargets, [m]: e.target.value } }))} />
                    </li>
                  );
                })}
              </ul>
              <p className="muted small">יעד הלימוד היומי נקבע במשימת הלימוד בלו״ז הקבוע.</p>
            </Section>

            <Section icon={<Quote size={18} />} title="משפט היום">
              <div className="segmented">
                {([['both', 'שניהם'], ['faith', '🙏 אמונה'], ['motivation', '🚀 מוטיבציה']] as const).map(([v, l]) => (
                  <button key={v} className={(data.quoteFilter ?? 'both') === v ? 'on' : ''} onClick={() => setData((d) => ({ ...d, quoteFilter: v }))}>{l}</button>
                ))}
              </div>
              <p className="field-label">הוספת משפט משלי</p>
              <div className="form-card" style={{ gap: 8 }}>
                <select value={cq.type} onChange={(e) => setCq({ ...cq, type: e.target.value as CustomQuote['type'] })}>
                  <option value="faith">🙏 אמונה</option><option value="motivation">🚀 מוטיבציה</option>
                </select>
                <input placeholder="המשפט" value={cq.text} onChange={(e) => setCq({ ...cq, text: e.target.value })} />
                <input placeholder="מקור (לא חובה)" value={cq.source} onChange={(e) => setCq({ ...cq, source: e.target.value })} />
                <textarea rows={2} placeholder="הסבר – מה זה אומר לי" value={cq.explain} onChange={(e) => setCq({ ...cq, explain: e.target.value })} />
                <button className="pill gold" disabled={!cq.text.trim()} onClick={() => {
                  setData((d) => ({ ...d, customQuotes: [...(d.customQuotes ?? []), { ...cq, text: cq.text.trim(), source: cq.source?.trim() || undefined, explain: cq.explain.trim() || '—' }] }));
                  setCq({ type: cq.type, text: '', source: '', explain: '' });
                }}>הוסף משפט</button>
              </div>
              {(data.customQuotes ?? []).map((q, i) => (
                <div key={i} className="custom-q">
                  <span>{q.type === 'faith' ? '🙏' : '🚀'} {q.text}</span>
                  <button className="tl-remove" aria-label="מחק" onClick={() => setData((d) => ({ ...d, customQuotes: (d.customQuotes ?? []).filter((_, j) => j !== i) }))}><Trash2 size={15} /></button>
                </div>
              ))}
            </Section>

            <Section icon={<Phone size={18} />} title="אנשי קשר (חזרה למסלול)">
              <ul className="plain-list">
                {(data.contacts ?? []).map((c, i) => (
                  <li key={i} className="contact-row">
                    <span>{c.name}</span>
                    <input dir="ltr" type="tel" placeholder="מספר טלפון" value={c.phone ?? ''}
                      onChange={(e) => setData((d) => ({ ...d, contacts: (d.contacts ?? []).map((x, j) => (j === i ? { ...x, phone: e.target.value } : x)) }))} />
                    <button className="tl-remove" aria-label="מחק" onClick={() => setData((d) => ({ ...d, contacts: (d.contacts ?? []).filter((_, j) => j !== i) }))}><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
              <div className="inline-row" style={{ marginTop: 10 }}>
                <input placeholder="שם" value={newContact} onChange={(e) => setNewContact(e.target.value)} />
                <button className="pill gold" disabled={!newContact.trim()} onClick={() => { setData((d) => ({ ...d, contacts: [...(d.contacts ?? []), { name: newContact.trim() }] })); setNewContact(''); }}>הוסף</button>
              </div>
            </Section>

            <Section icon={<Link2 size={18} />} title="קישורים">
              <label className="field"><span className="field-label">האתר הפיננסי</span>
                <input dir="ltr" placeholder="https://" value={data.money?.financeUrl ?? ''}
                  onChange={(e) => setData((d) => ({ ...d, money: { loanDue: d.money?.loanDue ?? '2027-05-31', savings: d.money?.savings ?? [], financeUrl: e.target.value } }))} /></label>
              <label className="field"><span className="field-label">הקלטות הקורס בזום</span>
                <input dir="ltr" placeholder="https://" value={data.links?.zoom ?? ''} onChange={(e) => setData((d) => ({ ...d, links: { ...d.links, zoom: e.target.value } }))} /></label>
            </Section>
          </>
        )}

        <Section icon={<Database size={18} />} title="הנתונים שלי וגיבוי" open={!data}>
          <p className="muted small" style={{ marginTop: 0 }}>הכול נשמר רק בטלפון הזה. מומלץ לשמור גיבוי פעם בשבוע.{data ? '' : ' עדיין לא נטענו נתונים.'}</p>
          <div className="stack">
            <button className="btn btn-gold" onClick={() => downloadText(`hamaslul-backup-${iso(new Date())}.json`, exportAll())}><Download size={18} /> שמור גיבוי לטלפון</button>
            <button className="btn" onClick={load}><FileUp size={18} /> טען נתונים / גיבוי מקובץ</button>
            <PasteData onDone={setMsg} />
            {msg && <p className="small">{msg}</p>}
          </div>
        </Section>
      </div>

      {editTpl && <TemplateSheet initial={editTpl === 'new' ? undefined : editTpl} onClose={() => setEditTpl(null)} />}
    </main>
  );
}
