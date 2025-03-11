import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Exercise} from '../models/exercise';

@Injectable({
  providedIn: 'root'
})
export class ExerciseAPIService {

  private http = inject(HttpClient)

  // Search exercises by name
  searchExercises(query: string): Observable<Exercise[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Exercise[]>('/api/exercises/search', { params });
  }

  // Get exercise by ID
  getExerciseById(id: string): Observable<Exercise> {
    return this.http.get<Exercise>(`/api/exercises/${id}`);
  }

  // Get exercises by muscle group
  getExercisesByMuscle(muscle: string): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`/api/exercises/muscle/${muscle}`);
  }

}
