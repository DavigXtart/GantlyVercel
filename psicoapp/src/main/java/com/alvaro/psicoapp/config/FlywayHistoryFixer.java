package com.alvaro.psicoapp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.Statement;

@Configuration
public class FlywayHistoryFixer {
    
    private static final Logger logger = LoggerFactory.getLogger(FlywayHistoryFixer.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Bean
    @Order(-1) // Ejecutar ANTES que Flyway
    public CommandLineRunner fixFlywayHistory() {
        return args -> {
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                
                // Verificar si existe la tabla flyway_schema_history
                DatabaseMetaData meta = conn.getMetaData();
                ResultSet tables = meta.getTables(null, null, "flyway_schema_history", null);
                
                if (tables.next()) {
                    // La tabla existe, verificar si está corrupta (versión 3 pero esquema incompleto)
                    try {
                        ResultSet rs = stmt.executeQuery(
                            "SELECT COUNT(*) as count FROM flyway_schema_history WHERE version = '3' AND success = 1"
                        );
                        if (rs.next() && rs.getInt("count") > 0) {
                            // Hay registro de versión 3 exitosa, pero el esquema puede estar incompleto
                            // Verificar si existen tablas básicas
                            ResultSet userTable = meta.getTables(null, null, "users", null);
                            boolean usersExists = userTable.next();
                            userTable.close();
                            
                            ResultSet testTable = meta.getTables(null, null, "tests", null);
                            boolean testsExists = testTable.next();
                            testTable.close();
                            
                            // Si falta alguna tabla básica, el esquema está incompleto
                            if (!usersExists || !testsExists) {
                                logger.warn("Esquema incompleto detectado. Limpiando flyway_schema_history para re-ejecutar todas las migraciones...");
                                stmt.executeUpdate("DELETE FROM flyway_schema_history");
                                logger.info("flyway_schema_history limpiado. Flyway ejecutará todas las migraciones desde el inicio.");
                            } else {
                                logger.info("Esquema parece completo. Flyway continuará normalmente.");
                            }
                        }
                        rs.close();
                    } catch (Exception e) {
                        logger.warn("Error al verificar flyway_schema_history: {}", e.getMessage());
                    }
                } else {
                    logger.info("Tabla flyway_schema_history no existe. Flyway la creará automáticamente.");
                }
                tables.close();
                
            } catch (Exception e) {
                logger.error("Error al verificar/fix flyway_schema_history: {}", e.getMessage());
                // No lanzamos la excepción, dejamos que Flyway intente funcionar
            }
        };
    }
}

