export type WeekType = 'home' | 'reserve';
export type Mode = 'full' | 'min';
export type Category =
  | 'wake' | 'study' | 'zoom' | 'fitness' | 'run' | 'cook' | 'clean' | 'robot'
  | 'social' | 'sleep' | 'review' | 'other';

/** A recurring task in the weekly template. */
export interface TaskTemplate {
  id: string;
  title: string;
  category: Category;
  start?: string;            // "HH:MM"; omitted = no fixed time
  end?: string;              // "HH:MM"
  days: number[];            // 0 = Sunday … 6 = Saturday
  weekType: WeekType | 'both';
  minTitle?: string;         // what the task becomes in 🌱 minimum mode
  targetMin?: number;        // study: target minutes in 💪 mode
  minTargetMin?: number;     // study: target minutes in 🌱 mode
  optional?: boolean;        // not counted in the daily %
  rule?: 'firstFridayOfMonth';
  validFrom?: string;        // ISO date
  validTo?: string;          // ISO date
  active?: boolean;          // false = not yet (e.g. running before 30-min fitness)
  sleepFromTargets?: boolean;// start time comes from sleepTargets by month
}

export type LessonStep = 'summary' | 'practice' | 'recording' | 'recSummary';

export interface Lesson {
  n: number;
  group: string;
  done: Partial<Record<LessonStep, boolean>>;
  steps: LessonStep[];
  notes?: string;      // summary written in the app
  link?: string;       // external summary (Word / Drive)
  recLink?: string;    // zoom recording
  minutes?: number;    // time spent on this lesson
  review?: boolean;    // "needs review"
}

export interface StageTask { id: string; text: string; done?: boolean; ref?: { lesson: number; step: LessonStep } }
export interface Stage { id: string; title: string; due?: string; status: 'done' | 'active' | 'locked'; tasks: StageTask[] }
export interface Goal {
  id: string;
  title: string;
  icon: 'home' | 'wallet' | 'dumbbell' | 'leaf' | 'star';
  why?: string;
  stages: Stage[];
  metric?: 'stress';          // shows a weekly stress-level metric instead of stages
  manualProgress?: number;    // overrides the automatic %
}

export interface JournalEntry { id: string; date: string; topic: string; learned: string; caseNote?: string }
export interface Question { id: string; text: string; answered: boolean; answer?: string }

export interface PlanItem { lesson: number; step: LessonStep; due: string }

export interface UserData {
  version: 1;
  name?: string;
  templates: TaskTemplate[];
  weekTypes: Record<string, WeekType>;      // key: Sunday ISO date
  vacations: string[];                      // ISO dates
  studyTopics: Record<string, string>;      // key: ISO date
  weekTopics: Record<string, string>;       // key: Sunday ISO date
  sleepTargets: Record<string, string>;     // key: "YYYY-MM" → "HH:MM"
  lessons: Lesson[];
  lessonPlan: PlanItem[];
  vision?: string;
  goals?: Goal[];
  journal?: JournalEntry[];
  questions?: Question[];
}

export interface ExtraTask { id: string; title: string; start?: string; category: Category; fromDate?: string }

export interface DayLog {
  mode?: Mode;
  done: Record<string, boolean>;
  studyMin: number;
  timerStart?: number;
  extras: ExtraTask[];
  skipped: Record<string, boolean>;
  overrides?: Record<string, { title?: string; start?: string; end?: string }>;
}

export interface Meta {
  firstUse: string;
  reviewed: Record<string, boolean>;  // days whose unfinished tasks were handled
}

/** A task as shown on a given day (template or one-off). */
export interface DayTask {
  id: string;
  title: string;
  category: Category;
  start?: string;
  end?: string;
  optional?: boolean;
  targetMin?: number;
  extra?: boolean;
}
