package vttp.batch5.paf.finalproject.server.models;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Document(collection = "workoutSessions")
public class WorkoutSession {

    @Id
    private String id;

    private String userId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer templateId; // Reference to MySQL template ID if used
    private String name; // Name of the workout (from template or custom)
    private List<ExerciseLog> exercises = new ArrayList<>();
    private String notes;

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

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public Integer getTemplateId() {
        return templateId;
    }

    public void setTemplateId(Integer templateId) {
        this.templateId = templateId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public List<ExerciseLog> getExercises() {
        return exercises;
    }

    public void setExercises(List<ExerciseLog> exercises) {
        this.exercises = exercises;
    }

    public void addExercise(ExerciseLog exercise) {
        this.exercises.add(exercise);
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

}
