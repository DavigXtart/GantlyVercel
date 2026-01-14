-- V25: Test de matching para psicólogos
-- Este test se completa durante el registro del psicólogo y se usa para el matching con pacientes

INSERT INTO tests (code, title, description, category, active, created_at)
SELECT 'PSYCHOLOGIST_MATCHING', 'Test de Matching para Psicólogos', 'Cuestionario completo para determinar el perfil profesional del psicólogo para matching con pacientes', 'MATCHING', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE code = 'PSYCHOLOGIST_MATCHING');

SET @psych_test_id = (SELECT id FROM tests WHERE code = 'PSYCHOLOGIST_MATCHING' LIMIT 1);

-- ============================================
-- BLOQUE 1: MODALIDAD DE TERAPIA (FILTRO ABSOLUTO)
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿En qué modalidades trabajas actualmente?', 'MULTIPLE', 1);
SET @q1 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1, 'Terapia individual adultos', NULL, 1),
(@q1, 'Terapia de pareja', NULL, 2),
(@q1, 'Terapia infantojuvenil (menores)', NULL, 3);

-- Subpreguntas para menores (si marca menores)
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Tienes formación específica en infancia/adolescencia?', 'SINGLE', 2);
SET @q1a = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1a, 'Sí', NULL, 1),
(@q1a, 'No', NULL, 2);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuál es tu experiencia mínima con menores?', 'SINGLE', 3);
SET @q1b = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1b, '< 1 año', NULL, 1),
(@q1b, '1–3 años', NULL, 2),
(@q1b, '> 3 años', NULL, 3);

-- Preguntas sobre precios por tipo de sesión
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuánto cobras por sesión de terapia individual adultos? (en euros)', 'NUMBER', 18);
SET @q_price_individual = LAST_INSERT_ID();

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuánto cobras por sesión de terapia de pareja? (en euros)', 'NUMBER', 19);
SET @q_price_pareja = LAST_INSERT_ID();

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuánto cobras por sesión de terapia infantojuvenil (menores)? (en euros)', 'NUMBER', 20);
SET @q_price_menores = LAST_INSERT_ID();

-- ============================================
-- BLOQUE 2: EXPERIENCIA CLÍNICA (PESO ALTO)
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuántos años de experiencia clínica real tienes?', 'SINGLE', 4);
SET @q2 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q2, '< 1 año', NULL, 1),
(@q2, '1–3 años', NULL, 2),
(@q2, '3–7 años', NULL, 3),
(@q2, '> 7 años', NULL, 4);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuáles son tus áreas de trabajo principales?', 'MULTIPLE', 5);
SET @q3 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q3, 'Ansiedad y estrés', NULL, 1),
(@q3, 'Depresión / estado de ánimo', NULL, 2),
(@q3, 'Ataques de pánico', NULL, 3),
(@q3, 'Duelo', NULL, 4),
(@q3, 'Trauma', NULL, 5),
(@q3, 'Pareja', NULL, 6),
(@q3, 'Familia', NULL, 7),
(@q3, 'Autoestima', NULL, 8),
(@q3, 'Conducta alimentaria', NULL, 9),
(@q3, 'Adicciones', NULL, 10),
(@q3, 'Sexualidad', NULL, 11),
(@q3, 'TDAH adultos', NULL, 12),
(@q3, 'Otros', NULL, 13);

-- ============================================
-- BLOQUE 3: PERFIL DE COMPLEJIDAD
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, 'En general, ¿qué nivel de complejidad clínica trabajas con mayor frecuencia?', 'SINGLE', 6);
SET @q4 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q4, 'Casos leves / preventivos', NULL, 1),
(@q4, 'Casos moderados', NULL, 2),
(@q4, 'Casos complejos', NULL, 3),
(@q4, 'Me adapto según el caso', NULL, 4);

-- ============================================
-- BLOQUE 4: ENFOQUE Y ESTILO TERAPÉUTICO
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuál es tu orientación principal?', 'MULTIPLE', 7);
SET @q5 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q5, 'Cognitivo-conductual', NULL, 1),
(@q5, 'Tercera generación / contextual', NULL, 2),
(@q5, 'Psicodinámica', NULL, 3),
(@q5, 'Humanista', NULL, 4),
(@q5, 'Sistémica', NULL, 5),
(@q5, 'Integrador', NULL, 6);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cómo describirías tu forma habitual de trabajar?', 'SINGLE', 8);
SET @q6 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q6, 'Muy práctica, con tareas y objetivos claros', NULL, 1),
(@q6, 'Más exploratoria y reflexiva', NULL, 2),
(@q6, 'Equilibrada entre ambas', NULL, 3);

-- ============================================
-- BLOQUE 5: VARIABLES RELACIONALES
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Con qué población te sientes más cómodo/a?', 'SINGLE', 9);
SET @q7 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q7, 'Adultos jóvenes (18–30)', NULL, 1),
(@q7, 'Adultos (30–50)', NULL, 2),
(@q7, 'Adultos mayores (+50)', NULL, 3),
(@q7, 'Todas', NULL, 4);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuál es tu experiencia en crisis vitales recientes? (divorcio, duelo, cambios vitales)', 'SINGLE', 10);
SET @q8 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q8, 'Baja', NULL, 1),
(@q8, 'Media', NULL, 2),
(@q8, 'Alta', NULL, 3);

-- ============================================
-- BLOQUE 6: VARIABLES DE IDENTIDAD Y AFINIDAD
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿En qué idiomas trabajas?', 'MULTIPLE', 11);
SET @q9 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q9, 'Español', NULL, 1),
(@q9, 'Inglés', NULL, 2),
(@q9, 'Francés', NULL, 3),
(@q9, 'Catalán', NULL, 4),
(@q9, 'Euskera', NULL, 5),
(@q9, 'Gallego', NULL, 6),
(@q9, 'Portugués', NULL, 7),
(@q9, 'Italiano', NULL, 8),
(@q9, 'Alemán', NULL, 9);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Trabajas desde una perspectiva LGTBIQ+ afirmativa?', 'SINGLE', 12);
SET @q10 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q10, 'Sí', NULL, 1),
(@q10, 'No', NULL, 2);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuál es tu género? (Autodeclarado, no se muestra como criterio explícito)', 'SINGLE', 13);
SET @q11 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q11, 'Mujer', NULL, 1),
(@q11, 'Hombre', NULL, 2),
(@q11, 'No binario / otro', NULL, 3);

-- ============================================
-- BLOQUE 7: DISPONIBILIDAD Y LOGÍSTICA
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Qué horarios habituales tienes disponibles?', 'MULTIPLE', 14);
SET @q12 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q12, 'Mañanas (8–12)', NULL, 1),
(@q12, 'Mediodía (13–17)', NULL, 2),
(@q12, 'Tardes (18–22)', NULL, 3),
(@q12, 'Fin de semana', NULL, 4);

INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Cuál es tu frecuencia habitual de trabajo?', 'SINGLE', 15);
SET @q13 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q13, 'Semanal', NULL, 1),
(@q13, 'Quincenal', NULL, 2),
(@q13, 'Flexible', NULL, 3);

-- ============================================
-- BLOQUE 8: EXPERIENCIA CON MEDICACIÓN PSIQUIÁTRICA
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿Tienes experiencia trabajando con pacientes que toman medicación psiquiátrica?', 'SINGLE', 16);
SET @q14 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q14, 'Sí, habitualmente', NULL, 1),
(@q14, 'Sí, en algunos casos', NULL, 2),
(@q14, 'Prefiero no trabajar con medicación activa', NULL, 3);

-- ============================================
-- BLOQUE 9: AUTOUBICACIÓN PROFESIONAL
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@psych_test_id, '¿En qué casos consideras que NO eres el profesional más adecuado?', 'TEXT', 17);
SET @q15 = LAST_INSERT_ID();

