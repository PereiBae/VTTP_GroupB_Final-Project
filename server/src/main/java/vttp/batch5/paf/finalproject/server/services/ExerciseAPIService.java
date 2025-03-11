package vttp.batch5.paf.finalproject.server.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

@Service
public class ExerciseAPIService {

    @Value("${exercise.api.key}")
    private String apiKey;

    @Value("${exercise.api.url}")
    private String apiUrl;

    public List<Map<String, Object>> searchExercises(String query) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString("https://api.api-ninjas.com/v1/exercises")
                .queryParam("name", query);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<List> response = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.GET,
                entity,
                List.class
        );

        return response.getBody();
    }

    public List<Map<String, Object>> getExercisesByMuscle(String muscle) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString("https://api.api-ninjas.com/v1/exercises")
                .queryParam("muscle", muscle);

        HttpEntity<String> entity = new HttpEntity<>(headers);

        RestTemplate restTemplate = new RestTemplate();

        ResponseEntity<List> response = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.GET,
                entity,
                List.class
        );

        return response.getBody();
    }

    public List<Map<String,Object>> getAllExercises() {

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-Api-Key", apiKey);

        UriComponentsBuilder builder = UriComponentsBuilder.fromUriString("https://api.api-ninjas.com/v1/exercises");
        HttpEntity<String> entity = new HttpEntity<>(headers);
        RestTemplate restTemplate = new RestTemplate();
        ResponseEntity<List> response = restTemplate.exchange(
                builder.toUriString(),
                HttpMethod.GET,
                entity,
                List.class
        );
        return response.getBody();
    }

}
