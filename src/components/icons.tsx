import {
  AlarmClock, BookOpen, Bot, CookingPot, Dumbbell, Footprints, Moon, NotebookPen, Sparkles, Users, Video, Circle,
} from 'lucide-react';
import type { Category } from '../lib/types';

export const CATEGORY_ICON: Record<Category, typeof Circle> = {
  wake: AlarmClock, study: BookOpen, zoom: Video, fitness: Dumbbell, run: Footprints, cook: CookingPot,
  clean: Sparkles, robot: Bot, social: Users, sleep: Moon, review: NotebookPen, other: Circle,
};
