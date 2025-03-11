import {WorkoutSession} from './workout-session';

export interface DiaryEntry {
  id?: string;
  userId?: string;
  date: string; // ISO format date string
  feeling: string;
  notes: string;
  workoutPerformed: boolean;
  spotifyTrackId?: string;
  spotifyTrackName?: string;
  spotifyArtistName?: string;
  workout?:WorkoutSession;
}
