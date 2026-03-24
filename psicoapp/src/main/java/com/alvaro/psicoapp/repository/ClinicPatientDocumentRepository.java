package com.alvaro.psicoapp.repository;
import com.alvaro.psicoapp.domain.ClinicPatientDocumentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ClinicPatientDocumentRepository extends JpaRepository<ClinicPatientDocumentEntity, Long> {
    List<ClinicPatientDocumentEntity> findByCompanyIdAndPatientIdOrderByUploadedAtDesc(Long companyId, Long patientId);
}
