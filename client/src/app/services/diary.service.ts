import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {DiaryEntry} from '../models/diary-entry';
import {BaseService} from './base.service';

@Injectable({
  providedIn: 'root'
})
export class DiaryService extends BaseService {

  constructor(http: HttpClient) {
    super(http);
  }

  // Get all diary entries for the current user
  getDiaryEntries(): Observable<DiaryEntry[]> {
    return this.http.get<DiaryEntry[]>('/api/diary',{headers: this.getAuthHeaders()});
  }

  // Get diary entries within a date range
  getDiaryEntriesInRange(startDate: string, endDate: string): Observable<DiaryEntry[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);

    return this.http.get<DiaryEntry[]>('/api/diary/range', { params, headers: this.getAuthHeaders() });
  }

  // Get diary entry by date
  getDiaryEntryByDate(date: string): Observable<DiaryEntry> {
    return this.http.get<DiaryEntry>(`/api/diary/date/${date}`,{headers: this.getAuthHeaders()});
  }

  // Get diary entry by ID
  getDiaryEntryById(id: string): Observable<DiaryEntry> {
    return this.http.get<DiaryEntry>(`/api/diary/${id}`,{headers: this.getAuthHeaders()});
  }

  // Create a new diary entry
  createDiaryEntry(entry: DiaryEntry): Observable<DiaryEntry> {
    return this.http.post<DiaryEntry>('/api/diary', entry, {headers: this.getAuthHeaders()});
  }

  // Update a diary entry
  updateDiaryEntry(id: string, entry: DiaryEntry): Observable<DiaryEntry> {
    return this.http.put<DiaryEntry>(`/api/diary/${id}`, entry, {headers: this.getAuthHeaders()});
  }

  // Delete a diary entry
  deleteDiaryEntry(id: string): Observable<void> {
    return this.http.delete<void>(`/api/diary/${id}`, {headers: this.getAuthHeaders()});
  }

}
