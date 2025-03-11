import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Exercise} from '../models/exercise';
import {BaseService} from './base.service';

@Injectable({
  providedIn: 'root'
})
export class ExerciseAPIService extends BaseService{

  constructor(http: HttpClient) {
    super(http);
  }

  // Search exercises by name
  searchExercises(query: string): Observable<Exercise[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<Exercise[]>('/api/exercises/search', { params, headers: this.getAuthHeaders() });
  }

  // Add to exercise-api.service.ts
  getAllExercises(): Observable<Exercise[]> {
    return this.http.get<Exercise[]>('/api/exercises', {
      headers: this.getAuthHeaders()
    });
  }

  // Get exercises by muscle group
  getExercisesByMuscle(muscle: string): Observable<Exercise[]> {
    return this.http.get<Exercise[]>(`/api/exercises/muscle/${muscle}`, {headers: this.getAuthHeaders()});
  }

}
