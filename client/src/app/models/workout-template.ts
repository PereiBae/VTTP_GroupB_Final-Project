import { TemplateExercise } from './template-exercise';

export interface WorkoutTemplate {
  id?: number;
  userId?: string;
  name: string;
  description?: string;
  exercises?: TemplateExercise[]; // For frontend use
}
