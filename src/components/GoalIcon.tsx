import { Dumbbell, Home, Leaf, Star, Wallet } from 'lucide-react';
import type { Goal } from '../lib/types';

const MAP = { home: Home, wallet: Wallet, dumbbell: Dumbbell, leaf: Leaf, star: Star };
export default function GoalIcon({ icon, size = 22 }: { icon: Goal['icon']; size?: number }) {
  const I = MAP[icon] ?? Star;
  return <I size={size} strokeWidth={1.75} />;
}
