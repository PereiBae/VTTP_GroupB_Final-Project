package vttp.batch5.paf.finalproject.server.repositories.mongo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import vttp.batch5.paf.finalproject.server.models.DiaryEntry;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public class DiaryRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    // Create a new diary entry
    public DiaryEntry createDiaryEntry(DiaryEntry entry) {
        // Set creation timestamp if not set
        if (entry.getWorkoutSession() != null && entry.getWorkoutSession().getStartTime() == null) {
            entry.getWorkoutSession().setStartTime(LocalDateTime.now());
        }
        return mongoTemplate.insert(entry);
    }

    // Get a diary entry by ID
    public DiaryEntry getDiaryEntryById(String id) {
        return mongoTemplate.findById(id, DiaryEntry.class);
    }

    // Get diary entries for a user
    public List<DiaryEntry> getDiaryEntriesByUser(String userId) {
        Query query = new Query(Criteria.where("userId").is(userId));
        return mongoTemplate.find(query, DiaryEntry.class);
    }

    // Get diary entries for a user within a date range
    public List<DiaryEntry> getDiaryEntriesByUserAndDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("date").gte(startDate).lte(endDate));
        return mongoTemplate.find(query, DiaryEntry.class);
    }

    // Get a diary entry for a user on a specific date
    public DiaryEntry getDiaryEntryByUserAndDate(String userId, LocalDate date) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("date").is(date));
        return mongoTemplate.findOne(query, DiaryEntry.class);
    }

    // Check if a user has a diary entry for a specific date
    public boolean hasDiaryEntryForDate(String userId, LocalDate date) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("date").is(date));
        return mongoTemplate.exists(query, DiaryEntry.class);
    }

    // Update a diary entry
    public DiaryEntry updateDiaryEntry(DiaryEntry entry) {
        Query query = new Query(Criteria.where("id").is(entry.getId()));

        // Create the update operation
        Update update = new Update()
                .set("date", entry.getDate())
                .set("feeling", entry.getFeeling())
                .set("notes", entry.getNotes())
                .set("workoutPerformed", entry.isWorkoutPerformed())
                .set("spotifyTrackId", entry.getSpotifyTrackId())
                .set("spotifyTrackName", entry.getSpotifyTrackName())
                .set("spotifyArtistName", entry.getSpotifyArtistName());

        // Set or unset workout based on workoutPerformed flag
        if (entry.isWorkoutPerformed() && entry.getWorkoutSession() != null) {
            update.set("workout", entry.getWorkoutSession());
        } else if (!entry.isWorkoutPerformed()) {
            update.unset("workout");
        }

        // Perform the update
        mongoTemplate.updateFirst(query, update, DiaryEntry.class);

        // Return the updated entry
        return getDiaryEntryById(entry.getId());
    }

    // Delete a diary entry
    public void deleteDiaryEntry(String id) {
        Query query = new Query(Criteria.where("id").is(id));
        mongoTemplate.remove(query, DiaryEntry.class);
    }

}
