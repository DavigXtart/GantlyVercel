-- V28: Crear psicólogos de prueba con datos y tests respondidos
-- Estos psicólogos se usan para probar el sistema de matching
-- Todos los psicólogos de prueba tienen la contraseña: test123
-- NOTA IMPORTANTE: Este hash BCrypt puede no ser válido. Si el login falla, 
-- usa el endpoint de cambio de contraseña o actualiza manualmente el hash en la BD
-- Para generar un hash válido, ejecuta en Java: BCryptPasswordEncoder().encode("test123")
SET @bcrypt_hash = '$2a$10$rK8Kx5Zx5Zx5Zx5Zx5Zx5Ou5Zx5Zx5Zx5Zx5Zx5Zx5Zx5Zx5Zx5Zx5Zx5Z';

-- Obtener el ID del test de matching de psicólogos
SET @psych_test_id = (SELECT id FROM tests WHERE code = 'PSYCHOLOGIST_MATCHING' LIMIT 1);

-- ============================================
-- PSICÓLOGO 1: Ana García - Especialista en adultos, ansiedad y depresión
-- ============================================
INSERT INTO users (name, email, password_hash, role, email_verified, gender, age, created_at)
VALUES ('Ana García López', 'ana.garcia@test.com', @bcrypt_hash, 'PSYCHOLOGIST', TRUE, 'Mujer', 35, NOW());
SET @psych1_id = LAST_INSERT_ID();

-- Respuestas del test para Psicólogo 1
SET @q1_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 1 LIMIT 1);
SET @q1_ans1 = (SELECT id FROM answers WHERE question_id = @q1_id AND position = 1 LIMIT 1); -- Terapia individual adultos
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q1_id, @q1_ans1);

SET @q4_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 4 LIMIT 1);
SET @q4_ans4 = (SELECT id FROM answers WHERE question_id = @q4_id AND position = 4 LIMIT 1); -- > 7 años
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q4_id, @q4_ans4);

SET @q5_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 5 LIMIT 1);
SET @q5_ans1 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 1 LIMIT 1); -- Ansiedad
SET @q5_ans2 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 2 LIMIT 1); -- Depresión
SET @q5_ans3 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 3 LIMIT 1); -- Pánico
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q5_id, @q5_ans1);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q5_id, @q5_ans2);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q5_id, @q5_ans3);

SET @q6_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 6 LIMIT 1);
SET @q6_ans3 = (SELECT id FROM answers WHERE question_id = @q6_id AND position = 3 LIMIT 1); -- Casos complejos
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q6_id, @q6_ans3);

SET @q7_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 7 LIMIT 1);
SET @q7_ans1 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 1 LIMIT 1); -- Cognitivo-conductual
SET @q7_ans6 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 6 LIMIT 1); -- Integrador
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q7_id, @q7_ans1);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q7_id, @q7_ans6);

SET @q8_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 8 LIMIT 1);
SET @q8_ans3 = (SELECT id FROM answers WHERE question_id = @q8_id AND position = 3 LIMIT 1); -- Equilibrada
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q8_id, @q8_ans3);

SET @q9_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 9 LIMIT 1);
SET @q9_ans4 = (SELECT id FROM answers WHERE question_id = @q9_id AND position = 4 LIMIT 1); -- Todas
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q9_id, @q9_ans4);

SET @q10_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 10 LIMIT 1);
SET @q10_ans3 = (SELECT id FROM answers WHERE question_id = @q10_id AND position = 3 LIMIT 1); -- Alta
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q10_id, @q10_ans3);

SET @q11_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 11 LIMIT 1);
SET @q11_ans1 = (SELECT id FROM answers WHERE question_id = @q11_id AND position = 1 LIMIT 1); -- Español
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q11_id, @q11_ans1);

SET @q12_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 12 LIMIT 1);
SET @q12_ans1 = (SELECT id FROM answers WHERE question_id = @q12_id AND position = 1 LIMIT 1); -- Sí, LGTBIQ+
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q12_id, @q12_ans1);

SET @q13_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 13 LIMIT 1);
SET @q13_ans1 = (SELECT id FROM answers WHERE question_id = @q13_id AND position = 1 LIMIT 1); -- Mujer
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q13_id, @q13_ans1);

SET @q14_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 14 LIMIT 1);
SET @q14_ans2 = (SELECT id FROM answers WHERE question_id = @q14_id AND position = 2 LIMIT 1); -- Mediodía
SET @q14_ans3 = (SELECT id FROM answers WHERE question_id = @q14_id AND position = 3 LIMIT 1); -- Tardes
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q14_id, @q14_ans2);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q14_id, @q14_ans3);

SET @q15_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 15 LIMIT 1);
SET @q15_ans1 = (SELECT id FROM answers WHERE question_id = @q15_id AND position = 1 LIMIT 1); -- Semanal
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q15_id, @q15_ans1);

SET @q16_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 16 LIMIT 1);
SET @q16_ans1 = (SELECT id FROM answers WHERE question_id = @q16_id AND position = 1 LIMIT 1); -- Sí, habitualmente
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych1_id, @q16_id, @q16_ans1);

-- ============================================
-- PSICÓLOGO 2: Carlos Martínez - Especialista en pareja y familia
-- ============================================
INSERT INTO users (name, email, password_hash, role, email_verified, gender, age, created_at)
VALUES ('Carlos Martínez Ruiz', 'carlos.martinez@test.com', @bcrypt_hash, 'PSYCHOLOGIST', TRUE, 'Hombre', 42, NOW());
SET @psych2_id = LAST_INSERT_ID();

SET @q1_ans2 = (SELECT id FROM answers WHERE question_id = @q1_id AND position = 2 LIMIT 1); -- Terapia de pareja
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q1_id, @q1_ans1); -- También individual
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q1_id, @q1_ans2);

SET @q4_ans3 = (SELECT id FROM answers WHERE question_id = @q4_id AND position = 3 LIMIT 1); -- 3-7 años
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q4_id, @q4_ans3);

SET @q5_ans6 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 6 LIMIT 1); -- Pareja
SET @q5_ans7 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 7 LIMIT 1); -- Familia
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q5_id, @q5_ans6);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q5_id, @q5_ans7);

SET @q6_ans4 = (SELECT id FROM answers WHERE question_id = @q6_id AND position = 4 LIMIT 1); -- Me adapto
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q6_id, @q6_ans4);

SET @q7_ans5 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 5 LIMIT 1); -- Sistémica
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q7_id, @q7_ans5);

SET @q8_ans3 = (SELECT id FROM answers WHERE question_id = @q8_id AND position = 3 LIMIT 1); -- Equilibrada
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q8_id, @q8_ans3);

SET @q9_ans4 = (SELECT id FROM answers WHERE question_id = @q9_id AND position = 4 LIMIT 1); -- Todas
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q9_id, @q9_ans4);

SET @q10_ans3 = (SELECT id FROM answers WHERE question_id = @q10_id AND position = 3 LIMIT 1); -- Alta
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q10_id, @q10_ans3);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q11_id, @q11_ans1); -- Español

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q12_id, @q12_ans1); -- Sí, LGTBIQ+

SET @q13_ans2 = (SELECT id FROM answers WHERE question_id = @q13_id AND position = 2 LIMIT 1); -- Hombre
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q13_id, @q13_ans2);

SET @q14_ans3 = (SELECT id FROM answers WHERE question_id = @q14_id AND position = 3 LIMIT 1); -- Tardes
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q14_id, @q14_ans3);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q15_id, @q15_ans1); -- Semanal

SET @q16_ans2 = (SELECT id FROM answers WHERE question_id = @q16_id AND position = 2 LIMIT 1); -- Algunos casos
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych2_id, @q16_id, @q16_ans2);

-- ============================================
-- PSICÓLOGO 3: Laura Fernández - Especialista en infantojuvenil
-- ============================================
INSERT INTO users (name, email, password_hash, role, email_verified, gender, age, created_at)
VALUES ('Laura Fernández Sánchez', 'laura.fernandez@test.com', @bcrypt_hash, 'PSYCHOLOGIST', TRUE, 'Mujer', 29, NOW());
SET @psych3_id = LAST_INSERT_ID();

SET @q1_ans3 = (SELECT id FROM answers WHERE question_id = @q1_id AND position = 3 LIMIT 1); -- Infantojuvenil
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q1_id, @q1_ans3);

SET @q2_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 2 LIMIT 1);
SET @q2_ans1 = (SELECT id FROM answers WHERE question_id = @q2_id AND position = 1 LIMIT 1); -- Sí, formación
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q2_id, @q2_ans1);

SET @q3_id = (SELECT id FROM questions WHERE test_id = @psych_test_id AND position = 3 LIMIT 1);
SET @q3_ans3 = (SELECT id FROM answers WHERE question_id = @q3_id AND position = 3 LIMIT 1); -- > 3 años experiencia
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q3_id, @q3_ans3);

SET @q4_ans2 = (SELECT id FROM answers WHERE question_id = @q4_id AND position = 2 LIMIT 1); -- 1-3 años
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q4_id, @q4_ans2);

SET @q5_ans4 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 4 LIMIT 1); -- Duelo
SET @q5_ans5 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 5 LIMIT 1); -- Trauma
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q5_id, @q5_ans4);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q5_id, @q5_ans5);

SET @q6_ans2 = (SELECT id FROM answers WHERE question_id = @q6_id AND position = 2 LIMIT 1); -- Moderados
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q6_id, @q6_ans2);

SET @q7_ans1 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 1 LIMIT 1); -- Cognitivo-conductual
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q7_id, @q7_ans1);

SET @q8_ans1 = (SELECT id FROM answers WHERE question_id = @q8_id AND position = 1 LIMIT 1); -- Muy práctica
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q8_id, @q8_ans1);

SET @q9_ans1 = (SELECT id FROM answers WHERE question_id = @q9_id AND position = 1 LIMIT 1); -- 18-30
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q9_id, @q9_ans1);

SET @q10_ans2 = (SELECT id FROM answers WHERE question_id = @q10_id AND position = 2 LIMIT 1); -- Media
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q10_id, @q10_ans2);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q11_id, @q11_ans1); -- Español

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q12_id, @q12_ans1); -- Sí, LGTBIQ+

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q13_id, @q13_ans1); -- Mujer

SET @q14_ans1 = (SELECT id FROM answers WHERE question_id = @q14_id AND position = 1 LIMIT 1); -- Mañanas
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q14_id, @q14_ans1);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q14_id, @q14_ans2); -- Mediodía

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q15_id, @q15_ans1); -- Semanal

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych3_id, @q16_id, @q16_ans1); -- Sí, habitualmente

-- ============================================
-- PSICÓLOGO 4: Miguel Torres - Especialista en trauma y TDAH
-- ============================================
INSERT INTO users (name, email, password_hash, role, email_verified, gender, age, created_at)
VALUES ('Miguel Torres González', 'miguel.torres@test.com', @bcrypt_hash, 'PSYCHOLOGIST', TRUE, 'Hombre', 38, NOW());
SET @psych4_id = LAST_INSERT_ID();

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q1_id, @q1_ans1); -- Individual adultos

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q4_id, @q4_ans4); -- > 7 años

SET @q5_ans5 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 5 LIMIT 1); -- Trauma
SET @q5_ans12 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 12 LIMIT 1); -- TDAH
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q5_id, @q5_ans5);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q5_id, @q5_ans12);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q6_id, @q6_ans3); -- Casos complejos

SET @q7_ans3 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 3 LIMIT 1); -- Psicodinámica
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q7_id, @q7_ans3);

SET @q8_ans2 = (SELECT id FROM answers WHERE question_id = @q8_id AND position = 2 LIMIT 1); -- Exploratoria
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q8_id, @q8_ans2);

SET @q9_ans2 = (SELECT id FROM answers WHERE question_id = @q9_id AND position = 2 LIMIT 1); -- 30-50
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q9_id, @q9_ans2);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q10_id, @q10_ans3); -- Alta

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q11_id, @q11_ans1); -- Español

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q12_id, @q12_ans1); -- Sí, LGTBIQ+

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q13_id, @q13_ans2); -- Hombre

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q14_id, @q14_ans2); -- Mediodía
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q14_id, @q14_ans3); -- Tardes

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q15_id, @q15_ans1); -- Semanal

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych4_id, @q16_id, @q16_ans1); -- Sí, habitualmente

-- ============================================
-- PSICÓLOGO 5: Sofía Ramírez - Especialista en ansiedad, autoestima, casos leves
-- ============================================
INSERT INTO users (name, email, password_hash, role, email_verified, gender, age, created_at)
VALUES ('Sofía Ramírez Vázquez', 'sofia.ramirez@test.com', @bcrypt_hash, 'PSYCHOLOGIST', TRUE, 'Mujer', 31, NOW());
SET @psych5_id = LAST_INSERT_ID();

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q1_id, @q1_ans1); -- Individual adultos

SET @q4_ans1 = (SELECT id FROM answers WHERE question_id = @q4_id AND position = 1 LIMIT 1); -- < 1 año
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q4_id, @q4_ans1);

SET @q5_ans1 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 1 LIMIT 1); -- Ansiedad
SET @q5_ans8 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 8 LIMIT 1); -- Autoestima
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q5_id, @q5_ans1);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q5_id, @q5_ans8);

SET @q6_ans1 = (SELECT id FROM answers WHERE question_id = @q6_id AND position = 1 LIMIT 1); -- Casos leves
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q6_id, @q6_ans1);

SET @q7_ans2 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 2 LIMIT 1); -- Tercera generación
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q7_id, @q7_ans2);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q8_id, @q8_ans1); -- Muy práctica

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q9_id, @q9_ans4); -- Todas

SET @q10_ans1 = (SELECT id FROM answers WHERE question_id = @q10_id AND position = 1 LIMIT 1); -- Baja
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q10_id, @q10_ans1);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q11_id, @q11_ans1); -- Español

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q12_id, @q12_ans1); -- Sí, LGTBIQ+

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q13_id, @q13_ans1); -- Mujer

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q14_id, @q14_ans1); -- Mañanas

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q15_id, @q15_ans1); -- Semanal

SET @q16_ans3 = (SELECT id FROM answers WHERE question_id = @q16_id AND position = 3 LIMIT 1); -- Prefiero no trabajar con medicación
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych5_id, @q16_id, @q16_ans3);

-- ============================================
-- PSICÓLOGO 6: David López - Especialista multidisciplinar, bilingüe
-- ============================================
INSERT INTO users (name, email, password_hash, role, email_verified, gender, age, created_at)
VALUES ('David López Moreno', 'david.lopez@test.com', @bcrypt_hash, 'PSYCHOLOGIST', TRUE, 'Hombre', 45, NOW());
SET @psych6_id = LAST_INSERT_ID();

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q1_id, @q1_ans1); -- Individual
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q1_id, @q1_ans2); -- Pareja

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q4_id, @q4_ans4); -- > 7 años

SET @q5_ans1 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 1 LIMIT 1); -- Ansiedad
SET @q5_ans2 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 2 LIMIT 1); -- Depresión
SET @q5_ans6 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 6 LIMIT 1); -- Pareja
SET @q5_ans9 = (SELECT id FROM answers WHERE question_id = @q5_id AND position = 9 LIMIT 1); -- Conducta alimentaria
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q5_id, @q5_ans1);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q5_id, @q5_ans2);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q5_id, @q5_ans6);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q5_id, @q5_ans9);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q6_id, @q6_ans4); -- Me adapto

SET @q7_ans6 = (SELECT id FROM answers WHERE question_id = @q7_id AND position = 6 LIMIT 1); -- Integrador
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q7_id, @q7_ans6);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q8_id, @q8_ans3); -- Equilibrada

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q9_id, @q9_ans4); -- Todas

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q10_id, @q10_ans3); -- Alta

SET @q11_ans1 = (SELECT id FROM answers WHERE question_id = @q11_id AND position = 1 LIMIT 1); -- Español
SET @q11_ans2 = (SELECT id FROM answers WHERE question_id = @q11_id AND position = 2 LIMIT 1); -- Inglés
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q11_id, @q11_ans1);
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q11_id, @q11_ans2);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q12_id, @q12_ans1); -- Sí, LGTBIQ+

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q13_id, @q13_ans2); -- Hombre

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q14_id, @q14_ans1); -- Mañanas
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q14_id, @q14_ans2); -- Mediodía
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q14_id, @q14_ans3); -- Tardes

SET @q15_ans3 = (SELECT id FROM answers WHERE question_id = @q15_id AND position = 3 LIMIT 1); -- Flexible
INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q15_id, @q15_ans3);

INSERT INTO user_answers (user_id, question_id, answer_id) VALUES (@psych6_id, @q16_id, @q16_ans1); -- Sí, habitualmente
