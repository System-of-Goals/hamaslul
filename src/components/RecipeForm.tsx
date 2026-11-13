import { useState } from 'react';
import { X } from 'lucide-react';
import { RECIPE_CATS } from '../lib/recipes';
import { useStore } from '../lib/store';
import type { Recipe, RecipeCat } from '../lib/types';

const uid = () => Math.random().toString(36).slice(2, 9);
const lines = (s: string) => s.split('\n').map((x) => x.trim()).filter(Boolean);

/** Add a recipe, or edit one (editing a built-in saves a personal copy with the same id). */
export default function RecipeForm({ initial, onClose }: { initial?: Recipe; onClose: () => void }) {
  const { setData } = useStore();
  const [name, setName] = useState(initial?.name ?? '');
  const [cat, setCat] = useState<RecipeCat>(initial?.cat ?? 'עוף');
  const [kind, setKind] = useState<Recipe['kind']>(initial?.kind ?? 'meat');
  const [time, setTime] = useState(String(initial?.time ?? 30));
  const [servings, setServings] = useState(String(initial?.servings ?? 5));
  const [ing, setIng] = useState(initial?.ingredients.join('\n') ?? '');
  const [steps, setSteps] = useState(initial?.steps.join('\n') ?? '');

  const save = () => {
    if (!name.trim()) return;
    const r: Recipe = {
      id: initial?.id ?? `r-${uid()}`, name: name.trim(), cat, kind, custom: true,
      time: Number(time) || 30, servings: Number(servings) || 1, ingredients: lines(ing), steps: lines(steps),
    };
    setData((d) => ({ ...d, recipes: [...(d.recipes ?? []).filter((x) => x.id !== r.id), r] }));
    onClose();
  };

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet glass" role="dialog" aria-label="מתכון" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{initial ? 'עריכת מתכון' : 'מתכון חדש'}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={20} /></button>
        </div>
        <label className="field" style={{ marginTop: 12 }}><span className="field-label">שם</span>
          <input value={name} onChange={(e) => setName(e.target.value)} /></label>
        <div className="field-row">
          <label className="field"><span className="field-label">קטגוריה</span>
            <select value={cat} onChange={(e) => setCat(e.target.value as RecipeCat)}>{RECIPE_CATS.map((c) => <option key={c}>{c}</option>)}</select></label>
          <label className="field"><span className="field-label">סוג</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as Recipe['kind'])}>
              <option value="meat">בשרי</option><option value="parve">פרווה</option></select></label>
        </div>
        <div className="field-row">
          <label className="field"><span className="field-label">זמן (דק׳)</span>
            <input type="number" inputMode="numeric" value={time} onChange={(e) => setTime(e.target.value)} /></label>
          <label className="field"><span className="field-label">מנות</span>
            <input type="number" inputMode="numeric" value={servings} onChange={(e) => setServings(e.target.value)} /></label>
        </div>
        <label className="field"><span className="field-label">רכיבים – כל רכיב בשורה</span>
          <textarea rows={6} value={ing} onChange={(e) => setIng(e.target.value)} /></label>
        <label className="field"><span className="field-label">אופן הכנה – כל שלב בשורה</span>
          <textarea rows={6} value={steps} onChange={(e) => setSteps(e.target.value)} /></label>
        <button className="btn btn-gold" style={{ width: '100%' }} onClick={save}>שמור מתכון</button>
      </div>
    </div>
  );
}
