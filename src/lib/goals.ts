import type { Goal, Stage, UserData } from './types';

export function stageTaskDone(t: Stage['tasks'][number], data: UserData) {
  if (t.ref) return !!data.lessons.find((l) => l.n === t.ref!.lesson)?.done[t.ref.step];
  return !!t.done;
}

export function stageFraction(s: Stage, data: UserData) {
  if (s.status === 'done') return 1;
  if (!s.tasks.length) return 0;
  return s.tasks.filter((t) => stageTaskDone(t, data)).length / s.tasks.length;
}

/** Automatic progress: completed stages + partial progress of the active stage. */
export function autoProgress(g: Goal, data: UserData) {
  if (!g.stages.length) return null;
  const sum = g.stages.reduce((a, s) => a + (s.status === 'locked' ? 0 : stageFraction(s, data)), 0);
  return Math.round((sum / g.stages.length) * 100);
}

export const goalProgress = (g: Goal, data: UserData) => g.manualProgress ?? autoProgress(g, data);
export const activeStage = (g: Goal) => g.stages.find((s) => s.status === 'active');
export const nextStage = (g: Goal) => {
  const i = g.stages.findIndex((s) => s.status === 'active');
  return i >= 0 ? g.stages[i + 1] : undefined;
};
