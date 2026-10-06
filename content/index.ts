import { TrackId, Lesson, BuildingBlock, CaseStudy } from './types';
import { PYTHON_LESSONS, PYTHON_CHEAT_SHEET } from './python';
import { DSA_LESSONS, DSA_PATTERNS } from './dsa';
import { SYSTEM_DESIGN_LESSONS, BUILDING_BLOCKS, CASE_STUDIES } from './systemDesign';

export * from './types';
export { PYTHON_CHEAT_SHEET } from './python';
export { DSA_PATTERNS } from './dsa';
export { BUILDING_BLOCKS, CASE_STUDIES } from './systemDesign';

const ALL_LESSONS: Lesson[] = [
  ...PYTHON_LESSONS,
  ...DSA_LESSONS,
  ...SYSTEM_DESIGN_LESSONS,
];

export function getAllLessons(track?: TrackId): Lesson[] {
  if (track) {
    return ALL_LESSONS.filter((l) => l.track === track);
  }
  return ALL_LESSONS;
}

export function getLessonById(id: string): Lesson | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}

export function getPythonLessons(): Lesson[] {
  return PYTHON_LESSONS;
}

export function getDsaLessons(): Lesson[] {
  return DSA_LESSONS;
}

export function getSystemDesignLessons(): Lesson[] {
  return SYSTEM_DESIGN_LESSONS;
}

export function getBuildingBlocks(): BuildingBlock[] {
  return BUILDING_BLOCKS;
}

export function getCaseStudies(): CaseStudy[] {
  return CASE_STUDIES;
}
