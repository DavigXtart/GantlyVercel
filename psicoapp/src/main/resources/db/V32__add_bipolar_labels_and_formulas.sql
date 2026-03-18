-- V32: Add bipolar labels and formula support to factors/subfactors
--
-- Delphos architecture mapping:
--   Delphos "Factores" (A, B, C...) → Gantly "Subfactors" (primary scoring units)
--   Delphos "Rasgos" (calculated traits) → Gantly "Factors" (higher-level aggregations)
--
-- New fields:
--   subfactors.min_label / max_label → Bipolar pole descriptions (e.g., "Reservado" / "Abierto")
--   factors.min_label / max_label   → Bipolar pole descriptions for aggregated traits
--   factors.formula                 → Expression to calculate from subfactor codes (e.g., "A+F+H-N+Q2")
--   factors.calculated              → Whether this factor uses a formula vs. simple sum of child subfactors

-- 1) Add columns to subfactors
ALTER TABLE subfactors ADD COLUMN min_label VARCHAR(100) NULL;
ALTER TABLE subfactors ADD COLUMN max_label VARCHAR(100) NULL;

-- 2) Add columns to factors
ALTER TABLE factors ADD COLUMN min_label VARCHAR(100) NULL;
ALTER TABLE factors ADD COLUMN max_label VARCHAR(100) NULL;
ALTER TABLE factors ADD COLUMN formula VARCHAR(500) NULL;
ALTER TABLE factors ADD COLUMN calculated BOOLEAN NOT NULL DEFAULT FALSE;

-- 3) Seed 16PF bipolar labels for subfactors (test_id = 28)
--    Based on standard 16PF factor descriptions from Cattell / TEA Ediciones

-- Subfactor A: Extroversión
UPDATE subfactors SET min_label = 'Reservado', max_label = 'Abierto'
WHERE test_id = 28 AND code = 'A';

-- Subfactor F: Animación
UPDATE subfactors SET min_label = 'Sobrio', max_label = 'Entusiasta'
WHERE test_id = 28 AND code = 'F';

-- Subfactor N(-): Espontaneidad
UPDATE subfactors SET min_label = 'Espontáneo', max_label = 'Calculador'
WHERE test_id = 28 AND code = 'N(-)';

-- Subfactor Q2(-): Participación grupal
UPDATE subfactors SET min_label = 'Dependiente del grupo', max_label = 'Autosuficiente'
WHERE test_id = 28 AND code = 'Q2(-)';

-- Subfactor E: Dominancia
UPDATE subfactors SET min_label = 'Sumiso', max_label = 'Dominante'
WHERE test_id = 28 AND code = 'E';

-- Subfactor H: Emprendimiento
UPDATE subfactors SET min_label = 'Tímido', max_label = 'Atrevido'
WHERE test_id = 28 AND code = 'H';

-- Subfactor Q2: Autosuficiencia
UPDATE subfactors SET min_label = 'Dependiente', max_label = 'Autosuficiente'
WHERE test_id = 28 AND code = 'Q2';

-- Subfactor Q1: Crítico
UPDATE subfactors SET min_label = 'Conservador', max_label = 'Innovador'
WHERE test_id = 28 AND code = 'Q1';

-- Subfactor I: Idealismo
UPDATE subfactors SET min_label = 'Objetivo/Duro', max_label = 'Sensible/Idealista'
WHERE test_id = 28 AND code = 'I';

-- Subfactor M: Creatividad
UPDATE subfactors SET min_label = 'Práctico', max_label = 'Imaginativo'
WHERE test_id = 28 AND code = 'M';

-- Subfactor Q1_AP: Apertura al cambio
UPDATE subfactors SET min_label = 'Tradicional', max_label = 'Abierto al cambio'
WHERE test_id = 28 AND code = 'Q1_AP';

-- Subfactor G: Sentido del deber
UPDATE subfactors SET min_label = 'Inconformista', max_label = 'Cumplidor'
WHERE test_id = 28 AND code = 'G';

-- Subfactor Q3: Control de emociones
UPDATE subfactors SET min_label = 'Flexible/Desordenado', max_label = 'Controlado/Perfeccionista'
WHERE test_id = 28 AND code = 'Q3';

-- Subfactor C: Estabilidad
UPDATE subfactors SET min_label = 'Emocionalmente reactivo', max_label = 'Estable'
WHERE test_id = 28 AND code = 'C';

-- Subfactor O: Aprehensión
UPDATE subfactors SET min_label = 'Seguro de sí', max_label = 'Aprensivo'
WHERE test_id = 28 AND code = 'O';

-- Subfactor L: Vigilancia
UPDATE subfactors SET min_label = 'Confiado', max_label = 'Vigilante'
WHERE test_id = 28 AND code = 'L';

-- Subfactor Q4: Tensión
UPDATE subfactors SET min_label = 'Relajado', max_label = 'Tenso'
WHERE test_id = 28 AND code = 'Q4';

-- 4) Set factor bipolar labels and formulas for 16PF second-order factors (test_id = 28)
--    These are the 5 global factors that aggregate the 17 subfactors

-- Factor 1: Competencias sociales (Extraversión)
UPDATE factors SET
    min_label = 'Introvertido',
    max_label = 'Extravertido',
    formula = 'A+F+H+Q2(-)',
    calculated = FALSE
WHERE test_id = 28 AND code = 'sociales';

-- Factor 2: Competencias de autonomía e independencia
UPDATE factors SET
    min_label = 'Acomodaticio',
    max_label = 'Independiente',
    formula = 'E+H+Q2+Q1',
    calculated = FALSE
WHERE test_id = 28 AND code = 'autonomia';

-- Factor 3: Competencias de apertura y adaptación
UPDATE factors SET
    min_label = 'Duro/Rígido',
    max_label = 'Receptivo/Flexible',
    formula = 'I+M+Q1_AP',
    calculated = FALSE
WHERE test_id = 28 AND code = 'apertura';

-- Factor 4: Competencias de autocontrol
UPDATE factors SET
    min_label = 'Desinhibido',
    max_label = 'Autocontrolado',
    formula = 'G+Q3',
    calculated = FALSE
WHERE test_id = 28 AND code = 'autocontrol';

-- Factor 5: Competencias de gestión de la ansiedad
UPDATE factors SET
    min_label = 'Imperturbable',
    max_label = 'Ansioso',
    formula = 'C+O+L+Q4',
    calculated = FALSE
WHERE test_id = 28 AND code = 'ansiedad';
