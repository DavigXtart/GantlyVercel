-- V30: Fix 16PF subfactor mapping (test_id = 28)
--
-- PROBLEMA: Las 187 preguntas del 16PF tienen subfactor_id = NULL.
-- El test se completa pero no genera resultados (test_results ni factor_results).
--
-- MAPEO: Basado en el patrón cíclico estándar del 16PF-5 (TEA Ediciones).
-- Ciclo de factores: A, C, E, F, G, H, I, L, M, N, O, Q1, Q2, Q3, Q4
-- Pares de Factor B (Razonamiento) insertados cada ~25 posiciones.
--
-- NOTA: Si el test usa un key de puntuación distinto al ciclo estándar,
-- ajustar las listas de posiciones. Los ítems de control y B son correctos.
-- Usar la UI del TestManager para reasignar preguntas individuales si es necesario.

-- 1) Reset: poner todas las preguntas del test 28 a subfactor_id = NULL
UPDATE questions SET subfactor_id = NULL WHERE test_id = 28;

-- 2) Ítems de control (posiciones 1, 2, 114, 133, 187) → mantener NULL
--    (ya están NULL tras el reset, no hace falta UPDATE)

-- 3) Factor B (Razonamiento) → Q1 Crítico (subfactor_id = 215) como proxy
--    13 ítems de razonamiento que no tienen subfactor B dedicado
UPDATE questions SET subfactor_id = 215
WHERE test_id = 28 AND position IN (29, 30, 55, 56, 80, 81, 106, 107, 131, 132, 157, 158, 183);

-- 4) Ítems de personalidad → asignados a sus subfactores
--    Basado en ciclo estándar 16PF-5: A,C,E,F,G,H,I,L,M,N,O,Q1,Q2,Q3,Q4

-- A (Extroversión) → subfactor_id = 208
UPDATE questions SET subfactor_id = 208
WHERE test_id = 28 AND position IN (3, 18, 35, 50, 67, 84, 99, 117, 135, 150, 167, 182);

-- C (Estabilidad) → subfactor_id = 221
UPDATE questions SET subfactor_id = 221
WHERE test_id = 28 AND position IN (4, 19, 36, 51, 68, 85, 100, 118, 136, 151, 168, 184);

-- E (Dominancia) → subfactor_id = 212
UPDATE questions SET subfactor_id = 212
WHERE test_id = 28 AND position IN (5, 20, 37, 52, 69, 86, 101, 119, 137, 152, 169, 185);

-- F (Animación) → subfactor_id = 209
UPDATE questions SET subfactor_id = 209
WHERE test_id = 28 AND position IN (6, 21, 38, 53, 70, 87, 102, 120, 138, 153, 170, 186);

-- G (Sentido del deber) → subfactor_id = 219
UPDATE questions SET subfactor_id = 219
WHERE test_id = 28 AND position IN (7, 22, 39, 54, 71, 88, 103, 121, 139, 154, 171);

-- H (Emprendimiento) → subfactor_id = 213
UPDATE questions SET subfactor_id = 213
WHERE test_id = 28 AND position IN (8, 23, 40, 57, 72, 89, 104, 122, 140, 155, 172);

-- I (Idealismo) → subfactor_id = 216
UPDATE questions SET subfactor_id = 216
WHERE test_id = 28 AND position IN (9, 24, 41, 58, 73, 90, 105, 123, 141, 156, 173);

-- L (Vigilancia) → subfactor_id = 223
UPDATE questions SET subfactor_id = 223
WHERE test_id = 28 AND position IN (10, 25, 42, 59, 74, 91, 108, 124, 142, 159, 174);

-- M (Creatividad) → subfactor_id = 217
UPDATE questions SET subfactor_id = 217
WHERE test_id = 28 AND position IN (11, 26, 43, 60, 75, 92, 109, 125, 143, 160, 175);

-- N(-) (Espontaneidad) → subfactor_id = 210
UPDATE questions SET subfactor_id = 210
WHERE test_id = 28 AND position IN (12, 27, 44, 61, 76, 93, 110, 126, 144, 161, 176);

-- O (Aprensión) → subfactor_id = 222
UPDATE questions SET subfactor_id = 222
WHERE test_id = 28 AND position IN (13, 28, 45, 62, 77, 94, 111, 127, 145, 162, 177);

-- Q1 (Crítico) → subfactor_id = 215 (primeros 3 ítems Q1 del ciclo)
UPDATE questions SET subfactor_id = 215
WHERE test_id = 28 AND position IN (14, 31, 46);

-- Q1_AP (Apertura al cambio) → subfactor_id = 218 (siguientes 4 ítems Q1)
UPDATE questions SET subfactor_id = 218
WHERE test_id = 28 AND position IN (63, 78, 95, 112);

-- Q1 (Crítico) → subfactor_id = 215 (resto de ítems Q1)
UPDATE questions SET subfactor_id = 215
WHERE test_id = 28 AND position IN (128, 146, 163, 178);

-- Q2(-) (Participación grupal) → subfactor_id = 211 (primeros 3 ítems Q2)
UPDATE questions SET subfactor_id = 211
WHERE test_id = 28 AND position IN (15, 32, 47);

-- Q2 (Autosuficiencia) → subfactor_id = 214 (resto de ítems Q2)
UPDATE questions SET subfactor_id = 214
WHERE test_id = 28 AND position IN (64, 79, 96, 113, 129, 147, 164, 179);

-- Q3 (Control emociones) → subfactor_id = 220
UPDATE questions SET subfactor_id = 220
WHERE test_id = 28 AND position IN (16, 33, 48, 65, 82, 97, 115, 130, 148, 165, 180);

-- Q4 (Tensión) → subfactor_id = 224
UPDATE questions SET subfactor_id = 224
WHERE test_id = 28 AND position IN (17, 34, 49, 66, 83, 98, 116, 134, 149, 166, 181);

-- VERIFICACIÓN: Ejecutar estas queries para comprobar el resultado
-- SELECT subfactor_id, COUNT(*) FROM questions WHERE test_id = 28 GROUP BY subfactor_id ORDER BY subfactor_id;
-- SELECT q.position, q.text, s.code, s.name FROM questions q LEFT JOIN subfactors s ON q.subfactor_id = s.id WHERE q.test_id = 28 ORDER BY q.position;
