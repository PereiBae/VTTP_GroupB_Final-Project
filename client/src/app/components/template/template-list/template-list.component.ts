import {Component, inject, OnInit} from '@angular/core';
import {TemplateService} from '../../../services/template.service';
import {WorkoutService} from '../../../services/workout.service';
import {ActivatedRoute, Router} from '@angular/router';
import {WorkoutTemplate} from '../../../models/workout-template';
import {MatSnackBar} from '@angular/material/snack-bar';
import {WorkoutSession} from '../../../models/workout-session';
import {DiaryService} from '../../../services/diary.service';
import {DiaryEntry} from '../../../models/diary-entry';

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
  private diaryService = inject(DiaryService)
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
    // Create a new diary entry with workout for today
    const today = new Date().toISOString().split('T')[0];
    const newEntry: DiaryEntry = {
      date: today,
      feeling: 'good', // Default feeling
      notes: `Workout from template: ${template.name}`,
      workoutPerformed: true,
      workout: {
        name: template.name,
        startTime: new Date().toISOString(),
        templateId: template.id,
        exercises: template.exercises?.map(te => ({
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
      }
    };

    this.diaryService.createDiaryEntry(newEntry).subscribe({
      next: entry => {
        this.router.navigate(['/diary', entry.id]);
      },
      error: error => {
        console.error('Error creating diary entry with workout', error);
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
