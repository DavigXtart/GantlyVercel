package com.alvaro.psicoapp.util;

import java.util.regex.Pattern;

public class InputSanitizer {

    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
    );

    private static final Pattern SQL_INJECTION_PATTERN = Pattern.compile(
        "(?i)(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|onerror|onload)"
    );

    private static final Pattern XSS_PATTERN = Pattern.compile(
        "(?i)(<script|</script>|javascript:|onerror=|onload=|onclick=|onmouseover=)"
    );

    public static String sanitize(String input) {
        if (input == null) {
            return null;
        }

        String sanitized = input.replaceAll("[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]", "");

        sanitized = sanitized.trim();

        return sanitized;
    }

    public static String sanitizeEmail(String email) {
        if (email == null || email.isEmpty()) {
            return null;
        }

        String sanitized = sanitize(email.toLowerCase().trim());

        if (!EMAIL_PATTERN.matcher(sanitized).matches()) {
            throw new IllegalArgumentException("Email inválido");
        }

        return sanitized;
    }

    public static void validateNoSqlInjection(String input) {
        if (input != null && SQL_INJECTION_PATTERN.matcher(input).find()) {
            throw new IllegalArgumentException("Input contiene caracteres no permitidos");
        }
    }

    public static void validateNoXss(String input) {
        if (input != null && XSS_PATTERN.matcher(input).find()) {
            throw new IllegalArgumentException("Input contiene caracteres no permitidos");
        }
    }

    public static String sanitizeAndValidate(String input, int maxLength) {
        if (input == null) {
            return null;
        }

        String sanitized = sanitize(input);

        if (sanitized.length() > maxLength) {
            throw new IllegalArgumentException("Input excede la longitud máxima de " + maxLength + " caracteres");
        }

        validateNoSqlInjection(sanitized);
        validateNoXss(sanitized);

        return sanitized;
    }

    public static void validateNumberRange(Number number, Number min, Number max) {
        if (number == null) {
            throw new IllegalArgumentException("El número no puede ser null");
        }

        double value = number.doubleValue();
        double minValue = min.doubleValue();
        double maxValue = max.doubleValue();

        if (value < minValue || value > maxValue) {
            throw new IllegalArgumentException(
                String.format("El valor debe estar entre %s y %s", min, max)
            );
        }
    }
}
