package vttp.batch5.paf.finalproject.server.controllers;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;
import vttp.batch5.paf.finalproject.server.models.DiaryEntry;
import vttp.batch5.paf.finalproject.server.models.WorkoutSession;
import vttp.batch5.paf.finalproject.server.repositories.mongo.DiaryRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Controller
@RequestMapping("/api/diary")
public class DiaryController {

    @Autowired
    private DiaryRepository diaryRepo;

    // Create a new diary entry
    @PostMapping
    @ResponseBody
    public ResponseEntity<DiaryEntry> createDiaryEntry(@RequestBody DiaryEntry entry, Authentication authentication) {
        // Set the userId from the authenticated user
        entry.setUserId(authentication.getName());

        // Check if the user already has an entry for this date
        if (diaryRepo.hasDiaryEntryForDate(authentication.getName(), entry.getDate())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(null); // User already has an entry for this date
        }

        // If workout was performed but no workout is attached, create a placeholder
        if (entry.isWorkoutPerformed() && entry.getWorkoutSession() == null) {
            WorkoutSession workout = new WorkoutSession();
            workout.setName("Workout on " + entry.getDate());
            workout.setStartTime(LocalDateTime.now());
            workout.setUserId(authentication.getName());
            entry.setWorkoutSession(workout);
        }

        DiaryEntry created = diaryRepo.createDiaryEntry(entry);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // Get all diary entries for the authenticated user
    @GetMapping
    @ResponseBody
    public ResponseEntity<List<DiaryEntry>> getUserDiaryEntries(Authentication authentication) {
        List<DiaryEntry> entries = diaryRepo.getDiaryEntriesByUser(authentication.getName());
        return ResponseEntity.ok(entries);
    }

    // Get diary entries within a date range
    @GetMapping("/range")
    @ResponseBody
    public ResponseEntity<List<DiaryEntry>> getDiaryEntriesInRange(
            @RequestParam LocalDate start,
            @RequestParam LocalDate end,
            Authentication authentication) {

        List<DiaryEntry> entries = diaryRepo.getDiaryEntriesByUserAndDateRange(
                authentication.getName(), start, end);
        return ResponseEntity.ok(entries);
    }

    // Get a diary entry for a specific date
    @GetMapping("/date/{date}")
    @ResponseBody
    public ResponseEntity<DiaryEntry> getDiaryEntryByDate(
            @PathVariable LocalDate date,
            Authentication authentication) {

        DiaryEntry entry = diaryRepo.getDiaryEntryByUserAndDate(authentication.getName(), date);

        if (entry == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(entry);
    }

    // Get a specific diary entry by ID
    @GetMapping("/{id}")
    @ResponseBody
    public ResponseEntity<DiaryEntry> getDiaryEntryById(@PathVariable String id, Authentication authentication) {
        DiaryEntry entry = diaryRepo.getDiaryEntryById(id);

        if (entry == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the entry belongs to the authenticated user
        if (!entry.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        return ResponseEntity.ok(entry);
    }

    // Update a diary entry
    @PutMapping("/{id}")
    @ResponseBody
    public ResponseEntity<DiaryEntry> updateDiaryEntry(
            @PathVariable String id,
            @RequestBody DiaryEntry entry,
            Authentication authentication) {

        DiaryEntry existing = diaryRepo.getDiaryEntryById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the entry belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }

        // Preserve the userId and date from the existing entry
        entry.setId(id);
        entry.setUserId(existing.getUserId());

        // If workout was performed but no workout is attached, preserve existing workout or create placeholder
        if (entry.isWorkoutPerformed() && entry.getWorkoutSession() == null) {
            if (existing.getWorkoutSession() != null) {
                entry.setWorkoutSession(existing.getWorkoutSession());
            } else {
                WorkoutSession workout = new WorkoutSession();
                workout.setName("Workout on " + entry.getDate());
                workout.setStartTime(LocalDateTime.now());
                workout.setUserId(authentication.getName());
                entry.setWorkoutSession(workout);
            }
        } else if (!entry.isWorkoutPerformed()) {
            // If workout is not performed, remove any workout attached
            entry.setWorkoutSession(null);
        }

        DiaryEntry updated = diaryRepo.updateDiaryEntry(entry);
        return ResponseEntity.ok(updated);
    }

    // Delete a diary entry
    @DeleteMapping("/{id}")
    @ResponseBody
    public ResponseEntity<Void> deleteDiaryEntry(@PathVariable String id, Authentication authentication) {
        DiaryEntry existing = diaryRepo.getDiaryEntryById(id);

        if (existing == null) {
            return ResponseEntity.notFound().build();
        }

        // Ensure the entry belongs to the authenticated user
        if (!existing.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        diaryRepo.deleteDiaryEntry(id);
        return ResponseEntity.noContent().build();
    }

}
