-- V17: Crear test 16PF: Test de personalidad
-- Este test utiliza los mismos factores y subfactores del test inicial

-- Crear el test 16PF
INSERT INTO tests (code, title, description, active, created_at)
SELECT '16PF', '16PF: Test de personalidad', 'Test completo de personalidad basado en los 16 factores de personalidad', TRUE, NOW()
WHERE NOT EXISTS (SELECT 1 FROM tests WHERE code = '16PF');

SET @test_16pf_id = (SELECT id FROM tests WHERE code = '16PF' LIMIT 1);

-- Obtener los factores del test inicial (comparten la misma estructura)
SET @factor_sociales = (SELECT id FROM factors WHERE code = 'sociales' AND test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1) LIMIT 1);
SET @factor_autonomia = (SELECT id FROM factors WHERE code = 'autonomia' AND test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1) LIMIT 1);
SET @factor_apertura = (SELECT id FROM factors WHERE code = 'apertura' AND test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1) LIMIT 1);
SET @factor_autocontrol = (SELECT id FROM factors WHERE code = 'autocontrol' AND test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1) LIMIT 1);
SET @factor_ansiedad = (SELECT id FROM factors WHERE code = 'ansiedad' AND test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1) LIMIT 1);

-- Crear los mismos factores para el test 16PF
INSERT INTO factors (test_id, code, name, description, position)
SELECT @test_16pf_id, code, name, description, position
FROM factors
WHERE test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM factors WHERE test_id = @test_16pf_id AND code = factors.code);

-- Obtener IDs de los factores del test 16PF
SET @factor_sociales_16pf = (SELECT id FROM factors WHERE code = 'sociales' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_autonomia_16pf = (SELECT id FROM factors WHERE code = 'autonomia' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_apertura_16pf = (SELECT id FROM factors WHERE code = 'apertura' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_autocontrol_16pf = (SELECT id FROM factors WHERE code = 'autocontrol' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_ansiedad_16pf = (SELECT id FROM factors WHERE code = 'ansiedad' AND test_id = @test_16pf_id LIMIT 1);

-- Crear los mismos subfactores para el test 16PF
INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, sf.code, sf.name, sf.description, 
       CASE 
         WHEN sf.code IN ('A', 'F', 'N(-)', 'Q2(-)') THEN @factor_sociales_16pf
         WHEN sf.code IN ('E', 'H', 'Q2', 'Q1') THEN @factor_autonomia_16pf
         WHEN sf.code IN ('I', 'M', 'Q1_AP') THEN @factor_apertura_16pf
         WHEN sf.code IN ('G', 'Q3') THEN @factor_autocontrol_16pf
         WHEN sf.code IN ('C', 'O', 'L', 'Q4') THEN @factor_ansiedad_16pf
       END,
       sf.position
FROM subfactors sf
WHERE sf.test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1)
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = sf.code);

-- Obtener IDs de los subfactores del test 16PF
SET @subfactor_a = (SELECT id FROM subfactors WHERE code = 'A' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_f = (SELECT id FROM subfactors WHERE code = 'F' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_e = (SELECT id FROM subfactors WHERE code = 'E' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_h = (SELECT id FROM subfactors WHERE code = 'H' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_i = (SELECT id FROM subfactors WHERE code = 'I' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_m = (SELECT id FROM subfactors WHERE code = 'M' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_g = (SELECT id FROM subfactors WHERE code = 'G' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_q3 = (SELECT id FROM subfactors WHERE code = 'Q3' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_c = (SELECT id FROM subfactors WHERE code = 'C' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_o = (SELECT id FROM subfactors WHERE code = 'O' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_l = (SELECT id FROM subfactors WHERE code = 'L' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_q4 = (SELECT id FROM subfactors WHERE code = 'Q4' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_q2 = (SELECT id FROM subfactors WHERE code = 'Q2' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_q1 = (SELECT id FROM subfactors WHERE code = 'Q1' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_q1_ap = (SELECT id FROM subfactors WHERE code = 'Q1_AP' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_n_neg = (SELECT id FROM subfactors WHERE code = 'N(-)' AND test_id = @test_16pf_id LIMIT 1);
SET @subfactor_q2_neg = (SELECT id FROM subfactors WHERE code = 'Q2(-)' AND test_id = @test_16pf_id LIMIT 1);

-- Pregunta 1: Control (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'He comprendido bien las instrucciones para contestar al cuestionario:', 'SINGLE', 1, NULL);
SET @q1 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q1, 'Si', 0, 1),
(@q1, 'No estoy seguro', 0, 2),
(@q1, 'No', 0, 3);

-- Pregunta 2: Control (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Estoy dispuesto a contestar todas las cuestiones con sinceridad:', 'SINGLE', 2, NULL);
SET @q2 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q2, 'Si', 0, 1),
(@q2, 'No estoy seguro', 0, 2),
(@q2, 'No', 0, 3);

-- Pregunta 3: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '¿Cuales de las siguientes palabras es diferente de las otras dos?:', 'SINGLE', 3, NULL);
SET @q3 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q3, 'Algo', 0, 1),
(@q3, 'Nada', 1, 2),
(@q3, 'Mucho', 0, 3);

-- Pregunta 4: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Poseo suficiente energía para enfrentarme a todos mis problemas:', 'SINGLE', 4, @subfactor_c);
SET @q4 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q4, 'Siempre', 2, 1),
(@q4, 'Frecuentemente', 1, 2),
(@q4, 'Raras veces', 0, 3);

-- Pregunta 5: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Evito criticar a la gente y sus ideas:', 'SINGLE', 5, @subfactor_i);
SET @q5 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q5, 'Si', 0, 1),
(@q5, 'Algunas veces', 1, 2),
(@q5, 'No', 2, 3);

-- Pregunta 6: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Hago agudas y sarcásticas observaciones a la gente si creo que las merece:', 'SINGLE', 6, @subfactor_e);
SET @q6 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q6, 'Generamente', 2, 1),
(@q6, 'Algunas veces', 1, 2),
(@q6, 'Nunca', 0, 3);

-- Pregunta 7: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta más la música semiclásica que las canciones populares:', 'SINGLE', 7, @subfactor_m);
SET @q7 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q7, 'Verdadero', 0, 1),
(@q7, 'No estoy seguro', 1, 2),
(@q7, 'Falso', 2, 3);

-- Pregunta 8: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si veo peleándose a los niños de mis vecinos:', 'SINGLE', 8, @subfactor_i);
SET @q8 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q8, 'Les dejos solucionar sus problemas', 0, 1),
(@q8, 'No estoy seguro', 1, 2),
(@q8, 'Razono con ellos la solución', 2, 3);

-- Pregunta 9: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En situaciones sociales:', 'SINGLE', 9, @subfactor_h);
SET @q9 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q9, 'Facilmente soy de los que toman iniciativas', 2, 1),
(@q9, 'Intervengo algunas veces', 1, 2),
(@q9, 'Prefiero quedarme tranquilamente a distancia', 0, 3);

-- Pregunta 10: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Sería más interesante ser:', 'SINGLE', 10, @subfactor_m);
SET @q10 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q10, 'Ingeniero de la construcción', 0, 1),
(@q10, 'No estoy seguro entre los dos', 1, 2),
(@q10, 'Escritor de teatro', 2, 3);

-- Pregunta 11: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Generalmente puedo tolerar a la gente presuntuosa, aunque fanfarronee o piense demasiado bien de ella misma:', 'SINGLE', 11, @subfactor_i);
SET @q11 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q11, 'Si', 0, 1),
(@q11, 'Término medio', 1, 2),
(@q11, 'No', 2, 3);

-- Pregunta 12: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando una persona no es honrada, casi siempre se le puede notar en la cara:', 'SINGLE', 12, @subfactor_l);
SET @q12 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q12, 'Verdadero', 0, 1),
(@q12, 'Término medio', 1, 2),
(@q12, 'Falso', 2, 3);

-- Pregunta 13: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Aceptaría mejor el riesgo de un trabajo donde pudiera terner ganacias mayores, aunque eventuales, que otro con sueldo pequeño, pero seguro:', 'SINGLE', 13, @subfactor_h);
SET @q13 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q13, 'Si', 0, 1),
(@q13, 'No estoy seguro', 1, 2),
(@q13, 'No', 2, 3);

-- Pregunta 14: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'De vez en cuando siento un vago temor o un repentino miedo, sin poder comprender las razones:', 'SINGLE', 14, @subfactor_o);
SET @q14 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q14, 'Si', 2, 1),
(@q14, 'Término medio', 1, 2),
(@q14, 'No', 0, 3);

-- Pregunta 15: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando me critican duramente por algo que no he hecho:', 'SINGLE', 15, @subfactor_o);
SET @q15 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q15, 'No me siento culpable', 2, 1),
(@q15, 'Término medio', 1, 2),
(@q15, 'Todavía me siento un poco culpable', 0, 3);

-- Pregunta 16: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Casi todo se puede comprar con dinero:', 'SINGLE', 16, @subfactor_l);
SET @q16 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q16, 'Si', 2, 1),
(@q16, 'No estoy seguro', 1, 2),
(@q16, 'No', 0, 3);

-- Pregunta 17: Autosuficiencia (Q2)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'La mayoría de las personas serían más felices si convivieran más con la gente de su nivel e hicieran las cosas como los demás:', 'SINGLE', 17, @subfactor_q2);
SET @q17 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q17, 'Si', 0, 1),
(@q17, 'Término medio', 1, 2),
(@q17, 'No', 2, 3);

-- Pregunta 18: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En ocasiones, mirándome en un espejo, me entrar dudas sobre lo que es mi derecha o izquierda:', 'SINGLE', 18, NULL);
SET @q18 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q18, 'Verdadero', 0, 1),
(@q18, 'No estoy seguro', 1, 2),
(@q18, 'Falso', 2, 3);

-- Pregunta 19: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando algo realmente me pone furioso, suelo calmarme muy pronto:', 'SINGLE', 19, @subfactor_c);
SET @q19 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q19, 'Si', 0, 1),
(@q19, 'Término medio', 1, 2),
(@q19, 'No', 2, 3);

-- Pregunta 20: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Preferiría tener una casa:', 'SINGLE', 20, @subfactor_a);
SET @q20 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q20, 'En un barrio con vida social', 2, 1),
(@q20, 'Término medio', 1, 2),
(@q20, 'Aislada en el bosque', 0, 3);

-- Pregunta 21: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Con el mismo horario y sueldo, sería más interesante ser:', 'SINGLE', 21, @subfactor_a);
SET @q21 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q21, 'El cocinero de un buen restaurante', 0, 1),
(@q21, 'No estoy seguro entre ambos', 1, 2),
(@q21, 'El que sirve mesas en el restaurante', 2, 3);

-- Pregunta 22: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Cansado" es a trabajar como "orgulloso" es a:', 'SINGLE', 22, NULL);
SET @q22 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q22, 'Sonreir', 0, 1),
(@q22, 'Tener éxito', 1, 2),
(@q22, 'Ser feliz', 0, 3);

-- Pregunta 23: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me pongo algo nervisoso ante animales salvajes, incluso cuando están encerrados en fuertes jaulas:', 'SINGLE', 23, @subfactor_c);
SET @q23 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q23, 'Si', 0, 1),
(@q23, 'No estoy seguro', 1, 2),
(@q23, 'No', 2, 3);

-- Pregunta 24: Crítico (Q1)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Una ley anticuada debería cambiarse:', 'SINGLE', 24, @subfactor_q1);
SET @q24 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q24, 'Sólo después de muchas discusiones', 0, 1),
(@q24, 'Término medio', 1, 2),
(@q24, 'Inmediatamente', 2, 3);

-- Pregunta 25: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'La mayor parte de las personas me consideran una interlocutor agradable.:', 'SINGLE', 25, @subfactor_a);
SET @q25 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q25, 'Si', 2, 1),
(@q25, 'No estoy seguro', 1, 2),
(@q25, 'No', 0, 3);

-- Pregunta 26: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta salir a divertirme o ir a un espectáculo:', 'SINGLE', 26, @subfactor_f);
SET @q26 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q26, 'Más de una vez por semana (más de lo corriente)', 2, 1),
(@q26, 'Alrededor de una vez por semana (lo corriente)', 1, 2),
(@q26, 'Menos de una vez por semana (menos de lo corriente)', 0, 3);

-- Pregunta 27: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando veo gente desaliñada y sucia:', 'SINGLE', 27, @subfactor_g);
SET @q27 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q27, 'Lo acepto simplemente', 0, 1),
(@q27, 'Término medio', 1, 2),
(@q27, 'Me disgusta y me fastidia', 2, 3);

-- Pregunta 28: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Estando en un grupo social me siento un poco turbado si de pronto paso a ser el foco de atención:', 'SINGLE', 28, @subfactor_h);
SET @q28 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q28, 'Si', 0, 1),
(@q28, 'Término medio', 1, 2),
(@q28, 'No', 2, 3);

-- Pregunta 29: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando voy por la calle prefiero detenerme antes a ver a un artista pintando que a escuchar a la gente discutir:', 'SINGLE', 29, @subfactor_m);
SET @q29 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q29, 'Verdadero', 2, 1),
(@q29, 'No estoy seguro', 1, 2),
(@q29, 'Falso', 0, 3);

-- Pregunta 30: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando me ponen al frente de algo, insisto en que se sigan mis instrucciones; en caso contrario, renuncio:', 'SINGLE', 30, @subfactor_e);
SET @q30 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q30, 'Si', 2, 1),
(@q30, 'Algunas vees', 1, 2),
(@q30, 'No', 0, 3);

-- Pregunta 31: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Serían mejor que las vacaciones fueran más largas y obligatorias para todas las personas:', 'SINGLE', 31, @subfactor_g);
SET @q31 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q31, 'De acuerdo', 0, 1),
(@q31, 'No estoy seguro', 1, 2),
(@q31, 'En desacuerdo', 2, 3);

-- Pregunta 32: Privacidad (N(-))
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Hablo acerca de mis sentimientos:', 'SINGLE', 32, @subfactor_n_neg);
SET @q32 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q32, 'Sólo si es necesario', 2, 1),
(@q32, 'Término medio', 1, 2),
(@q32, 'Facilmente, siempre que tengo ocasión', 0, 3);

-- Pregunta 33: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me siento muy abatido cuando la gente me critica en un grupo:', 'SINGLE', 33, @subfactor_o);
SET @q33 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q33, 'Verdadero', 2, 1),
(@q33, 'Término medio', 1, 2),
(@q33, 'Falso', 0, 3);

-- Pregunta 34: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si mi jefe o profesor me llama a su despacho:', 'SINGLE', 34, @subfactor_o);
SET @q34 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q34, 'Aprovecho la ocasión para pedirle algo que deseo', 0, 1),
(@q34, 'Término medio', 1, 2),
(@q34, 'Temo haber hecho algo malo', 2, 3);

-- Pregunta 35: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Mis decisiones se apoyan más en:', 'SINGLE', 35, @subfactor_i);
SET @q35 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q35, 'El corazón', 0, 1),
(@q35, 'Los sentimientos y la razón pr igual', 1, 2),
(@q35, 'La cabeza', 2, 3);

-- Pregunta 36: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En mi adolescencia pertenecí a equipos deportivos:', 'SINGLE', 36, @subfactor_f);
SET @q36 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q36, 'Algunas veces', 2, 1),
(@q36, 'A menudo', 1, 2),
(@q36, 'La mayoría de las veces', 0, 3);

-- Pregunta 37: Privacidad (N(-))
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando hablo con alguien, me gusta:', 'SINGLE', 37, @subfactor_n_neg);
SET @q37 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q37, 'Decir las cosas tal y como se me ocurre', 0, 1),
(@q37, 'Término medio', 1, 2),
(@q37, 'Organizar antes mis ideas', 2, 3);

-- Pregunta 38: Tensión (Q4)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'A veces me pongo en estado de tensión y agitación cuando pienso en los sucesos del día:', 'SINGLE', 38, @subfactor_q4);
SET @q38 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q38, 'Si', 2, 1),
(@q38, 'Término medio', 1, 2),
(@q38, 'No', 0, 3);

-- Pregunta 39: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'He sido elegido para hacer algo:', 'SINGLE', 39, @subfactor_e);
SET @q39 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q39, 'Sólo en pocas ocasiones', 0, 1),
(@q39, 'Varias veces', 1, 2),
(@q39, 'Muchas veces', 2, 3);

-- Pregunta 40: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '¿Cuál de las siguientes cosas es diferente de las otras dos?:', 'SINGLE', 40, NULL);
SET @q40 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q40, 'Vela', 0, 1),
(@q40, 'Luna', 1, 2),
(@q40, 'Luz eléctrica', 0, 3);

-- Pregunta 41: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Sorpresa" es a "extraño" como "miedo" es a:', 'SINGLE', 41, NULL);
SET @q41 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q41, 'Valeroso', 0, 1),
(@q41, 'Ansioso', 0, 2),
(@q41, 'Terrible', 1, 3);

-- Pregunta 42: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'A veces no puedo dormir porque tengo una idea que me da vueltas en la cabeza:', 'SINGLE', 42, @subfactor_m);
SET @q42 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q42, 'Verdadero', 0, 1),
(@q42, 'No estoy seguro', 1, 2),
(@q42, 'Falso', 2, 3);

-- Pregunta 43: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me siento desasosegado cuando trabajo en un proyecto que requiere una acción rápida que afecta a los demás:', 'SINGLE', 43, @subfactor_c);
SET @q43 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q43, 'Verdadero', 0, 1),
(@q43, 'Término medio', 1, 2),
(@q43, 'Falso', 2, 3);

-- Pregunta 44: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Indudablemente tengo menos amigos que la mayoría de las personas:', 'SINGLE', 44, @subfactor_a);
SET @q44 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q44, 'Si', 0, 1),
(@q44, 'Término medio', 1, 2),
(@q44, 'No', 2, 3);

-- Pregunta 45: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Aborrecería tener que estar en un lugar donde hubiera poca gente con quien hablar:', 'SINGLE', 45, @subfactor_a);
SET @q45 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q45, 'Verdadero', 2, 1),
(@q45, 'No estoy seguro', 1, 2),
(@q45, 'Falso', 0, 3);

-- Pregunta 46: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo que es más importante mucha libertad que buena educación y respeto a la ley:', 'SINGLE', 46, @subfactor_g);
SET @q46 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q46, 'Verdadero', 0, 1),
(@q46, 'No estoy seguro', 1, 2),
(@q46, 'Falso', 2, 3);

-- Pregunta 47: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siempre me alegra formar parte de un grupo grande, como una reunión, un baile o una asamblea:', 'SINGLE', 47, @subfactor_a);
SET @q47 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q47, 'Si', 2, 1),
(@q47, 'Término medio', 1, 2),
(@q47, 'No', 0, 3);

-- Pregunta 48: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En mi época de estudiante me gustaba (me gusta):', 'SINGLE', 48, @subfactor_m);
SET @q48 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q48, 'La música', 2, 1),
(@q48, 'No estoy seguro', 1, 2),
(@q48, 'La actividad de tipo manual', 0, 3);

-- Pregunta 49: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si alguien se enfada conmigo:', 'SINGLE', 49, @subfactor_c);
SET @q49 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q49, 'Intento calmarle', 0, 1),
(@q49, 'No estoy seguro', 1, 2),
(@q49, 'Me irrito con él', 2, 3);

-- Pregunta 50: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Para los padres es más importante:', 'SINGLE', 50, @subfactor_i);
SET @q50 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q50, 'Ayudar a sus hijos a desarrollarse afectivamente', 2, 1),
(@q50, 'Término medio', 1, 2),
(@q50, 'Enseñarles a controlar sus emociones', 0, 3);

-- Pregunta 51: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siento de vez en cuando la necesidad de ocuparme en una actividad física enérgica:', 'SINGLE', 51, @subfactor_f);
SET @q51 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q51, 'Si', 0, 1),
(@q51, 'Término medio', 1, 2),
(@q51, 'No', 2, 3);

-- Pregunta 52: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Hay veces que no me siento con humor para ver a alguien:', 'SINGLE', 52, @subfactor_a);
SET @q52 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q52, 'Muy raramente', 0, 1),
(@q52, 'Término medio', 1, 2),
(@q52, 'Muy a menudo', 2, 3);

-- Pregunta 53: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'A veces los demás me advierten que yo muestro mi excitación demasiado claramente en la voz y en los modales:', 'SINGLE', 53, @subfactor_f);
SET @q53 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q53, 'Si', 2, 1),
(@q53, 'Término medio', 1, 2),
(@q53, 'No', 0, 3);

-- Pregunta 54: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Lo que el mundo necesita es:', 'SINGLE', 54, @subfactor_i);
SET @q54 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q54, 'Ciudadanos más sensatos y constantes', 0, 1),
(@q54, 'No estoy seguro', 1, 2),
(@q54, 'Más idealistas con proyectos para un mundo mejor', 2, 3);

-- Pregunta 55: Autosuficiencia (Q2)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Preferiría tener un negocio propio, no compartido con otra persona:', 'SINGLE', 55, @subfactor_q2);
SET @q55 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q55, 'Si', 2, 1),
(@q55, 'No estoy seguro', 1, 2),
(@q55, 'No', 0, 3);

-- Pregunta 56: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Tengo mi habitación organizada de un modo inteligente y estético, con las cosas colocadas casi siempre en lugares conocidos:', 'SINGLE', 56, @subfactor_q3);
SET @q56 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q56, 'Sí', 2, 1),
(@q56, 'Término medio', 1, 2),
(@q56, 'No', 0, 3);

-- Pregunta 57: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En ocasiones dudo si la gente con la que estoy hablando se interesa realmente por lo que digo:', 'SINGLE', 57, @subfactor_o);
SET @q57 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q57, 'Si', 2, 1),
(@q57, 'Término medio', 1, 2),
(@q57, 'No', 0, 3);

-- Pregunta 58: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si tuviera que escoger, preferiría ser:', 'SINGLE', 58, @subfactor_i);
SET @q58 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q58, 'Guarda forestal', 0, 1),
(@q58, 'No estoy seguro', 1, 2),
(@q58, 'Profesor de Enseñanza Media', 2, 3);

-- Pregunta 59: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '¿Cuál de las siguientes fracciones es diferente a las otras dos?:', 'SINGLE', 59, NULL);
SET @q59 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q59, '3/7', 0, 1),
(@q59, '3/9', 1, 2),
(@q59, '3/11', 0, 3);

-- Pregunta 60: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Tamaño" es a "longitud" como "delito" es a:', 'SINGLE', 60, NULL);
SET @q60 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q60, 'Prisión', 0, 1),
(@q60, 'Castigo', 0, 2),
(@q60, 'Robo', 1, 3);

-- Pregunta 61: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En mi vida personal consigo casi siempre todos mis propósitos:', 'SINGLE', 61, @subfactor_c);
SET @q61 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q61, 'Verdadero', 2, 1),
(@q61, 'No estoy seguro', 1, 2),
(@q61, 'Falso', 0, 3);

-- Pregunta 62: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Tengo algunas características en las que que me siento claramente superior a la mayor parte de la gente:', 'SINGLE', 62, @subfactor_e);
SET @q62 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q62, 'Si', 2, 1),
(@q62, 'No estoy seguro', 1, 2),
(@q62, 'No', 0, 3);

-- Pregunta 63: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Sólo asisto a actos sociales cuando estoy obligado, y me mantengo aparte en las demás ocasiones:', 'SINGLE', 63, @subfactor_a);
SET @q63 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q63, 'Sí', 0, 1),
(@q63, 'No estoy seguro', 1, 2),
(@q63, 'No', 2, 3);

-- Pregunta 64: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Es mejor ser cauto y esperar poco que optimista y esperar siempre el éxito:', 'SINGLE', 64, @subfactor_c);
SET @q64 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q64, 'Verdadero', 0, 1),
(@q64, 'No estoy seguro', 1, 2),
(@q64, 'Falso', 2, 3);

-- Pregunta 65: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Algunas veces la gente dice que soy descuidado, aunque me considera una persona agradable:', 'SINGLE', 65, @subfactor_q3);
SET @q65 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q65, 'Sí', 0, 1),
(@q65, 'Término medio', 1, 2),
(@q65, 'No', 2, 3);

-- Pregunta 66: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Suelo permanecer callado delante de personas mayores (con mucha más experiencia, edad o jerarquía):', 'SINGLE', 66, @subfactor_e);
SET @q66 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q66, 'Si', 0, 1),
(@q66, 'Término medio', 1, 2),
(@q66, 'No', 2, 3);

-- Pregunta 67: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Tengo un buen sentido de la orientación (sitúo fácilmente los puntos cardinales), cuando me encuentro en un lugar desconocido:', 'SINGLE', 67, NULL);
SET @q67 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q67, 'Si', 0, 1),
(@q67, 'Término medio', 1, 2),
(@q67, 'No', 2, 3);

-- Pregunta 68: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando leo en una revista un artículo tendencioso o injusto, me inclino más a olvidarlo que a replicar o "devolver el golpe":', 'SINGLE', 68, @subfactor_c);
SET @q68 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q68, 'Verdadero', 0, 1),
(@q68, 'No estoy seguro', 1, 2),
(@q68, 'Falso', 2, 3);

-- Pregunta 69: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En tareas de grupo, preferiría:', 'SINGLE', 69, @subfactor_m);
SET @q69 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q69, 'Intentar mejorar los preparativos', 2, 1),
(@q69, 'Término medio', 1, 2),
(@q69, 'Llevar las actas o registros y procurar que se cumplan las normas', 0, 3);

-- Pregunta 70: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gustaría más andar con personas corteses que con individuos rebeldes y toscos:', 'SINGLE', 70, @subfactor_i);
SET @q70 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q70, 'Si', 2, 1),
(@q70, 'Término medio', 1, 2),
(@q70, 'No', 0, 3);

-- Pregunta 71: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si mis conocidos me tratan mal o muestran que yo les disgusto:', 'SINGLE', 71, @subfactor_o);
SET @q71 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q71, 'No me importa nada', 0, 1),
(@q71, 'Término medio', 1, 2),
(@q71, 'Me siento abatido', 2, 3);

-- Pregunta 72: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siempre estoy alerta ante los intentos de propaganda en las cosas que leo:', 'SINGLE', 72, @subfactor_l);
SET @q72 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q72, 'Si', 2, 1),
(@q72, 'No estoy seguro', 1, 2),
(@q72, 'No', 0, 3);

-- Pregunta 73: Autosuficiencia (Q2)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gustaría más gozar de la vida tranquilamente y a mi modo que ser admirado por mis resultados:', 'SINGLE', 73, @subfactor_q2);
SET @q73 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q73, 'Verdadero', 2, 1),
(@q73, 'No estoy seguro', 1, 2),
(@q73, 'Falso', 0, 3);

-- Pregunta 74: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Para estar informado, prefiero:', 'SINGLE', 74, @subfactor_a);
SET @q74 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q74, 'Discutir los acontecimientos con la gente', 0, 1),
(@q74, 'Término medio', 1, 2),
(@q74, 'Apoyarme en las informaciones periodísticas de actualidad', 2, 3);

-- Pregunta 75: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me encuentro formado (maduro) para la mayor parte de las cosas:', 'SINGLE', 75, @subfactor_c);
SET @q75 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q75, 'Verdadero', 2, 1),
(@q75, 'No estoy seguro', 1, 2),
(@q75, 'Falso', 0, 3);

-- Pregunta 76: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me encuentro más abatido que ayudado por el tipo de crítica que la gente suele hacer:', 'SINGLE', 76, @subfactor_o);
SET @q76 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q76, 'A menudo', 2, 1),
(@q76, 'Ocasionalmente', 1, 2),
(@q76, 'Nunca', 0, 3);

-- Pregunta 77: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En las fiestas de cumpleaños:', 'SINGLE', 77, @subfactor_i);
SET @q77 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q77, 'Me gusta hacer regalos personales', 2, 1),
(@q77, 'No estoy seguro', 1, 2),
(@q77, 'Pienso que comprar regalos es un poco latoso', 0, 3);

-- Pregunta 78: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"AB" es a "dc" como "SR" es:', 'SINGLE', 78, NULL);
SET @q78 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q78, 'qp', 0, 1),
(@q78, 'pq', 1, 2),
(@q78, 'tu', 0, 3);

-- Pregunta 79: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Mejor" es a "pésimo" como "menor" es a:', 'SINGLE', 79, NULL);
SET @q79 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q79, 'Mayor', 0, 1),
(@q79, 'Óptimo', 0, 2),
(@q79, 'Máximo', 1, 3);

-- Pregunta 80: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Mis amigos me han fallado:', 'SINGLE', 80, @subfactor_a);
SET @q80 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q80, 'Muy rara vez', 2, 1),
(@q80, 'Ocasionalmente', 1, 2),
(@q80, 'Muchas veces', 0, 3);

-- Pregunta 81: Privacidad (N(-))
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando me siento abatido hago grandes esfuerzos por ocultar mis sentimientos a los demás:', 'SINGLE', 81, @subfactor_n_neg);
SET @q81 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q81, 'Verdadero', 0, 1),
(@q81, 'Término medio', 1, 2),
(@q81, 'Falso', 2, 3);

-- Pregunta 82: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Gasto gran parte de mi tiempo libre hablando con los amigos sobre situaciones sociales agradables vividas en el pasado:', 'SINGLE', 82, @subfactor_a);
SET @q82 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q82, 'Si', 2, 1),
(@q82, 'Término medio', 1, 2),
(@q82, 'No', 0, 3);

-- Pregunta 83: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Pensando en las dificultades de mi trabajo:', 'SINGLE', 83, @subfactor_q3);
SET @q83 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q83, 'Intento organizarme antes de que aparezcan', 2, 1),
(@q83, 'Término medio', 1, 2),
(@q83, 'Doy por supuesto que puedo dominarlas cuando vengan', 0, 3);

-- Pregunta 84: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me cuesta bastante hablar o dirigir la palabra a un grupo numeroso:', 'SINGLE', 84, @subfactor_h);
SET @q84 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q84, 'Si', 0, 1),
(@q84, 'Término medio', 1, 2),
(@q84, 'No', 2, 3);

-- Pregunta 85: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'He experimentado en varias situaciones sociales el llamado "nerviosismo del orador":', 'SINGLE', 85, @subfactor_h);
SET @q85 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q85, 'Muy frecuentemente', 0, 1),
(@q85, 'Ocasionalmente', 1, 2),
(@q85, 'Casi nunca', 2, 3);

-- Pregunta 86: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Prefiero leer:', 'SINGLE', 86, @subfactor_m);
SET @q86 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q86, 'Una narración realista de contiendas militares o políticas', 0, 1),
(@q86, 'No estoy seguro', 1, 2),
(@q86, 'Un novela imaginativa y delicada', 2, 3);

-- Pregunta 87: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando la gente autoritaria trata de dominarme, hago justamente lo contrario a lo que quiere:', 'SINGLE', 87, @subfactor_e);
SET @q87 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q87, 'si', 2, 1),
(@q87, 'Término medio', 1, 2),
(@q87, 'No', 0, 3);

-- Pregunta 88: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Suelo olvidar muchas cosas triviales y sin importancia, tales como los nombres de las calles y tiendas de la ciudad:', 'SINGLE', 88, @subfactor_q3);
SET @q88 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q88, 'Si', 2, 1),
(@q88, 'Término medio', 1, 2),
(@q88, 'No', 0, 3);

-- Pregunta 89: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gustaría la profesión de veterinario, ocupado con las enfermedades y curación de los animales:', 'SINGLE', 89, @subfactor_i);
SET @q89 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q89, 'Si', 0, 1),
(@q89, 'Término medio', 1, 2),
(@q89, 'No', 2, 3);

-- Pregunta 90: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me resulta embarazoso que me dediquen elogios o cumplidos:', 'SINGLE', 90, @subfactor_o);
SET @q90 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q90, 'Si', 2, 1),
(@q90, 'Término medio', 1, 2),
(@q90, 'No', 0, 3);

-- Pregunta 91: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siendo adolescente, cuando mi opinión era distinta a la de mis padres, normalmente:', 'SINGLE', 91, @subfactor_e);
SET @q91 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q91, 'Mantenía mi opinión', 2, 1),
(@q91, 'Término medio', 1, 2),
(@q91, 'Aceptaba su autoridad', 0, 3);

-- Pregunta 92: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta tomar parte activa en las tareas sociales, trabajos de comité, etc.:', 'SINGLE', 92, @subfactor_a);
SET @q92 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q92, 'Si', 0, 1),
(@q92, 'Término medio', 1, 2),
(@q92, 'No', 2, 3);

-- Pregunta 93: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Al llevar a cabo una tarea, no estoy satisfecho hasta que se ha considerado con toda atención el menor detalle:', 'SINGLE', 93, @subfactor_q3);
SET @q93 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q93, 'Verdadero', 2, 1),
(@q93, 'Término medio', 1, 2),
(@q93, 'Falso', 0, 3);

-- Pregunta 94: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Tengo ocasiones en que me es difícil alejar un sentimiento de compasión hacia mí mismo:', 'SINGLE', 94, @subfactor_o);
SET @q94 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q94, 'A menudo', 0, 1),
(@q94, 'Algunas veces', 1, 2),
(@q94, 'Nunca', 2, 3);

-- Pregunta 95: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siempre soy capaz de controlar perfectamente la expresión de mis sentimientos:', 'SINGLE', 95, @subfactor_q3);
SET @q95 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q95, 'Si', 0, 1),
(@q95, 'Término medio', 1, 2),
(@q95, 'No', 2, 3);

-- Pregunta 96: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Ante un nuevo invento utilitario, me gustaría:', 'SINGLE', 96, @subfactor_m);
SET @q96 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q96, 'Trabajar sobre él en el laboratorio', 0, 1),
(@q96, 'No estoy seguro', 1, 2),
(@q96, 'Venderlo a la gente', 2, 3);

-- Pregunta 97: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'La sigueinte serie de letras XOOOOXXOOOXXX continúa con el grupo:', 'SINGLE', 97, NULL);
SET @q97 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q97, 'OXXX', 0, 1),
(@q97, 'OOXX', 1, 2),
(@q97, 'XOOO', 0, 3);

-- Pregunta 98: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Algunas personas parecen ignorarme o evitarme, aunque no sé por qué:', 'SINGLE', 98, @subfactor_o);
SET @q98 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q98, 'Verdadero', 0, 1),
(@q98, 'No estoy seguro', 1, 2),
(@q98, 'Falso', 2, 3);

-- Pregunta 99: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'La gente me trata menos razonablemente de lo que merecen mis buenas intenciones:', 'SINGLE', 99, @subfactor_l);
SET @q99 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q99, 'A menudo', 0, 1),
(@q99, 'Ocasionalmente', 1, 2),
(@q99, 'Nunca', 2, 3);

-- Pregunta 100: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Aunque no sea en un grupo mixto de mujeres y hombres, me disgusta que se use un lenguaje obsceno:', 'SINGLE', 100, @subfactor_i);
SET @q100 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q100, 'Si', 0, 1),
(@q100, 'Término medio', 1, 2),
(@q100, 'No', 2, 3);

-- Pregunta 101: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta hacer cosas atrevidas y temerarias sólo por el placer de divertirme:', 'SINGLE', 101, @subfactor_h);
SET @q101 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q101, 'Si', 2, 1),
(@q101, 'Término medio', 1, 2),
(@q101, 'No', 0, 3);

-- Pregunta 102: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me resulta molesta la vista de una habitación muy sucia:', 'SINGLE', 102, @subfactor_g);
SET @q102 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q102, 'Si', 2, 1),
(@q102, 'Término medio', 1, 2),
(@q102, 'No', 0, 3);

-- Pregunta 103: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando estoy en un grupo pequeño, me agrada quedarme en un segundo término y dejar que otros lleven el peso de la conversación:', 'SINGLE', 103, @subfactor_a);
SET @q103 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q103, 'Si', 0, 1),
(@q103, 'Término medio', 1, 2),
(@q103, 'No', 2, 3);

-- Pregunta 104: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me resulta fácil mezclarme con la gente en una reunión social:', 'SINGLE', 104, @subfactor_a);
SET @q104 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q104, 'Verdadero', 2, 1),
(@q104, 'No estoy seguro', 1, 2),
(@q104, 'Falso', 0, 3);

-- Pregunta 105: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Sería más interesante ser:', 'SINGLE', 105, @subfactor_i);
SET @q105 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q105, 'Orientador vocacional para ayudar a los jóvenes en la búsqueda de su profesión', 2, 1),
(@q105, 'No estoy seguro', 1, 2),
(@q105, 'Directivo de una empresa industrial', 0, 3);

-- Pregunta 106: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Por regla general, mis jefes y mi familia me encuentran defectos sólo cuando realmente existen:', 'SINGLE', 106, @subfactor_l);
SET @q106 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q106, 'Verdadero', 0, 1),
(@q106, 'Término medio', 1, 2),
(@q106, 'Falso', 2, 3);

-- Pregunta 107: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me disgusta el modo con que algunas personas se fijan en otras en la calle o en las tiendas:', 'SINGLE', 107, @subfactor_l);
SET @q107 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q107, 'Si', 2, 1),
(@q107, 'Término medio', 1, 2),
(@q107, 'No', 0, 3);

-- Pregunta 108: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Como los alimentos con gusto y placer, aunque no siempre tan cuidadosa y educadamente como otras personas:', 'SINGLE', 108, @subfactor_g);
SET @q108 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q108, 'Verdadero', 0, 1),
(@q108, 'No estoy seguro', 1, 2),
(@q108, 'Falso', 2, 3);

-- Pregunta 109: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Temo algún castigo incluso cuando no he hecho nada malo:', 'SINGLE', 109, @subfactor_o);
SET @q109 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q109, 'A menudo', 2, 1),
(@q109, 'Ocasionalmente', 1, 2),
(@q109, 'Nunca', 0, 3);

-- Pregunta 110: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gustaría más tener un trabajo con:', 'SINGLE', 110, @subfactor_e);
SET @q110 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q110, 'Un determinado sueldo fijo', 0, 1),
(@q110, 'Término medio', 1, 2),
(@q110, 'Un sueldo más alto pero siempre que demuestre a los demás que lo merezco', 2, 3);

-- Pregunta 111: Apertura al cambio (Q1_AP)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me molesta que la gente piense que mi comportamiento es demasiado raro o fuera de lo corriente:', 'SINGLE', 111, @subfactor_q1_ap);
SET @q111 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q111, 'Mucho', 0, 1),
(@q111, 'Algo', 1, 2),
(@q111, 'Nada en absoluto', 2, 3);

-- Pregunta 112: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'A veces dejo que sentiemientos de envidia o celos influyan en mis acciones:', 'SINGLE', 112, @subfactor_o);
SET @q112 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q112, 'Si', 0, 1),
(@q112, 'Término medio', 1, 2),
(@q112, 'No', 2, 3);

-- Pregunta 113: Tensión (Q4)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En ocasiones, contrariedades muy pequeñas me irritan mucho:', 'SINGLE', 113, @subfactor_q4);
SET @q113 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q113, 'Si', 2, 1),
(@q113, 'Término medio', 1, 2),
(@q113, 'No', 0, 3);

-- Pregunta 114: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siempre duermo, nunca hablo en sueños ni me levanto sonámbulo:', 'SINGLE', 114, @subfactor_c);
SET @q114 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q114, 'Si', 0, 1),
(@q114, 'Término medio', 1, 2),
(@q114, 'No', 2, 3);

-- Pregunta 115: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me resultaría más interesante trabajar en una empresa:', 'SINGLE', 115, @subfactor_a);
SET @q115 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q115, 'Atendiento a los clientes', 2, 1),
(@q115, 'Término medio', 1, 2),
(@q115, 'Llevando la cuentas o los archivos', 0, 3);

-- Pregunta 116: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Azada" es a "Cavar" como "Cuchillo" es a:', 'SINGLE', 116, NULL);
SET @q116 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q116, 'Cortar', 1, 1),
(@q116, 'Afilar', 0, 2),
(@q116, 'Picar', 0, 3);

-- Pregunta 117: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando la gente no es razonable, yo normalmente:', 'SINGLE', 117, @subfactor_c);
SET @q117 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q117, 'Me quedo tan tranquilo', 2, 1),
(@q117, 'Término medio', 1, 2),
(@q117, 'La menosprecio', 0, 3);

-- Pregunta 118: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si los demás hablan en voz alta cuando estoy escuchando música:', 'SINGLE', 118, @subfactor_q3);
SET @q118 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q118, 'Puedo concentrarme en ella sin que me molesten', 2, 1),
(@q118, 'Término medio', 1, 2),
(@q118, 'Eso me impide disfrutar de ello y me incomoda', 0, 3);

-- Pregunta 119: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo que se me describe mejor como:', 'SINGLE', 119, @subfactor_f);
SET @q119 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q119, 'Comedido y reposado', 0, 1),
(@q119, 'Término medio', 1, 2),
(@q119, 'Enérgico', 2, 3);

-- Pregunta 120: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Preferiría vestirme con sencillez y corrección que con un estilo personal y llamativo:', 'SINGLE', 120, @subfactor_g);
SET @q120 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q120, 'Verdadero', 0, 1),
(@q120, 'No estoy seguro', 1, 2),
(@q120, 'Falso', 2, 3);

-- Pregunta 121: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me niego a admitir sugerencias bien intencionadas de los demás aunque sé que no debería hacerlo:', 'SINGLE', 121, @subfactor_e);
SET @q121 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q121, 'Algunas veces', 0, 1),
(@q121, 'Casi nunca', 1, 2),
(@q121, 'Nunca', 2, 3);

-- Pregunta 122: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando es necesario que alguien emplee un poco de diplomacia y persuasión para conseguir que la gente actúe, generalmente sólo me lo encargan a mí:', 'SINGLE', 122, @subfactor_a);
SET @q122 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q122, 'Si', 2, 1),
(@q122, 'Término medio', 1, 2),
(@q122, 'No', 0, 3);

-- Pregunta 123: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me considero a mí mismo como una persona muy abierta y sociable:', 'SINGLE', 123, @subfactor_a);
SET @q123 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q123, 'Si', 2, 1),
(@q123, 'Término medio', 1, 2),
(@q123, 'No', 0, 3);

-- Pregunta 124: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta la música:', 'SINGLE', 124, @subfactor_m);
SET @q124 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q124, 'Ligera, movida y animada', 0, 1),
(@q124, 'Término medio', 1, 2),
(@q124, 'Emotiva y sentimental', 2, 3);

-- Pregunta 125: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si estoy completamente seguro de que una persona es injusta o se comporta egoístamente, se lo digo, incluso si esto me causa problemas:', 'SINGLE', 125, @subfactor_e);
SET @q125 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q125, 'Si', 2, 1),
(@q125, 'Término medio', 1, 2),
(@q125, 'No', 0, 3);

-- Pregunta 126: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En un viaje largo, preferiría:', 'SINGLE', 126, @subfactor_m);
SET @q126 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q126, 'Leer algo profundo pero interesante', 2, 1),
(@q126, 'No estoy seguro', 1, 2),
(@q126, 'Pasando el tiempo charlando sobre cualquier cosa con un  compañero de viaje', 0, 3);

-- Pregunta 127: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En una situación que puede llegar a ser peligrosa, creo que es mejor alborotar o hablar alto, aún cuando se pierdan la calma y la cortesía:', 'SINGLE', 127, @subfactor_c);
SET @q127 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q127, 'Si', 0, 1),
(@q127, 'Término medio', 1, 2),
(@q127, 'No', 2, 3);

-- Pregunta 128: Crítico (Q1)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Es muy exagerada la idea de que la enfermedad proviene tanto de causas mentales como físicas:', 'SINGLE', 128, @subfactor_q1);
SET @q128 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q128, 'Si', 2, 1),
(@q128, 'Término medio', 1, 2),
(@q128, 'No', 0, 3);

-- Pregunta 129: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En cualquier gran ceremonia oficial debería mantenerse la pompa y el esplendor:', 'SINGLE', 129, @subfactor_g);
SET @q129 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q129, 'Si', 0, 1),
(@q129, 'Término medio', 1, 2),
(@q129, 'No', 2, 3);

-- Pregunta 130: Autosuficiencia (Q2)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando hay algo que hacer algo, me gustaría más trabajar:', 'SINGLE', 130, @subfactor_q2);
SET @q130 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q130, 'En equipo', 0, 1),
(@q130, 'No estoy seguro', 1, 2),
(@q130, 'Yo solo', 2, 3);

-- Pregunta 131: Sentido del deber (G)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo firmemente que "tal vez el jefe no tenga siempre la razón, pero siempre tiene la razón por ser el jefe":', 'SINGLE', 131, @subfactor_g);
SET @q131 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q131, 'Si', 2, 1),
(@q131, 'No estoy seguro', 1, 2),
(@q131, 'No', 0, 3);

-- Pregunta 132: Tensión (Q4)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Suelo enfadarme con las personas demasiado pronto:', 'SINGLE', 132, @subfactor_q4);
SET @q132 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q132, 'Si', 2, 1),
(@q132, 'Término medio', 1, 2),
(@q132, 'No', 0, 3);

-- Pregunta 133: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Siempre puedo cambiar viejos hábitos sin dificultad y sin volver a ellos:', 'SINGLE', 133, @subfactor_q3);
SET @q133 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q133, 'Si', 0, 1),
(@q133, 'Término medio', 1, 2),
(@q133, 'No', 2, 3);

-- Pregunta 134: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si el sueldo fuera el mismo, preferiría ser:', 'SINGLE', 134, @subfactor_i);
SET @q134 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q134, 'Abogado', 2, 1),
(@q134, 'No estoy seguro entre ambos', 1, 2),
(@q134, 'Navegante o piloto', 0, 3);

-- Pregunta 135: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Llama" es a "Calor" como "Rosa" es a:', 'SINGLE', 135, NULL);
SET @q135 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q135, 'Espina', 0, 1),
(@q135, 'Pétalo', 0, 2),
(@q135, 'Aroma', 1, 3);

-- Pregunta 136: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando se acerca el momento de algo que he planeado y he esperado, en ocasiones pierdo la ilusión por ello:', 'SINGLE', 136, @subfactor_c);
SET @q136 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q136, 'Verdadero', 0, 1),
(@q136, 'Término medio', 1, 2),
(@q136, 'Falso', 2, 3);

-- Pregunta 137: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Puedo trabajar cuidadosamente en la mayor parte de las cosas sin que me molesten las personas que hacen mucho ruido a mi alrededor:', 'SINGLE', 137, @subfactor_q3);
SET @q137 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q137, 'Si', 2, 1),
(@q137, 'Término medio', 1, 2),
(@q137, 'No', 0, 3);

-- Pregunta 138: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En ocasiones hablo a desconocidos sobre cosas que considero importantes, aunque no me pregunten sobre ellas:', 'SINGLE', 138, @subfactor_a);
SET @q138 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q138, 'Si', 2, 1),
(@q138, 'Término medio', 1, 2),
(@q138, 'No', 0, 3);

-- Pregunta 139: Extroversión (A)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me atrae más pasar una tarde ocupada en una tarea tranquila a la que tenga afición que estar en una reunión animada:', 'SINGLE', 139, @subfactor_a);
SET @q139 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q139, 'Verdadero', 0, 1),
(@q139, 'No estoy seguro', 1, 2),
(@q139, 'Falso', 2, 3);

-- Pregunta 140: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando debo decidir algo, tengo siempre presentes las reglas básicas de lo justo y lo injusto:', 'SINGLE', 140, @subfactor_i);
SET @q140 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q140, 'Si', 2, 1),
(@q140, 'Término medio', 1, 2),
(@q140, 'No', 0, 3);

-- Pregunta 141: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En el trato social:', 'SINGLE', 141, @subfactor_f);
SET @q141 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q141, 'Muestro mis emociones tal como las siento', 2, 1),
(@q141, 'Término medio', 1, 2),
(@q141, 'Guardo mis emociones para mis adentros', 0, 3);

-- Pregunta 142: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Admiro más la belleza de un poema que la de un arma de fuego bien construida:', 'SINGLE', 142, @subfactor_m);
SET @q142 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q142, 'Si', 2, 1),
(@q142, 'No estoy seguro', 1, 2),
(@q142, 'No', 0, 3);

-- Pregunta 143: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'A veces digo en broma disparates, sólo para sorprender a la gente y ver qué responden:', 'SINGLE', 143, @subfactor_f);
SET @q143 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q143, 'Si', 2, 1),
(@q143, 'Término medio', 1, 2),
(@q143, 'No', 0, 3);

-- Pregunta 144: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me agradaría ser un periodista que escribiera sobre teatro, conciertos, ópera, etc.:', 'SINGLE', 144, @subfactor_m);
SET @q144 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q144, 'Si', 2, 1),
(@q144, 'No estoy seguro', 1, 2),
(@q144, 'No', 0, 3);

-- Pregunta 145: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Nunca siento la necesidad de garabatear, dibujar o moverme cuando estoy sentado en una reunión:', 'SINGLE', 145, @subfactor_q3);
SET @q145 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q145, 'Verdadero', 2, 1),
(@q145, 'No estoy seguro', 1, 2),
(@q145, 'Falso', 0, 3);

-- Pregunta 146: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si alguien me dice algo que yo sé que no es cierto, suelo pensar:', 'SINGLE', 146, @subfactor_l);
SET @q146 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q146, '"Es un mentiroso"', 2, 1),
(@q146, 'Término medio', 1, 2),
(@q146, '"Evidentemente no está bien informado"', 0, 3);

-- Pregunta 147: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'La gente me considera con justicia una persona activa pero con éxito sólo mediano:', 'SINGLE', 147, @subfactor_e);
SET @q147 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q147, 'Si', 2, 1),
(@q147, 'No estoy seguro', 1, 2),
(@q147, 'No', 0, 3);

-- Pregunta 148: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si se suscitara una controversia violenta entre otras miembros de un grupo de discusión:', 'SINGLE', 148, @subfactor_e);
SET @q148 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q148, 'Me gustaría ver quién es el "ganador"', 2, 1),
(@q148, 'Término medio', 1, 2),
(@q148, 'Desearía que se suavizara de nuevo la situación', 0, 3);

-- Pregunta 149: Autosuficiencia (Q2)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta planear mis cosas solo, sin interrupciones y sugerencias de otros:', 'SINGLE', 149, @subfactor_q2);
SET @q149 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q149, 'Si', 2, 1),
(@q149, 'Término medio', 1, 2),
(@q149, 'No', 0, 3);

-- Pregunta 150: Apertura al cambio (Q1_AP)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta seguir mis propios caminos en vez de actuar según normas establecidas:', 'SINGLE', 150, @subfactor_q1_ap);
SET @q150 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q150, 'Verdadero', 0, 1),
(@q150, 'No estoy seguro', 1, 2),
(@q150, 'Falso', 2, 3);

-- Pregunta 151: Tensión (Q4)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me pongo nervioso (tenso) cuando pienso en todas las cosas que tengo que hacer:', 'SINGLE', 151, @subfactor_q4);
SET @q151 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q151, 'Si', 2, 1),
(@q151, 'Algunas veces', 1, 2),
(@q151, 'No', 0, 3);

-- Pregunta 152: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'No me perturba que la gente me haga alguna sugerencia cuando estoy jugando:', 'SINGLE', 152, @subfactor_c);
SET @q152 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q152, 'Verdadero', 0, 1),
(@q152, 'No estoy seguro', 1, 2),
(@q152, 'Falso', 2, 3);

-- Pregunta 153: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me parece más interesante ser:', 'SINGLE', 153, @subfactor_m);
SET @q153 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q153, 'Artista', 0, 1),
(@q153, 'No estoy seguro', 1, 2),
(@q153, 'Secretario de un club social', 2, 3);

-- Pregunta 154: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '¿Cuál de las siguientes palabras es diferente de las otras dos?:', 'SINGLE', 154, NULL);
SET @q154 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q154, 'Ancho', 1, 1),
(@q154, 'Zigzag', 0, 2),
(@q154, 'Recto', 0, 3);

-- Pregunta 155: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'He tenido sueños tan intensos que no me han dejado dormir bien:', 'SINGLE', 155, @subfactor_o);
SET @q155 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q155, 'A menudo', 0, 1),
(@q155, 'Ocasionalmente', 1, 2),
(@q155, 'Prácticamente nunca', 2, 3);

-- Pregunta 156: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Aunque tenga pocas posibilidades de éxito, creo que todavía me merece la pena correr el riesgo:', 'SINGLE', 156, @subfactor_h);
SET @q156 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q156, 'Si', 2, 1),
(@q156, 'Término medio', 1, 2),
(@q156, 'No', 0, 3);

-- Pregunta 157: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Cuando yo sé muy bien lo que el grupo tiene que hacer, me gusta ser el único en dar las órdenes:', 'SINGLE', 157, @subfactor_e);
SET @q157 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q157, 'Si', 2, 1),
(@q157, 'Término medio', 1, 2),
(@q157, 'No', 0, 3);

-- Pregunta 158: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me consideran una persona muy entusiasta:', 'SINGLE', 158, @subfactor_f);
SET @q158 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q158, 'Si', 2, 1),
(@q158, 'Término medio', 1, 2),
(@q158, 'No', 0, 3);

-- Pregunta 159: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Soy una persona bastante estricta, e insisto siempre en hacer las cosas tan correctamente como sea posible:', 'SINGLE', 159, @subfactor_q3);
SET @q159 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q159, 'Verdadero', 2, 1),
(@q159, 'Término medio', 1, 2),
(@q159, 'Falso', 0, 3);

-- Pregunta 160: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me disgusta un poco que la gente me esté mirando cuando trabajo:', 'SINGLE', 160, @subfactor_h);
SET @q160 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q160, 'Si', 0, 1),
(@q160, 'Término medio', 1, 2),
(@q160, 'No', 2, 3);

-- Pregunta 161: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Como no siempre es posible conseguir las cosas utilizando gradualmente métodos razonables, a veces es necesario emplear la fuerza:', 'SINGLE', 161, @subfactor_e);
SET @q161 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q161, 'Verdadero', 0, 1),
(@q161, 'Término medio', 1, 2),
(@q161, 'Falso', 2, 3);

-- Pregunta 162: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si se pasa por alto una buena observación mía:', 'SINGLE', 162, @subfactor_e);
SET @q162 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q162, 'La dejo pasar', 0, 1),
(@q162, 'Término medio', 1, 2),
(@q162, 'Doy a la gente la oportunidad de volver a escucharla', 2, 3);

-- Pregunta 163: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gustaría hacer el trabajo de un oficial encargado de los casos de delincuentes bajo fianza:', 'SINGLE', 163, @subfactor_i);
SET @q163 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q163, 'Si', 2, 1),
(@q163, 'Término medio', 1, 2),
(@q163, 'No', 0, 3);

-- Pregunta 164: Vigilancia (L)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Hay que ser prudente antes de mezclarse con cualquier desconocido, puesto que hay peligros de infección y de otro tipo:', 'SINGLE', 164, @subfactor_l);
SET @q164 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q164, 'Si', 0, 1),
(@q164, 'No estoy seguro', 1, 2),
(@q164, 'No', 2, 3);

-- Pregunta 165: Autosuficiencia (Q2)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En un viaje al extranjero, preferiría ir en un grupo organizado, con un experto, que planear yo mismo los lugares que deseo visitar:', 'SINGLE', 165, @subfactor_q2);
SET @q165 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q165, 'Si', 2, 1),
(@q165, 'No estoy seguro', 1, 2),
(@q165, 'No', 0, 3);

-- Pregunta 166: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si la gente se aprovecha de mi amistad, no me quedo resentido y lo olvido pronto:', 'SINGLE', 166, @subfactor_c);
SET @q166 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q166, 'Verdadero', 0, 1),
(@q166, 'Término medio', 1, 2),
(@q166, 'Falso', 2, 3);

-- Pregunta 167: Apertura al cambio (Q1_AP)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo que la sociedad debería aceptar nuevas costumbres, de acuerdo con la razón, y olvidar los viejos usos y tradiciones:', 'SINGLE', 167, @subfactor_q1_ap);
SET @q167 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q167, 'Si', 2, 1),
(@q167, 'Término medio', 1, 2),
(@q167, 'No', 0, 3);

-- Pregunta 168: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Aprendo mejor:', 'SINGLE', 168, @subfactor_m);
SET @q168 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q168, 'Leyendo un libro bien escrito', 2, 1),
(@q168, 'Término medio', 1, 2),
(@q168, 'Participando en un grupo de discusión', 0, 3);

-- Pregunta 169: Privacidad (N(-))
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta esperar a estar seguro de que lo que voy a decir es correcto, antes de exponer mis ideas:', 'SINGLE', 169, @subfactor_n_neg);
SET @q169 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q169, 'Siempre', 2, 1),
(@q169, 'Generalmente', 1, 2),
(@q169, 'Sólo si es posible', 0, 3);

-- Pregunta 170: Tensión (Q4)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Algunas veces me "sacan de quicio" de un modo insoportable pequeñas cosas, aunque reconozca que son triviales:', 'SINGLE', 170, @subfactor_q4);
SET @q170 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q170, 'Si', 2, 1),
(@q170, 'Término medio', 1, 2),
(@q170, 'No', 0, 3);

-- Pregunta 171: Privacidad (N(-))
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'No suelo decir, sin pensarlas, cosas que luego lamento mucho:', 'SINGLE', 171, @subfactor_n_neg);
SET @q171 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q171, 'Verdadero', 0, 1),
(@q171, 'No estoy seguro', 1, 2),
(@q171, 'Falso', 2, 3);

-- Pregunta 172: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si se me pidiera colaborar en una campaña caritativa:', 'SINGLE', 172, @subfactor_i);
SET @q172 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q172, 'Aceptaría', 2, 1),
(@q172, 'No estoy seguro', 1, 2),
(@q172, 'Diría cortésmente que estoy muy ocupado', 0, 3);

-- Pregunta 173: Razonamiento (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, '"Pronto" es a "nunca" como "cerca" es a:', 'SINGLE', 173, NULL);
SET @q173 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q173, 'En ningún sitio', 1, 1),
(@q173, 'Lejos', 0, 2),
(@q173, 'En otro sitio', 0, 3);

-- Pregunta 174: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Si cometo una falta social desagradable, puedo olvidarla pronto:', 'SINGLE', 174, @subfactor_c);
SET @q174 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q174, 'Si', 2, 1),
(@q174, 'No estoy seguro', 1, 2),
(@q174, 'No', 0, 3);

-- Pregunta 175: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Se me considera un "hombre de ideas" que casi siempre puede apuntar alguna solución a un problema:', 'SINGLE', 175, @subfactor_m);
SET @q175 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q175, 'Si', 2, 1),
(@q175, 'Término medio', 1, 2),
(@q175, 'No', 0, 3);

-- Pregunta 176: Dominancia (E)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo que se me da mejor mostrar:', 'SINGLE', 176, @subfactor_e);
SET @q176 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q176, 'Aplomo en las pugnas y discusiones de una reunión', 2, 1),
(@q176, 'No estoy seguro', 1, 2),
(@q176, 'Tolerancia con los deseos de los demás', 0, 3);

-- Pregunta 177: Emprendimiento (H)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta un trabajo que presente cambios, variedad y viajes, aunque implique algún peligro:', 'SINGLE', 177, @subfactor_h);
SET @q177 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q177, 'Si', 2, 1),
(@q177, 'Término medio', 1, 2),
(@q177, 'No', 0, 3);

-- Pregunta 178: Control de emociones (Q3)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Me gusta un trabajo que requiera dotes de atención y exactitud:', 'SINGLE', 178, @subfactor_q3);
SET @q178 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q178, 'Si', 2, 1),
(@q178, 'Término medio', 1, 2),
(@q178, 'No', 0, 3);

-- Pregunta 179: Animación (F)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Soy de ese tipo de personas con tanta energía que siempre están ocupadas:', 'SINGLE', 179, @subfactor_f);
SET @q179 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q179, 'Si', 2, 1),
(@q179, 'No estoy seguro', 1, 2),
(@q179, 'No', 0, 3);

-- Pregunta 180: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En mi época de estudiante prefería (prefiero):', 'SINGLE', 180, @subfactor_m);
SET @q180 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q180, 'Lengua o Literatura', 2, 1),
(@q180, 'No estoy seguro', 1, 2),
(@q180, 'Matemáticas o Aritmética', 0, 3);

-- Pregunta 181: Aprehensión (O)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Algunas veces me ha turbado el que la gente diga a mi espalda cosas desagradables de mí sin fundamento:', 'SINGLE', 181, @subfactor_o);
SET @q181 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q181, 'Si', 2, 1),
(@q181, 'No estoy seguro', 1, 2),
(@q181, 'No', 0, 3);

-- Pregunta 182: Creatividad (M)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Hablar con personas corrientes, convencionales y rutinarias:', 'SINGLE', 182, @subfactor_m);
SET @q182 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q182, 'Es a menudo muy interesante e instructivo', 0, 1),
(@q182, 'Término medio', 1, 2),
(@q182, 'Me fastidia porque no hay profundidad o se trata de chismes y cosas sin importancia', 2, 3);

-- Pregunta 183: Tensión (Q4)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Algunas cosas me irritan tanto que creo que entonces lo mejor es no hablar:', 'SINGLE', 183, @subfactor_q4);
SET @q183 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q183, 'Si', 0, 1),
(@q183, 'Término medio', 1, 2),
(@q183, 'No', 2, 3);

-- Pregunta 184: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'En la formación del niño, es más importante:', 'SINGLE', 184, @subfactor_i);
SET @q184 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q184, 'Darle bastante efecto', 2, 1),
(@q184, 'Término medio', 1, 2),
(@q184, 'Procurar que aprenda hábitos y actitudes deseables', 0, 3);

-- Pregunta 185: Estabilidad (C)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Los demás me consideran una persona firme e impreturbable, impasible ante los vaivenes de las circunstancias:', 'SINGLE', 185, @subfactor_c);
SET @q185 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q185, 'Si', 0, 1),
(@q185, 'Término medio', 1, 2),
(@q185, 'No', 2, 3);

-- Pregunta 186: Idealismo (I)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo que en el mundo actual es más importante resolver:', 'SINGLE', 186, @subfactor_i);
SET @q186 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q186, 'El problema de la intención moral', 0, 1),
(@q186, 'No estoy seguro', 1, 2),
(@q186, 'Los problemas políticos', 2, 3);

-- Pregunta 187: Control (sin subfactor)
INSERT INTO questions (test_id, text, type, position, subfactor_id) VALUES
(@test_16pf_id, 'Creo que no me he saltado ninguna cuestión y he contestado a todas de modo apropiado:', 'SINGLE', 187, NULL);
SET @q187 = LAST_INSERT_ID();
INSERT INTO answers (question_id, text, value, position) VALUES
(@q187, 'Si', 0, 1),
(@q187, 'No estoy seguro', 0, 2),
(@q187, 'No', 0, 3);

