import {Component, inject, OnInit} from '@angular/core';
import {Exercise} from '../../../models/exercise';
import {MatDialog} from '@angular/material/dialog';
import {ExerciseAPIService} from '../../../services/exercise-api.service';
import {Router} from '@angular/router';
import {MatSnackBar} from '@angular/material/snack-bar';
import {MatChipListboxChange} from '@angular/material/chips';
import {ExerciseDetailsDialogComponent} from '../exercise-details-dialog/exercise-details-dialog.component';
import {TemplateSelectionDialogComponent} from '../template-selection-dialog/template-selection-dialog.component';
import {TemplateExercise} from '../../../models/template-exercise';
import {TemplateService} from '../../../services/template.service';

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
  private templateService = inject(TemplateService)

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
    const dialogRef = this.dialog.open(ExerciseDetailsDialogComponent, {
      width: '600px',
      data: { exercise }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // If result exists, user clicked "Add to Template" in the details view
        this.addToTemplate(result);
      }
    });
  }

  addToTemplate(exercise: Exercise): void {
    const dialogRef = this.dialog.open(TemplateSelectionDialogComponent, {
      width: '500px',
      data: { exercise }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (!result) return;

      if (result.action === 'add-to-existing') {
        // Add to existing template
        this.addExerciseToExistingTemplate(result.templateId, result.exercise);
      } else if (result.action === 'create-new') {
        // Navigate to create template page with exercise data
        this.navigateToCreateTemplate(result.exercise);
      }
    });
  }

  private addExerciseToExistingTemplate(templateId: number, exerciseData: TemplateExercise): void {
    this.templateService.getTemplateWithExercises(templateId).subscribe({
      next: (template) => {
        // Add the new exercise to the template's exercises
        const exercises = [...(template.exercises || []), exerciseData];

        // Update the template with the new exercise
        this.templateService.updateTemplate(templateId, template, exercises).subscribe({
          next: () => {
            this.snackBar.open(`Exercise added to "${template.name}" template`, 'View', {
              duration: 5000
            }).onAction().subscribe(() => {
              this.router.navigate(['/templates', templateId]);
            });
          },
          error: (error) => {
            console.error('Error updating template', error);
            this.snackBar.open('Error adding exercise to template', 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('Error getting template details', error);
        this.snackBar.open('Error retrieving template details', 'Close', { duration: 3000 });
      }
    });
  }

  private navigateToCreateTemplate(exerciseData: TemplateExercise): void {
    // Store exercise data in sessionStorage for the template form to use
    sessionStorage.setItem('newTemplateExercise', JSON.stringify(exerciseData));
    // Navigate to template creation page
    this.router.navigate(['/templates/new']);
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
