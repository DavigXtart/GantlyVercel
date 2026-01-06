package com.alvaro.psicoapp.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import javax.sql.DataSource;

@Configuration
public class FlywayRepairConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FlywayRepairConfig.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Bean
    @Order(0) // Ejecutar antes que otros CommandLineRunner
    public CommandLineRunner repairFlyway() {
        return args -> {
            try {
                logger.info("Intentando reparar Flyway...");
                Flyway flyway = Flyway.configure()
                    .dataSource(dataSource)
                    .locations("classpath:db/migration")
                    .load();
                
                flyway.repair();
                logger.info("Flyway reparado correctamente");
            } catch (Exception e) {
                logger.warn("No se pudo reparar Flyway (puede estar bien): {}", e.getMessage());
                // No lanzamos la excepción, continuamos
            }
        };
    }
}

