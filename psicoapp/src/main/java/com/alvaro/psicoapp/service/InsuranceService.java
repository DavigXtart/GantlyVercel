package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.InsuranceCompanyEntity;
import com.alvaro.psicoapp.domain.InsurancePatientPolicyEntity;
import com.alvaro.psicoapp.domain.UserEntity;
import com.alvaro.psicoapp.repository.CompanyRepository;
import com.alvaro.psicoapp.repository.InsuranceCompanyRepository;
import com.alvaro.psicoapp.repository.InsurancePatientPolicyRepository;
import com.alvaro.psicoapp.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class InsuranceService {

    private final CompanyRepository companyRepository;
    private final InsuranceCompanyRepository insuranceCompanyRepository;
    private final InsurancePatientPolicyRepository policyRepository;
    private final UserRepository userRepository;

    public InsuranceService(CompanyRepository companyRepository,
                            InsuranceCompanyRepository insuranceCompanyRepository,
                            InsurancePatientPolicyRepository policyRepository,
                            UserRepository userRepository) {
        this.companyRepository = companyRepository;
        this.insuranceCompanyRepository = insuranceCompanyRepository;
        this.policyRepository = policyRepository;
        this.userRepository = userRepository;
    }

    // --- DTOs ---
    public record InsuranceCompanyDto(Long id, String name, String nif, String address, String phone,
                                       String email, String contactPerson, Boolean active, String createdAt) {}
    public record InsurancePatientPolicyDto(Long id, Long patientId, String patientName,
                                             Long insuranceCompanyId, String insuranceCompanyName,
                                             String policyNumber, String holderName,
                                             String expirationDate, String status, String createdAt) {}
    public record CreateInsuranceCompanyRequest(String name, String nif, String address, String phone,
                                                 String email, String contactPerson) {}
    public record UpdateInsuranceCompanyRequest(String name, String nif, String address, String phone,
                                                 String email, String contactPerson, Boolean active) {}
    public record CreatePolicyRequest(Long insuranceCompanyId, String policyNumber, String holderName,
                                       String expirationDate) {}

    private Long resolveCompanyId(String email) {
        return companyRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Empresa no encontrada"))
                .getId();
    }

    // --- Insurance Companies CRUD ---

    @Transactional(readOnly = true)
    public List<InsuranceCompanyDto> getInsuranceCompanies(String email) {
        Long companyId = resolveCompanyId(email);
        return insuranceCompanyRepository.findByCompanyIdOrderByNameAsc(companyId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InsuranceCompanyDto createInsuranceCompany(String email, CreateInsuranceCompanyRequest req) {
        Long companyId = resolveCompanyId(email);
        if (req.name() == null || req.name().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El nombre de la aseguradora es obligatorio");
        }
        InsuranceCompanyEntity entity = new InsuranceCompanyEntity();
        entity.setCompanyId(companyId);
        entity.setName(req.name().trim());
        entity.setNif(req.nif());
        entity.setAddress(req.address());
        entity.setPhone(req.phone());
        entity.setEmail(req.email());
        entity.setContactPerson(req.contactPerson());
        entity.setActive(true);
        insuranceCompanyRepository.save(entity);
        return toDto(entity);
    }

    @Transactional
    public InsuranceCompanyDto updateInsuranceCompany(String email, Long id, UpdateInsuranceCompanyRequest req) {
        Long companyId = resolveCompanyId(email);
        InsuranceCompanyEntity entity = insuranceCompanyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aseguradora no encontrada"));
        if (!companyId.equals(entity.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        if (req.name() != null && !req.name().isBlank()) entity.setName(req.name().trim());
        if (req.nif() != null) entity.setNif(req.nif());
        if (req.address() != null) entity.setAddress(req.address());
        if (req.phone() != null) entity.setPhone(req.phone());
        if (req.email() != null) entity.setEmail(req.email());
        if (req.contactPerson() != null) entity.setContactPerson(req.contactPerson());
        if (req.active() != null) entity.setActive(req.active());
        insuranceCompanyRepository.save(entity);
        return toDto(entity);
    }

    @Transactional
    public void deleteInsuranceCompany(String email, Long id) {
        Long companyId = resolveCompanyId(email);
        InsuranceCompanyEntity entity = insuranceCompanyRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aseguradora no encontrada"));
        if (!companyId.equals(entity.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        entity.setActive(false);
        insuranceCompanyRepository.save(entity);
    }

    // --- Patient Policies CRUD ---

    @Transactional(readOnly = true)
    public List<InsurancePatientPolicyDto> getAllPolicies(String email) {
        Long companyId = resolveCompanyId(email);
        return policyRepository.findByInsuranceCompanyCompanyIdOrderByCreatedAtDesc(companyId)
                .stream()
                .map(this::toPolicyDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<InsurancePatientPolicyDto> getPatientPolicies(String email, Long patientId) {
        Long companyId = resolveCompanyId(email);
        return policyRepository.findByInsuranceCompanyCompanyIdAndPatientIdOrderByCreatedAtDesc(companyId, patientId)
                .stream()
                .map(this::toPolicyDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public InsurancePatientPolicyDto createPolicy(String email, Long patientId, CreatePolicyRequest req) {
        Long companyId = resolveCompanyId(email);
        UserEntity patient = userRepository.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Paciente no encontrado"));
        InsuranceCompanyEntity ic = insuranceCompanyRepository.findById(req.insuranceCompanyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Aseguradora no encontrada"));
        if (!companyId.equals(ic.getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        if (req.policyNumber() == null || req.policyNumber().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El numero de poliza es obligatorio");
        }
        InsurancePatientPolicyEntity policy = new InsurancePatientPolicyEntity();
        policy.setPatient(patient);
        policy.setInsuranceCompany(ic);
        policy.setPolicyNumber(req.policyNumber().trim());
        policy.setHolderName(req.holderName());
        if (req.expirationDate() != null && !req.expirationDate().isBlank()) {
            policy.setExpirationDate(LocalDate.parse(req.expirationDate()));
        }
        policy.setStatus("ACTIVE");
        policyRepository.save(policy);
        return toPolicyDto(policy);
    }

    @Transactional
    public void deletePolicy(String email, Long policyId) {
        Long companyId = resolveCompanyId(email);
        InsurancePatientPolicyEntity policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Poliza no encontrada"));
        if (!companyId.equals(policy.getInsuranceCompany().getCompanyId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No autorizado");
        }
        policyRepository.delete(policy);
    }

    private InsuranceCompanyDto toDto(InsuranceCompanyEntity e) {
        return new InsuranceCompanyDto(e.getId(), e.getName(), e.getNif(), e.getAddress(), e.getPhone(),
                e.getEmail(), e.getContactPerson(), e.getActive(),
                e.getCreatedAt() != null ? e.getCreatedAt().toString() : null);
    }

    private InsurancePatientPolicyDto toPolicyDto(InsurancePatientPolicyEntity p) {
        return new InsurancePatientPolicyDto(
                p.getId(), p.getPatient().getId(), p.getPatient().getName(),
                p.getInsuranceCompany().getId(), p.getInsuranceCompany().getName(),
                p.getPolicyNumber(), p.getHolderName(),
                p.getExpirationDate() != null ? p.getExpirationDate().toString() : null,
                p.getStatus(),
                p.getCreatedAt() != null ? p.getCreatedAt().toString() : null);
    }
}
