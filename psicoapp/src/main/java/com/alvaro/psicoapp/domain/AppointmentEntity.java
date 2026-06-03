package com.alvaro.psicoapp.domain;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "appointments", indexes = {
    @Index(name = "idx_appt_psych_start", columnList = "psychologist_id, start_time"),
    @Index(name = "idx_appt_user", columnList = "user_id"),
    @Index(name = "idx_appt_status", columnList = "status")
})
public class AppointmentEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "psychologist_id")
    private UserEntity psychologist;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private UserEntity user;

    @Column(name = "start_time", nullable = false)
    private Instant startTime;

    @Column(name = "end_time", nullable = false)
    private Instant endTime;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AppointmentStatusEnum status = AppointmentStatusEnum.FREE;

    @Column(length = 500)
    private String notes;

    @Column(name = "price", precision = 10, scale = 2)
    private BigDecimal price;

    @Column(name = "tax_rate", precision = 5, scale = 4)
    private BigDecimal taxRate;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    private BigDecimal taxAmount;

    @Column(name = "total_amount", precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Column(name = "tax_exempt")
    private Boolean taxExempt = true;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "payment_deadline")
    private Instant paymentDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status", length = 20)
    private PaymentStatusEnum paymentStatus = PaymentStatusEnum.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "confirmed_by_user_id")
    private UserEntity confirmedByUser;

    @Column(name = "stripe_session_id", length = 255)
    private String stripeSessionId;

    @Column(length = 100)
    private String service;

    @Column(name = "clinic_notes", length = 500)
    private String clinicNotes;

    @Column(length = 20, nullable = false)
    private String modality = "ONLINE";

    @Column(name = "payment_method", length = 20, nullable = false)
    private String paymentMethod = "STRIPE";

    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "recurrence_group_id", length = 36)
    private String recurrenceGroupId;

    @Column(name = "recurrence_rule", length = 20)
    private String recurrenceRule;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "insurance_policy_id")
    private InsurancePatientPolicyEntity insurancePolicy;

    @Column(name = "billing_type", length = 20)
    private String billingType = "PRIVATE"; // PRIVATE, INSURANCE

    @Version
    private Long version;

    @JsonIgnore
    @OneToMany(mappedBy = "appointment", cascade = CascadeType.REMOVE, orphanRemoval = true)
    private List<AppointmentRequestEntity> requests = new ArrayList<>();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getPsychologist() { return psychologist; }
    public void setPsychologist(UserEntity psychologist) { this.psychologist = psychologist; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public Instant getStartTime() { return startTime; }
    public void setStartTime(Instant startTime) { this.startTime = startTime; }
    public Instant getEndTime() { return endTime; }
    public void setEndTime(Instant endTime) { this.endTime = endTime; }
    public AppointmentStatusEnum getStatus() { return status; }
    public void setStatus(AppointmentStatusEnum status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
    public BigDecimal getTaxRate() { return taxRate; }
    public void setTaxRate(BigDecimal taxRate) { this.taxRate = taxRate; }
    public BigDecimal getTaxAmount() { return taxAmount; }
    public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public Boolean getTaxExempt() { return taxExempt; }
    public void setTaxExempt(Boolean taxExempt) { this.taxExempt = taxExempt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getConfirmedAt() { return confirmedAt; }
    public void setConfirmedAt(Instant confirmedAt) { this.confirmedAt = confirmedAt; }
    public Instant getPaymentDeadline() { return paymentDeadline; }
    public void setPaymentDeadline(Instant paymentDeadline) { this.paymentDeadline = paymentDeadline; }
    public PaymentStatusEnum getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(PaymentStatusEnum paymentStatus) { this.paymentStatus = paymentStatus; }
    public UserEntity getConfirmedByUser() { return confirmedByUser; }
    public void setConfirmedByUser(UserEntity confirmedByUser) { this.confirmedByUser = confirmedByUser; }
    public String getStripeSessionId() { return stripeSessionId; }
    public void setStripeSessionId(String stripeSessionId) { this.stripeSessionId = stripeSessionId; }
    public String getService() { return service; }
    public void setService(String service) { this.service = service; }
    public String getClinicNotes() { return clinicNotes; }
    public void setClinicNotes(String clinicNotes) { this.clinicNotes = clinicNotes; }
    public String getModality() { return modality; }
    public void setModality(String modality) { this.modality = modality; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public Long getRoomId() { return roomId; }
    public void setRoomId(Long roomId) { this.roomId = roomId; }
    public String getRecurrenceGroupId() { return recurrenceGroupId; }
    public void setRecurrenceGroupId(String recurrenceGroupId) { this.recurrenceGroupId = recurrenceGroupId; }
    public String getRecurrenceRule() { return recurrenceRule; }
    public void setRecurrenceRule(String recurrenceRule) { this.recurrenceRule = recurrenceRule; }
    public List<AppointmentRequestEntity> getRequests() { return requests; }
    public void setRequests(List<AppointmentRequestEntity> requests) { this.requests = requests; }
    public InsurancePatientPolicyEntity getInsurancePolicy() { return insurancePolicy; }
    public void setInsurancePolicy(InsurancePatientPolicyEntity insurancePolicy) { this.insurancePolicy = insurancePolicy; }
    public String getBillingType() { return billingType; }
    public void setBillingType(String billingType) { this.billingType = billingType; }
    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
