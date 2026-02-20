package com.alvaro.psicoapp.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

@Configuration
public class WebConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // Buscar uploads/ en el directorio actual o en el directorio del jar/proyecto
        java.nio.file.Path uploadsPath = Paths.get("uploads").toAbsolutePath();
        if (!uploadsPath.toFile().exists()) {
            // Si no existe en el directorio actual, buscar en el directorio del módulo psicoapp
            java.nio.file.Path altPath = Paths.get("psicoapp", "uploads").toAbsolutePath();
            if (altPath.toFile().exists()) {
                uploadsPath = altPath;
            }
        }
        String uploads = "file:" + uploadsPath.toString().replace("\\", "/") + "/";
        registry.addResourceHandler("/uploads/**").addResourceLocations(uploads);
    }
}


