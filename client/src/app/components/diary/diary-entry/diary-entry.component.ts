import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {WorkoutSession} from '../../../models/workout-session';
import {DiaryService} from '../../../services/diary.service';
import {WorkoutService} from '../../../services/workout.service';
import {ActivatedRoute, Router} from '@angular/router';
import {MatDialog} from '@angular/material/dialog';
import {DiaryEntry} from '../../../models/diary-entry';
import {formatDate} from '@angular/common';

@Component({
  selector: 'app-diary-entry',
  standalone: false,
  templateUrl: './diary-entry.component.html',
  styleUrl: './diary-entry.component.css'
})
export class DiaryEntryComponent implements OnInit{

  diaryForm!: FormGroup;
  isEdit = false;
  entryId?: string;
  loading = false;

  workoutSelected = false;
  selectedWorkout?: WorkoutSession;
  spotifyTrackSelected = false;

  private formBuilder = inject(FormBuilder)
  private diaryService = inject(DiaryService)
  private workoutService = inject(WorkoutService)
  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private dialog = inject(MatDialog)

  ngOnInit(): void {
    this.createForm();
    this.entryId = this.route.snapshot.paramMap.get('id') || undefined;
    this.isEdit = !!this.entryId;

    if (this.isEdit && this.entryId) {
      this.loadDiaryEntry(this.entryId);
    } else {
      // Set default date to today for new entries
      this.diaryForm.patchValue({
        date: new Date()
      });
    }

    // React to workoutPerformed toggle
    this.diaryForm.get('workoutPerformed')?.valueChanges.subscribe(value => {
      if (!value) {
        this.workoutSelected = false;
        this.selectedWorkout = undefined;
      }
    });
  }

  createForm(): void {
    this.diaryForm = this.formBuilder.group({
      date: ['', Validators.required],
      feeling: ['okay', Validators.required],
      notes: [''],
      workoutPerformed: [false],
      workoutSessionId: [''],
      spotifyTrackId: [''],
      spotifyTrackName: [''],
      spotifyArtistName: ['']
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
          workoutSessionId: entry.workoutSessionId,
          spotifyTrackId: entry.spotifyTrackId,
          spotifyTrackName: entry.spotifyTrackName,
          spotifyArtistName: entry.spotifyArtistName
        });

        // If there's a workout, load it
        if (entry.workoutPerformed && entry.workoutSessionId) {
          this.loadWorkout(entry.workoutSessionId);
        }

        // Check if Spotify track is set
        this.spotifyTrackSelected = !!entry.spotifyTrackId;

        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading diary entry', error);
        this.loading = false;
      }
    });
  }

  loadWorkout(workoutId: string): void {
    this.workoutService.getWorkoutSessionById(workoutId).subscribe({
      next: (workout) => {
        this.selectedWorkout = workout;
        this.workoutSelected = true;
      },
      error: (error) => {
        console.error('Error loading workout', error);
      }
    });
  }

  saveDiaryEntry(): void {
    if (this.diaryForm.invalid) return;

    this.loading = true;

    // Extract form values
    const formValues = this.diaryForm.value;

    // Convert Date object to ISO string format
    const dateStr = formatDate(formValues.date, 'yyyy-MM-dd', 'en-US');

    const entry: DiaryEntry = {
      date: dateStr,
      feeling: formValues.feeling,
      notes: formValues.notes,
      workoutPerformed: formValues.workoutPerformed,
      workoutSessionId: formValues.workoutSessionId,
      spotifyTrackId: formValues.spotifyTrackId,
      spotifyTrackName: formValues.spotifyTrackName,
      spotifyArtistName: formValues.spotifyArtistName
    };

    if (this.isEdit && this.entryId) {
      // Update existing entry
      this.diaryService.updateDiaryEntry(this.entryId, entry).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/diary']);
        },
        error: (error) => {
          console.error('Error updating diary entry', error);
          this.loading = false;
        }
      });
    } else {
      // Create new entry
      this.diaryService.createDiaryEntry(entry).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/diary']);
        },
        error: (error) => {
          console.error('Error creating diary entry', error);
          this.loading = false;
        }
      });
    }
  }

  startNewWorkout(): void {
    // This would navigate to workout creation
    // For now, we'll implement a placeholder
    alert('This feature will be implemented in the next phase');
  }

  openWorkoutSelector(): void {
    // This would open a dialog to select from recent workouts
    // For now, we'll implement a placeholder
    alert('This feature will be implemented in the next phase');
  }

  viewWorkout(): void {
    if (this.selectedWorkout && this.selectedWorkout.id) {
      this.router.navigate(['/workouts', this.selectedWorkout.id]);
    }
  }

  removeWorkout(): void {
    this.workoutSelected = false;
    this.selectedWorkout = undefined;
    this.diaryForm.patchValue({
      workoutSessionId: '',
      workoutPerformed: false
    });
  }

}
