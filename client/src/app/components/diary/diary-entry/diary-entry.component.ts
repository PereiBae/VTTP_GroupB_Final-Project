import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {WorkoutSession} from '../../../models/workout-session';
import {DiaryService} from '../../../services/diary.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {DiaryEntry} from '../../../models/diary-entry';
import {debounceTime, distinctUntilChanged, Observable, of, Subject, takeUntil} from 'rxjs';
import {WorkoutTemplate} from '../../../models/workout-template';
import {TemplateService} from '../../../services/template.service';
import {AuthService} from '../../../services/auth.service';
import {WorkoutStore} from '../../../stores/workout.store';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ExerciseLog, ExerciseSet} from '../../../models/exercise-log';
import {SpotifyService, SpotifyTrack} from '../../../services/spotify.service';
import {switchMap} from 'rxjs/operators';

@Component({
  selector: 'app-diary-entry',
  standalone: false,
  templateUrl: './diary-entry.component.html',
  styleUrl: './diary-entry.component.css',
  providers:[WorkoutStore]
})
export class DiaryEntryComponent implements OnInit, OnDestroy{

  // Add inside the class
  spotifySearchControl = new FormControl('');
  spotifySearchResults: SpotifyTrack[] = [];
  selectedTrack: SpotifyTrack | null = null;
  isSearchingSpotify = false;
  spotifyConnected = false;

  diaryForm!: FormGroup;
  workoutForm!: FormGroup;
  isEdit = false;
  entryId?: string;
  loading = false;
  spotifyTrackSelected = false

  workoutSelected = false;
  templates: WorkoutTemplate[] = [];

  // ComponentStore selectors
  workout$: Observable<WorkoutSession | null>;
  workoutLoading$: Observable<boolean>;
  workoutError$: Observable<string | null>;

  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private diaryService: DiaryService,
    private templateService: TemplateService,
    private authService: AuthService,
    private workoutStore: WorkoutStore,
    private route: ActivatedRoute,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private spotifyService: SpotifyService
  ) {
    this.workout$ = this.workoutStore.currentWorkout$;
    this.workoutLoading$ = this.workoutStore.loading$;
    this.workoutError$ = this.workoutStore.error$;
  }

  ngOnInit(): void {
    this.createForms();
    this.loadTemplates();
    // Check if Spotify is connected
    this.spotifyConnected = this.spotifyService.hasValidToken();
    console.log('Spotify connected status:', this.spotifyConnected);

    this.entryId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.entryId;

    if (this.isEdit && this.entryId) {
      this.loadDiaryEntry(this.entryId);
    } else {
      // Set default date to today for new entries
      this.diaryForm.patchValue({
        date: new Date()
      });

      // Initialize empty workout
      this.workoutStore.initializeWorkout({
        name: 'Today\'s Workout',
        startTime: new Date().toISOString(),
        exercises: []
      });

      if (this.spotifyConnected) {
        this.setupSpotifySearch();
      }
    }

    // React to workoutPerformed toggle
    this.diaryForm.get('workoutPerformed')?.valueChanges.subscribe(value => {
      this.workoutSelected = value;
    });

    // Subscribe to workout store changes
    this.workout$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(workout => {
      if (workout) {
        this.updateWorkoutForm(workout);
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  createForms(): void {
    // Create diary form
    this.diaryForm = this.formBuilder.group({
      date: ['', Validators.required],
      feeling: ['okay', Validators.required],
      notes: [''],
      workoutPerformed: [false],
      spotifyTrackId: [''],
      spotifyTrackName: [''],
      spotifyArtistName: ['']
    });

    // Create workout form (will be managed through WorkoutStore)
    this.workoutForm = this.formBuilder.group({
      name: ['Today\'s Workout'],
      notes: [''],
      templateId: [null],
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

  loadDiaryEntry(id: string): void {
    this.loading = true;
    this.diaryService.getDiaryEntryById(id).subscribe({
      next: (entry) => {
        // Convert string date to Date object for the form
        const entryDate = new Date(entry.date);

        this.diaryForm.patchValue({
          date: entryDate,
          feeling: entry.feeling,
          notes: entry.notes,
          workoutPerformed: entry.workoutPerformed,
          spotifyTrackId: entry.spotifyTrackId,
          spotifyTrackName: entry.spotifyTrackName,
          spotifyArtistName: entry.spotifyArtistName
        });

        // If there's a workout, load it
        if (entry.workoutPerformed && entry.workout) {
          this.workoutSelected = true;
          this.workoutStore.setCurrentWorkout(entry.workout);
        } else {
          // Initialize empty workout
          this.workoutStore.initializeWorkout({
            name: 'Today\'s Workout',
            startTime: new Date().toISOString(),
            exercises: []
          });
        }

        // Create selected track object if Spotify track was attached
        if (entry.spotifyTrackId && entry.spotifyTrackName && entry.spotifyArtistName) {
          this.selectedTrack = {
            id: entry.spotifyTrackId,
            name: entry.spotifyTrackName,
            artist: entry.spotifyArtistName,
            albumName: 'From diary entry', // Placeholder as we don't store this
            albumArt: 'assets/default-album-art.jpg' // Default image
          };

          // If connected to Spotify, try to get the full track details
          if (this.spotifyConnected) {
            this.spotifyService.getTrack(entry.spotifyTrackId).subscribe({
              next: (trackDetails) => {
                this.selectedTrack = trackDetails;
              },
              error: (err) => {
                console.error('Could not fetch track details:', err);
                // Keep the basic track info we already set
              }
            });
          }
        }

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading diary entry', error);
        this.loading = false;
      }
    });
  }

  // Get exercises FormArray
  get exercises(): FormArray {
    return this.workoutForm.get('exercises') as FormArray;
  }

  // Create an exercise form group
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

  // Create a set form group
  createSetFormGroup(set?: ExerciseSet): FormGroup {
    return this.formBuilder.group({
      setNumber: [set?.setNumber || 1],
      weight: [set?.weight || 0],
      reps: [set?.reps || 0],
      rpe: [set?.rpe || null],
      completed: [set?.completed || false]
    });
  }

  // Get sets FormArray for an exercise
  getExerciseSets(exerciseIndex: number): FormArray {
    return this.exercises.at(exerciseIndex).get('sets') as FormArray;
  }

  // Update workout form from store
  updateWorkoutForm(workout: WorkoutSession): void {
    // Reset exercise form array
    while (this.exercises.length) {
      this.exercises.removeAt(0);
    }

    // Update form values
    this.workoutForm.patchValue({
      name: workout.name,
      notes: workout.notes,
      templateId: workout.templateId
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
        // Initialize workout with template data
        this.workoutStore.initializeWorkout({
          name: fullTemplate.name,
          startTime: new Date().toISOString(),
          templateId: fullTemplate.id,
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
      }
    });
  }

  // Modify addExercise method
  addExercise(): void {
    const newExercise: ExerciseLog = {
      exerciseId: '',
      name: 'New Exercise', // Ensure this default name is preserved
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

  // Remove an exercise
  removeExercise(index: number): void {
    this.workoutStore.removeExercise(index);
  }

  // Add a new set to an exercise
  addSet(exerciseIndex: number): void {
    const exerciseSets = this.getExerciseSets(exerciseIndex);
    const exerciseForm = this.exercises.at(exerciseIndex);
    const exerciseName = exerciseForm.get('name')?.value;
    const lastSet = exerciseSets.at(exerciseSets.length - 1)?.value;

    const newSet: ExerciseSet = {
      setNumber: exerciseSets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      rpe: undefined,
      completed: false
    };

    // Add the set to the store
    this.workoutStore.addSet({
      exerciseIndex,
      set: newSet
    });

    // Preserve the exercise name by setting it after a small delay
    // This ensures the form has been updated by the store first
    setTimeout(() => {
      const updatedExerciseForm = this.exercises.at(exerciseIndex);
      if (updatedExerciseForm && exerciseName) {
        updatedExerciseForm.get('name')?.patchValue(exerciseName);
      }
    }, 0);
  }

  // Remove a set from an exercise
  removeSet(exerciseIndex: number, setIndex: number): void {
    this.workoutStore.removeSet({ exerciseIndex, setIndex });
  }

  // Exercise search
  openExerciseSearch(): void {
    // Before adding a new exercise, let's save the current state of existing exercises
    const currentExercises = this.exercises.controls.map(control => ({
      name: control.get('name')?.value,
      muscleGroup: control.get('muscleGroup')?.value,
      exerciseId: control.get('exerciseId')?.value
    }));

    // Add the new exercise
    this.addExercise();

    // After adding the exercise, restore the previous exercise names
    setTimeout(() => {
      // Skip the last exercise (the newly added one)
      for (let i = 0; i < currentExercises.length; i++) {
        const exerciseForm = this.exercises.at(i);
        if (exerciseForm) {
          exerciseForm.get('name')?.setValue(currentExercises[i].name);
          exerciseForm.get('muscleGroup')?.setValue(currentExercises[i].muscleGroup);
          exerciseForm.get('exerciseId')?.setValue(currentExercises[i].exerciseId);
        }
      }
    }, 0);
  }

  // Save the diary entry and workout if applicable
  saveDiaryEntry(): void {
    if (this.diaryForm.invalid) return;

    this.loading = true;

    // Extract form values
    const diaryFormValues = this.diaryForm.value;

    // Convert Date object to string format
    const dateStr = diaryFormValues.date.toISOString().split('T')[0];

    // Create the diary entry object
    const entry: DiaryEntry = {
      date: dateStr,
      feeling: diaryFormValues.feeling,
      notes: diaryFormValues.notes,
      workoutPerformed: diaryFormValues.workoutPerformed,
      spotifyTrackId: diaryFormValues.spotifyTrackId,
      spotifyTrackName: diaryFormValues.spotifyTrackName,
      spotifyArtistName: diaryFormValues.spotifyArtistName
    };

    // If workout was performed, include the workout details
    if (diaryFormValues.workoutPerformed) {
      // Use the observable to get the current workout
      this.workout$.subscribe(currentWorkout => {
        if (currentWorkout) {
          // Update the workout with form values
          const workout: WorkoutSession = {
            ...currentWorkout,
            name: this.workoutForm.value.name,
            notes: this.workoutForm.value.notes
          };

          // Update exercises from form
          this.workoutForm.value.exercises.forEach((exerciseForm: any, index: number) => {
            if (index < workout.exercises.length) {
              workout.exercises[index] = {
                ...workout.exercises[index],
                name: exerciseForm.name,
                muscleGroup: exerciseForm.muscleGroup,
                sets: exerciseForm.sets.map((setForm: any) => ({
                  setNumber: setForm.setNumber,
                  weight: setForm.weight,
                  reps: setForm.reps,
                  rpe: setForm.rpe,
                  completed: setForm.completed
                }))
              };
            }
          });

          // Add the workout to the diary entry
          entry.workout = workout;

          // Now proceed with saving
          this.saveEntry(entry);
        } else {
          // No workout data available
          this.saveEntry(entry);
        }
      });
    } else {
      // No workout to include
      this.saveEntry(entry);
    }
  }

  // Helper method to save entry
  private saveEntry(entry: DiaryEntry): void {
    if (this.isEdit && this.entryId) {
      // Update existing entry
      this.diaryService.updateDiaryEntry(this.entryId, entry).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Diary entry updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/diary']);
        },
        error: (error) => {
          console.error('Error updating diary entry', error);
          this.loading = false;
          this.snackBar.open('Error updating diary entry', 'Close', { duration: 3000 });
        }
      });
    } else {
      // Create new entry
      this.diaryService.createDiaryEntry(entry).subscribe({
        next: () => {
          this.loading = false;
          this.snackBar.open('Diary entry created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/diary']);
        },
        error: (error) => {
          console.error('Error creating diary entry', error);
          this.loading = false;
          this.snackBar.open('Error creating diary entry', 'Close', { duration: 3000 });
        }
      });
    }
  }

  get exerciseControls() {
    return (this.exercises as FormArray).controls;
  }

  getSetsControls(exerciseIndex: number) {
    return (this.getExerciseSets(exerciseIndex) as FormArray).controls;
  }

  connectToSpotify() {
    this.spotifyService.getAuthUrl().subscribe(url => {
      window.location.href = url;
    });
  }

  selectTrack(track: SpotifyTrack) {
    this.selectedTrack = track;
    this.spotifySearchResults = [];
    this.spotifySearchControl.setValue('');

    // Update form values
    this.diaryForm.patchValue({
      spotifyTrackId: track.id,
      spotifyTrackName: track.name,
      spotifyArtistName: track.artist
    });
  }

  clearSelectedTrack() {
    this.selectedTrack = null;

    // Clear form values
    this.diaryForm.patchValue({
      spotifyTrackId: null,
      spotifyTrackName: null,
      spotifyArtistName: null
    });
  }

  playPreview() {
    if (this.selectedTrack && this.selectedTrack.previewUrl) {
      // Create and play audio element
      const audio = new Audio(this.selectedTrack.previewUrl);
      audio.play();
    }
  }

  setupSpotifySearch() {
    this.spotifySearchControl.valueChanges.pipe(
      debounceTime(500),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 3) {
          return of([]);
        }

        this.isSearchingSpotify = true;
        return this.spotifyService.searchTracks(query);
      })
    ).subscribe({
      next: results => {
        this.spotifySearchResults = results;
        this.isSearchingSpotify = false;
      },
      error: err => {
        console.error('Error searching Spotify:', err);
        this.isSearchingSpotify = false;

        // Handle token expiration
        if (err.status === 401) {
          this.spotifyConnected = false;
          this.spotifyService.clearToken();
        }
      }
    });
  }

}
