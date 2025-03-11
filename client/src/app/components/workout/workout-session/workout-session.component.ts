import {Component, inject, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WorkoutService} from '../../../services/workout.service';
import {TemplateService} from '../../../services/template.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ExerciseAPIService} from '../../../services/exercise-api.service';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatDialog} from '@angular/material/dialog';
import {WorkoutTemplate} from '../../../models/workout-template';
import {WorkoutSession} from '../../../models/workout-session';
import {ExerciseLog, ExerciseSet} from '../../../models/exercise-log';

@Component({
  selector: 'app-workout-session',
  standalone: false,
  templateUrl: './workout-session.component.html',
  styleUrl: './workout-session.component.css'
})
export class WorkoutSessionComponent implements OnInit{

  private formBuilder = inject(FormBuilder)
  private workoutService = inject(WorkoutService)
  private templateService = inject(TemplateService)
  private exerciseAPIService = inject(ExerciseAPIService)
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  workoutForm!: FormGroup;
  isEdit = false;
  workoutId?: string;
  loading = false;
  hasEndTime = false;

  templates: WorkoutTemplate[] = [];

  ngOnInit() {
    this.createForm();
    this.loadTemplates();

    this.workoutId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.workoutId;

    if (this.isEdit && this.workoutId) {
      this.loadWorkout(this.workoutId);
    } else {
      // Set default start time to now for new workouts
      this.workoutForm.patchValue({
        startTime: new Date(),
        name: 'My Workout'
      });
    }
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
      }
    });
  }

  loadWorkout(id: string): void {
    this.loading = true;
    this.workoutService.getWorkoutSessionById(id).subscribe({
      next: (workout) => {
        // Reset exercise form array
        while (this.exercises.length) {
          this.exercises.removeAt(0);
        }

        // Patch basic workout details
        this.workoutForm.patchValue({
          name: workout.name,
          startTime: new Date(workout.startTime),
          endTime: workout.endTime ? new Date(workout.endTime) : null,
          templateId: workout.templateId,
          notes: workout.notes
        });

        this.hasEndTime = !!workout.endTime;

        // Add exercises to form array
        if (workout.exercises && workout.exercises.length > 0) {
          workout.exercises.forEach(exercise => {
            const exerciseFormGroup = this.createExerciseFormGroup(exercise);
            this.exercises.push(exerciseFormGroup);
          });
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workout', error);
        this.loading = false;
      }
    });
  }

  onTemplateSelected(template: WorkoutTemplate | null): void {
    if (!template) return;

    // Update workout name
    this.workoutForm.patchValue({
      name: template.name,
      templateId: template.id
    });

    // Clear existing exercises
    while (this.exercises.length) {
      this.exercises.removeAt(0);
    }

    // Load full template with exercises
    this.templateService.getTemplateWithExercises(template.id!).subscribe({
      next: (fullTemplate) => {
        if (fullTemplate.exercises && fullTemplate.exercises.length > 0) {
          fullTemplate.exercises.forEach(templateExercise => {
            // Create exercise form group
            const exercise: ExerciseLog = {
              exerciseId: templateExercise.exerciseId,
              name: templateExercise.exerciseName,
              muscleGroup: '',
              sets: []
            };

            // Add sets based on template
            for (let i = 0; i < templateExercise.sets; i++) {
              exercise.sets.push({
                setNumber: i + 1,
                weight: templateExercise.weight,
                reps: templateExercise.reps,
                completed: false
              });
            }

            const exerciseFormGroup = this.createExerciseFormGroup(exercise);
            this.exercises.push(exerciseFormGroup);
          });
        }
      },
      error: (error) => {
        console.error('Error loading template details', error);
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
    this.exercises.push(this.createExerciseFormGroup());
  }

  removeExercise(index: number): void {
    this.exercises.removeAt(index);
  }

  addSet(exerciseIndex: number): void {
    const sets = this.getExerciseSets(exerciseIndex);
    const lastSet = sets.at(sets.length - 1)?.value;

    // Create new set based on the last one
    const newSet = this.createSetFormGroup({
      setNumber: sets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      rpe: 0,
      completed: false
    });

    sets.push(newSet);
  }

  removeSet(exerciseIndex: number, setIndex: number): void {
    const sets = this.getExerciseSets(exerciseIndex);
    sets.removeAt(setIndex);

    // Update set numbers for remaining sets
    for (let i = 0; i < sets.length; i++) {
      sets.at(i).get('setNumber')?.setValue(i + 1);
    }
  }

  openExerciseSearch(): void {
    // For now, just add an empty exercise
    // In a future implementation, this would open a search dialog
    this.addExercise();
  }

  saveWorkout(): void {
    if (this.workoutForm.invalid) return;

    this.loading = true;

    const formValue = this.workoutForm.value;

    // Format dates as ISO strings
    const startTimeStr = formValue.startTime.toISOString();
    const endTimeStr = formValue.endTime ? formValue.endTime.toISOString() : null;

    // Map form data to model
    const workout: WorkoutSession = {
      name: formValue.name,
      startTime: startTimeStr,
      endTime: endTimeStr,
      templateId: formValue.templateId,
      notes: formValue.notes,
      exercises: formValue.exercises.map((ex: any) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        sets: ex.sets.map((set: any) => ({
          setNumber: set.setNumber,
          weight: set.weight,
          reps: set.reps,
          rpe: set.rpe,
          completed: set.completed
        }))
      }))
    };

    if (this.isEdit && this.workoutId) {
      // Update existing workout
      this.workoutService.updateWorkoutSession(this.workoutId, workout).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Workout updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/workouts']);
        },
        error: (error) => {
          console.error('Error updating workout', error);
          this.loading = false;
          this.snackBar.open('Error updating workout', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Create new workout
      this.workoutService.createWorkoutSession(workout).subscribe({
        next: (createdWorkout) => {
          this.loading = false;
          this.snackBar.open('Workout started successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/workouts', createdWorkout.id]);
        },
        error: (error) => {
          console.error('Error creating workout', error);
          this.loading = false;
          this.snackBar.open('Error starting workout', 'Close', { duration: 3000 });
        }
      });
    }
  }

  finishWorkout(): void {
    // Set end time to now
    this.workoutForm.patchValue({
      endTime: new Date()
    });

    this.hasEndTime = true;
    this.saveWorkout();
  }

  deleteWorkout(): void {
    if (!this.workoutId || !confirm('Are you sure you want to delete this workout?')) return;

    this.loading = true;
    this.workoutService.deleteWorkoutSession(this.workoutId).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Workout deleted successfully', 'Close', { duration: 3000 });
        this.router.navigate(['/workouts']);
      },
      error: (error) => {
        console.error('Error deleting workout', error);
        this.loading = false;
        this.snackBar.open('Error deleting workout', 'Close', { duration: 3000 });
      }
    });
  }

}
