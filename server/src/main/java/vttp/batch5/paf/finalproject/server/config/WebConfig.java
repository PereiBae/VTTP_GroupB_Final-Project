package vttp.batch5.paf.finalproject.server.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("https://earnest-charisma-production.up.railway.app","http://localhost:4200")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }

            @Override
            public void addResourceHandlers(ResourceHandlerRegistry registry) {
                registry.addResourceHandler(
                                // Add all resource patterns
                                "/", "/index.html",
                                "/*.js", "/*.css", "/*.ico", "/*.png", "/*.json",
                                "/polyfills-FFHMD2TL.js", "/main-YAYMII3O.js",
                                "/assets/**", "/icons/**"
                        )
                        .addResourceLocations(
                                "classpath:/static/",
                                "classpath:/public/",
                                "classpath:/META-INF/resources/",
                                "file:/app/static/"
                        )
                        .setCachePeriod(0);  // Disable caching during development
            }
        };
    }

}
