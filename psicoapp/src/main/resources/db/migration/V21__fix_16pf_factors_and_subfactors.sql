-- V21: Corregir factores y subfactores del test 16PF
-- Esta migración asegura que el test 16PF tenga todos los factores y subfactores necesarios

SET @test_16pf_id = (SELECT id FROM tests WHERE code = '16PF' LIMIT 1);

-- Si el test 16PF no existe, no hacer nada
-- Si existe, crear los factores si no existen
INSERT INTO factors (test_id, code, name, description, position)
SELECT @test_16pf_id, 'sociales', 'Competencias sociales', 'Competencias relacionadas con la interacción social', 1
WHERE @test_16pf_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM factors WHERE test_id = @test_16pf_id AND code = 'sociales');

INSERT INTO factors (test_id, code, name, description, position)
SELECT @test_16pf_id, 'autonomia', 'Competencias de autonomía e independencia', 'Competencias relacionadas con la autonomía e independencia', 2
WHERE @test_16pf_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM factors WHERE test_id = @test_16pf_id AND code = 'autonomia');

INSERT INTO factors (test_id, code, name, description, position)
SELECT @test_16pf_id, 'apertura', 'Competencias de apertura y adaptación', 'Competencias relacionadas con la apertura y adaptación', 3
WHERE @test_16pf_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM factors WHERE test_id = @test_16pf_id AND code = 'apertura');

INSERT INTO factors (test_id, code, name, description, position)
SELECT @test_16pf_id, 'autocontrol', 'Competencias de autocontrol', 'Competencias relacionadas con el autocontrol', 4
WHERE @test_16pf_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM factors WHERE test_id = @test_16pf_id AND code = 'autocontrol');

INSERT INTO factors (test_id, code, name, description, position)
SELECT @test_16pf_id, 'ansiedad', 'Competencias de gestión de la ansiedad', 'Competencias relacionadas con la gestión de la ansiedad', 5
WHERE @test_16pf_id IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM factors WHERE test_id = @test_16pf_id AND code = 'ansiedad');

-- Obtener IDs de los factores del test 16PF
SET @factor_sociales_16pf = (SELECT id FROM factors WHERE code = 'sociales' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_autonomia_16pf = (SELECT id FROM factors WHERE code = 'autonomia' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_apertura_16pf = (SELECT id FROM factors WHERE code = 'apertura' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_autocontrol_16pf = (SELECT id FROM factors WHERE code = 'autocontrol' AND test_id = @test_16pf_id LIMIT 1);
SET @factor_ansiedad_16pf = (SELECT id FROM factors WHERE code = 'ansiedad' AND test_id = @test_16pf_id LIMIT 1);

-- Crear subfactores para Competencias sociales
INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'A', 'Extroversión', 'Cercanía afectiva, trato cordial e interés genuino por las personas.', @factor_sociales_16pf, 1
WHERE @test_16pf_id IS NOT NULL AND @factor_sociales_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'A');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'F', 'Animación', 'Energía visible, expresividad en la interacción, tono vital alto.', @factor_sociales_16pf, 2
WHERE @test_16pf_id IS NOT NULL AND @factor_sociales_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'F');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'N(-)', 'Espontaneidad / Privacidad–Astucia', 'Filtra y dosifica lo que muestra; gestiona su imagen y lee subtextos.', @factor_sociales_16pf, 3
WHERE @test_16pf_id IS NOT NULL AND @factor_sociales_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'N(-)');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'Q2(-)', 'Participación grupal', 'Preferencia por actuar solo; baja orientación grupal.', @factor_sociales_16pf, 4
WHERE @test_16pf_id IS NOT NULL AND @factor_sociales_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'Q2(-)');

-- Crear subfactores para Competencias de autonomía e independencia
INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'E', 'Dominancia', 'Asumir control e influir en interacciones.', @factor_autonomia_16pf, 1
WHERE @test_16pf_id IS NOT NULL AND @factor_autonomia_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'E');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'H', 'Emprendimiento', 'Atrevimiento y desenvoltura ante exposición social y situaciones nuevas.', @factor_autonomia_16pf, 2
WHERE @test_16pf_id IS NOT NULL AND @factor_autonomia_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'H');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'Q2', 'Autosuficiencia', 'Baja dependencia del grupo; autonomía para avanzar y decidir.', @factor_autonomia_16pf, 3
WHERE @test_16pf_id IS NOT NULL AND @factor_autonomia_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'Q2');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'Q1', 'Crítico', 'Actitud analítica; revisa creencias y adopta cambios con evidencia.', @factor_autonomia_16pf, 4
WHERE @test_16pf_id IS NOT NULL AND @factor_autonomia_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'Q1');

-- Crear subfactores para Competencias de apertura y adaptación
INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'I', 'Idealismo', 'Sensibilidad y orientación a principios éticos y armonía.', @factor_apertura_16pf, 1
WHERE @test_16pf_id IS NOT NULL AND @factor_apertura_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'I');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'M', 'Creatividad', 'Pensamiento imaginativo y asociativo; generación de ideas nuevas.', @factor_apertura_16pf, 2
WHERE @test_16pf_id IS NOT NULL AND @factor_apertura_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'M');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'Q1_AP', 'Apertura al cambio', 'Flexibilidad ante nuevas ideas y experiencias.', @factor_apertura_16pf, 3
WHERE @test_16pf_id IS NOT NULL AND @factor_apertura_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'Q1_AP');

-- Crear subfactores para Competencias de autocontrol
INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'G', 'Sentido del deber', 'Responsabilidad, adherencia a normas y estándares.', @factor_autocontrol_16pf, 1
WHERE @test_16pf_id IS NOT NULL AND @factor_autocontrol_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'G');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'Q3', 'Control de emociones', 'Perfeccionismo, organización y autorregulación emocional.', @factor_autocontrol_16pf, 2
WHERE @test_16pf_id IS NOT NULL AND @factor_autocontrol_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'Q3');

-- Crear subfactores para Competencias de gestión de la ansiedad
INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'C', 'Estabilidad', 'Calma, equilibrio emocional y recuperación ante el estrés.', @factor_ansiedad_16pf, 1
WHERE @test_16pf_id IS NOT NULL AND @factor_ansiedad_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'C');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'O', 'Aprehensión', 'Autocrítica, auto-duda y tendencia a la culpabilidad.', @factor_ansiedad_16pf, 2
WHERE @test_16pf_id IS NOT NULL AND @factor_ansiedad_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'O');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'L', 'Vigilancia', 'Cautela, expectativa de segundas intenciones.', @factor_ansiedad_16pf, 3
WHERE @test_16pf_id IS NOT NULL AND @factor_ansiedad_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'L');

INSERT INTO subfactors (test_id, code, name, description, factor_id, position)
SELECT @test_16pf_id, 'Q4', 'Tensión', 'Activación interna, impaciencia e irritabilidad ante contratiempos.', @factor_ansiedad_16pf, 4
WHERE @test_16pf_id IS NOT NULL AND @factor_ansiedad_16pf IS NOT NULL
AND NOT EXISTS (SELECT 1 FROM subfactors WHERE test_id = @test_16pf_id AND code = 'Q4');

