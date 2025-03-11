package vttp.batch5.paf.finalproject.server.repositories;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import vttp.batch5.paf.finalproject.server.models.WorkoutSession;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public class WorkoutRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    // Create a new workout session
    public WorkoutSession createWorkoutSession(WorkoutSession session) {
        return mongoTemplate.insert(session);
    }

    // Get a workout session by ID
    public WorkoutSession getWorkoutSessionById(String id) {
        return mongoTemplate.findById(id, WorkoutSession.class);
    }

    // Get workout sessions for a user
    public List<WorkoutSession> getWorkoutSessionsByUser(String userId) {
        Query query = new Query(Criteria.where("userId").is(userId));
        return mongoTemplate.find(query, WorkoutSession.class);
    }

    // Get workout sessions for a user within a date range
    public List<WorkoutSession> getWorkoutSessionsByUserAndDateRange(String userId, LocalDateTime startTime, LocalDateTime endTime) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("startTime").gte(startTime).lte(endTime));
        return mongoTemplate.find(query, WorkoutSession.class);
    }

    // Get workout sessions for a user with a specific template
    public List<WorkoutSession> getWorkoutSessionsByUserAndTemplate(String userId, Integer templateId) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("templateId").is(templateId));
        return mongoTemplate.find(query, WorkoutSession.class);
    }

    // Update a workout session
    public WorkoutSession updateWorkoutSession(WorkoutSession session) {
        Query query = new Query(Criteria.where("id").is(session.getId()));
        Update update = new Update()
                .set("endTime", session.getEndTime())
                .set("exercises", session.getExercises())
                .set("notes", session.getNotes());

        mongoTemplate.updateFirst(query, update, WorkoutSession.class);
        return getWorkoutSessionById(session.getId());
    }

    // Delete a workout session
    public void deleteWorkoutSession(String id) {
        Query query = new Query(Criteria.where("id").is(id));
        mongoTemplate.remove(query, WorkoutSession.class);
    }

}
