package vttp.batch5.paf.finalproject.server.repositories.mongo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Repository;
import vttp.batch5.paf.finalproject.server.models.NutritionLog;

import java.time.LocalDate;
import java.util.List;

@Repository
public class NutritionRepository {

    @Autowired
    private MongoTemplate mongoTemplate;

    // Create a new nutrition log
    public NutritionLog createNutritionLog(NutritionLog log) {
        return mongoTemplate.insert(log);
    }

    // Get a nutrition log by ID
    public NutritionLog getNutritionLogById(String id) {
        return mongoTemplate.findById(id, NutritionLog.class);
    }

    // Get nutrition logs for a user
    public List<NutritionLog> getNutritionLogsByUser(String userId) {
        Query query = new Query(Criteria.where("userId").is(userId));
        return mongoTemplate.find(query, NutritionLog.class);
    }

    // Get nutrition logs for a user within a date range
    public List<NutritionLog> getNutritionLogsByUserAndDateRange(String userId, LocalDate startDate, LocalDate endDate) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("date").gte(startDate).lte(endDate));
        return mongoTemplate.find(query, NutritionLog.class);
    }

    // Get a nutrition log for a user on a specific date
    public NutritionLog getNutritionLogByUserAndDate(String userId, LocalDate date) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("date").is(date));
        return mongoTemplate.findOne(query, NutritionLog.class);
    }

    // Check if a user has a nutrition log for a specific date
    public boolean hasNutritionLogForDate(String userId, LocalDate date) {
        Query query = new Query(Criteria.where("userId").is(userId)
                .and("date").is(date));
        return mongoTemplate.exists(query, NutritionLog.class);
    }

    // Update a nutrition log
    public NutritionLog updateNutritionLog(NutritionLog log) {
        Query query = new Query(Criteria.where("id").is(log.getId()));
        Update update = new Update()
                .set("totalCalories", log.getTotalCalories())
                .set("totalProtein", log.getTotalProtein())
                .set("totalCarbs", log.getTotalCarbs())
                .set("totalFat", log.getTotalFat())
                .set("meals", log.getMeals());

        mongoTemplate.updateFirst(query, update, NutritionLog.class);
        return getNutritionLogById(log.getId());
    }

    // Delete a nutrition log
    public void deleteNutritionLog(String id) {
        Query query = new Query(Criteria.where("id").is(id));
        mongoTemplate.remove(query, NutritionLog.class);
    }

}
