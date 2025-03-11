package vttp.batch5.paf.finalproject.server.services;

import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ExerciseGitService {

    private static final String EXERCISE_DB_URL = "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";

    // Cache the exercises to avoid fetching the large JSON file repeatedly
    private List<Map<String, Object>> cachedExercises;

    // Get all exercises
    public List<Map<String, Object>> getAllExercises() {

        RestTemplate restTemplate = new RestTemplate();
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setSupportedMediaTypes(Arrays.asList(MediaType.APPLICATION_JSON, MediaType.TEXT_PLAIN));
        restTemplate.getMessageConverters().addFirst(converter);

        if (cachedExercises == null) {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    EXERCISE_DB_URL,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<>() {
                    }
            );
            cachedExercises = response.getBody();
        }
        return cachedExercises;
    }

    // Search exercises by name
    public List<Map<String, Object>> searchExercises(String query) {
        List<Map<String, Object>> allExercises = getAllExercises();
        String lowercaseQuery = query.toLowerCase();

        return allExercises.stream()
                .filter(exercise -> {
                    String name = (String) exercise.get("name");
                    return name != null && name.toLowerCase().contains(lowercaseQuery);
                })
                .collect(Collectors.toList());
    }

    // Get exercise by ID
    public Map<String, Object> getExerciseById(String id) {
        List<Map<String, Object>> allExercises = getAllExercises();

        return allExercises.stream()
                .filter(exercise -> id.equals(exercise.get("id")))
                .findFirst()
                .orElse(null);
    }

    // Get exercises by muscle
    public List<Map<String, Object>> getExercisesByMuscle(String muscle) {
        if ("all".equals(muscle)) {
            return getAllExercises();
        }

        List<Map<String, Object>> allExercises = getAllExercises();
        String lowercaseMuscle = muscle.toLowerCase();

        return allExercises.stream()
                .filter(exercise -> {
                    // Check primary muscles (which is an array, not a string)
                    @SuppressWarnings("unchecked")
                    List<String> primaryMuscles = (List<String>) exercise.get("primaryMuscles");
                    if (primaryMuscles != null) {
                        for (String m : primaryMuscles) {
                            if (m.toLowerCase().contains(lowercaseMuscle)) {
                                return true;
                            }
                        }
                    }

                    return false;
                })
                .collect(Collectors.toList());
    }

}
