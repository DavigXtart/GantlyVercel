package com.alvaro.psicoapp.domain;

public final class AppointmentStatus {
    private AppointmentStatus() {}

    public static final String FREE = "FREE";
    public static final String REQUESTED = "REQUESTED";
    public static final String CONFIRMED = "CONFIRMED";
    public static final String BOOKED = "BOOKED";
    public static final String CANCELLED = "CANCELLED";

    public static final String REQUEST_PENDING = "PENDING";
    public static final String REQUEST_CONFIRMED = "CONFIRMED";
    public static final String REQUEST_REJECTED = "REJECTED";

    public static final String PAYMENT_PENDING = "PENDING";
    public static final String PAYMENT_PAID = "PAID";
    public static final String PAYMENT_EXPIRED = "EXPIRED";
}
