import {Component, inject, OnInit} from '@angular/core';
import {WorkoutSession} from '../../../models/workout-session';
import {WorkoutService} from '../../../services/workout.service';

@Component({
  selector: 'app-workout-list',
  standalone: false,
  templateUrl: './workout-list.component.html',
  styleUrl: './workout-list.component.css'
})
export class WorkoutListComponent implements OnInit{

  workouts: WorkoutSession[] = [];
  loading = false;

  // Default to showing the last 30 days
  startDate: Date = new Date(new Date().setDate(new Date().getDate() - 30));
  endDate: Date = new Date();

  private workoutService = inject(WorkoutService)

  ngOnInit(){
    this.loadWorkouts()
  }

  loadWorkouts(): void {
    this.loading = true;

    // Format dates as ISO strings
    const startTimeStr = this.formatDateForApi(this.startDate);
    const endTimeStr = this.formatDateForApi(this.endDate, true); // End of day

    this.workoutService.getWorkoutSessionsInRange(startTimeStr, endTimeStr).subscribe({
      next: (workouts) => {
        this.workouts = workouts.sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading workouts', error);
        this.loading = false;
      }
    });
  }

  getTotalSets(workout: WorkoutSession): number {
    return workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  }

  getDuration(workout: WorkoutSession): string {
    if (!workout.endTime) return 'N/A';

    const startTime = new Date(workout.startTime).getTime();
    const endTime = new Date(workout.endTime).getTime();
    const durationMs = endTime - startTime;

    // Convert to minutes
    const minutes = Math.floor(durationMs / 60000);

    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours} hr ${remainingMinutes} min`;
    }
  }

  private formatDateForApi(date: Date, endOfDay = false): string {
    if (endOfDay) {
      // Set time to end of day (23:59:59.999)
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      return endDate.toISOString();
    } else {
      // Set time to start of day (00:00:00.000)
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      return startDate.toISOString();
    }
  }

}
