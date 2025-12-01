-- V14: Actualizar textos de respuestas Likert (preguntas 4-7) a formato descriptivo
-- Si las respuestas ya tienen los textos correctos, esta migración no hará cambios

SET @matching_test_id = (SELECT id FROM tests WHERE code = 'INITIAL' LIMIT 1);

-- Actualizar respuestas de la pregunta 4: "Me cuesta abrirme con personas nuevas."
UPDATE answers a
INNER JOIN questions q ON a.question_id = q.id
SET a.text = CASE a.position
    WHEN 1 THEN 'Muy en desacuerdo'
    WHEN 2 THEN 'Algo en desacuerdo'
    WHEN 3 THEN 'Ni de acuerdo ni en desacuerdo'
    WHEN 4 THEN 'Algo de acuerdo'
    WHEN 5 THEN 'Muy de acuerdo'
    ELSE a.text
END
WHERE q.test_id = @matching_test_id 
  AND q.position = 4
  AND a.position BETWEEN 1 AND 5;

-- Actualizar respuestas de la pregunta 5: "Prefiero que me den pautas claras y estructuradas."
UPDATE answers a
INNER JOIN questions q ON a.question_id = q.id
SET a.text = CASE a.position
    WHEN 1 THEN 'Muy en desacuerdo'
    WHEN 2 THEN 'Algo en desacuerdo'
    WHEN 3 THEN 'Ni de acuerdo ni en desacuerdo'
    WHEN 4 THEN 'Algo de acuerdo'
    WHEN 5 THEN 'Muy de acuerdo'
    ELSE a.text
END
WHERE q.test_id = @matching_test_id 
  AND q.position = 5
  AND a.position BETWEEN 1 AND 5;

-- Actualizar respuestas de la pregunta 6: "Me ayuda más alguien que escuche sin juzgar..."
UPDATE answers a
INNER JOIN questions q ON a.question_id = q.id
SET a.text = CASE a.position
    WHEN 1 THEN 'Muy en desacuerdo'
    WHEN 2 THEN 'Algo en desacuerdo'
    WHEN 3 THEN 'Ni de acuerdo ni en desacuerdo'
    WHEN 4 THEN 'Algo de acuerdo'
    WHEN 5 THEN 'Muy de acuerdo'
    ELSE a.text
END
WHERE q.test_id = @matching_test_id 
  AND q.position = 6
  AND a.position BETWEEN 1 AND 5;

-- Actualizar respuestas de la pregunta 7: "Cuando tengo un problema, quiero soluciones prácticas..."
UPDATE answers a
INNER JOIN questions q ON a.question_id = q.id
SET a.text = CASE a.position
    WHEN 1 THEN 'Muy en desacuerdo'
    WHEN 2 THEN 'Algo en desacuerdo'
    WHEN 3 THEN 'Ni de acuerdo ni en desacuerdo'
    WHEN 4 THEN 'Algo de acuerdo'
    WHEN 5 THEN 'Muy de acuerdo'
    ELSE a.text
END
WHERE q.test_id = @matching_test_id 
  AND q.position = 7
  AND a.position BETWEEN 1 AND 5;

