import * as Crypto from 'expo-crypto';
import { exercisesRepo } from '../../db/repos/exercisesRepo';
import { MuscleGroup, EquipmentType } from '../../db/types';

export interface SeedExercise {
  name: string;
  muscle_group: MuscleGroup;
  equipment: EquipmentType;
  setup?: string;
  notes?: string;
  default_rest_sec?: number;
}

const SEED_EXERCISES: SeedExercise[] = [
  // Upper
  {
    name: 'Incline Dumbbell Bench Press',
    muscle_group: 'chest',
    equipment: 'dumbbell',
    setup: 'Bench inclined at 30 degrees',
    notes: 'Control the descent, full stretch at bottom',
    default_rest_sec: 120,
  },
  {
    name: 'Barbell Bench Press (Flat)',
    muscle_group: 'chest',
    equipment: 'barbell',
    setup: 'Bar at eye level on rack',
    notes: 'Retract scapula, arch slightly, drive feet',
    default_rest_sec: 150,
  },
  {
    name: 'Lat Pulldown (Machine)',
    muscle_group: 'back',
    equipment: 'machine',
    setup: 'Thigh pad snug, pin at working weight',
    notes: 'Pull to upper chest, drive elbows down',
    default_rest_sec: 90,
  },
  {
    name: 'Seated Cable Row',
    muscle_group: 'back',
    equipment: 'cable',
    setup: 'Feet firm on footplates, V-bar handle',
    notes: 'Keep torso upright, pull to belly button',
    default_rest_sec: 90,
  },
  {
    name: 'Overhead Dumbbell Shoulder Press',
    muscle_group: 'shoulders',
    equipment: 'dumbbell',
    setup: 'Bench at 80 degrees',
    notes: 'Press straight overhead, do not clank dumbbells',
    default_rest_sec: 90,
  },
  {
    name: 'Dumbbell Lateral Raise',
    muscle_group: 'shoulders',
    equipment: 'dumbbell',
    notes: 'Lead with elbows, slight lean forward',
    default_rest_sec: 60,
  },
  {
    name: 'Triceps Rope Pushdown',
    muscle_group: 'arms',
    equipment: 'cable',
    setup: 'Cable at highest position, rope attachment',
    notes: 'Pin elbows to ribs, flare rope at bottom',
    default_rest_sec: 60,
  },

  // Lower
  {
    name: 'Barbell Back Squat',
    muscle_group: 'legs',
    equipment: 'barbell',
    setup: 'Pins at mid-chest height, safety bars set',
    notes: 'Brace core, hit parallel depth',
    default_rest_sec: 180,
  },
  {
    name: 'Romanian Deadlift (RDL)',
    muscle_group: 'legs',
    equipment: 'barbell',
    notes: 'Hinge at hips, soft knees, feel hamstring stretch',
    default_rest_sec: 120,
  },
  {
    name: 'Leg Press (Machine)',
    muscle_group: 'legs',
    equipment: 'machine',
    setup: 'Back pad at 45 deg, safety pins disengaged',
    notes: 'Feet shoulder-width on platform, do not lock knees',
    default_rest_sec: 120,
  },
  {
    name: 'Leg Extension (Machine)',
    muscle_group: 'legs',
    equipment: 'machine',
    setup: 'Back pad forward, shin pad right above ankles',
    notes: 'Pause at top contraction',
    default_rest_sec: 75,
  },
  {
    name: 'Lying Leg Curl (Machine)',
    muscle_group: 'legs',
    equipment: 'machine',
    setup: 'Roller pad above heels, knee aligned with pivot',
    notes: 'Control the eccentric tempo',
    default_rest_sec: 75,
  },
  {
    name: 'Standing Calf Raise',
    muscle_group: 'legs',
    equipment: 'machine',
    setup: 'Shoulder pads adjusted to height',
    notes: 'Full stretch at bottom, squeeze at peak',
    default_rest_sec: 60,
  },

  // Biceps Focus
  {
    name: 'Incline Dumbbell Bicep Curl',
    muscle_group: 'arms',
    equipment: 'dumbbell',
    setup: 'Bench inclined at 45–60 degrees',
    notes: 'Deep stretch on long head of bicep',
    default_rest_sec: 90,
  },
  {
    name: 'Standing Cable Bicep Curl',
    muscle_group: 'arms',
    equipment: 'cable',
    setup: 'Straight bar or EZ curl bar on low pulley',
    notes: 'Constant tension, elbows fixed',
    default_rest_sec: 75,
  },
  {
    name: 'Dumbbell Hammer Curl',
    muscle_group: 'arms',
    equipment: 'dumbbell',
    notes: 'Neutral grip, targets brachialis and forearms',
    default_rest_sec: 75,
  },
  {
    name: 'Preacher Curl (Machine)',
    muscle_group: 'arms',
    equipment: 'machine',
    setup: 'Seat height so armpit sits snug at top of pad',
    notes: 'Isolates short head, don’t hyperextend at bottom',
    default_rest_sec: 90,
  },
];

export async function checkAndSeedExercises(): Promise<void> {
  const existing = await exercisesRepo.getAll(true);
  if (existing.length === 0) {
    const now = Date.now();
    for (const item of SEED_EXERCISES) {
      await exercisesRepo.insert({
        id: Crypto.randomUUID(),
        name: item.name,
        muscle_group: item.muscle_group,
        equipment: item.equipment,
        setup: item.setup ?? null,
        notes: item.notes ?? null,
        default_rest_sec: item.default_rest_sec ?? 90,
        archived: 0,
        created_at: now,
      });
    }
  }
}
