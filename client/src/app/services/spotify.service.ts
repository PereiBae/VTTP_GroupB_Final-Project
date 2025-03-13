import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import {BehaviorSubject, catchError, map, Observable, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {tap} from 'rxjs/operators';

export interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

export interface SpotifyTrack{
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumArt: string;
  previewUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SpotifyService extends BaseService {

  private tokenSubject = new BehaviorSubject<string | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(http: HttpClient) {
    super(http);
    // Check localStorage for existing token
    const token = localStorage.getItem('spotify_token');
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  getAuthUrl(): Observable<string> {
    return this.http.get<{ url: string }>('/api/spotify/auth-url', { headers: this.getAuthHeaders() })
      .pipe(
        map(response => response.url),
        catchError(error => {
          console.error('Error getting auth URL:', error);
          return throwError(() => new Error('Failed to get Spotify authorization URL'));
        })
      );
  }

  exchangeCodeForToken(code: string): Observable<SpotifyToken> {
    return this.http.post<SpotifyToken>('/api/spotify/token', { code }, { headers: this.getAuthHeaders() })
      .pipe(
        tap(response => {
          console.log('Received Spotify token');
          localStorage.setItem('spotify_token', response.access_token);
          this.tokenSubject.next(response.access_token);
        }),
        catchError(error => {
          console.error('Error exchanging code for token:', error);
          return throwError(() => new Error('Failed to get Spotify token'));
        })
      );
  }

  // Update SpotifyService
  searchTracks(query: string): Observable<SpotifyTrack[]> {
    const token = localStorage.getItem('spotify_token');
    if (!token) {
      console.error('No Spotify token available');
      return throwError(() => new Error('No Spotify token available'));
    }

    console.log('Sending search request with token');
    return this.http.get<any>(`/api/spotify/search?query=${encodeURIComponent(query)}&token=${token}`,
      { headers: this.getAuthHeaders() })
      .pipe(
        map(response => {
          console.log('Raw Spotify response:', response);
          if (!response.tracks || !response.tracks.items) {
            return [];
          }

          return response.tracks.items.map((item: any) => ({
            id: item.id,
            name: item.name,
            artist: item.artists[0].name,
            albumName: item.album.name,
            albumArt: item.album.images[1]?.url || '',
            previewUrl: item.preview_url
          }));
        }),
        catchError(error => {
          console.error('Spotify API error:', error);
          // Handle token expiration
          if (error.status === 401) {
            localStorage.removeItem('spotify_token');
            this.tokenSubject.next(null);
          }
          return throwError(() => error);
        })
      );
  }

  getTrack(id: string): Observable<SpotifyTrack> {
    const token = localStorage.getItem('spotify_token');
    if (!token) {
      return throwError(() => new Error('Spotify token not available'));
    }

    return this.http.get<any>(`/api/spotify/track/${id}?token=${token}`,
      { headers: this.getAuthHeaders() })
      .pipe(
        map(track => ({
          id: track.id,
          name: track.name,
          artist: track.artists[0].name,
          albumName: track.album.name,
          albumArt: track.album.images[1]?.url || '',
          previewUrl: track.preview_url
        })),
        catchError(error => {
          console.error('Error getting track:', error);
          return throwError(() => error);
        })
      );
  }

  hasValidToken(): boolean {
    return !!this.tokenSubject.getValue();
  }

  clearToken(): void {
    localStorage.removeItem('spotify_token');
    this.tokenSubject.next(null);
  }

}
