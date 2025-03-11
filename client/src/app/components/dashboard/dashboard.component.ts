import {Component, inject, OnInit} from '@angular/core';
import {DiaryEntry} from '../../models/diary-entry';
import {WorkoutSession} from '../../models/workout-session';
import {WorkoutTemplate} from '../../models/workout-template';
import {DiaryService} from '../../services/diary.service';
import {TemplateService} from '../../services/template.service';
import {WorkoutService} from '../../services/workout.service';
import {AuthService} from '../../services/auth.service';
import {Router} from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit{

  recentEntries: DiaryEntry[] = [];
  recentWorkouts: WorkoutSession[] = [];
  workoutTemplates: WorkoutTemplate[] = [];
  isPremium = false;

  private diaryService = inject(DiaryService)
  private workoutService = inject(WorkoutService)
  private templateService = inject(TemplateService)
  private authService = inject(AuthService)
  private router = inject(Router)

  ngOnInit() {
    this.loadDashboardData();
    this.isPremium = this.authService.isPremiumUser();
  }

  loadDashboardData() {
    // Load recent diary entries
    this.diaryService.getDiaryEntries().subscribe(entries => {
      this.recentEntries = entries.slice(0, 5); // Get the 5 most recent entries
    });

    // Load recent workouts
    this.workoutService.getWorkoutSessions().subscribe(workouts => {
      this.recentWorkouts = workouts.slice(0, 5); // Get the 5 most recent workouts
    });

    // Load workout templates
    this.templateService.getTemplates().subscribe(templates => {
      this.workoutTemplates = templates.slice(0, 4); // Get the 4 most recent templates
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

  startWorkoutFromTemplate(template: WorkoutTemplate): void {
    // Create a new workout from template
    const newWorkout: WorkoutSession = {
      name: template.name,
      startTime: new Date().toISOString(),
      templateId: template.id,
      exercises: template.exercises?.map(te => ({
        exerciseId: te.exerciseId,
        name: te.exerciseName,
        muscleGroup: '', // Will be filled from the API
        sets: Array(te.sets).fill(0).map((_, i) => ({
          setNumber: i + 1,
          weight: te.weight,
          reps: te.reps,
          completed: false
        }))
      })) || []
    };

    this.workoutService.createWorkoutSession(newWorkout).subscribe(
      workout => {
        this.router.navigate(['/workouts', workout.id]);
      }
    );
  }

}
