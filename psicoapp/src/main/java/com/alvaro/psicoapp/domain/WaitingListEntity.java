package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "waiting_list")
public class WaitingListEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id")
    private UserEntity patient;

    @Column(name = "patient_name", nullable = false, length = 200)
    private String patientName;

    @Column(name = "patient_email", length = 255)
    private String patientEmail;

    @Column(name = "patient_phone", length = 30)
    private String patientPhone;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requested_service_id")
    private ClinicServiceEntity requestedService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "psychologist_preference_id")
    private UserEntity psychologistPreference;

    @Column(length = 20, nullable = false)
    private String priority = "NORMAL";

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(length = 20, nullable = false)
    private String status = "WAITING";

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at")
    private Instant updatedAt = Instant.now();

    @Column(name = "contacted_at")
    private Instant contactedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scheduled_appointment_id")
    private AppointmentEntity scheduledAppointment;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getCompanyId() { return companyId; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public UserEntity getPatient() { return patient; }
    public void setPatient(UserEntity patient) { this.patient = patient; }
    public String getPatientName() { return patientName; }
    public void setPatientName(String patientName) { this.patientName = patientName; }
    public String getPatientEmail() { return patientEmail; }
    public void setPatientEmail(String patientEmail) { this.patientEmail = patientEmail; }
    public String getPatientPhone() { return patientPhone; }
    public void setPatientPhone(String patientPhone) { this.patientPhone = patientPhone; }
    public ClinicServiceEntity getRequestedService() { return requestedService; }
    public void setRequestedService(ClinicServiceEntity requestedService) { this.requestedService = requestedService; }
    public UserEntity getPsychologistPreference() { return psychologistPreference; }
    public void setPsychologistPreference(UserEntity psychologistPreference) { this.psychologistPreference = psychologistPreference; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getContactedAt() { return contactedAt; }
    public void setContactedAt(Instant contactedAt) { this.contactedAt = contactedAt; }
    public AppointmentEntity getScheduledAppointment() { return scheduledAppointment; }
    public void setScheduledAppointment(AppointmentEntity scheduledAppointment) { this.scheduledAppointment = scheduledAppointment; }
}
