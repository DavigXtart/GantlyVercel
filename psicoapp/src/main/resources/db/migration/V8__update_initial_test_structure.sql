-- Migración V8: Actualizar test inicial con nueva estructura de factores y subfactores
-- Esta migración limpia y reconstruye el test inicial completamente

-- Desactivar verificación de claves foráneas temporalmente
SET FOREIGN_KEY_CHECKS = 0;

-- Obtener ID del test inicial si existe
SET @test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1);

-- Si el test existe, eliminar todos los datos relacionados en el orden correcto
-- Primero eliminar resultados de test y factor_results que dependen de subfactores/factores
DELETE FROM factor_results WHERE test_id = @test_id;
DELETE FROM test_results WHERE test_id = @test_id;

-- Eliminar respuestas de usuario que dependen de preguntas
DELETE FROM user_answers WHERE question_id IN (SELECT id FROM questions WHERE test_id = @test_id);

-- Eliminar respuestas y preguntas
DELETE FROM answers WHERE question_id IN (SELECT id FROM questions WHERE test_id = @test_id);
DELETE FROM questions WHERE test_id = @test_id;

-- Eliminar subfactores y factores
DELETE FROM subfactors WHERE test_id = @test_id;
DELETE FROM factors WHERE test_id = @test_id;

-- Reactivar verificación de claves foráneas
SET FOREIGN_KEY_CHECKS = 1;

-- Si el test no existe, crearlo
INSERT INTO tests (code, title, description, active, created_at) 
SELECT 'INITIAL', 'Test Inicial de Personalidad', 'Test básico de personalidad para nuevos usuarios', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE code = 'INITIAL');

SET @test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1);

-- Crear factores generales según la nueva estructura
INSERT INTO factors (test_id, code, name, description, position) VALUES
(@test_id, 'sociales', 'Competencias sociales', 'Competencias relacionadas con la interacción social', 1),
(@test_id, 'autonomia', 'Competencias de autonomía e independencia', 'Competencias relacionadas con la autonomía e independencia', 2),
(@test_id, 'apertura', 'Competencias de apertura y adaptación', 'Competencias relacionadas con la apertura y adaptación', 3),
(@test_id, 'autocontrol', 'Competencias de autocontrol', 'Competencias relacionadas con el autocontrol', 4),
(@test_id, 'ansiedad', 'Competencias de gestión de la ansiedad', 'Competencias relacionadas con la gestión de la ansiedad', 5);

-- Obtener IDs de los factores
SET @factor_sociales = (SELECT id FROM factors WHERE code = 'sociales' AND test_id = @test_id LIMIT 1);
SET @factor_autonomia = (SELECT id FROM factors WHERE code = 'autonomia' AND test_id = @test_id LIMIT 1);
SET @factor_apertura = (SELECT id FROM factors WHERE code = 'apertura' AND test_id = @test_id LIMIT 1);
SET @factor_autocontrol = (SELECT id FROM factors WHERE code = 'autocontrol' AND test_id = @test_id LIMIT 1);
SET @factor_ansiedad = (SELECT id FROM factors WHERE code = 'ansiedad' AND test_id = @test_id LIMIT 1);

-- Crear subfactores para Competencias sociales
INSERT INTO subfactors (test_id, code, name, description, factor_id, position) VALUES
(@test_id, 'A', 'Extroversión', 'Cercanía afectiva, trato cordial e interés genuino por las personas.', @factor_sociales, 1),
(@test_id, 'F', 'Animación', 'Energía visible, expresividad en la interacción, tono vital alto.', @factor_sociales, 2),
(@test_id, 'N(-)', 'Espontaneidad / Privacidad–Astucia', 'Filtra y dosifica lo que muestra; gestiona su imagen y lee subtextos.', @factor_sociales, 3),
(@test_id, 'Q2(-)', 'Participación grupal', 'Preferencia por actuar solo; baja orientación grupal.', @factor_sociales, 4);

-- Crear subfactores para Competencias de autonomía e independencia
INSERT INTO subfactors (test_id, code, name, description, factor_id, position) VALUES
(@test_id, 'E', 'Dominancia', 'Asumir control e influir en interacciones.', @factor_autonomia, 1),
(@test_id, 'H', 'Emprendimiento', 'Atrevimiento y desenvoltura ante exposición social y situaciones nuevas.', @factor_autonomia, 2),
(@test_id, 'Q2', 'Autosuficiencia', 'Baja dependencia del grupo; autonomía para avanzar y decidir.', @factor_autonomia, 3),
(@test_id, 'Q1', 'Crítico', 'Actitud analítica; revisa creencias y adopta cambios con evidencia.', @factor_autonomia, 4);

-- Crear subfactores para Competencias de apertura y adaptación
INSERT INTO subfactors (test_id, code, name, description, factor_id, position) VALUES
(@test_id, 'I', 'Idealismo', 'Sensibilidad y orientación a principios éticos y armonía.', @factor_apertura, 1),
(@test_id, 'M', 'Creatividad', 'Pensamiento imaginativo y asociativo; generación de ideas nuevas.', @factor_apertura, 2),
(@test_id, 'Q1_AP', 'Apertura al cambio', 'Flexibilidad ante nuevas ideas y experiencias.', @factor_apertura, 3);

-- Crear subfactores para Competencias de autocontrol
INSERT INTO subfactors (test_id, code, name, description, factor_id, position) VALUES
(@test_id, 'G', 'Sentido del deber', 'Responsabilidad, adherencia a normas y estándares.', @factor_autocontrol, 1),
(@test_id, 'Q3', 'Control de emociones', 'Perfeccionismo, organización y autorregulación emocional.', @factor_autocontrol, 2);

-- Crear subfactores para Competencias de gestión de la ansiedad
INSERT INTO subfactors (test_id, code, name, description, factor_id, position) VALUES
(@test_id, 'C', 'Estabilidad', 'Calma, equilibrio emocional y recuperación ante el estrés.', @factor_ansiedad, 1),
(@test_id, 'O', 'Aprehensión', 'Autocrítica, auto-duda y tendencia a la culpabilidad.', @factor_ansiedad, 2),
(@test_id, 'L', 'Vigilancia', 'Cautela, expectativa de segundas intenciones.', @factor_ansiedad, 3),
(@test_id, 'Q4', 'Tensión', 'Activación interna, impaciencia e irritabilidad ante contratiempos.', @factor_ansiedad, 4);

-- Obtener IDs de los subfactores
SET @subfactor_a = (SELECT id FROM subfactors WHERE code = 'A' AND test_id = @test_id LIMIT 1);
SET @subfactor_f = (SELECT id FROM subfactors WHERE code = 'F' AND test_id = @test_id LIMIT 1);
SET @subfactor_e = (SELECT id FROM subfactors WHERE code = 'E' AND test_id = @test_id LIMIT 1);
SET @subfactor_h = (SELECT id FROM subfactors WHERE code = 'H' AND test_id = @test_id LIMIT 1);
SET @subfactor_i = (SELECT id FROM subfactors WHERE code = 'I' AND test_id = @test_id LIMIT 1);
SET @subfactor_m = (SELECT id FROM subfactors WHERE code = 'M' AND test_id = @test_id LIMIT 1);
SET @subfactor_g = (SELECT id FROM subfactors WHERE code = 'G' AND test_id = @test_id LIMIT 1);
SET @subfactor_q3 = (SELECT id FROM subfactors WHERE code = 'Q3' AND test_id = @test_id LIMIT 1);
SET @subfactor_c = (SELECT id FROM subfactors WHERE code = 'C' AND test_id = @test_id LIMIT 1);
SET @subfactor_o = (SELECT id FROM subfactors WHERE code = 'O' AND test_id = @test_id LIMIT 1);

-- Crear 20 preguntas distribuidas entre los subfactores
-- Respuestas tipo Likert: Siempre = 5, Casi siempre = 4, A veces = 3, Alguna vez = 2, Nunca = 1

-- Preguntas asociadas a Extroversión (A) - Competencias sociales
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Me siento cómodo mostrando cercanía afectiva con las personas', 'SINGLE', 1, @subfactor_a);

SET @q1 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1, 'Siempre', 5, 1),
(@q1, 'Casi siempre', 4, 2),
(@q1, 'A veces', 3, 3),
(@q1, 'Alguna vez', 2, 4),
(@q1, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Tengo interés genuino por conocer a las personas', 'SINGLE', 2, @subfactor_a);

SET @q2 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q2, 'Siempre', 5, 1),
(@q2, 'Casi siempre', 4, 2),
(@q2, 'A veces', 3, 3),
(@q2, 'Alguna vez', 2, 4),
(@q2, 'Nunca', 1, 5);

-- Preguntas asociadas a Animación (F) - Competencias sociales
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Muestro energía visible cuando interactúo con otros', 'SINGLE', 3, @subfactor_f);

SET @q3 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q3, 'Siempre', 5, 1),
(@q3, 'Casi siempre', 4, 2),
(@q3, 'A veces', 3, 3),
(@q3, 'Alguna vez', 2, 4),
(@q3, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Soy expresivo en mis interacciones sociales', 'SINGLE', 4, @subfactor_f);

SET @q4 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q4, 'Siempre', 5, 1),
(@q4, 'Casi siempre', 4, 2),
(@q4, 'A veces', 3, 3),
(@q4, 'Alguna vez', 2, 4),
(@q4, 'Nunca', 1, 5);

-- Preguntas asociadas a Dominancia (E) - Competencias de autonomía
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Asumo el control cuando es necesario en las interacciones', 'SINGLE', 5, @subfactor_e);

SET @q5 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q5, 'Siempre', 5, 1),
(@q5, 'Casi siempre', 4, 2),
(@q5, 'A veces', 3, 3),
(@q5, 'Alguna vez', 2, 4),
(@q5, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Influyo en las decisiones del grupo cuando participo', 'SINGLE', 6, @subfactor_e);

SET @q6 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q6, 'Siempre', 5, 1),
(@q6, 'Casi siempre', 4, 2),
(@q6, 'A veces', 3, 3),
(@q6, 'Alguna vez', 2, 4),
(@q6, 'Nunca', 1, 5);

-- Preguntas asociadas a Emprendimiento (H) - Competencias de autonomía
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Me atrevo a enfrentar situaciones nuevas con desenvoltura', 'SINGLE', 7, @subfactor_h);

SET @q7 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q7, 'Siempre', 5, 1),
(@q7, 'Casi siempre', 4, 2),
(@q7, 'A veces', 3, 3),
(@q7, 'Alguna vez', 2, 4),
(@q7, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Me siento cómodo cuando debo exponerme socialmente', 'SINGLE', 8, @subfactor_h);

SET @q8 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q8, 'Siempre', 5, 1),
(@q8, 'Casi siempre', 4, 2),
(@q8, 'A veces', 3, 3),
(@q8, 'Alguna vez', 2, 4),
(@q8, 'Nunca', 1, 5);

-- Preguntas asociadas a Idealismo (I) - Competencias de apertura
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Me guío por principios éticos en mis decisiones', 'SINGLE', 9, @subfactor_i);

SET @q9 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q9, 'Siempre', 5, 1),
(@q9, 'Casi siempre', 4, 2),
(@q9, 'A veces', 3, 3),
(@q9, 'Alguna vez', 2, 4),
(@q9, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Busco la armonía en mis relaciones con los demás', 'SINGLE', 10, @subfactor_i);

SET @q10 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q10, 'Siempre', 5, 1),
(@q10, 'Casi siempre', 4, 2),
(@q10, 'A veces', 3, 3),
(@q10, 'Alguna vez', 2, 4),
(@q10, 'Nunca', 1, 5);

-- Preguntas asociadas a Creatividad (M) - Competencias de apertura
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Tengo pensamiento imaginativo y genero ideas nuevas', 'SINGLE', 11, @subfactor_m);

SET @q11 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q11, 'Siempre', 5, 1),
(@q11, 'Casi siempre', 4, 2),
(@q11, 'A veces', 3, 3),
(@q11, 'Alguna vez', 2, 4),
(@q11, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Asocio ideas de formas creativas y originales', 'SINGLE', 12, @subfactor_m);

SET @q12 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q12, 'Siempre', 5, 1),
(@q12, 'Casi siempre', 4, 2),
(@q12, 'A veces', 3, 3),
(@q12, 'Alguna vez', 2, 4),
(@q12, 'Nunca', 1, 5);

-- Preguntas asociadas a Sentido del deber (G) - Competencias de autocontrol
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Soy responsable y cumplo con mis compromisos', 'SINGLE', 13, @subfactor_g);

SET @q13 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q13, 'Siempre', 5, 1),
(@q13, 'Casi siempre', 4, 2),
(@q13, 'A veces', 3, 3),
(@q13, 'Alguna vez', 2, 4),
(@q13, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Adhiero a normas y estándares establecidos', 'SINGLE', 14, @subfactor_g);

SET @q14 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q14, 'Siempre', 5, 1),
(@q14, 'Casi siempre', 4, 2),
(@q14, 'A veces', 3, 3),
(@q14, 'Alguna vez', 2, 4),
(@q14, 'Nunca', 1, 5);

-- Preguntas asociadas a Control de emociones (Q3) - Competencias de autocontrol
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Mantengo la organización y el orden en mis actividades', 'SINGLE', 15, @subfactor_q3);

SET @q15 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q15, 'Siempre', 5, 1),
(@q15, 'Casi siempre', 4, 2),
(@q15, 'A veces', 3, 3),
(@q15, 'Alguna vez', 2, 4),
(@q15, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Regulo mis emociones de manera efectiva', 'SINGLE', 16, @subfactor_q3);

SET @q16 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q16, 'Siempre', 5, 1),
(@q16, 'Casi siempre', 4, 2),
(@q16, 'A veces', 3, 3),
(@q16, 'Alguna vez', 2, 4),
(@q16, 'Nunca', 1, 5);

-- Preguntas asociadas a Estabilidad (C) - Competencias de gestión de la ansiedad
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Mantengo la calma ante situaciones de estrés', 'SINGLE', 17, @subfactor_c);

SET @q17 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q17, 'Siempre', 5, 1),
(@q17, 'Casi siempre', 4, 2),
(@q17, 'A veces', 3, 3),
(@q17, 'Alguna vez', 2, 4),
(@q17, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Me recupero rápidamente después de situaciones difíciles', 'SINGLE', 18, @subfactor_c);

SET @q18 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q18, 'Siempre', 5, 1),
(@q18, 'Casi siempre', 4, 2),
(@q18, 'A veces', 3, 3),
(@q18, 'Alguna vez', 2, 4),
(@q18, 'Nunca', 1, 5);

-- Preguntas asociadas a Aprehensión (O) - Competencias de gestión de la ansiedad
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Tiendo a ser autocrítico con mis acciones', 'SINGLE', 19, @subfactor_o);

SET @q19 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q19, 'Siempre', 5, 1),
(@q19, 'Casi siempre', 4, 2),
(@q19, 'A veces', 3, 3),
(@q19, 'Alguna vez', 2, 4),
(@q19, 'Nunca', 1, 5);

INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_id, 'Siento tendencia a la culpabilidad cuando algo sale mal', 'SINGLE', 20, @subfactor_o);

SET @q20 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q20, 'Siempre', 5, 1),
(@q20, 'Casi siempre', 4, 2),
(@q20, 'A veces', 3, 3),
(@q20, 'Alguna vez', 2, 4),
(@q20, 'Nunca', 1, 5);
