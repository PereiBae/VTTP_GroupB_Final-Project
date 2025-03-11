package vttp.batch5.paf.finalproject.server.repositories.mysql;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import vttp.batch5.paf.finalproject.server.models.TemplateExercise;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class TemplateExerciseRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final String INSERT_EXERCISE = "INSERT INTO template_exercises (template_id, exercise_id, exercise_name, sets, reps, weight) VALUES (?, ?, ?, ?, ?, ?)";
    private final String SELECT_EXERCISES_BY_TEMPLATE = "SELECT * FROM template_exercises WHERE template_id = ?";
    private final String DELETE_EXERCISES_BY_TEMPLATE = "DELETE FROM template_exercises WHERE template_id = ?";

    // Add an exercise to a template
    public Integer addExercise(TemplateExercise exercise) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(INSERT_EXERCISE, Statement.RETURN_GENERATED_KEYS);
            ps.setInt(1, exercise.getTemplateId());
            ps.setString(2, exercise.getExerciseId());
            ps.setString(3, exercise.getExerciseName());
            ps.setInt(4, exercise.getSets());
            ps.setInt(5, exercise.getReps());
            ps.setDouble(6, exercise.getWeight());
            return ps;
        }, keyHolder);

        return keyHolder.getKey().intValue();
    }

    // Get all exercises for a template
    public List<TemplateExercise> getExercisesByTemplate(Integer templateId) {
        return jdbcTemplate.query(SELECT_EXERCISES_BY_TEMPLATE, (rs, rowNum) -> {
            TemplateExercise exercise = new TemplateExercise();
            exercise.setId(rs.getInt("id"));
            exercise.setTemplateId(rs.getInt("template_id"));
            exercise.setExerciseId(rs.getString("exercise_id"));
            exercise.setExerciseName(rs.getString("exercise_name"));
            exercise.setSets(rs.getInt("sets"));
            exercise.setReps(rs.getInt("reps"));
            exercise.setWeight(rs.getDouble("weight"));
            return exercise;
        }, templateId);
    }

    // Delete all exercises for a template
    public boolean deleteExercisesByTemplate(Integer templateId) {
        int deleted = jdbcTemplate.update(DELETE_EXERCISES_BY_TEMPLATE, templateId);
        return deleted > 0;
    }

}
