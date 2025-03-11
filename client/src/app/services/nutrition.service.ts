import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {NutritionLog} from '../models/nutrition-log';

@Injectable({
  providedIn: 'root'
})
export class NutritionService {

  private http = inject(HttpClient)

  // Get all nutrition logs for the current user
  getNutritionLogs(): Observable<NutritionLog[]> {
    return this.http.get<NutritionLog[]>('/api/nutrition');
  }

  // Get nutrition logs within a date range
  getNutritionLogsInRange(startDate: string, endDate: string): Observable<NutritionLog[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);

    return this.http.get<NutritionLog[]>('/api/nutrition/range', { params });
  }

  // Get nutrition log by date
  getNutritionLogByDate(date: string): Observable<NutritionLog> {
    return this.http.get<NutritionLog>(`/api/nutrition/date/${date}`);
  }

  // Get nutrition log by ID
  getNutritionLogById(id: string): Observable<NutritionLog> {
    return this.http.get<NutritionLog>(`/api/nutrition/${id}`);
  }

  // Create a new nutrition log
  createNutritionLog(log: NutritionLog): Observable<NutritionLog> {
    return this.http.post<NutritionLog>('/api/nutrition', log);
  }

  // Update a nutrition log
  updateNutritionLog(id: string, log: NutritionLog): Observable<NutritionLog> {
    return this.http.put<NutritionLog>(`/api/nutrition/${id}`, log);
  }

  // Delete a nutrition log
  deleteNutritionLog(id: string): Observable<void> {
    return this.http.delete<void>(`/api/nutrition/${id}`);
  }

}
