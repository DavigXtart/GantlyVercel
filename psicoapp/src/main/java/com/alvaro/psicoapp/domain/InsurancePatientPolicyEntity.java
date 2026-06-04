package com.alvaro.psicoapp.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "insurance_patient_policies")
public class InsurancePatientPolicyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "patient_id")
    private UserEntity patient;

    @ManyToOne(optional = false)
    @JoinColumn(name = "insurance_company_id")
    private InsuranceCompanyEntity insuranceCompany;

    @Column(name = "policy_number", nullable = false, length = 50)
    private String policyNumber;

    @Column(name = "holder_name", length = 200)
    private String holderName;

    @Column(name = "expiration_date")
    private LocalDate expirationDate;

    @Column(length = 20, nullable = false)
    private String status = "ACTIVE"; // ACTIVE, EXPIRED, CANCELLED

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public UserEntity getPatient() { return patient; }
    public void setPatient(UserEntity patient) { this.patient = patient; }
    public InsuranceCompanyEntity getInsuranceCompany() { return insuranceCompany; }
    public void setInsuranceCompany(InsuranceCompanyEntity insuranceCompany) { this.insuranceCompany = insuranceCompany; }
    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }
    public String getHolderName() { return holderName; }
    public void setHolderName(String holderName) { this.holderName = holderName; }
    public LocalDate getExpirationDate() { return expirationDate; }
    public void setExpirationDate(LocalDate expirationDate) { this.expirationDate = expirationDate; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
