package vttp.batch5.paf.finalproject.server.models;

import java.util.ArrayList;
import java.util.List;

public class ExerciseLog {

    private String exerciseId; // Unique identifier from the exercise API
    private String name;
    private String muscleGroup;
    private List<ExerciseSet> sets = new ArrayList<>();

    // Getters and Setters
    public String getExerciseId() {
        return exerciseId;
    }

    public void setExerciseId(String exerciseId) {
        this.exerciseId = exerciseId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getMuscleGroup() {
        return muscleGroup;
    }

    public void setMuscleGroup(String muscleGroup) {
        this.muscleGroup = muscleGroup;
    }

    public List<ExerciseSet> getSets() {
        return sets;
    }

    public void setSets(List<ExerciseSet> sets) {
        this.sets = sets;
    }

    public void addSet(ExerciseSet set) {
        this.sets.add(set);
    }

}
