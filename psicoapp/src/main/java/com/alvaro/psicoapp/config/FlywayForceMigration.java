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
import java.sql.Connection;
import java.sql.Statement;

@Configuration
public class FlywayForceMigration {
    
    private static final Logger logger = LoggerFactory.getLogger(FlywayForceMigration.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Bean
    @Order(-1) // Ejecutar ANTES que todo
    public CommandLineRunner resetFlywayHistory() {
        return args -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                
                logger.info("Reseteando tabla flyway_schema_history para forzar ejecución completa...");
                
                // Intentar borrar todos los registros de flyway_schema_history
                try {
                    stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE success = 0");
                    logger.info("Registros fallidos eliminados de flyway_schema_history");
                } catch (Exception e) {
                    logger.warn("No se pudo limpiar flyway_schema_history (puede estar vacía): {}", e.getMessage());
                }
                
                // Si solo hay versión 3, resetear a 0 para ejecutar todo
                try {
                    int count = stmt.executeUpdate("DELETE FROM flyway_schema_history WHERE version <= '3'");
                    if (count > 0) {
                        logger.info("Eliminadas {} migraciones antiguas para forzar re-ejecución", count);
                    }
                } catch (Exception e) {
                    logger.warn("Error al resetear migraciones: {}", e.getMessage());
                }
                
            } catch (Exception e) {
                logger.error("Error al resetear flyway_schema_history: {}", e.getMessage());
                // No lanzamos la excepción, continuamos
            }
        };
    }
}

