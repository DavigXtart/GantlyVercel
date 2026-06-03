package com.alvaro.psicoapp.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.support.CompositeCacheManager;

import java.time.Duration;
import java.util.List;

@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * Primary cache manager with two tiers:
     * - "adminStats": short TTL (5 min) since stats change with every user action
     * - All others (testsByCategory, testsByTopic): longer TTL (15 min) for rarely changing data
     */
    @Bean
    public CacheManager cacheManager() {
        // Short-lived cache for admin statistics
        CaffeineCacheManager statsCacheManager = new CaffeineCacheManager();
        statsCacheManager.setCacheNames(List.of("adminStats"));
        statsCacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10)
            .expireAfterWrite(Duration.ofMinutes(5))
        );

        // Longer-lived cache for test definitions
        CaffeineCacheManager testsCacheManager = new CaffeineCacheManager();
        testsCacheManager.setCacheNames(List.of("testsByCategory", "testsByTopic"));
        testsCacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(500)
            .expireAfterWrite(Duration.ofMinutes(15))
        );

        CompositeCacheManager compositeCacheManager = new CompositeCacheManager();
        compositeCacheManager.setCacheManagers(List.of(statsCacheManager, testsCacheManager));
        compositeCacheManager.setFallbackToNoOpCache(false);
        return compositeCacheManager;
    }
}
