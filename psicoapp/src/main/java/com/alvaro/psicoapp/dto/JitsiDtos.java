package com.alvaro.psicoapp.dto;

public final class JitsiDtos {
    private JitsiDtos() {}

    public record UserInfo(String email, String name) {}
    public record RoomInfoResponse(String roomName, UserInfo currentUser, UserInfo otherUser, boolean hasActiveAppointment) {}
}
