import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {WorkoutSession} from '../models/workout-session';

@Injectable({
  providedIn: 'root'
})
export class WorkoutService {

  private http = inject(HttpClient)

  // Get all workout sessions for the current user
  getWorkoutSessions(): Observable<WorkoutSession[]> {
    return this.http.get<WorkoutSession[]>('/api/workouts');
  }

  // Get workout sessions within a date range
  getWorkoutSessionsInRange(startTime: string, endTime: string): Observable<WorkoutSession[]> {
    const params = new HttpParams()
      .set('start', startTime)
      .set('end', endTime);

    return this.http.get<WorkoutSession[]>('/api/workouts/range', { params });
  }

  // Get workout sessions by template
  getWorkoutSessionsByTemplate(templateId: number): Observable<WorkoutSession[]> {
    return this.http.get<WorkoutSession[]>(`/api/workouts/template/${templateId}`);
  }

  // Get workout session by ID
  getWorkoutSessionById(id: string): Observable<WorkoutSession> {
    return this.http.get<WorkoutSession>(`/api/workouts/${id}`);
  }

  // Create a new workout session
  createWorkoutSession(session: WorkoutSession): Observable<WorkoutSession> {
    return this.http.post<WorkoutSession>('/api/workouts', session);
  }

  // Update a workout session
  updateWorkoutSession(id: string, session: WorkoutSession): Observable<WorkoutSession> {
    return this.http.put<WorkoutSession>(`/api/workouts/${id}`, session);
  }

  // Delete a workout session
  deleteWorkoutSession(id: string): Observable<void> {
    return this.http.delete<void>(`/api/workouts/${id}`);
  }

}
