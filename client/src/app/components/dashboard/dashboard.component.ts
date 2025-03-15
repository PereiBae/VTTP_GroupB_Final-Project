import {Component, inject, OnInit} from '@angular/core';
import {DiaryEntry} from '../../models/diary-entry';
import {WorkoutTemplate} from '../../models/workout-template';
import {DiaryService} from '../../services/diary.service';
import {TemplateService} from '../../services/template.service';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';
import {WorkoutSession} from '../../models/workout-session';
import {WorkoutService} from '../../services/workout.service';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{

  // Combined diary entries (which now include workouts)
  recentEntries: DiaryEntry[] = [];
  workoutTemplates: WorkoutTemplate[] = [];
  recentWorkoutCount: number = 0;
  isPremium = false;
  loading = false;


  private diaryService = inject(DiaryService)
  private templateService = inject(TemplateService)
  private workoutService = inject(WorkoutService)
  private authService = inject(AuthService)
  private router = inject(Router)

  ngOnInit() {
    this.loadDashboardData();
    this.isPremium = this.authService.isPremiumUser();
  }

  loadDashboardData() {
    this.loading = true;

    // Load recent diary entries (which now include workout data)
    this.diaryService.getDiaryEntries().subscribe({
      next: entries => {
        this.recentEntries = entries.slice(0, 5); // Get the 5 most recent entries
        this.loading = false;
      },
      error: error => {
        console.error('Error loading diary entries', error);
        this.loading = false;
      }
    });

    // Load workout templates
    this.templateService.getTemplates().subscribe({
      next: templates => {
        this.workoutTemplates = templates.slice(0, 4); // Get the 4 most recent templates
      },
      error: error => {
        console.error('Error loading templates', error);
      }
    });

  }



  getEmotionIcon(feeling: string): string {
    switch (feeling?.toLowerCase()) {
      case 'great':
        return 'sentiment_very_satisfied';
      case 'good':
        return 'sentiment_satisfied';
      case 'okay':
        return 'sentiment_neutral';
      case 'bad':
        return 'sentiment_dissatisfied';
      case 'terrible':
        return 'sentiment_very_dissatisfied';
      default:
        return 'sentiment_neutral';
    }
  }

  // New method to start workout directly from diary
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

}
