export interface UserProfile {
  email: string;
  name?: string;
  age?: number;
  height?: number; // in cm
  weight?: number; // in kg
  fitnessGoals?: string;
  profilePictureUrl?: string;
}
