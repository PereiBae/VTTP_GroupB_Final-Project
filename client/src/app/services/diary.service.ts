import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {DiaryEntry} from '../models/diary-entry';

@Injectable({
  providedIn: 'root'
})
export class DiaryService {

  private http = inject(HttpClient)

  // Get all diary entries for the current user
  getDiaryEntries(): Observable<DiaryEntry[]> {
    return this.http.get<DiaryEntry[]>('/api/diary');
  }

  // Get diary entries within a date range
  getDiaryEntriesInRange(startDate: string, endDate: string): Observable<DiaryEntry[]> {
    const params = new HttpParams()
      .set('start', startDate)
      .set('end', endDate);

    return this.http.get<DiaryEntry[]>('/api/diary/range', { params });
  }

  // Get diary entry by date
  getDiaryEntryByDate(date: string): Observable<DiaryEntry> {
    return this.http.get<DiaryEntry>(`/api/diary/date/${date}`);
  }

  // Get diary entry by ID
  getDiaryEntryById(id: string): Observable<DiaryEntry> {
    return this.http.get<DiaryEntry>(`/api/diary/${id}`);
  }

  // Create a new diary entry
  createDiaryEntry(entry: DiaryEntry): Observable<DiaryEntry> {
    return this.http.post<DiaryEntry>('/api/diary', entry);
  }

  // Update a diary entry
  updateDiaryEntry(id: string, entry: DiaryEntry): Observable<DiaryEntry> {
    return this.http.put<DiaryEntry>(`/api/diary/${id}`, entry);
  }

  // Delete a diary entry
  deleteDiaryEntry(id: string): Observable<void> {
    return this.http.delete<void>(`/api/diary/${id}`);
  }

}
