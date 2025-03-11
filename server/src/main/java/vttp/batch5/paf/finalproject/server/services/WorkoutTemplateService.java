package vttp.batch5.paf.finalproject.server.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vttp.batch5.paf.finalproject.server.models.TemplateExercise;
import vttp.batch5.paf.finalproject.server.models.WorkoutTemplate;
import vttp.batch5.paf.finalproject.server.repositories.mysql.TemplateExerciseRepository;
import vttp.batch5.paf.finalproject.server.repositories.mysql.WorkoutTemplateRepository;

import java.util.List;

@Service
public class WorkoutTemplateService {

    @Autowired
    private WorkoutTemplateRepository workoutTemplateRepo;

    @Autowired
    private TemplateExerciseRepository templateExerciseRepo;

    // Create a new workout template
    @Transactional
    public WorkoutTemplate createTemplate(WorkoutTemplate template, List<TemplateExercise> exercises) {
        // Create the template first
        Integer templateId = workoutTemplateRepo.createTemplate(template);
        template.setId(templateId);

        // Add the exercises to the template
        if (exercises != null && !exercises.isEmpty()) {
            for (TemplateExercise exercise : exercises) {
                exercise.setTemplateId(templateId);
                templateExerciseRepo.addExercise(exercise);
            }
        }

        return template;
    }

    // Get all templates for a user
    public List<WorkoutTemplate> getTemplatesByUser(String userId) {
        return workoutTemplateRepo.getTemplatesByUser(userId);
    }

    // Get a specific template with its exercises
    public WorkoutTemplate getTemplateWithExercises(Integer templateId) {
        WorkoutTemplate template = workoutTemplateRepo.getTemplateById(templateId);
        if (template != null) {
            List<TemplateExercise> exercises = templateExerciseRepo.getExercisesByTemplate(templateId);
            // You can add exercises to the template if you add a List<TemplateExercise> field to WorkoutTemplate
            // For now, we'll just return the template
        }
        return template;
    }

    // Get exercises for a template
    public List<TemplateExercise> getExercisesByTemplate(Integer templateId) {
        return templateExerciseRepo.getExercisesByTemplate(templateId);
    }

    // Update a template
    @Transactional
    public boolean updateTemplate(WorkoutTemplate template, List<TemplateExercise> exercises) {
        boolean templateUpdated = workoutTemplateRepo.updateTemplate(template);

        if (templateUpdated && exercises != null) {
            // Delete all existing exercises for this template
            templateExerciseRepo.deleteExercisesByTemplate(template.getId());

            // Add the new exercises
            for (TemplateExercise exercise : exercises) {
                exercise.setTemplateId(template.getId());
                templateExerciseRepo.addExercise(exercise);
            }
        }

        return templateUpdated;
    }

    // Delete a template
    @Transactional
    public boolean deleteTemplate(Integer templateId) {
        // Delete the exercises first (though cascade should handle this)
        templateExerciseRepo.deleteExercisesByTemplate(templateId);

        // Then delete the template
        return workoutTemplateRepo.deleteTemplate(templateId);
    }

}
