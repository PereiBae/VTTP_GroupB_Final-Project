import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WorkoutService} from '../../../services/workout.service';
import {TemplateService} from '../../../services/template.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {WorkoutTemplate} from '../../../models/workout-template';
import {WorkoutSession} from '../../../models/workout-session';
import {ExerciseLog, ExerciseSet} from '../../../models/exercise-log';
import {WorkoutStore} from '../../../stores/workout.store';
import {Observable, Subject, takeUntil} from 'rxjs';

@Component({
  selector: 'app-workout-session',
  standalone: false,
  templateUrl: './workout-session.component.html',
  styleUrl: './workout-session.component.css',
  providers: [WorkoutStore]
})
export class WorkoutSessionComponent implements OnInit, OnDestroy{

  workoutForm!: FormGroup;
  isEdit = false;
  workoutId?: string;
  hasEndTime = false;
  templates: WorkoutTemplate[] = [];

  // ComponentStore selectors
  workout$: Observable<WorkoutSession | null>;
  loading$: Observable<boolean>;
  error$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private workoutService: WorkoutService,
    private workoutStore: WorkoutStore,
    private templateService: TemplateService,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {
    // Initialize observables from store
    this.workout$ = this.workoutStore.currentWorkout$;
    this.loading$ = this.workoutStore.loading$;
    this.error$ = this.workoutStore.error$;
  }

  ngOnInit() {
    this.createForm();
    this.loadTemplates();

    this.workoutId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.workoutId;

    if (this.isEdit && this.workoutId) {
      // Load existing workout using the store
      this.workoutStore.loadWorkout(this.workoutId);
    } else {
      // Initialize new workout using the store
      this.workoutStore.initializeWorkout({
        name: 'My Workout',
        startTime: new Date().toISOString(),
        exercises: []
      });
    }

    // Subscribe to workout changes from the store
    this.workout$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(workout => {
      if (workout) {
        this.updateFormFromWorkout(workout);
        this.hasEndTime = !!workout.endTime;
      }
    });

    // Subscribe to error messages
    this.error$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(error => {
      if (error) {
        this.snackBar.open(error, 'Close', { duration: 3000 });
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForm(): void {
    this.workoutForm = this.formBuilder.group({
      name: ['', Validators.required],
      startTime: ['', Validators.required],
      endTime: [''],
      templateId: [null],
      notes: [''],
      exercises: this.formBuilder.array([])
    });
  }

  loadTemplates(): void {
    this.templateService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
      },
      error: (error) => {
        console.error('Error loading templates', error);
        this.snackBar.open('Error loading templates', 'Close', { duration: 3000 });
      }
    });
  }

  updateFormFromWorkout(workout: WorkoutSession): void {
    // Reset exercise form array
    while (this.exercises.length) {
      this.exercises.removeAt(0);
    }

    // Patch basic workout details
    this.workoutForm.patchValue({
      name: workout.name,
      startTime: workout.startTime ? new Date(workout.startTime) : new Date(),
      endTime: workout.endTime ? new Date(workout.endTime) : null,
      templateId: workout.templateId,
      notes: workout.notes
    });

    // Add exercises to form array
    if (workout.exercises && workout.exercises.length > 0) {
      workout.exercises.forEach(exercise => {
        const exerciseFormGroup = this.createExerciseFormGroup(exercise);
        this.exercises.push(exerciseFormGroup);
      });
    }
  }

  onTemplateSelected(template: WorkoutTemplate | null): void {
    if (!template) return;

    // Load full template with exercises
    this.templateService.getTemplateWithExercises(template.id!).subscribe({
      next: (fullTemplate) => {
        // Initialize workout with template data in the store
        this.workoutStore.initializeWorkout({
          name: template.name,
          startTime: new Date().toISOString(),
          templateId: template.id,
          exercises: fullTemplate.exercises?.map(te => ({
            exerciseId: te.exerciseId,
            name: te.exerciseName,
            muscleGroup: '',
            sets: Array(te.sets).fill(0).map((_, i) => ({
              setNumber: i + 1,
              weight: te.weight,
              reps: te.reps,
              rpe: undefined,
              completed: false
            }))
          })) || []
        });
      },
      error: (error) => {
        console.error('Error loading template details', error);
        this.snackBar.open('Error loading template details', 'Close', { duration: 3000 });
      }
    });
  }

  createExerciseFormGroup(exercise?: ExerciseLog): FormGroup {
    const exerciseGroup = this.formBuilder.group({
      exerciseId: [exercise?.exerciseId || ''],
      name: [exercise?.name || '', Validators.required],
      muscleGroup: [exercise?.muscleGroup || ''],
      sets: this.formBuilder.array([])
    });

    // Add sets if available
    const setsArray = exerciseGroup.get('sets') as FormArray;
    if (exercise && exercise.sets && exercise.sets.length > 0) {
      exercise.sets.forEach(set => {
        setsArray.push(this.createSetFormGroup(set));
      });
    } else {
      // Add default set if none provided
      setsArray.push(this.createSetFormGroup());
    }

    return exerciseGroup;
  }

  createSetFormGroup(set?: ExerciseSet): FormGroup {
    return this.formBuilder.group({
      setNumber: [set?.setNumber || this.getNextSetNumber()],
      weight: [set?.weight || 0],
      reps: [set?.reps || 0],
      rpe: [set?.rpe || null],
      completed: [set?.completed || false]
    });
  }

  getNextSetNumber(): number {
    // For a new set, default to the next number in sequence
    return 1; // This will be updated when added to the form
  }

  get exercises(): FormArray {
    return this.workoutForm.get('exercises') as FormArray;
  }

  getExerciseSets(exerciseIndex: number): FormArray {
    return this.exercises.at(exerciseIndex).get('sets') as FormArray;
  }

  getExerciseSummary(exerciseForm: any): string {
    const setsCount = exerciseForm.get('sets')?.controls?.length || 0;
    return `${setsCount} sets`;
  }

  addExercise(): void {
    const newExercise: ExerciseLog = {
      exerciseId: '',
      name: 'New Exercise',
      muscleGroup: '',
      sets: [{
        setNumber: 1,
        weight: 0,
        reps: 0,
        rpe: undefined,
        completed: false
      }]
    };

    this.workoutStore.addExercise(newExercise);
  }

  removeExercise(index: number): void {
    this.workoutStore.removeExercise(index);
  }

  addSet(exerciseIndex: number): void {
    const exerciseSets = this.getExerciseSets(exerciseIndex);
    const lastSet = exerciseSets.at(exerciseSets.length - 1)?.value;

    const newSet: ExerciseSet = {
      setNumber: exerciseSets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      rpe: undefined,
      completed: false
    };

    this.workoutStore.addSet({ exerciseIndex, set: newSet });
  }

  removeSet(exerciseIndex: number, setIndex: number): void {
    this.workoutStore.removeSet({ exerciseIndex, setIndex });
  }

  openExerciseSearch(): void {
    // For now, just add an empty exercise
    // In a future implementation, this would open a search dialog
    this.addExercise();
  }

  saveWorkout(): void {
    if (this.workoutForm.invalid) return;

    // Update the workout in the store with form values
    const formValue = this.workoutForm.value;

    // First, update basic workout details
    this.workoutStore.updateWorkoutDetails({
      name: formValue.name,
      startTime: formValue.startTime?.toISOString(),
      endTime: formValue.endTime?.toISOString(),
      notes: formValue.notes,
      templateId: formValue.templateId
    });

    // Then update each exercise from the form
    formValue.exercises.forEach((exerciseForm: any, index: number) => {
      this.workoutStore.updateExercise({
        index,
        exercise: {
          exerciseId: exerciseForm.exerciseId,
          name: exerciseForm.name,
          muscleGroup: exerciseForm.muscleGroup,
          sets: exerciseForm.sets.map((setForm: any) => ({
            setNumber: setForm.setNumber,
            weight: setForm.weight,
            reps: setForm.reps,
            rpe: setForm.rpe,
            completed: setForm.completed
          }))
        }
      });
    });

    // Save the workout
    this.workoutStore.saveWorkout();

    // Navigate back after save
    setTimeout(() => {
      this.router.navigate(['/workouts']);
    }, 500);
  }

  finishWorkout(): void {
    // Update the form data first
    if (this.workoutForm.invalid) return;

    const formValue = this.workoutForm.value;

    // Update workout details before finishing
    this.workoutStore.updateWorkoutDetails({
      name: formValue.name,
      notes: formValue.notes
    });

    // Finish workout (sets end time and saves)
    this.workoutStore.finishWorkout();

    // Navigate back to workouts list
    setTimeout(() => {
      this.router.navigate(['/workouts']);
    }, 500);
  }

  deleteWorkout(): void {
    if (!this.workoutId || !confirm('Are you sure you want to delete this workout?')) return;

    this.workoutService.deleteWorkoutSession(this.workoutId).subscribe({
      next: () => {
        this.snackBar.open('Workout deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/workouts']);
      },
      error: (error) => {
        console.error('Error deleting workout', error);
        this.snackBar.open('Error deleting workout', 'Close', { duration: 3000 });
      }
    });
  }

}
