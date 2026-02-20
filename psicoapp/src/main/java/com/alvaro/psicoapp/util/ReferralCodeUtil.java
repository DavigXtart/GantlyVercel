package com.alvaro.psicoapp.util;

import java.text.Normalizer;

/**
 * Genera slugs para referral codes de psicólogos: "Juan García López" -> "juan-garcia-lopez"
 */
public final class ReferralCodeUtil {

    private ReferralCodeUtil() {}

    public static String nameToSlug(String name) {
        if (name == null || name.trim().isEmpty()) return "";
        String n = Normalizer.normalize(name.trim(), Normalizer.Form.NFD);
        n = n.replaceAll("[\\p{InCombiningDiacriticalMarks}]", "");
        n = n.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        return n;
    }
}
