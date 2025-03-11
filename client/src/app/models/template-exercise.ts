export interface TemplateExercise {
  id?: number;
  templateId?: number;
  exerciseId: string;
  exerciseName: string;
  sets: number;
  reps: number;
  weight: number;
}
