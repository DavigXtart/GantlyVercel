package com.alvaro.psicoapp.config;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Component
@Order(1) // Ejecutar después de que todo esté inicializado
public class DataInitializer implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);
    
    @Autowired
    private TestRepository testRepository;
    
    @Autowired
    private QuestionRepository questionRepository;
    
    @Autowired
    private AnswerRepository answerRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private UserAnswerRepository userAnswerRepository;
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    @Override
    @Transactional
    public void run(String... args) {
        logger.info("Inicializando datos esenciales (tests y usuarios de prueba)...");
        
        try {
            // Inicializar test de matching de pacientes
            initializePatientMatchingTest();
            
            // Inicializar test de matching de psicólogos
            initializePsychologistMatchingTest();
            
            // Inicializar psicólogos de prueba
            initializeTestPsychologists();
            
            logger.info("Datos iniciales cargados correctamente");
        } catch (Exception e) {
            logger.error("Error al inicializar datos: {}", e.getMessage(), e);
            // No lanzamos la excepción para que la app pueda iniciar
        }
    }
    
    private void initializePatientMatchingTest() {
        Optional<TestEntity> existing = testRepository.findByCode("PATIENT_MATCHING");
        if (existing.isPresent()) {
            logger.info("Test PATIENT_MATCHING ya existe, omitiendo inicialización");
            return;
        }
        
        logger.info("Creando test PATIENT_MATCHING...");
        TestEntity test = new TestEntity();
        test.setCode("PATIENT_MATCHING");
        test.setTitle("Test de Matching para Pacientes");
        test.setDescription("Cuestionario para conectar pacientes con psicólogos compatibles");
        test.setCategory("MATCHING");
        test.setActive(true);
        test = testRepository.save(test);
        
        // Crear preguntas básicas (solo las esenciales para que funcione)
        createQuestion(test, "¿Qué tipo de terapia buscas?", "SINGLE", 1,
            List.of("Terapia individual", "Terapia de pareja", "Terapia para un menor"));
        
        logger.info("Test PATIENT_MATCHING creado");
    }
    
    private void initializePsychologistMatchingTest() {
        Optional<TestEntity> existing = testRepository.findByCode("PSYCHOLOGIST_MATCHING");
        if (existing.isPresent()) {
            logger.info("Test PSYCHOLOGIST_MATCHING ya existe, omitiendo inicialización");
            return;
        }
        
        logger.info("Creando test PSYCHOLOGIST_MATCHING...");
        TestEntity test = new TestEntity();
        test.setCode("PSYCHOLOGIST_MATCHING");
        test.setTitle("Test de Matching para Psicólogos");
        test.setDescription("Cuestionario completo para determinar el perfil profesional del psicólogo");
        test.setCategory("MATCHING");
        test.setActive(true);
        test = testRepository.save(test);
        
        // Crear preguntas básicas
        createQuestion(test, "¿En qué modalidades trabajas actualmente?", "MULTIPLE", 1,
            List.of("Terapia individual adultos", "Terapia de pareja", "Terapia infantojuvenil (menores)"));
        
        logger.info("Test PSYCHOLOGIST_MATCHING creado");
    }
    
    private void initializeTestPsychologists() {
        // Verificar si ya existen psicólogos de prueba
        List<UserEntity> existing = userRepository.findByRole("PSYCHOLOGIST");
        if (!existing.isEmpty()) {
            logger.info("Ya existen {} psicólogos, omitiendo creación de psicólogos de prueba", existing.size());
            return;
        }
        
        logger.info("Creando psicólogos de prueba...");
        
        // Solo crear uno de prueba por ahora
        UserEntity psych = new UserEntity();
        psych.setName("Psicólogo de Prueba");
        psych.setEmail("test.psychologist@test.com");
        psych.setPasswordHash(passwordEncoder.encode("test123"));
        psych.setRole("PSYCHOLOGIST");
        psych.setEmailVerified(true);
        psych.setGender("Hombre");
        psych.setAge(35);
        userRepository.save(psych);
        
        logger.info("Psicólogo de prueba creado: {}", psych.getEmail());
    }
    
    private void createQuestion(TestEntity test, String text, String type, int position, List<String> answersText) {
        QuestionEntity question = new QuestionEntity();
        question.setTest(test);
        question.setText(text);
        question.setType(type);
        question.setPosition(position);
        question = questionRepository.save(question);
        
        for (int i = 0; i < answersText.size(); i++) {
            AnswerEntity answer = new AnswerEntity();
            answer.setQuestion(question);
            answer.setText(answersText.get(i));
            answer.setPosition(i + 1);
            answerRepository.save(answer);
        }
    }
}

