package com.alvaro.psicoapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StreamUtils;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;

@Component
@Order(1) // Ejecutar después de que Hibernate cree el esquema
public class FlywayDataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(FlywayDataInitializer.class);
    
    @Autowired
    private JdbcTemplate jdbcTemplate;
    
    // Solo las migraciones que insertan DATOS (no crean esquema)
    private static final List<String> DATA_MIGRATIONS = Arrays.asList(
        "db/migration/V25__create_psychologist_matching_test.sql",
        "db/migration/V26__create_patient_matching_test.sql",
        "db/migration/V28__create_test_psychologists.sql"
    );
    
    @Override
    @Transactional
    public void run(String... args) {
        logger.info("Inicializando datos de Flyway (tests y usuarios)...");
        
        for (String migrationFile : DATA_MIGRATIONS) {
            try {
                logger.info("Ejecutando migración de datos: {}", migrationFile);
                ClassPathResource resource = new ClassPathResource(migrationFile);
                String sql = StreamUtils.copyToString(resource.getInputStream(), StandardCharsets.UTF_8);
                
                // Ejecutar el SQL
                jdbcTemplate.execute(sql);
                logger.info("Migración {} ejecutada correctamente", migrationFile);
                
            } catch (Exception e) {
                logger.warn("Error al ejecutar migración {}: {}. Continuando...", migrationFile, e.getMessage());
                // Continuamos con las siguientes migraciones aunque una falle
            }
        }
        
        logger.info("Inicialización de datos de Flyway completada");
    }
}

