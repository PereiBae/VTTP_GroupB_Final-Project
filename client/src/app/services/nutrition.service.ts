import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {NutritionLog} from '../models/nutrition-log';
import {BaseService} from "./base.service";

@Injectable({
  providedIn: 'root'
})
export class NutritionService extends BaseService{

  constructor(http: HttpClient) {
    super(http);
  }

  // Get all nutrition logs for the current user
  getNutritionLogs(): Observable<NutritionLog[]> {
    return this.http.get<NutritionLog[]>('/api/nutrition');
  }

  // Get nutrition logs within a date range
  getNutritionLogsInRange(startDate: string, endDate: string): Observable<NutritionLog[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);

    return this.http.get<NutritionLog[]>('/api/nutrition/range', { params, headers:this.getAuthHeaders()});
  }

  // Get nutrition log by date
  getNutritionLogByDate(date: string): Observable<NutritionLog> {
    return this.http.get<NutritionLog>(`/api/nutrition/date/${date}`, {headers:this.getAuthHeaders()});
  }

  // Get nutrition log by ID
  getNutritionLogById(id: string): Observable<NutritionLog> {
    return this.http.get<NutritionLog>(`/api/nutrition/${id}`, {headers:this.getAuthHeaders()});
  }

  // Create a new nutrition log
  createNutritionLog(log: NutritionLog): Observable<NutritionLog> {
    return this.http.post<NutritionLog>('/api/nutrition', log, {headers:this.getAuthHeaders()});
  }

  // Update a nutrition log
  updateNutritionLog(id: string, log: NutritionLog): Observable<NutritionLog> {
    return this.http.put<NutritionLog>(`/api/nutrition/${id}`, log, {headers:this.getAuthHeaders()});
  }

  // Delete a nutrition log
  deleteNutritionLog(id: string): Observable<void> {
    return this.http.delete<void>(`/api/nutrition/${id}`, {headers:this.getAuthHeaders()});
  }

}
