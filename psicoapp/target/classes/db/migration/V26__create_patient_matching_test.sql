-- V26: Test de matching para pacientes
-- Este test se completa después del registro y se usa para encontrar psicólogos compatibles

INSERT INTO tests (code, title, description, category, active, created_at)
SELECT 'PATIENT_MATCHING', 'Test de Matching para Pacientes', 'Cuestionario para conectar pacientes con psicólogos compatibles', 'MATCHING', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE code = 'PATIENT_MATCHING');

SET @patient_test_id = (SELECT id FROM tests WHERE code = 'PATIENT_MATCHING' LIMIT 1);

-- ============================================
-- BLOQUE 1: TIPO DE TERAPIA (FILTRO ABSOLUTO)
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Qué tipo de terapia buscas?', 'SINGLE', 1);
SET @q1 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1, 'Terapia individual', NULL, 1),
(@q1, 'Terapia de pareja', NULL, 2),
(@q1, 'Terapia para un menor', NULL, 3);

-- ============================================
-- BLOQUE 2: DATOS SOCIODEMOGRÁFICOS
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Cuál es tu fecha de nacimiento?', 'TEXT', 2);
SET @q2 = LAST_INSERT_ID();

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Cuál describe mejor tu ocupación principal actual?', 'SINGLE', 3);
SET @q3 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q3, 'Estudiante', NULL, 1),
(@q3, 'Empleado/a con funciones principalmente operativas o técnicas', NULL, 2),
(@q3, 'Profesional cualificado/a (sanitario, educativo, jurídico, tecnológico, etc.)', NULL, 3),
(@q3, 'Mando intermedio / coordinador/a de equipo', NULL, 4),
(@q3, 'Directivo/a / empresario/a con alta responsabilidad', NULL, 5),
(@q3, 'Autónomo/a o freelance', NULL, 6),
(@q3, 'En situación de desempleo o inestabilidad laboral', NULL, 7),
(@q3, 'Jubilado/a', NULL, 8),
(@q3, 'Dedicación principal al cuidado de terceros', NULL, 9);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Tu trabajo implica toma de decisiones sobre otras personas? (Solo si marcaste opciones 3, 4, 5 o 6)', 'SINGLE', 4);
SET @q3a = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q3a, 'No', NULL, 1),
(@q3a, 'Sí, sobre un pequeño equipo', NULL, 2),
(@q3a, 'Sí, sobre un equipo amplio u organización', NULL, 3);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Cómo describirías tu situación de pareja actual?', 'SINGLE', 5);
SET @q4 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q4, 'Sin pareja', NULL, 1),
(@q4, 'Con pareja, no convivimos', NULL, 2),
(@q4, 'Con pareja y convivimos', NULL, 3),
(@q4, 'Separación o divorcio en curso', NULL, 4),
(@q4, 'Divorciado/a (proceso finalizado)', NULL, 5),
(@q4, 'Viudo/a', NULL, 6);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Has vivido una ruptura de pareja significativa en los últimos 6 meses?', 'SINGLE', 6);
SET @q5 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q5, 'No', NULL, 1),
(@q5, 'Sí', NULL, 2);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Te consideras una persona religiosa?', 'SINGLE', 7);
SET @q6 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q6, 'Sí', NULL, 1),
(@q6, 'No', NULL, 2);

-- ============================================
-- BLOQUE 3: MOTIVO DE CONSULTA (NÚCLEO CLÍNICO)
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Qué te trae hoy a Gantly?', 'MULTIPLE', 8);
SET @q7 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q7, 'Ansiedad / estrés', NULL, 1),
(@q7, 'Estado de ánimo bajo / tristeza', NULL, 2),
(@q7, 'Ataques de pánico', NULL, 3),
(@q7, 'Problemas de pareja', NULL, 4),
(@q7, 'Dificultades familiares', NULL, 5),
(@q7, 'Duelo', NULL, 6),
(@q7, 'Trauma / experiencias difíciles', NULL, 7),
(@q7, 'Autoestima / imagen corporal', NULL, 8),
(@q7, 'Conducta alimentaria', NULL, 9),
(@q7, 'Sueño', NULL, 10),
(@q7, 'Adicciones / consumo', NULL, 11),
(@q7, 'Problemas sexuales', NULL, 12),
(@q7, 'TDAH / atención / organización (sospecha)', NULL, 13),
(@q7, 'Otro', NULL, 14);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Desde cuándo te ocurre esto?', 'SINGLE', 9);
SET @q8 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q8, 'Días', NULL, 1),
(@q8, 'Semanas', NULL, 2),
(@q8, 'Meses', NULL, 3),
(@q8, 'Más de 6 meses', NULL, 4),
(@q8, 'Años', NULL, 5);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, 'En las últimas 2 semanas, esto ha afectado a tu vida…', 'SINGLE', 10);
SET @q9 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q9, 'Poco', NULL, 1),
(@q9, 'Moderadamente', NULL, 2),
(@q9, 'Mucho', NULL, 3),
(@q9, 'Muchísimo (me cuesta funcionar)', NULL, 4);

-- ============================================
-- BLOQUE 4: EXPERIENCIA PREVIA EN TERAPIA
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Has hecho terapia antes?', 'SINGLE', 11);
SET @q10 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q10, 'No', NULL, 1),
(@q10, 'Sí, y me fue bien', NULL, 2),
(@q10, 'Sí, pero no me encajó', NULL, 3),
(@q10, 'Sí, actualmente estoy en terapia', NULL, 4);

-- ============================================
-- BLOQUE 5: INFORMACIÓN SENSIBLE (POST-REGISTRO)
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Actualmente tomas medicación psiquiátrica?', 'SINGLE', 12);
SET @q11 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q11, 'No', NULL, 1),
(@q11, 'Sí', NULL, 2);

-- ============================================
-- BLOQUE 6: PERFIL DEL TERAPEUTA
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Con qué perfil te sentirías más cómodo/a?', 'SINGLE', 13);
SET @q12 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q12, 'Mujer', NULL, 1),
(@q12, 'Hombre', NULL, 2),
(@q12, 'Indiferente', NULL, 3);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿En qué idioma prefieres realizar la terapia?', 'MULTIPLE', 14);
SET @q13 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q13, 'Español', NULL, 1),
(@q13, 'Inglés', NULL, 2),
(@q13, 'Francés', NULL, 3),
(@q13, 'Catalán', NULL, 4),
(@q13, 'Euskera', NULL, 5),
(@q13, 'Gallego', NULL, 6),
(@q13, 'Portugués', NULL, 7),
(@q13, 'Italiano', NULL, 8),
(@q13, 'Alemán', NULL, 9);

INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Qué estilo terapéutico prefieres?', 'SINGLE', 15);
SET @q14 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q14, 'Más práctico, con tareas', NULL, 1),
(@q14, 'Más exploratorio', NULL, 2),
(@q14, 'Equilibrado', NULL, 3);

-- ============================================
-- BLOQUE 7: DISPONIBILIDAD
-- ============================================
INSERT INTO questions (test_id, text, type, position) VALUES
(@patient_test_id, '¿Qué horarios te vendrían mejor para las sesiones?', 'MULTIPLE', 16);
SET @q15 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q15, 'Mañanas (8–12)', NULL, 1),
(@q15, 'Mediodía (13–17)', NULL, 2),
(@q15, 'Tardes (18–22)', NULL, 3),
(@q15, 'Fin de semana', NULL, 4);

