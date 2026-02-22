package com.alvaro.psicoapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {

        java.nio.file.Path uploadsPath = Paths.get("uploads").toAbsolutePath();
        if (!uploadsPath.toFile().exists()) {

            java.nio.file.Path altPath = Paths.get("psicoapp", "uploads").toAbsolutePath();
            if (altPath.toFile().exists()) {
                uploadsPath = altPath;
            }
        }
        String uploads = "file:" + uploadsPath.toString().replace("\\", "/") + "/";
        registry.addResourceHandler("/uploads/**").addResourceLocations(uploads);
    }
}
