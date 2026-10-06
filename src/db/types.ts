import { BlockCategory } from '../theme/tokens';

export type BlockKind = 'task' | 'event' | 'focus' | 'workout' | 'study';

export interface BlockRecord {
  id: string;
  title: string;
  kind: BlockKind;
  category: BlockCategory;
  date: string | null; // 'YYYY-MM-DD' or null for Inbox
  start_min: number | null; // 0-1439
  duration_min: number | null;
  done_at: number | null; // epoch ms
  notes: string | null;
  link_type: 'topic' | 'workout' | null;
  link_id: string | null;
  created_at: number;
  updated_at: number;
}

export type FocusMode = 'pomodoro' | 'countdown' | 'stopwatch';

export interface FocusSessionRecord {
  id: string;
  mode: FocusMode;
  label: string | null;
  topic_id: string | null;
  planned_ms: number | null;
  actual_ms: number;
  started_at: number;
  ended_at: number;
  completed: number; // 1 or 0
}

export type LearnStatus = 'todo' | 'learning' | 'done';

export interface LearnProgressRecord {
  topic_id: string;
  status: LearnStatus;
  notes: string | null;
  review_stage: number;
  last_reviewed_at: number | null;
  next_review_at: number | null;
  time_spent_ms: number;
}

export type DsaDifficulty = 'easy' | 'medium' | 'hard';
export type DsaStatus = 'todo' | 'attempted' | 'solved' | 'review';

export interface DsaProblemRecord {
  id: string;
  title: string;
  url: string | null;
  pattern: string | null;
  difficulty: DsaDifficulty | null;
  status: DsaStatus;
  attempts: number;
  time_spent_ms: number;
  notes: string | null;
  solved_at: number | null;
  created_at: number;
}

export type MuscleGroup = 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core' | 'other';
export type EquipmentType = 'machine' | 'barbell' | 'dumbbell' | 'cable' | 'bodyweight' | 'other';

export interface ExerciseRecord {
  id: string;
  name: string;
  muscle_group: MuscleGroup | null;
  equipment: EquipmentType | null;
  setup: string | null;
  notes: string | null;
  default_rest_sec: number | null;
  archived: number; // 0 or 1
  created_at: number;
}

export interface ExercisePhotoRecord {
  id: string;
  exercise_id: string;
  filename: string;
  caption: string | null;
  taken_at: number;
}

export interface WorkoutRecord {
  id: string;
  title: string | null;
  started_at: number;
  ended_at: number | null;
  notes: string | null;
}

export interface WorkoutSetRecord {
  id: string;
  workout_id: string;
  exercise_id: string;
  position: number;
  set_number: number;
  weight_kg: number | null;
  reps: number | null;
  rpe: number | null;
  is_warmup: number; // 0 or 1
  completed_at: number | null;
}
