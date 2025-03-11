package vttp.batch5.paf.finalproject.server.models;

public class ExerciseSet {

    private Integer setNumber;
    private Double weight; // in kg
    private Integer reps;
    private Integer rpe; // Rate of Perceived Exertion (1-10)
    private Boolean completed;

    // Getters and Setters
    public Integer getSetNumber() {
        return setNumber;
    }

    public void setSetNumber(Integer setNumber) {
        this.setNumber = setNumber;
    }

    public Double getWeight() {
        return weight;
    }

    public void setWeight(Double weight) {
        this.weight = weight;
    }

    public Integer getReps() {
        return reps;
    }

    public void setReps(Integer reps) {
        this.reps = reps;
    }

    public Integer getRpe() {
        return rpe;
    }

    public void setRpe(Integer rpe) {
        this.rpe = rpe;
    }

    public Boolean getCompleted() {
        return completed;
    }

    public void setCompleted(Boolean completed) {
        this.completed = completed;
    }

}
