package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.models.NutritionLog;
import vttp.batch5.paf.finalproject.server.repositories.mongo.NutritionRepository;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/api/nutrition")
public class NutritionController {

    @Autowired
    private NutritionRepository nutritionRepo;

    // Check if user has premium access
    private boolean hasPremiumAccess(Authentication authentication) {
        return authentication.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_PREMIUM"));
    }

    // Create a new nutrition log
    @PostMapping
    public ResponseEntity<NutritionLog> createNutritionLog(
            @RequestBody NutritionLog log,
            Authentication authentication) {

        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Set the userId from the authenticated user
        log.setUserId(authentication.getName());

        // Check if the user already has a log for this date
        if (nutritionRepo.hasNutritionLogForDate(authentication.getName(), log.getDate())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(null); // User already has a log for this date
        }

        NutritionLog created = nutritionRepo.createNutritionLog(log);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Get all nutrition logs for the authenticated user
    @GetMapping
    public ResponseEntity<List<NutritionLog>> getUserNutritionLogs(Authentication authentication) {
        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        List<NutritionLog> logs = nutritionRepo.getNutritionLogsByUser(authentication.getName());
        return ResponseEntity.ok(logs);
    }

    // Get nutrition logs within a date range
    @GetMapping("/range")
    public ResponseEntity<List<NutritionLog>> getNutritionLogsInRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            Authentication authentication) {

        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        List<NutritionLog> logs = nutritionRepo.getNutritionLogsByUserAndDateRange(
                authentication.getName(), start, end);
        return ResponseEntity.ok(logs);
    }

    // Get a nutrition log for a specific date
    @GetMapping("/date/{date}")
    public ResponseEntity<NutritionLog> getNutritionLogByDate(
            @PathVariable LocalDate date,
            Authentication authentication) {

        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        NutritionLog log = nutritionRepo.getNutritionLogByUserAndDate(authentication.getName(), date);

        if (log == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(log);
    }

    // Get a specific nutrition log by ID
    @GetMapping("/{id}")
    public ResponseEntity<NutritionLog> getNutritionLogById(
            @PathVariable String id,
            Authentication authentication) {

        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        NutritionLog log = nutritionRepo.getNutritionLogById(id);

        if (log == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the log belongs to the authenticated user
        if (!log.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        return ResponseEntity.ok(log);
    }

    // Update a nutrition log
    @PutMapping("/{id}")
    public ResponseEntity<NutritionLog> updateNutritionLog(
            @PathVariable String id,
            @RequestBody NutritionLog log,
            Authentication authentication) {

        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        NutritionLog existing = nutritionRepo.getNutritionLogById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the log belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Preserve the userId and date from the existing log
        log.setId(id);
        log.setUserId(existing.getUserId());
        log.setDate(existing.getDate());

        NutritionLog updated = nutritionRepo.updateNutritionLog(log);
        return ResponseEntity.ok(updated);
    }

    // Delete a nutrition log
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNutritionLog(
            @PathVariable String id,
            Authentication authentication) {

        if (!hasPremiumAccess(authentication)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        NutritionLog existing = nutritionRepo.getNutritionLogById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the log belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        nutritionRepo.deleteNutritionLog(id);
        return ResponseEntity.noContent().build();
    }

}
