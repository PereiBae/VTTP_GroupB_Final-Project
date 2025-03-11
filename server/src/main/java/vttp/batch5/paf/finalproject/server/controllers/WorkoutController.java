package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.models.WorkoutSession;
import vttp.batch5.paf.finalproject.server.repositories.WorkoutRepository;

import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/api/workouts")
public class WorkoutController {

    @Autowired
    private WorkoutRepository workoutRepo;

    // Create a new workout session
    @PostMapping
    public ResponseEntity<WorkoutSession> createWorkoutSession(
            @RequestBody WorkoutSession session,
            Authentication authentication) {

        // Set the userId from the authenticated user
        session.setUserId(authentication.getName());

        WorkoutSession created = workoutRepo.createWorkoutSession(session);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Get all workout sessions for the authenticated user
    @GetMapping
    public ResponseEntity<List<WorkoutSession>> getUserWorkoutSessions(Authentication authentication) {
        List<WorkoutSession> sessions = workoutRepo.getWorkoutSessionsByUser(authentication.getName());
        return ResponseEntity.ok(sessions);
    }

    // Get workout sessions within a date range
    @GetMapping("/range")
    public ResponseEntity<List<WorkoutSession>> getWorkoutSessionsInRange(
            @RequestParam LocalDateTime start,
            @RequestParam LocalDateTime end,
            Authentication authentication) {

        List<WorkoutSession> sessions = workoutRepo.getWorkoutSessionsByUserAndDateRange(
                authentication.getName(), start, end);
        return ResponseEntity.ok(sessions);
    }

    // Get workout sessions by template
    @GetMapping("/template/{templateId}")
    public ResponseEntity<List<WorkoutSession>> getWorkoutSessionsByTemplate(
            @PathVariable Integer templateId,
            Authentication authentication) {

        List<WorkoutSession> sessions = workoutRepo.getWorkoutSessionsByUserAndTemplate(
                authentication.getName(), templateId);
        return ResponseEntity.ok(sessions);
    }

    // Get a specific workout session by ID
    @GetMapping("/{id}")
    public ResponseEntity<WorkoutSession> getWorkoutSessionById(
            @PathVariable String id,
            Authentication authentication) {

        WorkoutSession session = workoutRepo.getWorkoutSessionById(id);

        if (session == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the session belongs to the authenticated user
        if (!session.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        return ResponseEntity.ok(session);
    }

    // Update a workout session
    @PutMapping("/{id}")
    public ResponseEntity<WorkoutSession> updateWorkoutSession(
            @PathVariable String id,
            @RequestBody WorkoutSession session,
            Authentication authentication) {

        WorkoutSession existing = workoutRepo.getWorkoutSessionById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the session belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Preserve the userId, startTime, templateId, and name from the existing session
        session.setId(id);
        session.setUserId(existing.getUserId());
        session.setStartTime(existing.getStartTime());
        session.setTemplateId(existing.getTemplateId());
        session.setName(existing.getName());

        WorkoutSession updated = workoutRepo.updateWorkoutSession(session);
        return ResponseEntity.ok(updated);
    }

    // Delete a workout session
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteWorkoutSession(
            @PathVariable String id,
            Authentication authentication) {

        WorkoutSession existing = workoutRepo.getWorkoutSessionById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the session belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        workoutRepo.deleteWorkoutSession(id);
        return ResponseEntity.noContent().build();
    }

}
