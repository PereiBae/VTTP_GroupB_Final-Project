import {Component, inject, OnInit} from '@angular/core';
import {TemplateService} from '../../../services/template.service';
import {WorkoutService} from '../../../services/workout.service';
import {ActivatedRoute, Router} from '@angular/router';
import {WorkoutTemplate} from '../../../models/workout-template';
import {MatSnackBar} from '@angular/material/snack-bar';
import {WorkoutSession} from '../../../models/workout-session';

@Component({
  selector: 'app-template-list',
  standalone: false,
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.css'
})
export class TemplateListComponent implements OnInit{

  templates: WorkoutTemplate[] = [];
  loading = false;

  private templateService = inject(TemplateService)
  private workoutService = inject(WorkoutService)
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  ngOnInit(){
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;
    this.templateService.getTemplates().subscribe({
      next: (templates) => {
        this.templates = templates;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading templates', error);
        this.loading = false;
        this.snackBar.open('Error loading templates', 'Close', { duration: 3000 });
      }
    });
  }

  startWorkoutFromTemplate(template: WorkoutTemplate): void {
    // First, get the full template with exercises
    this.templateService.getTemplateWithExercises(template.id!).subscribe({
      next: (fullTemplate) => {
        // Create a new workout from the template
        const workout: WorkoutSession = {
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
              completed: false
            }))
          })) || []
        };

        // Create the workout
        this.workoutService.createWorkoutSession(workout).subscribe({
          next: (createdWorkout) => {
            this.snackBar.open('Workout started', 'Close', { duration: 3000 });
            this.router.navigate(['/workouts', createdWorkout.id]);
          },
          error: (error) => {
            console.error('Error starting workout', error);
            this.snackBar.open('Error starting workout', 'Close', { duration: 3000 });
          }
        });
      },
      error: (error) => {
        console.error('Error loading template details', error);
        this.snackBar.open('Error loading template details', 'Close', { duration: 3000 });
      }
    });
  }

  deleteTemplate(template: WorkoutTemplate): void {
    if (!template.id || !confirm(`Are you sure you want to delete the template "${template.name}"?`)) {
      return;
    }

    this.templateService.deleteTemplate(template.id).subscribe({
      next: () => {
        this.snackBar.open('Template deleted', 'Close', { duration: 3000 });
        this.loadTemplates(); // Reload templates
      },
      error: (error) => {
        console.error('Error deleting template', error);
        this.snackBar.open('Error deleting template', 'Close', { duration: 3000 });
      }
    });
  }

}
