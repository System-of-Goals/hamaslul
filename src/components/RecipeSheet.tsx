import { useState } from 'react';
import { Check, Clock, Pencil, Trash2, Users, X } from 'lucide-react';
import { RECIPES } from '../lib/recipes';
import { useStore } from '../lib/store';
import type { Recipe } from '../lib/types';
import RecipeForm from './RecipeForm';

export default function RecipeSheet({ recipe, onClose, pickLabel, onPick }: {
  recipe: Recipe; onClose: () => void; pickLabel?: string; onPick?: () => void;
}) {
  const { setData } = useStore();
  const [have, setHave] = useState<Record<number, boolean>>({});
  const [editing, setEditing] = useState(false);
  const builtIn = RECIPES.some((r) => r.id === recipe.id);

  if (editing) return <RecipeForm initial={recipe} onClose={() => { setEditing(false); onClose(); }} />;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet glass" role="dialog" aria-label={recipe.name} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>{recipe.name}</h2>
          <button className="icon-btn" onClick={onClose} aria-label="סגור"><X size={20} /></button>
        </div>
        <div className="recipe-meta">
          <span className="chip"><Clock size={14} /> {recipe.time} דק׳</span>
          <span className="chip"><Users size={14} /> {recipe.servings} מנות</span>
          <span className={`chip kind-${recipe.kind}`}>{recipe.kind === 'meat' ? '🥩 בשרי' : '🌿 פרווה'}</span>
        </div>

        {onPick && <button className="btn btn-gold" style={{ width: '100%', margin: '12px 0 4px' }} onClick={onPick}>{pickLabel}</button>}

        <h3 className="recipe-h">רכיבים</h3>
        <ul className="ingredients">
          {recipe.ingredients.map((x, i) => (
            <li key={i}>
              <button className={`mini-check ${have[i] ? 'ok' : ''}`} onClick={() => setHave({ ...have, [i]: !have[i] })} aria-pressed={!!have[i]}>
                {have[i] ? <Check size={13} strokeWidth={3} /> : null}
              </button>
              <span className={have[i] ? 'struck' : ''}>{x}</span>
            </li>
          ))}
        </ul>

        <h3 className="recipe-h">אופן הכנה</h3>
        <ol className="steps">{recipe.steps.map((x, i) => <li key={i}>{x}</li>)}</ol>

        <div className="sheet-actions">
          <button className="btn" onClick={() => setEditing(true)}><Pencil size={16} /> עריכת המתכון</button>
          {!builtIn && (
            <button className="btn danger" onClick={() => { setData((d) => ({ ...d, recipes: (d.recipes ?? []).filter((r) => r.id !== recipe.id) })); onClose(); }}>
              <Trash2 size={16} /> מחיקה
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
