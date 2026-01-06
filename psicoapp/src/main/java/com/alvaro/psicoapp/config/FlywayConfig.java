package com.alvaro.psicoapp.config;

import org.flywaydb.core.Flyway;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.flyway.FlywayMigrationInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.DependsOn;

import javax.sql.DataSource;

@Configuration
public class FlywayConfig {
    
    private static final Logger logger = LoggerFactory.getLogger(FlywayConfig.class);
    
    @Autowired
    private DataSource dataSource;
    
    @Bean(initMethod = "migrate")
    @DependsOn("entityManagerFactory")
    public Flyway flyway() {
        logger.info("Initializing Flyway programmatically after Hibernate initialization...");
        Flyway flyway = Flyway.configure()
            .dataSource(dataSource)
            .locations("classpath:db/migration")
            .baselineOnMigrate(true)
            .validateOnMigrate(false)
            .outOfOrder(true)
            .cleanDisabled(true)
            .load();
        
        logger.info("Flyway configured. Current version: {}", flyway.info().current());
        return flyway;
    }
}

