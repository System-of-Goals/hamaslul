import type { DayLog, DayTask, Mode, TaskTemplate, UserData, WeekType } from './types';
import { addDays, iso, restDay, toMin, weekStart } from './dates';

/** Sort key: times after midnight (e.g. sleep at 00:30) belong to the end of the day. */
const sortKey = (t?: string) => (t ? (toMin(t) < 300 ? toMin(t) + 1440 : toMin(t)) : 1430); // untimed: end of day, before late-night sleep

export const emptyLog = (): DayLog => ({ done: {}, studyMin: 0, extras: [], skipped: {} });

export function weekTypeOf(d: Date, data: UserData | null): WeekType {
  return data?.weekTypes[iso(weekStart(d))] ?? 'home';
}

function firstFridayOfMonth(d: Date) {
  return d.getDay() === 5 && d.getDate() <= 7;
}

function applies(t: TaskTemplate, d: Date, wt: WeekType) {
  const day = iso(d);
  if (t.active === false) return false;
  if (!t.days.includes(d.getDay())) return false;
  if (t.weekType !== 'both' && t.weekType !== wt) return false;
  if (t.validFrom && day < t.validFrom) return false;
  if (t.validTo && day > t.validTo) return false;
  if (t.rule === 'firstFridayOfMonth' && !firstFridayOfMonth(d)) return false;
  return true;
}

/** Why a day has no tasks (Shabbat, holiday, vacation) – or null for a normal day. */
export function dayOff(d: Date, data: UserData | null): string | null {
  const rest = restDay(d);
  if (rest) return rest;
  if (data?.vacations.includes(iso(d))) return 'יום חופש';
  return null;
}

export function studyTopic(d: Date, data: UserData | null) {
  if (!data) return undefined;
  return data.studyTopics[iso(d)] ?? data.weekTopics[iso(weekStart(d))];
}

export function tasksFor(d: Date, data: UserData | null, log: DayLog, mode: Mode = 'full'): DayTask[] {
  if (!data || dayOff(d, data)) return [];
  const wt = weekTypeOf(d, data);
  const month = iso(d).slice(0, 7);
  const topic = studyTopic(d, data);

  const list: DayTask[] = data.templates.filter((t) => applies(t, d, wt)).map((t) => {
    let title = mode === 'min' && t.minTitle ? t.minTitle : t.title;
    if (t.category === 'study' && topic) title = `${title} · ${topic}`;
    const start = t.sleepFromTargets ? (data.sleepTargets[month] ?? t.start) : t.start;
    return {
      id: t.id, title, category: t.category, start, end: t.end, optional: t.optional,
      targetMin: t.category === 'study' ? (mode === 'min' ? t.minTargetMin : t.targetMin) : undefined,
    };
  });

  for (const t of list) {
    const o = log.overrides?.[t.id];
    if (o) Object.assign(t, Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)));
  }
  for (const x of log.extras) {
    list.push({ id: x.id, title: x.title, category: x.category, start: x.start, extra: true });
  }
  return list
    .filter((t) => !log.skipped[t.id])
    .sort((a, b) => sortKey(a.start) - sortKey(b.start));
}

export function isDone(t: DayTask, log: DayLog) {
  if (log.done[t.id]) return true;
  return t.category === 'study' && !!t.targetMin && log.studyMin >= t.targetMin;
}

export function progress(tasks: DayTask[], log: DayLog) {
  const counted = tasks.filter((t) => !t.optional);
  if (!counted.length) return null;
  return Math.round((counted.filter((t) => isDone(t, log)).length / counted.length) * 100);
}

/** A day "counts" for the streak: study minimum (30 min or study done) + at least one more task. */
export function dayQualifies(tasks: DayTask[], log: DayLog) {
  const study = tasks.filter((t) => t.category === 'study');
  const studyOk = log.studyMin >= 30 || study.some((t) => log.done[t.id]);
  const others = tasks.filter((t) => t.category !== 'study' && isDone(t, log)).length;
  return studyOk && others >= 1;
}

export function streak(today: Date, data: UserData | null, logs: Record<string, DayLog>, firstUse: string) {
  let count = 0;
  const check = (d: Date) => {
    const log = logs[iso(d)] ?? emptyLog();
    const tasks = tasksFor(d, data, log, log.mode);
    if (!tasks.some((t) => t.category === 'study' && !t.optional)) return 'skip';
    return dayQualifies(tasks, log) ? 'ok' : 'fail';
  };
  if (check(today) === 'ok') count++;
  for (let d = addDays(today, -1); iso(d) >= firstUse; d = addDays(d, -1)) {
    const r = check(d);
    if (r === 'fail') break;
    if (r === 'ok') count++;
  }
  return count;
}

export function weekProgress(today: Date, data: UserData | null, logs: Record<string, DayLog>) {
  let total = 0, done = 0;
  for (let d = weekStart(today); d <= today; d = addDays(d, 1)) {
    const log = logs[iso(d)] ?? emptyLog();
    const tasks = tasksFor(d, data, log, log.mode).filter((t) => !t.optional);
    total += tasks.length;
    done += tasks.filter((t) => isDone(t, log)).length;
  }
  return total ? Math.round((done / total) * 100) : null;
}

/** Weekly numbers for the Week page / weekly summary. */
export function weekStats(anyDay: Date, data: UserData | null, logs: Record<string, DayLog>) {
  let studyMin = 0, studyTarget = 0, fitDone = 0, fitPlan = 0;
  const start = weekStart(anyDay);
  for (let i = 0; i < 7; i++) {
    const d = addDays(start, i);
    const log = logs[iso(d)] ?? emptyLog();
    const tasks = tasksFor(d, data, log, 'full');
    studyMin += log.studyMin;
    for (const t of tasks) {
      if (t.category === 'study' && !t.optional) studyTarget += t.targetMin ?? 0;
      if (t.category === 'fitness' || t.category === 'run') { fitPlan++; if (isDone(t, log)) fitDone++; }
    }
  }
  return { studyMin, studyTarget, fitDone, fitPlan };
}

/** Next day (after `from`) that is a working day with tasks – used to suggest where to move tasks. */
export function nextWorkingDay(from: Date, data: UserData | null) {
  for (let i = 1; i <= 7; i++) {
    const d = addDays(from, i);
    if (!dayOff(d, data) && tasksFor(d, data, emptyLog()).length) return d;
  }
  return addDays(from, 1);
}

/** Early-warning signs that suggest opening "back on track" (no judgement – just a gentle offer). */
export function needsNudge(today: Date, data: UserData | null, logs: Record<string, DayLog>, firstUse: string, behind: number) {
  if (!data) return null;
  if (behind >= 2) return 'יש קצת פיגור בקורס';
  const misses: boolean[] = [];
  for (let d = addDays(today, -1), i = 0; i < 10 && misses.length < 2 && iso(d) >= firstUse; d = addDays(d, -1), i++) {
    const log = logs[iso(d)] ?? emptyLog();
    const tasks = tasksFor(d, data, log, log.mode);
    if (!tasks.some((t) => t.category === 'study' && !t.optional)) continue;
    misses.push(!dayQualifies(tasks, log));
  }
  if (misses.length === 2 && misses.every(Boolean)) return 'היומיים האחרונים היו קשים';
  const recent = Object.entries(data.summaries ?? {}).filter(([k, v]) => v.savedAt && k >= iso(addDays(today, -14))).sort(([a], [b]) => b.localeCompare(a))[0];
  if (recent && recent[1].stress >= 4) return 'השבוע היה לחוץ';
  return null;
}
