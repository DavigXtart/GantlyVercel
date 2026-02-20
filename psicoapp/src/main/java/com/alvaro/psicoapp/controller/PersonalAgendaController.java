package com.alvaro.psicoapp.controller;

import com.alvaro.psicoapp.domain.DailyMoodEntryEntity;
import com.alvaro.psicoapp.dto.DailyMoodDtos;
import com.alvaro.psicoapp.service.CurrentUserService;
import com.alvaro.psicoapp.service.DailyMoodService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/personal-agenda")
@Tag(name = "Agenda Personal", description = "APIs para gestión del diario de estado de ánimo y estadísticas personales")
public class PersonalAgendaController {
    private final DailyMoodService dailyMoodService;
    private final CurrentUserService currentUserService;

    public PersonalAgendaController(DailyMoodService dailyMoodService, CurrentUserService currentUserService) {
        this.dailyMoodService = dailyMoodService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/entry")
    @Operation(summary = "Guardar entrada de estado de ánimo", description = "Guarda o actualiza una entrada del diario de estado de ánimo")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Entrada guardada exitosamente"),
		@ApiResponse(responseCode = "400", description = "Datos inválidos")
	})
    public ResponseEntity<?> saveEntry(Principal principal, @Valid @RequestBody DailyMoodDtos.SaveEntryRequest req) {
        try {
            var user = currentUserService.getCurrentUser(principal);
            if (req.moodRating() == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "El estado de ánimo es obligatorio"));
            }
            DailyMoodEntryEntity entry = dailyMoodService.saveOrUpdate(user.getId(), req);
            var entryData = new DailyMoodDtos.EntryData(
                    entry.getId(), entry.getEntryDate().toString(), entry.getMoodRating(),
                    entry.getEmotions() != null ? entry.getEmotions() : "",
                    entry.getActivities() != null ? entry.getActivities() : "",
                    entry.getCompanions() != null ? entry.getCompanions() : "",
                    entry.getLocation() != null ? entry.getLocation() : "",
                    entry.getNotes() != null ? entry.getNotes() : "");
            return ResponseEntity.ok(new DailyMoodDtos.SaveEntryResponse(true, entryData));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage() != null ? e.getMessage() : "Error al guardar la entrada"));
        }
    }

    @GetMapping("/entry/today")
    @Operation(summary = "Obtener entrada de hoy", description = "Obtiene la entrada del diario de estado de ánimo del día actual")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Entrada obtenida exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener la entrada")
	})
    public ResponseEntity<?> getTodayEntry(Principal principal) {
        try {
            var user = currentUserService.getCurrentUser(principal);
            Optional<DailyMoodEntryEntity> entry = dailyMoodService.getTodayEntry(user.getId());
            return ResponseEntity.ok(Map.of("entry", entry.orElse(null)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/entries")
    @Operation(summary = "Obtener todas las entradas", description = "Obtiene todas las entradas del diario de estado de ánimo del usuario")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Entradas obtenidas exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener las entradas")
	})
    public ResponseEntity<?> getUserEntries(Principal principal) {
        try {
            var user = currentUserService.getCurrentUser(principal);
            List<DailyMoodEntryEntity> entries = dailyMoodService.getUserEntries(user.getId());
            return ResponseEntity.ok(Map.of("entries", entries));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/statistics")
    @Operation(summary = "Obtener estadísticas", description = "Obtiene estadísticas del estado de ánimo del usuario en un período de días")
    @ApiResponses(value = {
		@ApiResponse(responseCode = "200", description = "Estadísticas obtenidas exitosamente"),
		@ApiResponse(responseCode = "400", description = "Error al obtener estadísticas")
	})
    public ResponseEntity<?> getStatistics(Principal principal, @RequestParam(defaultValue = "30") int days) {
        try {
            var user = currentUserService.getCurrentUser(principal);
            return ResponseEntity.ok(dailyMoodService.getStatistics(user.getId(), days));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
