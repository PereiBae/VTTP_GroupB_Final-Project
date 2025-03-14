package vttp.batch5.paf.finalproject.server.models;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDate;

@Document(collection = "diaryEntries")
public class DiaryEntry {

    @Id
    private String id;

    private String userId;
    private LocalDate date;
    private String feeling;
    private String notes;
    private boolean workoutPerformed;
    private String spotifyTrackId;
    private String spotifyTrackName;
    private String spotifyArtistName;

    // Reference to workout if performed
    @JsonProperty("workout")  // Map JSON property "workout" to Java property "workoutSession"
    @Field("workout")         // Map Java property "workoutSession" to MongoDB field "workout"
    private WorkoutSession workoutSession;

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public LocalDate getDate() {
        return date;
    }

    public void setDate(LocalDate date) {
        this.date = date;
    }

    public String getFeeling() {
        return feeling;
    }

    public void setFeeling(String feeling) {
        this.feeling = feeling;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public boolean isWorkoutPerformed() {
        return workoutPerformed;
    }

    public void setWorkoutPerformed(boolean workoutPerformed) {
        this.workoutPerformed = workoutPerformed;
    }

    public WorkoutSession getWorkoutSession() {
        return workoutSession;
    }

    public void setWorkoutSession(WorkoutSession workoutSession) {
        this.workoutSession = workoutSession;
    }

    public String getSpotifyTrackId() {
        return spotifyTrackId;
    }

    public void setSpotifyTrackId(String spotifyTrackId) {
        this.spotifyTrackId = spotifyTrackId;
    }

    public String getSpotifyTrackName() {
        return spotifyTrackName;
    }

    public void setSpotifyTrackName(String spotifyTrackName) {
        this.spotifyTrackName = spotifyTrackName;
    }

    public String getSpotifyArtistName() {
        return spotifyArtistName;
    }

    public void setSpotifyArtistName(String spotifyArtistName) {
        this.spotifyArtistName = spotifyArtistName;
    }
}
