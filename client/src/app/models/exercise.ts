export interface Exercise {
  id: string;
  name: string;
  target: string; // Primary muscle
  bodyPart: string;
  equipment: string;
  gifUrl?: string;
}
