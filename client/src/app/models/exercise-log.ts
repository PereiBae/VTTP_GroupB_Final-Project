export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  completed: boolean;
}

export interface ExerciseLog {
  exerciseId: string;
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
}
