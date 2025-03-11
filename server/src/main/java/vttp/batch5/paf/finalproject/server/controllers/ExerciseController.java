package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.services.ExerciseAPIService;
import vttp.batch5.paf.finalproject.server.services.ExerciseGitService;

import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/api/exercises")
public class ExerciseController {

    @Autowired
    private ExerciseGitService exerciseAPISvc;

    // Add this new method to get all exercises
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllExercises() {
        List<Map<String, Object>> exercises = exerciseAPISvc.getAllExercises();
        return ResponseEntity.ok(exercises);
    }


    // Search exercises by name
    @GetMapping("/search")
    @ResponseBody
    public ResponseEntity<Object> searchExercises(@RequestParam String query) {
        Object results = exerciseAPISvc.searchExercises(query);
        return ResponseEntity.ok(results);
    }

    // Get exercises by muscle
    @GetMapping("/muscle/{muscle}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getExercisesByMuscle(@PathVariable String muscle) {
        List<Map<String, Object>> exercises = exerciseAPISvc.getExercisesByMuscle(muscle);
        System.out.println(exercises);
        return ResponseEntity.ok(exercises);
    }

}
