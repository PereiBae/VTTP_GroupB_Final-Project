export interface DiaryEntry {
  id?: string;
  userId?: string;
  date: string; // ISO format date string
  feeling: string;
  notes: string;
  workoutPerformed: boolean;
  workoutSessionId?: string;
  spotifyTrackId?: string;
  spotifyTrackName?: string;
  spotifyArtistName?: string;
}
