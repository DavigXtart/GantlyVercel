package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Period;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class MatchingService {
    
    @Autowired
    private TestRepository testRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private UserAnswerRepository userAnswerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserPsychologistRepository userPsychologistRepository;
    
    @Autowired
    private PsychologistProfileRepository psychologistProfileRepository;
    
    private static final String PATIENT_MATCHING_TEST_CODE = "PATIENT_MATCHING";
    private static final String PSYCHOLOGIST_MATCHING_TEST_CODE = "PSYCHOLOGIST_MATCHING";
    
    /**
     * Calcula el matching entre un paciente y todos los psicólogos disponibles
     */
    @Transactional(readOnly = true)
    public List<MatchingResult> calculateMatching(Long patientId) {
        UserEntity patient = userRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Paciente no encontrado"));
        
        // Obtener test de matching del paciente
        TestEntity patientTest = testRepository.findByCode(PATIENT_MATCHING_TEST_CODE)
            .orElseThrow(() -> new RuntimeException("Test de matching de paciente no encontrado"));
        
        List<UserAnswerEntity> patientAnswers = userAnswerRepository.findByUser(patient).stream()
            .filter(ua -> ua.getQuestion().getTest().getCode().equals(PATIENT_MATCHING_TEST_CODE))
            .collect(Collectors.toList());
        
        if (patientAnswers.isEmpty()) {
            return Collections.emptyList(); // Paciente no ha completado el test
        }
        
        // Obtener todos los psicólogos que han completado su test
        TestEntity psychologistTest = testRepository.findByCode(PSYCHOLOGIST_MATCHING_TEST_CODE)
            .orElseThrow(() -> new RuntimeException("Test de matching de psicólogo no encontrado"));
        
        List<UserEntity> allPsychologists = userRepository.findByRole("PSYCHOLOGIST");
        
        List<MatchingResult> results = new ArrayList<>();
        
        for (UserEntity psychologist : allPsychologists) {
            List<UserAnswerEntity> psychologistAnswers = userAnswerRepository.findByUser(psychologist).stream()
                .filter(ua -> ua.getQuestion().getTest().getCode().equals(PSYCHOLOGIST_MATCHING_TEST_CODE))
                .collect(Collectors.toList());
            
            if (psychologistAnswers.isEmpty()) {
                continue; // Psicólogo no ha completado su test
            }
            
            // Calcular score de afinidad (siempre calcular, incluso si no pasa filtros)
            // calculateAffinityScore ya garantiza un mínimo del 1%
            double affinityScore = calculateAffinityScore(patientAnswers, psychologistAnswers, patient, psychologist);
            
            // Verificar si pasa filtros absolutos (pero no excluir, solo penalizar)
            boolean passesFilters = passesAbsoluteFilters(patientAnswers, psychologistAnswers, patient);
            
            // Si no pasa filtros, aplicar penalización pero no excluir
            if (!passesFilters) {
                affinityScore = Math.max(0.01, affinityScore * 0.3); // Penalizar con 30% pero mantener mínimo del 1%
            }
            
            // Asegurar un score mínimo para que siempre aparezca
            affinityScore = Math.max(0.01, affinityScore);
            
            MatchingResult result = new MatchingResult();
            result.setPsychologist(psychologist);
            result.setAffinityScore(affinityScore);
            result.setMatchPercentage((int) Math.round(affinityScore * 100));
            
            // Agregar a resultados principales (siempre agregar, nunca excluir)
            results.add(result);
        }
        
        // Si no hay resultados, pero hay psicólogos disponibles, devolver al menos el mejor disponible
        if (results.isEmpty() && !allPsychologists.isEmpty()) {
            // Buscar cualquier psicólogo que haya completado el test
            for (UserEntity psychologist : allPsychologists) {
                List<UserAnswerEntity> psychologistAnswers = userAnswerRepository.findByUser(psychologist).stream()
                    .filter(ua -> ua.getQuestion().getTest().getCode().equals(PSYCHOLOGIST_MATCHING_TEST_CODE))
                    .collect(Collectors.toList());
                
                if (!psychologistAnswers.isEmpty()) {
                    // Crear un resultado mínimo para este psicólogo
                    MatchingResult result = new MatchingResult();
                    result.setPsychologist(psychologist);
                    result.setAffinityScore(0.01); // Score mínimo del 1%
                    result.setMatchPercentage(1);
                    results.add(result);
                    break; // Solo necesitamos uno
                }
            }
        }
        
        // Ordenar por score descendente
        results.sort((a, b) -> Double.compare(b.getAffinityScore(), a.getAffinityScore()));
        
        return results;
    }
    
    /**
     * Filtros absolutos: si no se cumplen, el psicólogo no aparece en resultados
     */
    private boolean passesAbsoluteFilters(List<UserAnswerEntity> patientAnswers, 
                                         List<UserAnswerEntity> psychologistAnswers,
                                         UserEntity patient) {
        
        // Agrupar respuestas por pregunta (puede haber múltiples para preguntas MULTIPLE)
        Map<Long, List<UserAnswerEntity>> patientAnswersByQuestion = patientAnswers.stream()
            .collect(Collectors.groupingBy(ua -> ua.getQuestion().getId()));
        
        Map<Long, List<UserAnswerEntity>> psychologistAnswersByQuestion = psychologistAnswers.stream()
            .collect(Collectors.groupingBy(ua -> ua.getQuestion().getId()));
        
        // FILTRO 1: Modalidad de terapia (BLOQUE 1 del psicólogo, pregunta posición 1)
        List<QuestionEntity> psychQuestions = questionRepository.findByTestOrderByPositionAsc(
            testRepository.findByCode(PSYCHOLOGIST_MATCHING_TEST_CODE).get());
        List<QuestionEntity> patientQuestions = questionRepository.findByTestOrderByPositionAsc(
            testRepository.findByCode(PATIENT_MATCHING_TEST_CODE).get());
        
        QuestionEntity modalityQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 1)
            .findFirst()
            .orElse(null);
        
        QuestionEntity patientModalityQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 1)
            .findFirst()
            .orElse(null);
        
        if (modalityQuestion != null && patientModalityQuestion != null) {
            List<UserAnswerEntity> patientModalityList = patientAnswersByQuestion.getOrDefault(
                patientModalityQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> psychModalityList = psychologistAnswersByQuestion.getOrDefault(
                modalityQuestion.getId(), Collections.emptyList());
            
            if (!patientModalityList.isEmpty() && !psychModalityList.isEmpty()) {
                UserAnswerEntity patientModality = patientModalityList.get(0); // SINGLE selection
                String patientModalityText = patientModality.getAnswer() != null ? 
                    patientModality.getAnswer().getText() : "";
                
                // Si es terapia para menores, verificar formación y experiencia
                if (patientModalityText.contains("menor")) {
                    // Verificar que el psicólogo tenga formación específica
                    QuestionEntity formationQuestion = psychQuestions.stream()
                        .filter(q -> q.getPosition() == 2)
                        .findFirst()
                        .orElse(null);
                    QuestionEntity experienceQuestion = psychQuestions.stream()
                        .filter(q -> q.getPosition() == 3)
                        .findFirst()
                        .orElse(null);
                    
                    List<UserAnswerEntity> formationList = formationQuestion != null ? 
                        psychologistAnswersByQuestion.getOrDefault(formationQuestion.getId(), Collections.emptyList()) : 
                        Collections.emptyList();
                    List<UserAnswerEntity> experienceList = experienceQuestion != null ? 
                        psychologistAnswersByQuestion.getOrDefault(experienceQuestion.getId(), Collections.emptyList()) : 
                        Collections.emptyList();
                    
                    if (formationList.isEmpty() || formationList.get(0).getAnswer() == null || 
                        !formationList.get(0).getAnswer().getText().equals("Sí")) {
                        return false;
                    }
                    if (experienceList.isEmpty() || experienceList.get(0).getAnswer() == null || 
                        experienceList.get(0).getAnswer().getText().equals("< 1 año")) {
                        return false;
                    }
                }
                
                // Verificar que el psicólogo trabaje en esa modalidad (MULTIPLE puede tener varias)
                boolean worksInModality = false;
                for (UserAnswerEntity psychModalityAnswer : psychModalityList) {
                    if (psychModalityAnswer.getAnswer() != null) {
                        String psychModalityText = psychModalityAnswer.getAnswer().getText();
                        if (patientModalityText.contains("individual") && psychModalityText.contains("individual adultos")) {
                            worksInModality = true;
                            break;
                        } else if (patientModalityText.contains("pareja") && psychModalityText.contains("pareja")) {
                            worksInModality = true;
                            break;
                        } else if (patientModalityText.contains("menor") && psychModalityText.contains("infantojuvenil")) {
                            worksInModality = true;
                            break;
                        }
                    }
                }
                
                if (!worksInModality) {
                    return false;
                }
            }
        }
        
        // FILTRO 2: Idioma (obligatorio respetar) - MULTIPLE
        QuestionEntity patientLangQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 14).findFirst().orElse(null);
        
        QuestionEntity psychLangQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 11)
            .findFirst()
            .orElse(null);
        
        if (patientLangQuestion != null && psychLangQuestion != null) {
            List<UserAnswerEntity> patientLangList = patientAnswersByQuestion.getOrDefault(
                patientLangQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> psychLangList = psychologistAnswersByQuestion.getOrDefault(
                psychLangQuestion.getId(), Collections.emptyList());
            
            if (!patientLangList.isEmpty() && !psychLangList.isEmpty()) {
                Set<String> patientLanguages = patientLangList.stream()
                    .map(ua -> ua.getAnswer() != null ? ua.getAnswer().getText() : "")
                    .filter(text -> !text.isEmpty())
                    .collect(Collectors.toSet());
                
                Set<String> psychLanguages = psychLangList.stream()
                    .map(ua -> ua.getAnswer() != null ? ua.getAnswer().getText() : "")
                    .filter(text -> !text.isEmpty())
                    .collect(Collectors.toSet());
                
                // Debe haber al menos un idioma en común
                patientLanguages.retainAll(psychLanguages);
                if (patientLanguages.isEmpty()) {
                    return false;
                }
            }
        }
        
        // FILTRO 3: Horarios (si no hay solapamiento, no aparece) - MULTIPLE
        QuestionEntity patientScheduleQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 16).findFirst().orElse(null);
        
        QuestionEntity psychScheduleQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 14)
            .findFirst()
            .orElse(null);
        
        if (patientScheduleQuestion != null && psychScheduleQuestion != null) {
            List<UserAnswerEntity> patientScheduleList = patientAnswersByQuestion.getOrDefault(
                patientScheduleQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> psychScheduleList = psychologistAnswersByQuestion.getOrDefault(
                psychScheduleQuestion.getId(), Collections.emptyList());
            
            if (!patientScheduleList.isEmpty() && !psychScheduleList.isEmpty()) {
                Set<String> patientSchedules = patientScheduleList.stream()
                    .map(ua -> ua.getAnswer() != null ? ua.getAnswer().getText() : "")
                    .filter(text -> !text.isEmpty())
                    .collect(Collectors.toSet());
                
                Set<String> psychSchedules = psychScheduleList.stream()
                    .map(ua -> ua.getAnswer() != null ? ua.getAnswer().getText() : "")
                    .filter(text -> !text.isEmpty())
                    .collect(Collectors.toSet());
                
                patientSchedules.retainAll(psychSchedules);
                if (patientSchedules.isEmpty()) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Calcula el score de afinidad (0.0 a 1.0)
     */
    private double calculateAffinityScore(List<UserAnswerEntity> patientAnswers,
                                         List<UserAnswerEntity> psychologistAnswers,
                                         UserEntity patient,
                                         UserEntity psychologist) {
        
        double totalScore = 0.0;
        double maxPossibleScore = 0.0;
        
        // Agrupar respuestas por pregunta (puede haber múltiples para preguntas MULTIPLE)
        Map<Long, List<UserAnswerEntity>> patientAnswersByQuestion = patientAnswers.stream()
            .collect(Collectors.groupingBy(ua -> ua.getQuestion().getId()));
        
        Map<Long, List<UserAnswerEntity>> psychologistAnswersByQuestion = psychologistAnswers.stream()
            .collect(Collectors.groupingBy(ua -> ua.getQuestion().getId()));
        
        List<QuestionEntity> patientQuestions = questionRepository.findByTestOrderByPositionAsc(
            testRepository.findByCode(PATIENT_MATCHING_TEST_CODE).get());
        List<QuestionEntity> psychQuestions = questionRepository.findByTestOrderByPositionAsc(
            testRepository.findByCode(PSYCHOLOGIST_MATCHING_TEST_CODE).get());
        
        // PESO ALTO: Experiencia clínica (BLOQUE 2.1, posición 4 del psicólogo)
        QuestionEntity psychExpQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 4).findFirst().orElse(null);
        
        if (psychExpQuestion != null) {
            List<UserAnswerEntity> psychExpList = psychologistAnswersByQuestion.getOrDefault(
                psychExpQuestion.getId(), Collections.emptyList());
            if (!psychExpList.isEmpty() && psychExpList.get(0).getAnswer() != null) {
                UserAnswerEntity psychExp = psychExpList.get(0);
                // Pacientes con alta afectación, cronificación, etc. priorizan mayor experiencia
                QuestionEntity patientAffectionQuestion = patientQuestions.stream()
                    .filter(q -> q.getPosition() == 10).findFirst().orElse(null);
                QuestionEntity patientDurationQuestion = patientQuestions.stream()
                    .filter(q -> q.getPosition() == 9).findFirst().orElse(null);
                
                boolean needsHighExperience = false;
                if (patientAffectionQuestion != null) {
                    List<UserAnswerEntity> patientAffectionList = patientAnswersByQuestion.getOrDefault(
                        patientAffectionQuestion.getId(), Collections.emptyList());
                    if (!patientAffectionList.isEmpty() && patientAffectionList.get(0).getAnswer() != null) {
                        String affection = patientAffectionList.get(0).getAnswer().getText();
                        if (affection.contains("Muchísimo") || affection.contains("Mucho")) {
                            needsHighExperience = true;
                        }
                    }
                }
                if (patientDurationQuestion != null) {
                    List<UserAnswerEntity> patientDurationList = patientAnswersByQuestion.getOrDefault(
                        patientDurationQuestion.getId(), Collections.emptyList());
                    if (!patientDurationList.isEmpty() && patientDurationList.get(0).getAnswer() != null) {
                        String duration = patientDurationList.get(0).getAnswer().getText();
                        if (duration.contains("más de 6 meses") || duration.contains("Años")) {
                            needsHighExperience = true;
                        }
                    }
                }
                
                if (needsHighExperience) {
                    double weight = 0.15;
                    maxPossibleScore += weight;
                    String exp = psychExp.getAnswer().getText();
                    if (exp.contains("> 7 años")) {
                        totalScore += weight;
                    } else if (exp.contains("3–7 años")) {
                        totalScore += weight * 0.7;
                    } else if (exp.contains("1–3 años")) {
                        totalScore += weight * 0.4;
                    }
                } else {
                    double weight = 0.10;
                    maxPossibleScore += weight;
                    String exp = psychExp.getAnswer().getText();
                    if (exp.contains("> 7 años")) {
                        totalScore += weight;
                    } else if (exp.contains("3–7 años")) {
                        totalScore += weight * 0.8;
                    } else if (exp.contains("1–3 años")) {
                        totalScore += weight * 0.6;
                    } else {
                        totalScore += weight * 0.3;
                    }
                }
            }
        }
        
        // PESO ALTO: Áreas de trabajo (BLOQUE 2.2, posición 5 del psicólogo vs posición 8 del paciente) - MULTIPLE
        QuestionEntity psychAreasQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 5).findFirst().orElse(null);
        QuestionEntity patientAreasQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 8).findFirst().orElse(null);
        
        if (psychAreasQuestion != null && patientAreasQuestion != null) {
            List<UserAnswerEntity> psychAreasList = psychologistAnswersByQuestion.getOrDefault(
                psychAreasQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> patientAreasList = patientAnswersByQuestion.getOrDefault(
                patientAreasQuestion.getId(), Collections.emptyList());
            
            Set<String> psychAreas = psychAreasList.stream()
                .map(ua -> ua.getAnswer() != null ? ua.getAnswer().getText().toLowerCase() : "")
                .filter(text -> !text.isEmpty())
                .collect(Collectors.toSet());
            
            Set<String> patientAreas = patientAreasList.stream()
                .map(ua -> ua.getAnswer() != null ? ua.getAnswer().getText().toLowerCase() : "")
                .filter(text -> !text.isEmpty())
                .collect(Collectors.toSet());
            
            // Mapeo de áreas para coincidencias parciales
            Map<String, Set<String>> areaMapping = new HashMap<>();
            areaMapping.put("ansiedad", Set.of("ansiedad", "estrés", "ataques de pánico"));
            areaMapping.put("depresión", Set.of("depresión", "estado de ánimo bajo", "tristeza"));
            areaMapping.put("pareja", Set.of("pareja", "problemas de pareja"));
            areaMapping.put("familia", Set.of("familia", "dificultades familiares"));
            areaMapping.put("duelo", Set.of("duelo"));
            areaMapping.put("trauma", Set.of("trauma", "experiencias difíciles"));
            areaMapping.put("autoestima", Set.of("autoestima", "imagen corporal"));
            areaMapping.put("conducta alimentaria", Set.of("conducta alimentaria"));
            areaMapping.put("adicciones", Set.of("adicciones", "consumo"));
            areaMapping.put("sexualidad", Set.of("sexualidad", "problemas sexuales"));
            areaMapping.put("tdah", Set.of("tdah", "atención", "organización"));
            
            int matches = 0;
            int totalPatientAreas = patientAreas.size();
            
            for (String patientArea : patientAreas) {
                for (String psychArea : psychAreas) {
                    if (patientArea.contains(psychArea) || psychArea.contains(patientArea)) {
                        matches++;
                        break;
                    }
                }
            }
            
            if (totalPatientAreas > 0) {
                double weight = 0.20;
                maxPossibleScore += weight;
                totalScore += weight * (matches / (double) totalPatientAreas);
            }
        }
        
        // PESO MEDIO: Complejidad clínica (BLOQUE 3, posición 6 del psicólogo)
        QuestionEntity psychComplexityQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 6).findFirst().orElse(null);
        
        if (psychComplexityQuestion != null) {
            List<UserAnswerEntity> psychComplexityList = psychologistAnswersByQuestion.getOrDefault(
                psychComplexityQuestion.getId(), Collections.emptyList());
            QuestionEntity patientAffectionQuestion = patientQuestions.stream()
                .filter(q -> q.getPosition() == 10).findFirst().orElse(null);
            QuestionEntity patientDurationQuestion = patientQuestions.stream()
                .filter(q -> q.getPosition() == 9).findFirst().orElse(null);
            
            boolean isComplex = false;
            if (patientAffectionQuestion != null) {
                List<UserAnswerEntity> patientAffectionList = patientAnswersByQuestion.getOrDefault(
                    patientAffectionQuestion.getId(), Collections.emptyList());
                if (!patientAffectionList.isEmpty() && patientAffectionList.get(0).getAnswer() != null) {
                    String affection = patientAffectionList.get(0).getAnswer().getText();
                    if (affection.contains("Muchísimo")) {
                        isComplex = true;
                    }
                }
            }
            if (patientDurationQuestion != null) {
                List<UserAnswerEntity> patientDurationList = patientAnswersByQuestion.getOrDefault(
                    patientDurationQuestion.getId(), Collections.emptyList());
                if (!patientDurationList.isEmpty() && patientDurationList.get(0).getAnswer() != null) {
                    String duration = patientDurationList.get(0).getAnswer().getText();
                    if (duration.contains("más de 6 meses") || duration.contains("Años")) {
                        isComplex = true;
                    }
                }
            }
            
            if (!psychComplexityList.isEmpty() && psychComplexityList.get(0).getAnswer() != null) {
                UserAnswerEntity psychComplexity = psychComplexityList.get(0);
                double weight = 0.10;
                maxPossibleScore += weight;
                String complexity = psychComplexity.getAnswer().getText();
                
                if (isComplex) {
                    // No derivar a perfiles "solo leves"
                    if (complexity.contains("leves")) {
                        totalScore += 0; // No sumar, puede restar al final
                    } else if (complexity.contains("complejos") || complexity.contains("adapto")) {
                        totalScore += weight;
                    } else {
                        totalScore += weight * 0.7;
                    }
                } else {
                    totalScore += weight * 0.8; // Todos son válidos para casos leves/moderados
                }
            }
        }
        
        // PESO MEDIO: Estilo terapéutico (BLOQUE 4.2, posición 8 del psicólogo vs posición 15 del paciente)
        QuestionEntity psychStyleQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 8).findFirst().orElse(null);
        QuestionEntity patientStyleQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 15).findFirst().orElse(null);
        
        if (psychStyleQuestion != null && patientStyleQuestion != null) {
            List<UserAnswerEntity> psychStyleList = psychologistAnswersByQuestion.getOrDefault(
                psychStyleQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> patientStyleList = patientAnswersByQuestion.getOrDefault(
                patientStyleQuestion.getId(), Collections.emptyList());
            
            if (!psychStyleList.isEmpty() && psychStyleList.get(0).getAnswer() != null &&
                !patientStyleList.isEmpty() && patientStyleList.get(0).getAnswer() != null) {
                UserAnswerEntity psychStyle = psychStyleList.get(0);
                UserAnswerEntity patientStyle = patientStyleList.get(0);
                
                double weight = 0.12;
                maxPossibleScore += weight;
                
                String psychStyleText = psychStyle.getAnswer().getText().toLowerCase();
                String patientStyleText = patientStyle.getAnswer().getText().toLowerCase();
                
                if (psychStyleText.contains("equilibrada") || patientStyleText.contains("equilibrado")) {
                    totalScore += weight * 0.9;
                } else if ((psychStyleText.contains("práctica") && patientStyleText.contains("práctico")) ||
                          (psychStyleText.contains("exploratoria") && patientStyleText.contains("exploratorio"))) {
                    totalScore += weight;
                } else {
                    totalScore += weight * 0.5;
                }
            }
        }
        
        // PESO MEDIO-BAJO: Población (BLOQUE 5.1, posición 9 del psicólogo)
        QuestionEntity psychPopulationQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 9).findFirst().orElse(null);
        
        if (psychPopulationQuestion != null && patient.getAge() != null) {
            List<UserAnswerEntity> psychPopulationList = psychologistAnswersByQuestion.getOrDefault(
                psychPopulationQuestion.getId(), Collections.emptyList());
            if (!psychPopulationList.isEmpty() && psychPopulationList.get(0).getAnswer() != null) {
                UserAnswerEntity psychPopulation = psychPopulationList.get(0);
                double weight = 0.08;
                maxPossibleScore += weight;
                String population = psychPopulation.getAnswer().getText();
                
                if (population.contains("Todas")) {
                    totalScore += weight;
                } else if (patient.getAge() >= 18 && patient.getAge() <= 30 && population.contains("18–30")) {
                    totalScore += weight;
                } else if (patient.getAge() > 30 && patient.getAge() <= 50 && population.contains("30–50")) {
                    totalScore += weight;
                } else if (patient.getAge() > 50 && population.contains("+50")) {
                    totalScore += weight;
                } else {
                    totalScore += weight * 0.3;
                }
            }
        }
        
        // PESO MEDIO-BAJO: Crisis vitales (BLOQUE 5.2, posición 10 del psicólogo)
        QuestionEntity psychCrisisQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 10).findFirst().orElse(null);
        QuestionEntity patientBreakupQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 6).findFirst().orElse(null);
        
        if (psychCrisisQuestion != null && patientBreakupQuestion != null) {
            List<UserAnswerEntity> psychCrisisList = psychologistAnswersByQuestion.getOrDefault(
                psychCrisisQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> patientBreakupList = patientAnswersByQuestion.getOrDefault(
                patientBreakupQuestion.getId(), Collections.emptyList());
            
            if (!psychCrisisList.isEmpty() && psychCrisisList.get(0).getAnswer() != null &&
                !patientBreakupList.isEmpty() && patientBreakupList.get(0).getAnswer() != null) {
                UserAnswerEntity psychCrisis = psychCrisisList.get(0);
                UserAnswerEntity patientBreakup = patientBreakupList.get(0);
                
                boolean recentBreakup = patientBreakup.getAnswer().getText().equals("Sí");
                
                if (recentBreakup) {
                    double weight = 0.10;
                    maxPossibleScore += weight;
                    String crisis = psychCrisis.getAnswer().getText();
                    if (crisis.equals("Alta")) {
                        totalScore += weight;
                    } else if (crisis.equals("Media")) {
                        totalScore += weight * 0.7;
                    } else {
                        totalScore += weight * 0.3;
                    }
                }
            }
        }
        
        // PESO BAJO: Género (BLOQUE 6.3, posición 13 del psicólogo vs posición 13 del paciente)
        QuestionEntity psychGenderQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 13).findFirst().orElse(null);
        QuestionEntity patientGenderQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 13).findFirst().orElse(null);
        
        if (psychGenderQuestion != null && patientGenderQuestion != null) {
            List<UserAnswerEntity> psychGenderList = psychologistAnswersByQuestion.getOrDefault(
                psychGenderQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> patientGenderList = patientAnswersByQuestion.getOrDefault(
                patientGenderQuestion.getId(), Collections.emptyList());
            
            if (!psychGenderList.isEmpty() && psychGenderList.get(0).getAnswer() != null &&
                !patientGenderList.isEmpty() && patientGenderList.get(0).getAnswer() != null) {
                UserAnswerEntity psychGender = psychGenderList.get(0);
                UserAnswerEntity patientGender = patientGenderList.get(0);
                
                String patientGenderPref = patientGender.getAnswer().getText();
                
                // Solo se activa si el paciente expresa preferencia explícita
                if (!patientGenderPref.equals("Indiferente")) {
                    double weight = 0.05;
                    maxPossibleScore += weight;
                    String psychGenderText = psychGender.getAnswer().getText();
                    
                    if (patientGenderPref.equals(psychGenderText)) {
                        totalScore += weight;
                    }
                }
            }
        }
        
        // PESO BAJO: LGTBIQ+ (BLOQUE 6.2, posición 12 del psicólogo)
        // Nota: Esto se podría activar si el paciente valora entorno seguro
        // Por ahora no lo ponderamos, pero se puede agregar
        
        // PESO MEDIO: Medicación psiquiátrica (BLOQUE 8, posición 16 del psicólogo vs posición 12 del paciente)
        QuestionEntity psychMedicationQuestion = psychQuestions.stream()
            .filter(q -> q.getPosition() == 16).findFirst().orElse(null);
        QuestionEntity patientMedicationQuestion = patientQuestions.stream()
            .filter(q -> q.getPosition() == 12).findFirst().orElse(null);
        
        if (psychMedicationQuestion != null && patientMedicationQuestion != null) {
            List<UserAnswerEntity> psychMedicationList = psychologistAnswersByQuestion.getOrDefault(
                psychMedicationQuestion.getId(), Collections.emptyList());
            List<UserAnswerEntity> patientMedicationList = patientAnswersByQuestion.getOrDefault(
                patientMedicationQuestion.getId(), Collections.emptyList());
            
            if (!psychMedicationList.isEmpty() && psychMedicationList.get(0).getAnswer() != null &&
                !patientMedicationList.isEmpty() && patientMedicationList.get(0).getAnswer() != null) {
                UserAnswerEntity psychMedication = psychMedicationList.get(0);
                UserAnswerEntity patientMedication = patientMedicationList.get(0);
                
                boolean patientHasMedication = patientMedication.getAnswer().getText().equals("Sí");
                
                if (patientHasMedication) {
                    double weight = 0.10;
                    maxPossibleScore += weight;
                    String psychMedText = psychMedication.getAnswer().getText();
                    
                    if (psychMedText.contains("habitualmente")) {
                        totalScore += weight;
                    } else if (psychMedText.contains("algunos casos")) {
                        totalScore += weight * 0.7;
                    } else {
                        totalScore += 0; // No trabajar con medicación
                    }
                }
            }
        }
        
        // Normalizar score (0.0 a 1.0)
        if (maxPossibleScore > 0) {
            double normalizedScore = Math.min(1.0, totalScore / maxPossibleScore);
            // Asegurar un score mínimo del 1% para que siempre haya match
            return Math.max(0.01, normalizedScore);
        }
        
        // Si no hay score calculado, devolver mínimo del 1%
        return 0.01;
    }
    
    /**
     * Clase interna para representar un resultado de matching
     */
    public static class MatchingResult {
        private UserEntity psychologist;
        private double affinityScore;
        private int matchPercentage;
        
        public UserEntity getPsychologist() { return psychologist; }
        public void setPsychologist(UserEntity psychologist) { this.psychologist = psychologist; }
        public double getAffinityScore() { return affinityScore; }
        public void setAffinityScore(double affinityScore) { this.affinityScore = affinityScore; }
        public int getMatchPercentage() { return matchPercentage; }
        public void setMatchPercentage(int matchPercentage) { this.matchPercentage = matchPercentage; }
    }
}

