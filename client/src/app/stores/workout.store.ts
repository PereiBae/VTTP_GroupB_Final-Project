import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { Observable } from 'rxjs';
import { tap, switchMap, withLatestFrom } from 'rxjs/operators';
import { WorkoutService } from '../services/workout.service';
import { WorkoutSession} from '../models/workout-session'
import { ExerciseLog, ExerciseSet } from '../models/exercise-log';

// Define the state shape
export interface WorkoutState {
  currentWorkout: WorkoutSession | null;
  loading: boolean;
  error: string | null;
}

// Define the initial state
const initialState: WorkoutState = {
  currentWorkout: null,
  loading: false,
  error: null
};

@Injectable()
export class WorkoutStore extends ComponentStore<WorkoutState> {

  constructor(private workoutService: WorkoutService) {
    super(initialState);
  }

  // SELECTORS - Extract data from state
  readonly currentWorkout$ = this.select(state => state.currentWorkout);
  readonly loading$ = this.select(state => state.loading);
  readonly error$ = this.select(state => state.error);

  // Derived selectors - Calculate values based on other selectors
  readonly exercises$ = this.select(
    this.currentWorkout$,
    (workout) => workout?.exercises || []
  );

  readonly hasExercises$ = this.select(
    this.exercises$,
    (exercises) => exercises.length > 0
  );

  // UPDATERS
  readonly setLoading = this.updater((state, loading: boolean) => ({
    ...state,
    loading,
    error: loading ? null : state.error // Clear error when loading starts
  }));

  readonly setError = this.updater((state, error: string | null) => ({
    ...state,
    error,
    loading: false
  }));

  readonly setCurrentWorkout = this.updater((state, workout: WorkoutSession | null) => ({
    ...state,
    currentWorkout: workout,
    loading: false,
    error: null
  }));

  // Update specific details of the workout without changing the whole object
  readonly updateWorkoutDetails = this.updater((state, details: Partial<WorkoutSession>) => {
    if (!state.currentWorkout) return state;

    return {
      ...state,
      currentWorkout: {
        ...state.currentWorkout,
        ...details
      }
    };
  });

  // Add a new exercise to the workout
  readonly addExercise = this.updater((state, exercise: ExerciseLog) => {
    if (!state.currentWorkout) return state;

    const exercises = [...(state.currentWorkout.exercises || []), exercise];

    return {
      ...state,
      currentWorkout: {
        ...state.currentWorkout,
        exercises
      }
    };
  });

  // Update an existing exercise at a specific index
  readonly updateExercise = this.updater((state, payload: { index: number, exercise: Partial<ExerciseLog> }) => {
    if (!state.currentWorkout) return state;

    const { index, exercise } = payload;
    const exercises = [...state.currentWorkout.exercises];

    if (index >= 0 && index < exercises.length) {
      exercises[index] = { ...exercises[index], ...exercise };
    }

    return {
      ...state,
      currentWorkout: {
        ...state.currentWorkout,
        exercises
      }
    };
  });

  // Remove an exercise from the workout
  readonly removeExercise = this.updater((state, index: number) => {
    if (!state.currentWorkout) return state;

    const exercises = state.currentWorkout.exercises.filter((_, i) => i !== index);

    return {
      ...state,
      currentWorkout: {
        ...state.currentWorkout,
        exercises
      }
    };
  });

  // Add a set to a specific exercise
  readonly addSet = this.updater((state, payload: { exerciseIndex: number, set: ExerciseSet }) => {
    if (!state.currentWorkout) return state;

    const { exerciseIndex, set } = payload;
    const exercises = [...state.currentWorkout.exercises];

    if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
      const exercise = exercises[exerciseIndex];
      exercises[exerciseIndex] = {
        ...exercise,
        sets: [...exercise.sets, set]
      };
    }

    return {
      ...state,
      currentWorkout: {
        ...state.currentWorkout,
        exercises
      }
    };
  });

  // Update a specific set within an exercise
  readonly updateSet = this.updater(
    (state, payload: { exerciseIndex: number, setIndex: number, set: Partial<ExerciseSet> }) => {
      if (!state.currentWorkout) return state;

      const { exerciseIndex, setIndex, set } = payload;
      const exercises = [...state.currentWorkout.exercises];

      if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
        const exercise = exercises[exerciseIndex];
        if (setIndex >= 0 && setIndex < exercise.sets.length) {
          const sets = [...exercise.sets];
          sets[setIndex] = { ...sets[setIndex], ...set };

          exercises[exerciseIndex] = {
            ...exercise,
            sets
          };
        }
      }

      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises
        }
      };
    }
  );

  // Remove a set from an exercise
  readonly removeSet = this.updater(
    (state, payload: { exerciseIndex: number, setIndex: number }) => {
      if (!state.currentWorkout) return state;

      const { exerciseIndex, setIndex } = payload;
      const exercises = [...state.currentWorkout.exercises];

      if (exerciseIndex >= 0 && exerciseIndex < exercises.length) {
        const exercise = exercises[exerciseIndex];
        if (setIndex >= 0 && setIndex < exercise.sets.length) {
          const sets = exercise.sets.filter((_, i) => i !== setIndex);

          exercises[exerciseIndex] = {
            ...exercise,
            sets
          };
        }
      }

      return {
        ...state,
        currentWorkout: {
          ...state.currentWorkout,
          exercises
        }
      };
    }
  );

  // EFFECTS (for side effects like API calls)
  // Initialize a new workout with default values
  readonly initializeWorkout = this.effect((params$: Observable<Partial<WorkoutSession>>) => {
    return params$.pipe(
      tap(() => this.setLoading(true)),
      tap(workoutParams => {
        const workout: WorkoutSession = {
          name: workoutParams.name || 'My Workout',
          startTime: workoutParams.startTime || new Date().toISOString(),
          exercises: workoutParams.exercises || [],
          templateId: workoutParams.templateId
        };
        this.setCurrentWorkout(workout);
      })
    );
  });

  // Load an existing workout by ID from the server
  readonly loadWorkout = this.effect((workoutId$: Observable<string>) => {
    return workoutId$.pipe(
      tap(() => this.setLoading(true)),
      switchMap(workoutId =>
        this.workoutService.getWorkoutSessionById(workoutId).pipe(
          tap({
            next: (workout) => this.setCurrentWorkout(workout),
            error: (error) => this.setError(error.message || 'Failed to load workout')
          })
        )
      )
    );
  });

  // Save the current workout to the server
  readonly saveWorkout = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      withLatestFrom(this.currentWorkout$),
      tap(([_, workout]) => {
        if (!workout) {
          this.setError('No workout to save');
          return;
        }
        this.setLoading(true);
      }),
      switchMap(([_, workout]) => {
        if (!workout) return [];

        if (workout.id) {
          // Update existing workout
          return this.workoutService.updateWorkoutSession(workout.id, workout).pipe(
            tap({
              next: (updatedWorkout) => this.setCurrentWorkout(updatedWorkout),
              error: (error) => this.setError(error.message || 'Failed to update workout')
            })
          );
        } else {
          // Create new workout
          return this.workoutService.createWorkoutSession(workout).pipe(
            tap({
              next: (createdWorkout) => this.setCurrentWorkout(createdWorkout),
              error: (error) => this.setError(error.message || 'Failed to create workout')
            })
          );
        }
      })
    );
  });

  // Mark the workout as finished and save it
  readonly finishWorkout = this.effect((trigger$: Observable<void>) => {
    return trigger$.pipe(
      withLatestFrom(this.currentWorkout$),
      tap(([_, currentWorkout]) => {
        if (currentWorkout) {
          this.setCurrentWorkout({
            ...currentWorkout,
            endTime: new Date().toISOString()
          });
        }
      }),
      switchMap(() => [this.saveWorkout()])
    );
  });

}
