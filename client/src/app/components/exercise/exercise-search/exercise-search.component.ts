import {Component, inject, OnInit} from '@angular/core';
import {Exercise} from '../../../models/exercise';
import {MatDialog} from '@angular/material/dialog';
import {ExerciseAPIService} from '../../../services/exercise-api.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatChipListboxChange} from '@angular/material/chips';

@Component({
  selector: 'app-exercise-search',
  standalone: false,
  templateUrl: './exercise-search.component.html',
  styleUrl: './exercise-search.component.css'
})
export class ExerciseSearchComponent implements OnInit {

  exercises: Exercise[] = [];
  loading = false;
  searchQuery = '';
  selectedMuscle = 'all';
  pageSize = 20;
  currentPage = 0;
  totalExercises = 0;

  private exerciseAPIService = inject(ExerciseAPIService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  ngOnInit(): void {
    this.loadInitialExercises();
  }

  loadInitialExercises(): void {
    this.loading = true;

    this.exerciseAPIService.getAllExercises().subscribe({
      next: (exercises) => {
        this.totalExercises = exercises.length;
        this.displayPaginatedResults(exercises);
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading exercises', error);
        this.loading = false;
        this.snackBar.open('Error loading exercises', 'Close', { duration: 3000 });
      }
    });
  }

  searchExercises(): void {
    if (!this.searchQuery && this.selectedMuscle === 'all') {
      this.loadInitialExercises();
      return;
    }

    this.loading = true;

    if (this.selectedMuscle !== 'all') {
      // Search by muscle
      this.exerciseAPIService.getExercisesByMuscle(this.selectedMuscle).subscribe({
        next: (exercises) => {
          this.exercises = exercises.slice(0, 20);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error searching exercises by muscle', error);
          this.loading = false;
          this.snackBar.open('Error searching exercises', 'Close', { duration: 3000 });
        }
      });
    } else if (this.searchQuery) {
      // Search by query only
      this.exerciseAPIService.searchExercises(this.searchQuery).subscribe({
        next: (exercises) => {
          this.exercises = exercises.slice(0, 20);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error searching exercises', error);
          this.loading = false;
          this.snackBar.open('Error searching exercises', 'Close', { duration: 3000 });
        }
      });
    }
  }

  onMuscleFilterChange(event: MatChipListboxChange): void {
    this.selectedMuscle = event.value;
    console.log('Selected muscle:', this.selectedMuscle);
    this.searchExercises();
  }

  viewExerciseDetails(exercise: Exercise): void {
    // For now, just show a snackbar with exercise details
    // In future could open a dialog with more details and possibly a gif
    this.snackBar.open(`${exercise.name}`, 'Close', { duration: 3000 });
  }

  addToTemplate(exercise: Exercise): void {
    // Navigate to create template page with exercise data
    // For simplicity, we'll just show a snackbar now
    this.snackBar.open(`Exercise "${exercise.name}" would be added to a template`, 'Close', { duration: 3000 });

    // Future implementation would:
    // 1. Either navigate to template creation page with exercise pre-filled
    // 2. Or open a dialog to select an existing template to add the exercise to
  }

  displayPaginatedResults(exercises: Exercise[]): void {
    const startIndex = this.currentPage * this.pageSize;
    this.exercises = exercises.slice(startIndex, startIndex + this.pageSize);
  }

  nextPage(): void {
    if ((this.currentPage + 1) * this.pageSize < this.totalExercises) {
      this.currentPage++;
      this.loadInitialExercises();
    }
  }

  prevPage(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.loadInitialExercises();
    }
  }

  protected readonly Math = Math;
}
