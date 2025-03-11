import { ExerciseLog } from './exercise-log';

export interface WorkoutSession {
  id?: string;
  userId?: string;
  startTime: string; // ISO format date-time string
  endTime?: string; // ISO format date-time string
  templateId?: number;
  name: string;
  exercises: ExerciseLog[];
  notes?: string;
}
