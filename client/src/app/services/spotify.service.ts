import { Injectable } from '@angular/core';
import { BaseService } from './base.service';
import {BehaviorSubject, catchError, map, Observable, of, throwError} from 'rxjs';
import {HttpClient} from '@angular/common/http';
import {switchMap, tap} from 'rxjs/operators';

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
  private refreshingToken = false;
  private refreshTokenInProgress: Observable<SpotifyToken> | null = null;

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
          if (response.refresh_token) {
            localStorage.setItem('spotify_refresh_token', response.refresh_token);
          }
          this.tokenSubject.next(response.access_token);
        }),
        catchError(error => {
          console.error('Error exchanging code for token:', error);
          return throwError(() => new Error('Failed to get Spotify token'));
        })
      );
  }

  refreshToken(): Observable<SpotifyToken> {
    // If we're already refreshing, return the in-progress Observable
    if (this.refreshingToken && this.refreshTokenInProgress) {
      return this.refreshTokenInProgress;
    }

    const refreshToken = localStorage.getItem('spotify_refresh_token');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    console.log('Refreshing Spotify token...');
    this.refreshingToken = true;

    this.refreshTokenInProgress = this.http.post<SpotifyToken>(
      '/api/spotify/refresh-token',
      { refresh_token: refreshToken },
      { headers: this.getAuthHeaders() }
    ).pipe(
      tap(response => {
        console.log('Spotify token refreshed successfully');
        localStorage.setItem('spotify_token', response.access_token);

        // If a new refresh token was provided, store it
        if (response.refresh_token) {
          localStorage.setItem('spotify_refresh_token', response.refresh_token);
        }

        this.tokenSubject.next(response.access_token);
        this.refreshingToken = false;
        this.refreshTokenInProgress = null;
      }),
      catchError(error => {
        console.error('Error refreshing token:', error);
        this.refreshingToken = false;
        this.refreshTokenInProgress = null;
        return throwError(() => new Error('Failed to refresh Spotify token'));
      })
    );

    return this.refreshTokenInProgress;
  }

  // This method will handle token refresh automatically if needed
  private getValidToken(): Observable<string> {
    const token = localStorage.getItem('spotify_token');
    if (!token) {
      return throwError(() => new Error('No Spotify token available'));
    }

    return of(token);
  }

  // Update SpotifyService
  searchTracks(query: string): Observable<SpotifyTrack[]> {
    console.log('Searching for tracks:', query);

    return this.getValidToken().pipe(
      switchMap(token => {
        console.log('Using token to search for tracks');
        return this.http.get<any>(
          `/api/spotify/search?query=${encodeURIComponent(query)}&token=${token}`,
          { headers: this.getAuthHeaders() }
        ).pipe(
          catchError(error => {
            console.error('Search error:', error);

            // If token is expired, try refreshing it and retry the search
            if (error.status === 401 || error.status === 403) {
              console.log('Token expired, attempting to refresh...');
              return this.refreshToken().pipe(
                switchMap(refreshResponse => {
                  console.log('Token refreshed, retrying search');
                  return this.http.get<any>(
                    `/api/spotify/search?query=${encodeURIComponent(query)}&token=${refreshResponse.access_token}`,
                    { headers: this.getAuthHeaders() }
                  );
                })
              );
            }

            return throwError(() => error);
          })
        );
      }),
      map(response => {
        console.log('Spotify search response:', response);

        if (!response.tracks || !response.tracks.items) {
          console.warn('Unexpected response format:', response);
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
    return !!localStorage.getItem('spotify_token');
  }

  clearToken(): void {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
    this.tokenSubject.next(null);
  }

}
