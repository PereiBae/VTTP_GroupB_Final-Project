package vttp.batch5.paf.finalproject.server.repositories;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Repository;
import vttp.batch5.paf.finalproject.server.models.WorkoutTemplate;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.util.List;

@Repository
public class WorkoutTemplateRepository {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final String INSERT_TEMPLATE = "INSERT INTO workout_templates (user_id, name, description) VALUES (?, ?, ?)";
    private final String SELECT_TEMPLATES_BY_USER = "SELECT * FROM workout_templates WHERE user_id = ?";
    private final String SELECT_TEMPLATE_BY_ID = "SELECT * FROM workout_templates WHERE id = ?";
    private final String UPDATE_TEMPLATE = "UPDATE workout_templates SET name = ?, description = ? WHERE id = ?";
    private final String DELETE_TEMPLATE = "DELETE FROM workout_templates WHERE id = ?";

    // Create a new workout template
    public Integer createTemplate(WorkoutTemplate template) {
        KeyHolder keyHolder = new GeneratedKeyHolder();

        jdbcTemplate.update(connection -> {
            PreparedStatement ps = connection.prepareStatement(INSERT_TEMPLATE, Statement.RETURN_GENERATED_KEYS);
            ps.setString(1, template.getUserId());
            ps.setString(2, template.getName());
            ps.setString(3, template.getDescription());
            return ps;
        }, keyHolder);

        return keyHolder.getKey().intValue();
    }

    // Get all templates for a user
    public List<WorkoutTemplate> getTemplatesByUser(String userId) {
        return jdbcTemplate.query(SELECT_TEMPLATES_BY_USER, (rs, rowNum) -> {
            WorkoutTemplate template = new WorkoutTemplate();
            template.setId(rs.getInt("id"));
            template.setUserId(rs.getString("user_id"));
            template.setName(rs.getString("name"));
            template.setDescription(rs.getString("description"));
            return template;
        }, userId);
    }

    // Get a specific template by ID
    public WorkoutTemplate getTemplateById(Integer id) {
        return jdbcTemplate.queryForObject(SELECT_TEMPLATE_BY_ID, (rs, rowNum) -> {
            WorkoutTemplate template = new WorkoutTemplate();
            template.setId(rs.getInt("id"));
            template.setUserId(rs.getString("user_id"));
            template.setName(rs.getString("name"));
            template.setDescription(rs.getString("description"));
            return template;
        }, id);
    }

    // Update a template
    public boolean updateTemplate(WorkoutTemplate template) {
        int updated = jdbcTemplate.update(UPDATE_TEMPLATE,
                template.getName(),
                template.getDescription(),
                template.getId());
        return updated > 0;
    }

    // Delete a template
    public boolean deleteTemplate(Integer id) {
        int deleted = jdbcTemplate.update(DELETE_TEMPLATE, id);
        return deleted > 0;
    }

}
