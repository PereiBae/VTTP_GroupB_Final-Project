import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FormArray, FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {WorkoutSession} from '../../../models/workout-session';
import {DiaryService} from '../../../services/diary.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {DiaryEntry} from '../../../models/diary-entry';
import {catchError, debounceTime, distinctUntilChanged, Observable, of, Subject, Subscription, takeUntil} from 'rxjs';
import {WorkoutTemplate} from '../../../models/workout-template';
import {TemplateService} from '../../../services/template.service';
import {AuthService} from '../../../services/auth.service';
import {WorkoutStore} from '../../../stores/workout.store';
import {MatSnackBar} from '@angular/material/snack-bar';
import {ExerciseLog, ExerciseSet} from '../../../models/exercise-log';
import {SpotifyService, SpotifyTrack} from '../../../services/spotify.service';
import {switchMap} from 'rxjs/operators';
import {MatAccordion} from '@angular/material/expansion';

@Component({
  selector: 'app-diary-entry',
  standalone: false,
  templateUrl: './diary-entry.component.html',
  styleUrl: './diary-entry.component.css',
  providers:[WorkoutStore]
})
export class DiaryEntryComponent implements OnInit, OnDestroy{

  // Add ViewChild to reference MatAccordion for expansion panel control
  @ViewChild(MatAccordion) accordion!: MatAccordion;

  // Track the expansion state of each exercise panel
  expandedExercises: { [index: number]: boolean } = {};

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

    // Add debugging logs
    console.log('Component initialized, checking Spotify connection...');

    this.createForms();
    this.loadTemplates();
    // Check if Spotify is connected
    this.spotifyConnected = this.spotifyService.hasValidToken();
    console.log('Spotify connected status:', this.spotifyConnected);

    this.entryId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.entryId;

    this.checkSpotifyToken();
    this.setupSpotifySearch()

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

    if (this.spotifySearchSubscription) {
      this.spotifySearchSubscription.unsubscribe();
    }

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

        // Handle Spotify track data if it exists
        if (entry.spotifyTrackId && entry.spotifyTrackName) {
          // Create a basic track object from the stored data
          this.selectedTrack = {
            id: entry.spotifyTrackId,
            name: entry.spotifyTrackName,
            artist: entry.spotifyArtistName || '',
            albumName: '', // We don't have this stored
            albumArt: 'assets/default-album-art.jpg' // Use a default image
          };

          // If we have a Spotify connection, try to get full track details
          if (this.spotifyConnected) {
            this.spotifyService.getTrack(entry.spotifyTrackId).subscribe({
              next: (trackDetails) => {
                this.selectedTrack = trackDetails;
              },
              error: (err) => {
                console.error('Could not fetch track details:', err);
                // We'll keep the basic track info we already set
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

  // FIXED: Add an exercise without resetting the form
  addExercise(): void {
    // Save the current expansion state
    this.saveExpansionState();

    // Save current exercise form values
    const exerciseValues = this.exercises.controls.map(control => ({
      name: control.get('name')?.value,
      muscleGroup: control.get('muscleGroup')?.value,
      exerciseId: control.get('exerciseId')?.value,
      sets: (control.get('sets') as FormArray).controls.map(setControl => ({
        weight: setControl.get('weight')?.value,
        reps: setControl.get('reps')?.value,
        rpe: setControl.get('rpe')?.value,
        completed: setControl.get('completed')?.value
      }))
    }));

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

    // After update completes, restore form values and auto-expand the new exercise
    setTimeout(() => {
      // Restore previous values for existing exercises
      exerciseValues.forEach((values, index) => {
        const exerciseForm = this.exercises.at(index);
        if (exerciseForm) {
          exerciseForm.get('name')?.setValue(values.name);
          exerciseForm.get('muscleGroup')?.setValue(values.muscleGroup);
          exerciseForm.get('exerciseId')?.setValue(values.exerciseId);

          // Restore set values
          const setsArray = exerciseForm.get('sets') as FormArray;
          values.sets.forEach((setValue, setIndex) => {
            if (setIndex < setsArray.length) {
              const setForm = setsArray.at(setIndex);
              setForm.get('weight')?.setValue(setValue.weight);
              setForm.get('reps')?.setValue(setValue.reps);
              setForm.get('rpe')?.setValue(setValue.rpe);
              setForm.get('completed')?.setValue(setValue.completed);
            }
          });
        }
      });

      // Restore expansion states
      this.restoreExpansionState();

      // Auto-expand the newly added exercise
      this.expandedExercises[this.exercises.length - 1] = true;
    }, 10);
  }


  // Remove an exercise
  removeExercise(index: number): void {
    this.workoutStore.removeExercise(index);
  }

  // Add a new set to an exercise
  addSet(exerciseIndex: number): void {
    // Save the current expansion state
    this.saveExpansionState();

    // Get current form values before updating
    const exerciseForm = this.exercises.at(exerciseIndex);
    const exerciseName = exerciseForm.get('name')?.value;
    const exerciseMuscleGroup = exerciseForm.get('muscleGroup')?.value;

    // Get last set values to copy for the new set
    const exerciseSets = this.getExerciseSets(exerciseIndex);
    const lastSetIndex = exerciseSets.length - 1;
    const lastSet = lastSetIndex >= 0 ? exerciseSets.at(lastSetIndex).value : null;

    // Create new set with values copied from the last set
    const newSet: ExerciseSet = {
      setNumber: exerciseSets.length + 1,
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 0,
      rpe: lastSet?.rpe || undefined,
      completed: false
    };

    // Add the set to the store
    this.workoutStore.addSet({
      exerciseIndex,
      set: newSet
    });

    // After a slight delay to allow the store update to complete...
    setTimeout(() => {
      // Restore previous values
      const updatedExerciseForm = this.exercises.at(exerciseIndex);
      if (updatedExerciseForm) {
        updatedExerciseForm.get('name')?.setValue(exerciseName);
        updatedExerciseForm.get('muscleGroup')?.setValue(exerciseMuscleGroup);
      }

      // Restore the expansion states
      this.restoreExpansionState();

      // Ensure all sets have proper setNumber values
      this.fixSetNumbers(exerciseIndex);
    }, 10);
  }

  // FIXED: Remove a set without closing the expansion panel
  removeSet(exerciseIndex: number, setIndex: number): void {
    // Save the current expansion state
    this.saveExpansionState();

    // Get current values before updating
    const exerciseForm = this.exercises.at(exerciseIndex);
    const exerciseName = exerciseForm.get('name')?.value;
    const exerciseMuscleGroup = exerciseForm.get('muscleGroup')?.value;

    // Remove the set
    this.workoutStore.removeSet({ exerciseIndex, setIndex });

    // After a slight delay to allow the store update to complete...
    setTimeout(() => {
      // Restore previous values
      const updatedExerciseForm = this.exercises.at(exerciseIndex);
      if (updatedExerciseForm) {
        updatedExerciseForm.get('name')?.setValue(exerciseName);
        updatedExerciseForm.get('muscleGroup')?.setValue(exerciseMuscleGroup);
      }

      // Restore the expansion states
      this.restoreExpansionState();

      // Ensure all sets have proper setNumber values
      this.fixSetNumbers(exerciseIndex);
    }, 10);
  }

  // Exercise search
  openExerciseSearch(): void {
    // Store all current exercise data including sets
    const exerciseValues = this.exercises.controls.map(control => ({
      name: control.get('name')?.value,
      muscleGroup: control.get('muscleGroup')?.value,
      exerciseId: control.get('exerciseId')?.value,
      sets: (control.get('sets') as FormArray).controls.map(setControl => ({
        weight: setControl.get('weight')?.value,
        reps: setControl.get('reps')?.value,
        rpe: setControl.get('rpe')?.value,
        completed: setControl.get('completed')?.value
      }))
    }));

    // Create a completely new exercise
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

    // Add the exercise directly through the store
    this.workoutStore.addExercise(newExercise);

    // Use a slightly longer timeout to ensure the DOM has updated
    setTimeout(() => {
      // Restore all exercise data EXCEPT for the newly added one
      for (let i = 0; i < exerciseValues.length; i++) {
        const exerciseForm = this.exercises.at(i);
        if (exerciseForm) {
          // Restore basic exercise info
          exerciseForm.get('name')?.setValue(exerciseValues[i].name);
          exerciseForm.get('muscleGroup')?.setValue(exerciseValues[i].muscleGroup);
          exerciseForm.get('exerciseId')?.setValue(exerciseValues[i].exerciseId);

          // Restore all sets data
          const setsArray = exerciseForm.get('sets') as FormArray;
          exerciseValues[i].sets.forEach((setValue, setIndex) => {
            if (setIndex < setsArray.length) {
              const setForm = setsArray.at(setIndex);
              setForm.get('weight')?.setValue(setValue.weight);
              setForm.get('reps')?.setValue(setValue.reps);
              setForm.get('rpe')?.setValue(setValue.rpe);
              setForm.get('completed')?.setValue(setValue.completed);
            }
          });
        }
      }

      // Expand the newly added exercise panel
      this.expandedExercises[this.exercises.length - 1] = true;
      this.restoreExpansionState();
    }, 20); // Slightly longer timeout to ensure DOM update
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

  connectToSpotify(event?: MouseEvent) {
    // If event exists, prevent form submission
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Store the current entry ID if editing
    if (this.entryId) {
      sessionStorage.setItem('return_to_entry', this.entryId);
    }

    this.spotifyService.getAuthUrl().subscribe({
      next: url => {
        window.location.href = url;
      },
      error: err => {
        console.error('Failed to get Spotify auth URL:', err);
        this.snackBar.open('Failed to connect to Spotify. Please try again.', 'Close', {
          duration: 3000
        });
      }
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
      const audio = new Audio(this.selectedTrack.previewUrl);
      audio.play();
    }
  }

  checkSpotifyToken() {
    const token = localStorage.getItem('spotify_token');
    const refreshToken = localStorage.getItem('spotify_refresh_token');
    console.log('Spotify tokens exist:', {
      accessToken: !!token,
      refreshToken: !!refreshToken
    });
    this.spotifyConnected = !!token && !!refreshToken;
  }

  setupSpotifySearch() {
    console.log('Setting up Spotify search');

    // Clean up any existing subscription
    if (this.spotifySearchSubscription) {
      this.spotifySearchSubscription.unsubscribe();
    }

    this.spotifySearchSubscription = this.spotifySearchControl.valueChanges
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        switchMap(query => {
          console.log('Search query:', query);
          if (!query || query.length < 3) {
            return of([]);
          }

          // Check token before searching
          if (!this.spotifyConnected) {
            console.warn('Not connected to Spotify');
            return of([]);
          }

          this.isSearchingSpotify = true;
          return this.spotifyService.searchTracks(query).pipe(
            catchError(error => {
              console.error('Spotify search error:', error);
              this.isSearchingSpotify = false;

              // If we got an error even after attempted token refresh
              if (error.message === 'Failed to refresh Spotify token') {
                this.snackBar.open('Spotify connection expired. Please reconnect.', 'Connect', {
                  duration: 5000
                }).onAction().subscribe(() => {
                  this.connectToSpotify();
                });
                this.spotifyConnected = false;
              }

              return of([]);
            })
          );
        })
      )
      .subscribe({
        next: results => {
          console.log('Search results:', results.length);
          this.spotifySearchResults = results;
          this.isSearchingSpotify = false;
        },
        error: err => {
          console.error('Subscription error:', err);
          this.isSearchingSpotify = false;
        }
      });
  }

// Don't forget to add this property and cleanup
  private spotifySearchSubscription: Subscription | null = null;

  // Helper method to save the current expansion state of all panels
  // Replace the existing saveExpansionState method
  private saveExpansionState(): void {
    // We're already tracking expansion state through the expandedExercises object
    // No need to check DOM directly, just preserve the current state
    this.expandedExercises = {...this.expandedExercises};
  }

// Replace the existing restoreExpansionState method
  private restoreExpansionState(): void {
    // Wait for next change detection cycle to ensure panels are rendered
    setTimeout(() => {
      const panelElements = document.querySelectorAll('mat-expansion-panel');

      for (let i = 0; i < this.exercises.length; i++) {
        const panel = panelElements[i] as HTMLElement;
        if (!panel) continue;

        const isCurrentlyExpanded = panel.classList.contains('mat-expanded');
        const shouldBeExpanded = this.expandedExercises[i] === true;

        // Only toggle if the current state doesn't match the desired state
        if (shouldBeExpanded && !isCurrentlyExpanded) {
          const header = panel.querySelector('.mat-expansion-panel-header') as HTMLElement;
          if (header) header.click();
        } else if (!shouldBeExpanded && isCurrentlyExpanded) {
          const header = panel.querySelector('.mat-expansion-panel-header') as HTMLElement;
          if (header) header.click();
        }
      }
    }, 0);
  }

  // Helper method to fix set numbers after adding/removing sets
  private fixSetNumbers(exerciseIndex: number): void {
    const exerciseSets = this.getExerciseSets(exerciseIndex);
    for (let i = 0; i < exerciseSets.length; i++) {
      // Update the setNumber field to match the array index + 1
      exerciseSets.at(i).get('setNumber')?.setValue(i + 1);
    }
  }

  // Track expansion state when a panel is toggled manually
  onPanelToggle(exerciseIndex: number, isExpanded: boolean): void {
    this.expandedExercises[exerciseIndex] = isExpanded;
  }

  // Add this method to your component class
  trackByIndex(index: number): number {
    return index;
  }

}
