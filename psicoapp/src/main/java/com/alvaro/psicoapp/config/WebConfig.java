package com.alvaro.psicoapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Usar file: en lugar de file:// para compatibilidad
        String uploads = "file:" + Paths.get("uploads").toAbsolutePath().toString().replace("\\", "/") + "/";
        registry.addResourceHandler("/uploads/**").addResourceLocations(uploads);
    }
}


