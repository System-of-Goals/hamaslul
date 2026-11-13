import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { useStore } from '../lib/store';
import type { Category, TaskTemplate } from '../lib/types';

const DAYS = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
const CATS: [Category, string][] = [
  ['study', '📚 לימוד'], ['fitness', '💪 כושר'], ['run', '🏃 ריצה'], ['cook', '🍳 בישול'], ['clean', '🧽 ניקיון'],
  ['robot', '🤖 רובוט'], ['social', '👥 חברים'], ['sleep', '😴 שינה'], ['wake', '⏰ קימה'], ['review', '📝 סיכום'], ['zoom', '💻 זום'], ['other', '• אחר'],
];
const uid = () => Math.random().toString(36).slice(2, 9);

/** Edit (or create) a recurring task in the weekly template. */
export default function TemplateSheet({ initial, onClose }: { initial?: TaskTemplate; onClose: () => void }) {
  const { setData } = useStore();
  const [t, setT] = useState<TaskTemplate>(initial ?? { id: `t-${uid()}`, title: '', category: 'other', days: [0], weekType: 'home' });
  const [confirmDel, setConfirmDel] = useState(false);
  const set = (p: Partial<TaskTemplate>) => setT({ ...t, ...p });

  const save = () => {
    if (!t.title.trim() || !t.days.length) return;
    const clean = { ...t, title: t.title.trim(), start: t.start || undefined, end: t.end || undefined, minTitle: t.minTitle || undefined };
    setData((d) => ({ ...d, templates: d.templates.some((x) => x.id === t.id) ? d.templates.map((x) => (x.id === t.id ? clean : x)) : [...d.templates, clean] }));
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet glass" role="dialog" aria-label="משימה קבועה" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{initial ? 'עריכת משימה קבועה' : 'משימה קבועה חדשה'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={20} /></button>
        </div>
        <label className="field" style={{ marginTop: 12 }}><span className="field-label">שם</span>
          <input value={t.title} onChange={(e) => set({ title: e.target.value })} /></label>
        <div className="field-row">
          <label className="field"><span className="field-label">סוג</span>
            <select value={t.category} onChange={(e) => set({ category: e.target.value as Category })}>
              {CATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></label>
          <label className="field"><span className="field-label">באיזה שבוע</span>
            <select value={t.weekType} onChange={(e) => set({ weekType: e.target.value as TaskTemplate['weekType'] })}>
              <option value="home">🏠 בית</option><option value="reserve">🪖 מילואים</option><option value="both">שניהם</option>
            </select></label>
        </div>
        <p className="field-label" style={{ margin: '0 0 6px' }}>ימים</p>
        <div className="day-toggle">
          {DAYS.map((l, i) => (
            <button key={i} className={t.days.includes(i) ? 'on' : ''} onClick={() => set({ days: t.days.includes(i) ? t.days.filter((x) => x !== i) : [...t.days, i].sort() })}>{l}</button>
          ))}
        </div>
        <div className="field-row" style={{ marginTop: 12 }}>
          <label className="field"><span className="field-label">התחלה</span>
            <input type="time" value={t.start ?? ''} disabled={t.sleepFromTargets} onChange={(e) => set({ start: e.target.value })} /></label>
          <label className="field"><span className="field-label">סיום</span>
            <input type="time" value={t.end ?? ''} onChange={(e) => set({ end: e.target.value })} /></label>
        </div>
        {t.sleepFromTargets && <p className="muted small" style={{ marginTop: 0 }}>שעת השינה נקבעת לפי יעד החודש (בהגדרות ← יעדים).</p>}
        {t.category === 'study' && (
          <div className="field-row">
            <label className="field"><span className="field-label">יעד יומי 💪 (דקות)</span>
              <input type="number" inputMode="numeric" value={t.targetMin ?? ''} onChange={(e) => set({ targetMin: Number(e.target.value) || undefined })} /></label>
            <label className="field"><span className="field-label">מינימום 🌱 (דקות)</span>
              <input type="number" inputMode="numeric" value={t.minTargetMin ?? ''} onChange={(e) => set({ minTargetMin: Number(e.target.value) || undefined })} /></label>
          </div>
        )}
        <label className="field"><span className="field-label">גרסת מינימום 🌱 (לא חובה)</span>
          <input value={t.minTitle ?? ''} onChange={(e) => set({ minTitle: e.target.value })} /></label>
        <label className="check-line"><input type="checkbox" checked={!!t.optional} onChange={(e) => set({ optional: e.target.checked })} /> רשות – לא נספר באחוזים</label>
        <label className="check-line" style={{ marginTop: 8 }}><input type="checkbox" checked={t.active !== false} onChange={(e) => set({ active: e.target.checked ? undefined : false })} /> פעילה</label>
        <div className="sheet-actions" style={{ marginTop: 14 }}>
          <button className="btn btn-gold" onClick={save}>שמור</button>
          {initial && (!confirmDel
            ? <button className="btn danger" onClick={() => setConfirmDel(true)}><Trash2 size={16} /> מחיקה</button>
            : <button className="btn danger" onClick={() => { setData((d) => ({ ...d, templates: d.templates.filter((x) => x.id !== t.id) })); onClose(); }}>בטוח? מחק מהלו״ז</button>)}
        </div>
      </div>
    </div>
  );
}
