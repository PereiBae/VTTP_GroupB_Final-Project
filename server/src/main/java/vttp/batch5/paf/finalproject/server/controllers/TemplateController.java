package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.models.TemplateExercise;
import vttp.batch5.paf.finalproject.server.models.WorkoutTemplate;
import vttp.batch5.paf.finalproject.server.services.WorkoutTemplateService;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/api/templates")
public class TemplateController {

    @Autowired
    private WorkoutTemplateService workoutTemplateSvc;

    // Create a new workout template
    @PostMapping
    @ResponseBody
    public ResponseEntity<WorkoutTemplate> createTemplate(
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        try {
            // Extract template data
            WorkoutTemplate template = new WorkoutTemplate();
            template.setUserId(authentication.getName());
            template.setName((String) payload.get("name"));
            template.setDescription((String) payload.get("description"));

            // Extract exercises (convert from Map to List<TemplateExercise>)
            List<Map<String, Object>> exercisesMap = (List<Map<String, Object>>) payload.get("exercises");
            List<TemplateExercise> exercises = convertToExerciseList(exercisesMap);

            WorkoutTemplate created = workoutTemplateSvc.createTemplate(template, exercises);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Get all templates for the authenticated user
    @GetMapping
    @ResponseBody
    public ResponseEntity<List<WorkoutTemplate>> getUserTemplates(Authentication authentication) {
        List<WorkoutTemplate> templates = workoutTemplateSvc.getTemplatesByUser(authentication.getName());
        return ResponseEntity.ok(templates);
    }

    // Get a specific template with its exercises
    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getTemplateWithExercises(@PathVariable Integer id, Authentication authentication) {
        WorkoutTemplate template = workoutTemplateSvc.getTemplateWithExercises(id);

        if (template == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the template belongs to the authenticated user
        if (!template.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        List<TemplateExercise> exercises = workoutTemplateSvc.getExercisesByTemplate(id);

        // Create a response with both template and exercises
        Map<String, Object> response = Map.of(
                "template", template,
                "exercises", exercises
        );

        return ResponseEntity.ok(response);
    }

    // Update a template
    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<WorkoutTemplate> updateTemplate(
            @PathVariable Integer id,
            @RequestBody Map<String, Object> payload,
            Authentication authentication) {

        WorkoutTemplate existing = workoutTemplateSvc.getTemplateWithExercises(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the template belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        try {
            // Update template data
            WorkoutTemplate template = new WorkoutTemplate();
            template.setId(id);
            template.setUserId(authentication.getName());
            template.setName((String) payload.get("name"));
            template.setDescription((String) payload.get("description"));

            // Extract exercises
            List<Map<String, Object>> exercisesMap = (List<Map<String, Object>>) payload.get("exercises");
            List<TemplateExercise> exercises = convertToExerciseList(exercisesMap);

            boolean updated = workoutTemplateSvc.updateTemplate(template, exercises);

            if (updated) {
                return ResponseEntity.ok(template);
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(null);
        }
    }

    // Delete a template
    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Void> deleteTemplate(@PathVariable Integer id, Authentication authentication) {
        WorkoutTemplate existing = workoutTemplateSvc.getTemplateWithExercises(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the template belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        boolean deleted = workoutTemplateSvc.deleteTemplate(id);

        if (deleted) {
            return ResponseEntity.noContent().build();
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // Helper method to convert from Map to TemplateExercise
    private List<TemplateExercise> convertToExerciseList(List<Map<String, Object>> exercisesMap) {
        if (exercisesMap == null) {
            return List.of();
        }

        return exercisesMap.stream().map(map -> {
            TemplateExercise exercise = new TemplateExercise();

            if (map.containsKey("id") && map.get("id") != null) {
                exercise.setId(Integer.valueOf(map.get("id").toString()));
            }

            exercise.setExerciseId((String) map.get("exerciseId"));
            exercise.setExerciseName((String) map.get("exerciseName"));

            if (map.containsKey("sets") && map.get("sets") != null) {
                exercise.setSets(Integer.valueOf(map.get("sets").toString()));
            } else {
                exercise.setSets(3); // Default value
            }

            if (map.containsKey("reps") && map.get("reps") != null) {
                exercise.setReps(Integer.valueOf(map.get("reps").toString()));
            } else {
                exercise.setReps(10); // Default value
            }

            if (map.containsKey("weight") && map.get("weight") != null) {
                exercise.setWeight(Double.valueOf(map.get("weight").toString()));
            } else {
                exercise.setWeight(0.0); // Default value
            }

            return exercise;
        }).collect(Collectors.toList());
    }

}
