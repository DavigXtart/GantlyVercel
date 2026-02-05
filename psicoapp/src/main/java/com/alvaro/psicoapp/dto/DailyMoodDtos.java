package com.alvaro.psicoapp.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.time.LocalDate;
import java.util.List;

/**
 * DTOs para agenda personal / estado de ánimo.
 */
public final class DailyMoodDtos {
    private DailyMoodDtos() {}

    public record SaveEntryRequest(LocalDate entryDate, @Min(1) @Max(5) Integer moodRating,
                                   String emotions, String activities, String companions, String location, String notes) {}

    public record MoodStatisticsResponse(double averageMood, int totalEntries, int streak,
                                         List<String> mostCommonEmotions, List<String> mostCommonActivities) {}

    public record SaveEntryResponse(boolean success, EntryData entry) {}
    public record EntryData(Long id, String entryDate, Integer moodRating, String emotions, String activities, String companions, String location, String notes) {}
}
