package com.alvaro.psicoapp.service;

import com.alvaro.psicoapp.domain.*;
import com.alvaro.psicoapp.domain.RoleConstants;
import com.alvaro.psicoapp.dto.AdminDtos;
import com.alvaro.psicoapp.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.io.File;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {
    private static final Logger logger = LoggerFactory.getLogger(AdminService.class);
    private final TestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final AnswerRepository answerRepository;
    private final UserRepository userRepository;
    private final UserAnswerRepository userAnswerRepository;
    private final SubfactorRepository subfactorRepository;
    private final FactorRepository factorRepository;
    private final UserPsychologistRepository userPsychologistRepository;
    private final EvaluationTestRepository evaluationTestRepository;
    private final AppointmentRepository appointmentRepository;
    private final PsychologistProfileRepository psychologistProfileRepository;
    private final TaskFileRepository taskFileRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public AdminService(TestRepository testRepository, QuestionRepository questionRepository,
                        AnswerRepository answerRepository, UserRepository userRepository,
                        UserAnswerRepository userAnswerRepository, SubfactorRepository subfactorRepository,
                        FactorRepository factorRepository, UserPsychologistRepository userPsychologistRepository,
                        EvaluationTestRepository evaluationTestRepository, AppointmentRepository appointmentRepository,
                        PsychologistProfileRepository psychologistProfileRepository,
                        TaskFileRepository taskFileRepository,
                        NotificationService notificationService, EmailService emailService) {
        this.testRepository = testRepository;
        this.questionRepository = questionRepository;
        this.answerRepository = answerRepository;
        this.userRepository = userRepository;
        this.userAnswerRepository = userAnswerRepository;
        this.subfactorRepository = subfactorRepository;
        this.factorRepository = factorRepository;
        this.userPsychologistRepository = userPsychologistRepository;
        this.evaluationTestRepository = evaluationTestRepository;
        this.taskFileRepository = taskFileRepository;
        this.appointmentRepository = appointmentRepository;
        this.psychologistProfileRepository = psychologistProfileRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional(readOnly = true)
    public List<TestEntity> listTests() {
        List<TestEntity> tests = testRepository.findAll();
        tests.forEach(t -> t.setQuestions(null));
        return tests;
    }

    @Transactional(readOnly = true)
    public Optional<TestEntity> getTestWithDetails(Long id) {
        return testRepository.findById(id);
    }

    @Transactional
    public TestEntity createTest(AdminDtos.TestCreate req) {
        TestEntity t = new TestEntity();
        t.setCode(req.code);
        t.setTitle(req.title);
        t.setDescription(req.description);
        t.setActive(true);
        TestEntity savedTest = testRepository.save(t);
        initDefaultStructureForTest(savedTest.getId());
        return savedTest;
    }

    @Transactional
    public Optional<TestEntity> updateTest(Long id, AdminDtos.TestUpdate req) {
        return testRepository.findById(id).map(test -> {
            if (req.code != null) test.setCode(req.code);
            if (req.title != null) test.setTitle(req.title);
            if (req.description != null) test.setDescription(req.description);
            if (req.active != null) test.setActive(req.active);
            if (req.category != null) test.setCategory(req.category);
            if (req.topic != null) test.setTopic(req.topic);
            return testRepository.save(test);
        });
    }

    @Transactional
    public boolean deleteTest(Long id) {
        if (testRepository.existsById(id)) {
            testRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Optional<Map<String, Object>> getTestStructure(Long testId) {
        TestEntity test = testRepository.findById(testId).orElse(null);
        if (test == null) return Optional.empty();

        List<SubfactorEntity> subfactors = subfactorRepository.findAll().stream()
                .filter(sf -> sf.getTest() != null && Objects.equals(sf.getTest().getId(), testId))
                .sorted(Comparator.comparing(SubfactorEntity::getPosition))
                .collect(Collectors.toList());

        List<Map<String, Object>> factors = new ArrayList<>();
        Map<Long, Map<String, Object>> factorMap = new LinkedHashMap<>();

        for (SubfactorEntity sf : subfactors) {
            FactorEntity f = sf.getFactor();
            Long fid = f != null ? f.getId() : -1L;
            factorMap.putIfAbsent(fid, new HashMap<String, Object>() {{
                put("id", fid);
                put("code", f != null ? f.getCode() : "-");
                put("name", f != null ? f.getName() : "Sin factor");
                put("minLabel", f != null ? f.getMinLabel() : null);
                put("maxLabel", f != null ? f.getMaxLabel() : null);
                put("formula", f != null ? f.getFormula() : null);
                put("calculated", f != null ? f.getCalculated() : false);
                put("subfactors", new ArrayList<>());
            }});
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> sflist = (List<Map<String, Object>>) factorMap.get(fid).get("subfactors");
            Map<String, Object> sfm = new HashMap<>();
            sfm.put("id", sf.getId());
            sfm.put("code", sf.getCode());
            sfm.put("name", sf.getName());
            sfm.put("minLabel", sf.getMinLabel());
            sfm.put("maxLabel", sf.getMaxLabel());
            sflist.add(sfm);
        }
        factors.addAll(factorMap.values());

        Map<String, Object> resp = new HashMap<>();
        resp.put("factors", factors);
        return Optional.of(resp);
    }

    @Transactional
    public AdminDtos.FactorCreateResponse createFactor(AdminDtos.FactorCreate req) {
        TestEntity test = testRepository.findById(req.testId).orElseThrow();
        FactorEntity f = new FactorEntity();
        f.setTest(test);
        f.setCode(req.code);
        f.setName(req.name);
        if (req.description != null) f.setDescription(req.description);
        f.setPosition(req.position != null ? req.position : 1);
        if (req.minLabel != null) f.setMinLabel(req.minLabel);
        if (req.maxLabel != null) f.setMaxLabel(req.maxLabel);
        if (req.formula != null) f.setFormula(req.formula);
        if (req.calculated != null) f.setCalculated(req.calculated);
        FactorEntity saved = factorRepository.save(f);
        return new AdminDtos.FactorCreateResponse(
                saved.getId(), saved.getCode(), saved.getName(),
                saved.getTest().getId(), saved.getPosition(),
                saved.getMinLabel(), saved.getMaxLabel(),
                saved.getFormula(), saved.getCalculated()
        );
    }

    @Transactional
    public Map<String, Object> createSubfactor(AdminDtos.SubfactorCreate req) {
        TestEntity test = testRepository.findById(req.testId).orElseThrow();
        SubfactorEntity sf = new SubfactorEntity();
        sf.setTest(test);
        sf.setCode(req.code);
        sf.setName(req.name);
        if (req.description != null) sf.setDescription(req.description);
        if (req.factorId != null) {
            factorRepository.findById(req.factorId).ifPresent(sf::setFactor);
        }
        sf.setPosition(req.position != null ? req.position : 1);
        if (req.minLabel != null) sf.setMinLabel(req.minLabel);
        if (req.maxLabel != null) sf.setMaxLabel(req.maxLabel);
        SubfactorEntity saved = subfactorRepository.save(sf);
        Map<String, Object> result = new HashMap<>();
        result.put("id", saved.getId());
        result.put("code", saved.getCode());
        result.put("name", saved.getName());
        result.put("testId", saved.getTest().getId());
        result.put("position", saved.getPosition());
        if (saved.getFactor() != null) result.put("factorId", saved.getFactor().getId());
        if (saved.getMinLabel() != null) result.put("minLabel", saved.getMinLabel());
        if (saved.getMaxLabel() != null) result.put("maxLabel", saved.getMaxLabel());
        return result;
    }

    @Transactional
    public AdminDtos.InitDefaultStructureResponse initDefaultStructure(Long testId) {
        TestEntity test = testRepository.findById(testId).orElseThrow();
        List<FactorEntity> existingFactors = factorRepository.findAll().stream()
                .filter(f -> f.getTest() != null && Objects.equals(f.getTest().getId(), testId))
                .collect(Collectors.toList());
        if (!existingFactors.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El test ya tiene factores configurados");
        }

        FactorEntity f1 = saveFactor(test, "sociales", "Competencias sociales", "Competencias relacionadas con la interacción social", 1, "Introvertido", "Extravertido", "A+F+H+Q2(-)");
        FactorEntity f2 = saveFactor(test, "autonomia", "Competencias de autonomía e independencia", "Competencias relacionadas con la autonomía e independencia", 2, "Acomodaticio", "Independiente", "E+H+Q2+Q1");
        FactorEntity f3 = saveFactor(test, "apertura", "Competencias de apertura y adaptación", "Competencias relacionadas con la apertura y adaptación", 3, "Duro/Rígido", "Receptivo/Flexible", "I+M+Q1_AP");
        FactorEntity f4 = saveFactor(test, "autocontrol", "Competencias de autocontrol", "Competencias relacionadas con el autocontrol", 4, "Desinhibido", "Autocontrolado", "G+Q3");
        FactorEntity f5 = saveFactor(test, "ansiedad", "Competencias de gestión de la ansiedad", "Competencias relacionadas con la gestión de la ansiedad", 5, "Imperturbable", "Ansioso", "C+O+L+Q4");
        saveSubfactor(test, f1, "A", "Extroversión", "Cercanía afectiva, trato cordial e interés genuino por las personas.", 1, "Reservado", "Abierto");
        saveSubfactor(test, f1, "F", "Animación", "Energía visible, expresividad en la interacción, tono vital alto.", 2, "Sobrio", "Entusiasta");
        saveSubfactor(test, f1, "N(-)", "Espontaneidad / Privacidad–Astucia", "Filtra y dosifica lo que muestra; gestiona su imagen y lee subtextos.", 3, "Espontáneo", "Calculador");
        saveSubfactor(test, f1, "Q2(-)", "Participación grupal", "Preferencia por actuar solo; baja orientación grupal.", 4, "Dependiente del grupo", "Autosuficiente");
        saveSubfactor(test, f2, "E", "Dominancia", "Asumir control e influir en interacciones.", 1, "Sumiso", "Dominante");
        saveSubfactor(test, f2, "H", "Emprendimiento", "Atrevimiento y desenvoltura ante exposición social y situaciones nuevas.", 2, "Tímido", "Atrevido");
        saveSubfactor(test, f2, "Q2", "Autosuficiencia", "Baja dependencia del grupo; autonomía para avanzar y decidir.", 3, "Dependiente", "Autosuficiente");
        saveSubfactor(test, f2, "Q1", "Crítico", "Actitud analítica; revisa creencias y adopta cambios con evidencia.", 4, "Conservador", "Innovador");
        saveSubfactor(test, f3, "I", "Idealismo", "Sensibilidad y orientación a principios éticos y armonía.", 1, "Objetivo/Duro", "Sensible/Idealista");
        saveSubfactor(test, f3, "M", "Creatividad", "Pensamiento imaginativo y asociativo; generación de ideas nuevas.", 2, "Práctico", "Imaginativo");
        saveSubfactor(test, f3, "Q1_AP", "Apertura al cambio", "Flexibilidad ante nuevas ideas y experiencias.", 3, "Tradicional", "Abierto al cambio");
        saveSubfactor(test, f4, "G", "Sentido del deber", "Responsabilidad, adherencia a normas y estándares.", 1, "Inconformista", "Cumplidor");
        saveSubfactor(test, f4, "Q3", "Control de emociones", "Perfeccionismo, organización y autorregulación emocional.", 2, "Flexible/Desordenado", "Controlado/Perfeccionista");
        saveSubfactor(test, f5, "C", "Estabilidad", "Calma, equilibrio emocional y recuperación ante el estrés.", 1, "Emocionalmente reactivo", "Estable");
        saveSubfactor(test, f5, "O", "Aprehensión", "Autocrítica, auto-duda y tendencia a la culpabilidad.", 2, "Seguro de sí", "Aprensivo");
        saveSubfactor(test, f5, "L", "Vigilancia", "Cautela, expectativa de segundas intenciones.", 3, "Confiado", "Vigilante");
        saveSubfactor(test, f5, "Q4", "Tensión", "Activación interna, impaciencia e irritabilidad ante contratiempos.", 4, "Relajado", "Tenso");

        return new AdminDtos.InitDefaultStructureResponse(true, "Estructura por defecto inicializada correctamente");
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.QuestionDto> getQuestions(Long testId) {
        TestEntity test = testRepository.findById(testId).orElseThrow();
        List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
        return questions.stream().map(q -> new AdminDtos.QuestionDto(q.getId(), q.getText(), q.getType(), q.getPosition()))
                .collect(Collectors.toList());
    }

    @Transactional
    public AdminDtos.QuestionCreateResponse createQuestion(AdminDtos.QuestionCreate req) {
        TestEntity t = testRepository.findById(req.testId).orElseThrow();
        QuestionEntity q = new QuestionEntity();
        q.setTest(t);
        q.setText(req.text);
        q.setType(req.type);
        q.setPosition(req.position);
        if (req.subfactorId != null) {
            subfactorRepository.findById(req.subfactorId).ifPresent(q::setSubfactor);
        }
        QuestionEntity savedQuestion = questionRepository.save(q);
        if (req.answers != null && !req.answers.isEmpty()) {
            for (AdminDtos.AnswerOption answerOpt : req.answers) {
                AnswerEntity a = new AnswerEntity();
                a.setQuestion(savedQuestion);
                a.setText(answerOpt.text);
                a.setValue(answerOpt.value != null ? answerOpt.value : 0);
                a.setPosition(answerOpt.position != null ? answerOpt.position : 1);
                answerRepository.save(a);
            }
        }
        return new AdminDtos.QuestionCreateResponse(
                savedQuestion.getId(), savedQuestion.getText(), savedQuestion.getType(), savedQuestion.getPosition()
        );
    }

    @Transactional
    public Optional<QuestionEntity> updateQuestion(Long id, AdminDtos.QuestionUpdate req) {
        return questionRepository.findById(id).map(question -> {
            if (req.text != null) question.setText(req.text);
            if (req.type != null) question.setType(req.type);
            if (req.position != null) question.setPosition(req.position);
            if (req.subfactorId != null) {
                subfactorRepository.findById(req.subfactorId).ifPresent(question::setSubfactor);
            } else if (req.subfactorId == null && req.text == null && req.type == null && req.position == null) {
                question.setSubfactor(null);
            }
            return questionRepository.save(question);
        });
    }

    @Transactional
    public boolean setQuestionSubfactor(Long id, AdminDtos.SetSubfactorReq req) {
        return questionRepository.findById(id).map(question -> {
            if (req.subfactorId == null) {
                question.setSubfactor(null);
            } else {
                subfactorRepository.findById(req.subfactorId).ifPresent(question::setSubfactor);
            }
            questionRepository.save(question);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean deleteQuestion(Long id) {
        if (questionRepository.existsById(id)) {
            questionRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.AnswerDto> getAnswers(Long questionId) {
        QuestionEntity question = questionRepository.findById(questionId).orElseThrow();
        List<AnswerEntity> answers = answerRepository.findByQuestionOrderByPositionAsc(question);
        return answers.stream().map(a -> new AdminDtos.AnswerDto(a.getId(), a.getText(), a.getValue(), a.getPosition()))
                .collect(Collectors.toList());
    }

    @Transactional
    public AnswerEntity createAnswer(AdminDtos.AnswerCreate req) {
        QuestionEntity q = questionRepository.findById(req.questionId).orElseThrow();
        AnswerEntity a = new AnswerEntity();
        a.setQuestion(q);
        a.setText(req.text);
        a.setValue(req.value);
        a.setPosition(req.position);
        return answerRepository.save(a);
    }

    @Transactional
    public Optional<AnswerEntity> updateAnswer(Long id, AdminDtos.AnswerUpdate req) {
        return answerRepository.findById(id).map(answer -> {
            if (req.text != null) answer.setText(req.text);
            if (req.value != null) answer.setValue(req.value);
            if (req.position != null) answer.setPosition(req.position);
            return answerRepository.save(answer);
        });
    }

    @Transactional
    public boolean deleteAnswer(Long id) {
        if (answerRepository.existsById(id)) {
            answerRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public List<AdminDtos.UserListDto> listUsers() {
        return userRepository.findAll().stream().map(user -> {
            List<UserAnswerEntity> answers = userAnswerRepository.findByUser(user);
            Set<Long> testIds = answers.stream()
                    .map(ua -> ua.getQuestion().getTest().getId())
                    .collect(Collectors.toSet());
            var rel = userPsychologistRepository.findByUserId(user.getId());
            Long psychId = rel.map(r -> r.getPsychologist().getId()).orElse(null);
            String psychName = rel.map(r -> r.getPsychologist().getName()).orElse(null);
            return new AdminDtos.UserListDto(
                    user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt(),
                    testIds.size(), psychId, psychName
            );
        }).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<AdminDtos.UserDetailDto> getUserDetails(Long userId) {
        return userRepository.findById(userId).map(user -> {
            List<UserAnswerEntity> allAnswers = userAnswerRepository.findByUserOrderByCreatedAtDesc(user);
            Map<Long, java.util.List<AdminDtos.AnswerInfoDto>> testsAnswers = new HashMap<>();
            Map<Long, TestEntity> testsEntities = new HashMap<>();
            for (UserAnswerEntity ua : allAnswers) {
                Long testId = ua.getQuestion().getTest().getId();
                testsAnswers.putIfAbsent(testId, new ArrayList<>());
                testsAnswers.get(testId).add(toAnswerInfo(ua));
                if (!testsEntities.containsKey(testId)) testsEntities.put(testId, ua.getQuestion().getTest());
            }
            List<AdminDtos.TestWithAnswersDto> tests = testsAnswers.entrySet().stream()
                    .map(e -> {
                        TestEntity t = testsEntities.get(e.getKey());
                        return new AdminDtos.TestWithAnswersDto(
                                e.getKey(), t.getCode(), t.getTitle(), e.getValue()
                        );
                    })
                    .collect(Collectors.toList());
            return new AdminDtos.UserDetailDto(
                    user.getId(), user.getName(), user.getEmail(), user.getRole(), user.getCreatedAt(), tests
            );
        });
    }

    @Transactional(readOnly = true)
    public Optional<List<AdminDtos.UserTestAnswersDto>> getTestUserAnswers(Long testId) {
        TestEntity test = testRepository.findById(testId).orElse(null);
        if (test == null) return Optional.empty();

        List<QuestionEntity> questions = questionRepository.findByTestOrderByPositionAsc(test);
        Set<Long> questionIds = questions.stream().map(QuestionEntity::getId).collect(Collectors.toSet());
        List<UserAnswerEntity> allUserAnswers = userAnswerRepository.findAll().stream()
                .filter(ua -> questionIds.contains(ua.getQuestion().getId()))
                .collect(Collectors.toList());

        Map<Long, Map<Long, java.util.List<AdminDtos.AnswerInfoDto>>> usersTestsMap = new HashMap<>();
        Map<Long, String> userNames = new HashMap<>();
        Map<Long, String> userEmails = new HashMap<>();
        Map<Long, Map<Long, TestEntity>> usersTestsEntities = new HashMap<>();

        for (UserAnswerEntity ua : allUserAnswers) {
            Long userId = ua.getUser().getId();
            Long testIdFromAnswer = ua.getQuestion().getTest().getId();
            userNames.put(userId, ua.getUser().getName());
            userEmails.put(userId, ua.getUser().getEmail());
            usersTestsMap.putIfAbsent(userId, new HashMap<>());
            usersTestsMap.get(userId).putIfAbsent(testIdFromAnswer, new ArrayList<>());
            usersTestsMap.get(userId).get(testIdFromAnswer).add(toAnswerInfo(ua));
            usersTestsEntities.putIfAbsent(userId, new HashMap<>());
            usersTestsEntities.get(userId).putIfAbsent(testIdFromAnswer, ua.getQuestion().getTest());
        }

        List<AdminDtos.UserTestAnswersDto> result = usersTestsMap.entrySet().stream()
                .map(e -> {
                    Long userId = e.getKey();
                    List<AdminDtos.TestWithAnswersDto> tests = e.getValue().entrySet().stream()
                            .map(te -> {
                                TestEntity t = usersTestsEntities.get(userId).get(te.getKey());
                                return new AdminDtos.TestWithAnswersDto(te.getKey(), t.getCode(), t.getTitle(), te.getValue());
                            })
                            .collect(Collectors.toList());
                    return new AdminDtos.UserTestAnswersDto(userId, userNames.get(userId), userEmails.get(userId), tests);
                })
                .collect(Collectors.toList());
        return Optional.of(result);
    }

    @Transactional(readOnly = true)
    public List<EvaluationTestEntity> listEvaluationTests() {
        return evaluationTestRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Optional<EvaluationTestEntity> getEvaluationTest(Long id) {
        return evaluationTestRepository.findById(id);
    }

    @Transactional
    public EvaluationTestEntity createEvaluationTest(AdminDtos.EvaluationTestCreate req) {
        EvaluationTestEntity test = new EvaluationTestEntity();
        test.setCode(req.code);
        test.setTitle(req.title);
        test.setDescription(req.description);
        test.setCategory(req.category);
        test.setTopic(req.topic);
        test.setActive(req.active != null ? req.active : true);
        return evaluationTestRepository.save(test);
    }

    @Transactional
    public Optional<EvaluationTestEntity> updateEvaluationTest(Long id, AdminDtos.EvaluationTestUpdate req) {
        return evaluationTestRepository.findById(id).map(test -> {
            if (req.code != null) test.setCode(req.code);
            if (req.title != null) test.setTitle(req.title);
            if (req.description != null) test.setDescription(req.description);
            if (req.category != null) test.setCategory(req.category);
            if (req.topic != null) test.setTopic(req.topic);
            if (req.active != null) test.setActive(req.active);
            test.setUpdatedAt(Instant.now());
            return evaluationTestRepository.save(test);
        });
    }

    @Transactional
    public boolean deleteEvaluationTest(Long id) {
        if (evaluationTestRepository.existsById(id)) {
            evaluationTestRepository.deleteById(id);
            return true;
        }
        return false;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        long totalUsers = userRepository.count();
        long users = userRepository.findByRole(RoleConstants.USER).size();
        long psychologists = userRepository.findByRole(RoleConstants.PSYCHOLOGIST).size();
        long admins = userRepository.findByRole(RoleConstants.ADMIN).size();
        stats.put("totalUsers", totalUsers);
        stats.put("users", users);
        stats.put("psychologists", psychologists);
        stats.put("admins", admins);
        stats.put("totalTests", testRepository.count());
        stats.put("evaluationTests", evaluationTestRepository.count());
        long totalAppointments = appointmentRepository.count();
        long bookedAppointments = appointmentRepository.findAll().stream()
                .filter(apt -> "BOOKED".equals(apt.getStatus()) || "CONFIRMED".equals(apt.getStatus()))
                .count();
        stats.put("totalAppointments", totalAppointments);
        stats.put("bookedAppointments", bookedAppointments);
        stats.put("totalUserAnswers", userAnswerRepository.count());
        stats.put("assignedRelations", userPsychologistRepository.count());
        long verifiedUsers = userRepository.findAll().stream()
                .filter(u -> Boolean.TRUE.equals(u.getEmailVerified()))
                .count();
        stats.put("verifiedUsers", verifiedUsers);
        return stats;
    }

    private void initDefaultStructureForTest(Long testId) {
        TestEntity test = testRepository.findById(testId).orElseThrow();
        FactorEntity f1 = saveFactor(test, "sociales", "Competencias sociales", "Competencias relacionadas con la interacción social", 1, "Introvertido", "Extravertido", "A+F+H+Q2(-)");
        FactorEntity f2 = saveFactor(test, "autonomia", "Competencias de autonomía e independencia", "Competencias relacionadas con la autonomía e independencia", 2, "Acomodaticio", "Independiente", "E+H+Q2+Q1");
        FactorEntity f3 = saveFactor(test, "apertura", "Competencias de apertura y adaptación", "Competencias relacionadas con la apertura y adaptación", 3, "Duro/Rígido", "Receptivo/Flexible", "I+M+Q1_AP");
        FactorEntity f4 = saveFactor(test, "autocontrol", "Competencias de autocontrol", "Competencias relacionadas con el autocontrol", 4, "Desinhibido", "Autocontrolado", "G+Q3");
        FactorEntity f5 = saveFactor(test, "ansiedad", "Competencias de gestión de la ansiedad", "Competencias relacionadas con la gestión de la ansiedad", 5, "Imperturbable", "Ansioso", "C+O+L+Q4");
        saveSubfactor(test, f1, "A", "Extroversión", "Cercanía afectiva, trato cordial e interés genuino por las personas.", 1, "Reservado", "Abierto");
        saveSubfactor(test, f1, "F", "Animación", "Energía visible, expresividad en la interacción, tono vital alto.", 2, "Sobrio", "Entusiasta");
        saveSubfactor(test, f1, "N(-)", "Espontaneidad / Privacidad–Astucia", "Filtra y dosifica lo que muestra; gestiona su imagen y lee subtextos.", 3, "Espontáneo", "Calculador");
        saveSubfactor(test, f1, "Q2(-)", "Participación grupal", "Preferencia por actuar solo; baja orientación grupal.", 4, "Dependiente del grupo", "Autosuficiente");
        saveSubfactor(test, f2, "E", "Dominancia", "Asumir control e influir en interacciones.", 1, "Sumiso", "Dominante");
        saveSubfactor(test, f2, "H", "Emprendimiento", "Atrevimiento y desenvoltura ante exposición social y situaciones nuevas.", 2, "Tímido", "Atrevido");
        saveSubfactor(test, f2, "Q2", "Autosuficiencia", "Baja dependencia del grupo; autonomía para avanzar y decidir.", 3, "Dependiente", "Autosuficiente");
        saveSubfactor(test, f2, "Q1", "Crítico", "Actitud analítica; revisa creencias y adopta cambios con evidencia.", 4, "Conservador", "Innovador");
        saveSubfactor(test, f3, "I", "Idealismo", "Sensibilidad y orientación a principios éticos y armonía.", 1, "Objetivo/Duro", "Sensible/Idealista");
        saveSubfactor(test, f3, "M", "Creatividad", "Pensamiento imaginativo y asociativo; generación de ideas nuevas.", 2, "Práctico", "Imaginativo");
        saveSubfactor(test, f3, "Q1_AP", "Apertura al cambio", "Flexibilidad ante nuevas ideas y experiencias.", 3, "Tradicional", "Abierto al cambio");
        saveSubfactor(test, f4, "G", "Sentido del deber", "Responsabilidad, adherencia a normas y estándares.", 1, "Inconformista", "Cumplidor");
        saveSubfactor(test, f4, "Q3", "Control de emociones", "Perfeccionismo, organización y autorregulación emocional.", 2, "Flexible/Desordenado", "Controlado/Perfeccionista");
        saveSubfactor(test, f5, "C", "Estabilidad", "Calma, equilibrio emocional y recuperación ante el estrés.", 1, "Emocionalmente reactivo", "Estable");
        saveSubfactor(test, f5, "O", "Aprehensión", "Autocrítica, auto-duda y tendencia a la culpabilidad.", 2, "Seguro de sí", "Aprensivo");
        saveSubfactor(test, f5, "L", "Vigilancia", "Cautela, expectativa de segundas intenciones.", 3, "Confiado", "Vigilante");
        saveSubfactor(test, f5, "Q4", "Tensión", "Activación interna, impaciencia e irritabilidad ante contratiempos.", 4, "Relajado", "Tenso");
    }

    private FactorEntity saveFactor(TestEntity test, String code, String name, String description, int position,
                                    String minLabel, String maxLabel, String formula) {
        FactorEntity f = new FactorEntity();
        f.setTest(test);
        f.setCode(code);
        f.setName(name);
        f.setDescription(description);
        f.setPosition(position);
        f.setMinLabel(minLabel);
        f.setMaxLabel(maxLabel);
        f.setFormula(formula);
        return factorRepository.save(f);
    }

    private void saveSubfactor(TestEntity test, FactorEntity factor, String code, String name, String description,
                               int position, String minLabel, String maxLabel) {
        SubfactorEntity sf = new SubfactorEntity();
        sf.setTest(test);
        sf.setFactor(factor);
        sf.setCode(code);
        sf.setName(name);
        sf.setDescription(description);
        sf.setPosition(position);
        sf.setMinLabel(minLabel);
        sf.setMaxLabel(maxLabel);
        subfactorRepository.save(sf);
    }

    // --- Psychologist approval methods ---

    @Transactional(readOnly = true)
    public List<AdminDtos.PendingPsychologistDto> getPendingPsychologists() {
        return psychologistProfileRepository.findByApprovedFalseOrderByUpdatedAtDesc().stream()
                .map(p -> new AdminDtos.PendingPsychologistDto(
                        p.getId(), p.getUser().getId(), p.getUser().getName(), p.getUser().getEmail(),
                        p.getLicenseNumber(), p.getEducation(), p.getCertifications(),
                        p.getExperience(), p.getSpecializations(),
                        p.getUser().getCreatedAt(), p.getRejectionReason(),
                        p.getBio(), p.getLanguages(), p.getLinkedinUrl(), p.getWebsite(),
                        p.getUser().getAvatarUrl(), p.getUser().getGender(), p.getUser().getAge(),
                        p.getInterests()))
                .collect(Collectors.toList());
    }

    @Transactional
    public void approvePsychologist(Long profileId) {
        PsychologistProfileEntity profile = psychologistProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil no encontrado"));
        profile.setApproved(true);
        profile.setApprovedAt(Instant.now());
        profile.setRejectionReason(null);
        psychologistProfileRepository.save(profile);

        notificationService.createNotification(profile.getUser().getId(), "APPROVAL",
                "Cuenta aprobada", "Tu cuenta de psicólogo ha sido aprobada. Ya puedes recibir pacientes.");

        try {
            emailService.sendPsychologistApprovalEmail(profile.getUser().getEmail(), profile.getUser().getName());
        } catch (Exception e) {
            logger.error("Error enviando email de aprobación al psicólogo", e);
        }
    }

    @Transactional
    public void rejectPsychologist(Long profileId, String reason) {
        PsychologistProfileEntity profile = psychologistProfileRepository.findById(profileId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Perfil no encontrado"));
        profile.setApproved(false);
        profile.setRejectionReason(reason);
        psychologistProfileRepository.save(profile);

        notificationService.createNotification(profile.getUser().getId(), "APPROVAL",
                "Cuenta rechazada", "Tu solicitud de cuenta de psicólogo necesita revisión: " + (reason != null ? reason : ""));

        try {
            emailService.sendPsychologistRejectionEmail(profile.getUser().getEmail(), profile.getUser().getName(), reason);
        } catch (Exception e) {
            logger.error("Error enviando email de rechazo al psicólogo", e);
        }
    }

    private AdminDtos.AnswerInfoDto toAnswerInfo(UserAnswerEntity ua) {
        Long answerId = ua.getAnswer() != null ? ua.getAnswer().getId() : null;
        String answerText = ua.getAnswer() != null ? ua.getAnswer().getText() : null;
        Integer answerValue = ua.getAnswer() != null ? ua.getAnswer().getValue() : null;
        return new AdminDtos.AnswerInfoDto(
                ua.getQuestion().getId(), ua.getQuestion().getText(), ua.getQuestion().getPosition(),
                ua.getQuestion().getType(), answerId, answerText, answerValue,
                ua.getNumericValue(), ua.getTextValue(), ua.getCreatedAt()
        );
    }

    public int cleanupOrphanedTaskFiles() {
        File uploadsDir = new File("uploads/tasks");
        if (!uploadsDir.exists() || !uploadsDir.isDirectory()) {
            return 0;
        }

        // Get all known filenames from DB
        List<TaskFileEntity> allDbFiles = taskFileRepository.findAll();
        Set<String> knownFilenames = allDbFiles.stream()
                .map(f -> {
                    String path = f.getFilePath();
                    // filePath is stored as "/uploads/tasks/filename.ext"
                    int lastSlash = path.lastIndexOf('/');
                    return lastSlash >= 0 ? path.substring(lastSlash + 1) : path;
                })
                .collect(Collectors.toSet());

        // List all files on disk
        File[] diskFiles = uploadsDir.listFiles();
        if (diskFiles == null) {
            return 0;
        }

        int deletedCount = 0;
        for (File diskFile : diskFiles) {
            if (diskFile.isFile() && !knownFilenames.contains(diskFile.getName())) {
                if (diskFile.delete()) {
                    deletedCount++;
                    logger.info("Deleted orphaned task file: {}", diskFile.getName());
                } else {
                    logger.warn("Failed to delete orphaned task file: {}", diskFile.getName());
                }
            }
        }

        return deletedCount;
    }
}
