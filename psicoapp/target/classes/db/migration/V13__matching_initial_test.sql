-- V13: Nuevo test inicial de matching + soporte de respuestas enriquecidas

-- 1) Añadir columna para texto libre en respuestas
ALTER TABLE user_answers
ADD COLUMN text_value VARCHAR(1000) NULL;

-- 2) Renombrar el test inicial anterior para conservarlo como legacy
UPDATE tests
SET code = 'INITIAL_LEGACY'
WHERE code = 'INITIAL';

-- 3) Crear el nuevo test inicial orientado a matching si no existe
INSERT INTO tests (code, title, description, active, created_at)
SELECT 'INITIAL', 'Test Inicial de Matching', 'Cuestionario breve para conectar pacientes con el profesional adecuado.', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE code = 'INITIAL');

SET @matching_test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1);

-- BLOQUE 1: Motivo principal (Pregunta 1)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Cuál es el motivo principal por el que buscas ayuda?', 'SINGLE', 1);
SET @q1 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1, 'Ansiedad / estrés / nervios', NULL, 1),
(@q1, 'Estado de ánimo bajo / depresión', NULL, 2),
(@q1, 'Problemas de autoestima / confianza', NULL, 3),
(@q1, 'Problemas de pareja', NULL, 4),
(@q1, 'Dificultades familiares', NULL, 5),
(@q1, 'Duelos o pérdidas', NULL, 6),
(@q1, 'Problemas laborales / burnout', NULL, 7),
(@q1, 'Problemas relacionados con estudios / oposiciones', NULL, 8),
(@q1, 'Dificultades sociales', NULL, 9),
(@q1, 'Problemas con la gestión de la ira', NULL, 10),
(@q1, 'Dificultad para concentrarte / TDAH (diagnosticado o no)', NULL, 11),
(@q1, 'Terapia para menores', NULL, 12),
(@q1, 'Otro (especificar)', NULL, 13);

-- BLOQUE 2: Preferencias del profesional (Preguntas 2-3)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Tienes preferencia sobre el género del psicólogo?', 'SINGLE', 2);
SET @q2 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q2, 'Hombre', NULL, 1),
(@q2, 'Mujer', NULL, 2),
(@q2, 'Me es indiferente', NULL, 3);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Hay algo importante que te gustaría que tuviera tu psicólogo?', 'SINGLE', 3);
SET @q3 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q3, 'Que sea muy empático y cercano', NULL, 1),
(@q3, 'Que sea directo y vaya al grano', NULL, 2),
(@q3, 'Que me dé herramientas prácticas desde el principio', NULL, 3),
(@q3, 'Que profundice en mis emociones', NULL, 4),
(@q3, 'Que tenga mucha experiencia', NULL, 5),
(@q3, 'Me es indiferente', NULL, 6);

-- BLOQUE 3: Personalidad y estilo (Preguntas 4-7, escala 1-5)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, 'Me cuesta abrirme con personas nuevas.', 'SINGLE', 4);
SET @q4 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q4, '1 - Muy en desacuerdo', 1, 1),
(@q4, '2', 2, 2),
(@q4, '3', 3, 3),
(@q4, '4', 4, 4),
(@q4, '5 - Muy de acuerdo', 5, 5);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, 'Prefiero que me den pautas claras y estructuradas.', 'SINGLE', 5);
SET @q5 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q5, '1 - Muy en desacuerdo', 1, 1),
(@q5, '2', 2, 2),
(@q5, '3', 3, 3),
(@q5, '4', 4, 4),
(@q5, '5 - Muy de acuerdo', 5, 5);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, 'Me ayuda más alguien que escuche sin juzgar que alguien que dé indicaciones.', 'SINGLE', 6);
SET @q6 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q6, '1 - Muy en desacuerdo', 1, 1),
(@q6, '2', 2, 2),
(@q6, '3', 3, 3),
(@q6, '4', 4, 4),
(@q6, '5 - Muy de acuerdo', 5, 5);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, 'Cuando tengo un problema, quiero soluciones prácticas cuanto antes.', 'SINGLE', 7);
SET @q7 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q7, '1 - Muy en desacuerdo', 1, 1),
(@q7, '2', 2, 2),
(@q7, '3', 3, 3),
(@q7, '4', 4, 4),
(@q7, '5 - Muy de acuerdo', 5, 5);

-- BLOQUE 4: Experiencia previa (Preguntas 8-9)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Has ido antes al psicólogo?', 'SINGLE', 8);
SET @q8 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q8, 'Sí', NULL, 1),
(@q8, 'No', NULL, 2);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Cómo fue tu experiencia anterior?', 'SINGLE', 9);
SET @q9 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q9, 'Muy positiva', NULL, 1),
(@q9, 'Positiva', NULL, 2),
(@q9, 'Neutra', NULL, 3),
(@q9, 'Algo negativa', NULL, 4),
(@q9, 'Muy negativa', NULL, 5),
(@q9, 'No he ido antes / Prefiero no responder', NULL, 6);

-- BLOQUE 5: Disponibilidad horaria (Preguntas 10-11)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Cuándo te viene mejor tener sesión? (puede elegir varias)', 'MULTI', 10);
SET @q10 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q10, 'Mañanas entre semana', NULL, 1),
(@q10, 'Tardes entre semana', NULL, 2),
(@q10, 'Noches entre semana', NULL, 3),
(@q10, 'Fines de semana', NULL, 4),
(@q10, 'Me adapto', NULL, 5);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Con qué frecuencia quieres tener sesiones?', 'SINGLE', 11);
SET @q11 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q11, 'Una vez por semana', NULL, 1),
(@q11, 'Cada 2 semanas', NULL, 2),
(@q11, 'No lo sé todavía', NULL, 3);

-- BLOQUE 6: Presupuesto y urgencia (Preguntas 12-13)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Cuál es tu presupuesto aproximado por sesión?', 'SINGLE', 12);
SET @q12 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q12, 'Menos de 30€', NULL, 1),
(@q12, '30–40€', NULL, 2),
(@q12, '40–50€', NULL, 3),
(@q12, '50–60€', NULL, 4),
(@q12, 'Más de 60€', NULL, 5),
(@q12, 'Me da igual si el profesional encaja bien conmigo', NULL, 6);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Cómo describirías la urgencia de tu situación?', 'SINGLE', 13);
SET @q13 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q13, 'Muy urgente (quiero sesión esta semana)', NULL, 1),
(@q13, 'Moderada (próximos 7–10 días)', NULL, 2),
(@q13, 'Baja (cuando haya hueco)', NULL, 3);

-- BLOQUE 7: Información contextual (Preguntas 14-15)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Cuál es tu edad?', 'NUMBER', 14);

INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Tienes alguna preferencia cultural o lingüística? (marca si aplica)', 'MULTI', 15);
SET @q15 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q15, 'Prefiero terapia en español', NULL, 1),
(@q15, 'Prefiero terapia en inglés', NULL, 2),
(@q15, 'Me da igual', NULL, 3),
(@q15, 'Busco alguien con sensibilidad cultural específica (especificar)', NULL, 4);

-- ÍTEM FINAL (Pregunta 16)
INSERT INTO questions (test_id, text, type, position) VALUES
(@matching_test_id, '¿Hay algo más que quieras comentar para ayudarte a elegir psicólogo?', 'TEXT', 16);


