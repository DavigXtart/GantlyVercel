package com.alvaro.psicoapp.config;

import java.time.ZoneId;

/**
 * Centralized timezone constant for the application.
 * All date/time comparisons that need a timezone should use APP_ZONE
 * instead of ZoneOffset.UTC or ZoneId.systemDefault().
 */
public final class AppTimezone {
    private AppTimezone() {}

    public static final ZoneId APP_ZONE = ZoneId.of("Europe/Madrid");
}
