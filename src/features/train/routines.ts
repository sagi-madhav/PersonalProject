import { MuscleGroup } from '../../db/types';

export interface RoutineExerciseTemplate {
  name: string;
  muscle_group: MuscleGroup;
  equipment: 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';
  targetSets: number;
  defaultReps: number;
  defaultWeightLb: number;
  setup?: string;
  notes?: string;
}

export interface WorkoutRoutine {
  id: string;
  title: string;
  subtitle: string;
  splitDay: string;
  muscleGroups: MuscleGroup[];
  exercises: RoutineExerciseTemplate[];
}

export const SPLIT_ROUTINES: WorkoutRoutine[] = [
  {
    id: 'upper-a',
    title: 'Upper Body A',
    subtitle: 'Chest & Back Dominant + Triceps',
    splitDay: 'Day 1 · Push/Pull Upper',
    muscleGroups: ['chest', 'back', 'shoulders', 'arms'],
    exercises: [
      {
        name: 'Incline Dumbbell Bench Press',
        muscle_group: 'chest',
        equipment: 'dumbbell',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 65,
        setup: 'Bench at 30 degrees',
        notes: 'Full stretch at bottom, explosive press',
      },
      {
        name: 'Lat Pulldown (Machine)',
        muscle_group: 'back',
        equipment: 'machine',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 140,
        setup: 'Thigh pad snug, wide overhand grip',
        notes: 'Drive elbows down and back to upper chest',
      },
      {
        name: 'Seated Cable Row',
        muscle_group: 'back',
        equipment: 'cable',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 130,
        setup: 'V-grip handle, feet braced',
        notes: 'Keep chest upright, squeeze scapulae',
      },
      {
        name: 'Overhead Dumbbell Shoulder Press',
        muscle_group: 'shoulders',
        equipment: 'dumbbell',
        targetSets: 3,
        defaultReps: 8,
        defaultWeightLb: 50,
        setup: 'Bench upright at 80 degrees',
        notes: 'Neutral to slight pronated grip',
      },
      {
        name: 'Dumbbell Lateral Raise',
        muscle_group: 'shoulders',
        equipment: 'dumbbell',
        targetSets: 3,
        defaultReps: 12,
        defaultWeightLb: 25,
        notes: 'Lead with elbows, controlled negative',
      },
      {
        name: 'Triceps Rope Pushdown',
        muscle_group: 'arms',
        equipment: 'cable',
        targetSets: 3,
        defaultReps: 12,
        defaultWeightLb: 45,
        setup: 'High pulley, rope attachment',
        notes: 'Lock elbows to sides, spread rope at lockout',
      },
    ],
  },
  {
    id: 'lower-body',
    title: 'Lower Body',
    subtitle: 'Quads, Hamstrings & Calves',
    splitDay: 'Day 2 · Legs & Posterior Chain',
    muscleGroups: ['legs', 'core'],
    exercises: [
      {
        name: 'Barbell Back Squat',
        muscle_group: 'legs',
        equipment: 'barbell',
        targetSets: 3,
        defaultReps: 8,
        defaultWeightLb: 185,
        setup: 'Pins at mid-chest, safeties set',
        notes: 'Brace core, descend to parallel depth',
      },
      {
        name: 'Romanian Deadlift (RDL)',
        muscle_group: 'legs',
        equipment: 'barbell',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 155,
        notes: 'Hinge hips back, feel intense hamstring stretch',
      },
      {
        name: 'Leg Press (Machine)',
        muscle_group: 'legs',
        equipment: 'machine',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 270,
        setup: 'Seat at 45 degrees, medium foot width',
        notes: 'Smooth descent, do not lock knees at top',
      },
      {
        name: 'Lying Leg Curl (Machine)',
        muscle_group: 'legs',
        equipment: 'machine',
        targetSets: 3,
        defaultReps: 12,
        defaultWeightLb: 90,
        setup: 'Pad above Achilles, align knee pivot',
        notes: 'Squeeze hamstrings at peak contraction',
      },
      {
        name: 'Standing Calf Raise',
        muscle_group: 'legs',
        equipment: 'machine',
        targetSets: 4,
        defaultReps: 15,
        defaultWeightLb: 120,
        notes: '2-second pause at bottom stretch',
      },
    ],
  },
  {
    id: 'biceps-hypertrophy',
    title: 'Biceps & Arms Focus',
    subtitle: 'Peak Hypertrophy & Forearms',
    splitDay: 'Day 3 · Dedicated Arm Specialization',
    muscleGroups: ['arms'],
    exercises: [
      {
        name: 'Incline Dumbbell Bicep Curl',
        muscle_group: 'arms',
        equipment: 'dumbbell',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 30,
        setup: 'Incline bench at 50 degrees',
        notes: 'Maximum long-head stretch at bottom',
      },
      {
        name: 'Preacher Curl (Machine)',
        muscle_group: 'arms',
        equipment: 'machine',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 65,
        setup: 'Seat height so armpits contact pad',
        notes: 'Strict isolation, avoid lifting elbows',
      },
      {
        name: 'Dumbbell Hammer Curl',
        muscle_group: 'arms',
        equipment: 'dumbbell',
        targetSets: 3,
        defaultReps: 12,
        defaultWeightLb: 35,
        notes: 'Neutral grip for brachialis & forearms',
      },
      {
        name: 'Standing Cable Bicep Curl',
        muscle_group: 'arms',
        equipment: 'cable',
        targetSets: 3,
        defaultReps: 12,
        defaultWeightLb: 50,
        setup: 'Low pulley, straight or EZ bar',
        notes: 'Constant cable tension at lockout',
      },
      {
        name: 'Triceps Rope Pushdown',
        muscle_group: 'arms',
        equipment: 'cable',
        targetSets: 3,
        defaultReps: 12,
        defaultWeightLb: 50,
        setup: 'High pulley with rope',
        notes: 'Superset companion to balance arm volume',
      },
    ],
  },
  {
    id: 'upper-b',
    title: 'Upper Body B',
    subtitle: 'Flat Bench & Shoulders Focus',
    splitDay: 'Day 4 · Upper Strength & Width',
    muscleGroups: ['chest', 'shoulders', 'back', 'arms'],
    exercises: [
      {
        name: 'Barbell Bench Press (Flat)',
        muscle_group: 'chest',
        equipment: 'barbell',
        targetSets: 3,
        defaultReps: 6,
        defaultWeightLb: 175,
        setup: 'Bar eye level, shoulder blades pinched',
        notes: 'Drive feet into floor, bar touches lower sternum',
      },
      {
        name: 'Seated Cable Row',
        muscle_group: 'back',
        equipment: 'cable',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 135,
        setup: 'Wide neutral or lat grip attachment',
        notes: 'Focus on lat activation and scapular retraction',
      },
      {
        name: 'Dumbbell Lateral Raise',
        muscle_group: 'shoulders',
        equipment: 'dumbbell',
        targetSets: 4,
        defaultReps: 12,
        defaultWeightLb: 25,
        notes: 'Strict form, no swinging',
      },
      {
        name: 'Lat Pulldown (Machine)',
        muscle_group: 'back',
        equipment: 'machine',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 140,
        notes: 'Full extension at top, hold 1s at bottom',
      },
      {
        name: 'Incline Dumbbell Bicep Curl',
        muscle_group: 'arms',
        equipment: 'dumbbell',
        targetSets: 3,
        defaultReps: 10,
        defaultWeightLb: 30,
        notes: 'Finish upper body with strict arm pump',
      },
    ],
  },
];

export function getRoutineById(id: string): WorkoutRoutine | undefined {
  return SPLIT_ROUTINES.find((r) => r.id === id);
}
