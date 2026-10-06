export type TrackId = 'python' | 'dsa' | 'system-design';

export interface Lesson {
  id: string;
  track: TrackId;
  module: string;
  order: number;
  title: string;
  estMinutes: number;
  tags: string[];
  keyPoints: string[];
  body: string;
}

export interface BuildingBlock {
  id: string;
  title: string;
  summary: string;
  keyConcepts: string[];
  tradeoffs: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
}
