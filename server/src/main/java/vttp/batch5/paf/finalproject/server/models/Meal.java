package vttp.batch5.paf.finalproject.server.models;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

public class Meal {

    private String name; // e.g., "Breakfast", "Lunch", "Dinner", "Snack"
    private LocalTime time;
    private Double calories;
    private Double protein;
    private Double carbs;
    private Double fat;
    private List<FoodItem> foodItems = new ArrayList<>();

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public LocalTime getTime() {
        return time;
    }

    public void setTime(LocalTime time) {
        this.time = time;
    }

    public Double getCalories() {
        return calories;
    }

    public void setCalories(Double calories) {
        this.calories = calories;
    }

    public Double getProtein() {
        return protein;
    }

    public void setProtein(Double protein) {
        this.protein = protein;
    }

    public Double getCarbs() {
        return carbs;
    }

    public void setCarbs(Double carbs) {
        this.carbs = carbs;
    }

    public Double getFat() {
        return fat;
    }

    public void setFat(Double fat) {
        this.fat = fat;
    }

    public List<FoodItem> getFoodItems() {
        return foodItems;
    }

    public void setFoodItems(List<FoodItem> foodItems) {
        this.foodItems = foodItems;
    }

    public void addFoodItem(FoodItem foodItem) {
        this.foodItems.add(foodItem);
    }
}
