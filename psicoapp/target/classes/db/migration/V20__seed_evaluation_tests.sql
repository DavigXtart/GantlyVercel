-- Insertar tests de ejemplo para Evaluaciones (Ansiedad)
INSERT INTO evaluation_tests (code, title, description, category, topic, active) VALUES
('ANXIETY_GAD7', 'Test de Ansiedad Generalizada (GAD-7)', 'Evalúa tu nivel de ansiedad generalizada', 'EVALUATION', 'Ansiedad', TRUE),
('ANXIETY_PANIC', 'Test de Ataques de Pánico', 'Identifica síntomas de ataques de pánico', 'EVALUATION', 'Ansiedad', TRUE),
('ANXIETY_SOCIAL', 'Test de Ansiedad Social', 'Evalúa tu nivel de ansiedad en situaciones sociales', 'EVALUATION', 'Ansiedad', TRUE);

-- Insertar tests de ejemplo para Descubrimiento
INSERT INTO evaluation_tests (code, title, description, category, topic, active) VALUES
('DISCOVERY_PERSONALITY', 'Descubre tu Personalidad', 'Explora los rasgos de tu personalidad', 'DISCOVERY', 'Personalidad', TRUE),
('DISCOVERY_STRESS', 'Nivel de Estrés', 'Identifica tus niveles de estrés actuales', 'DISCOVERY', 'Estrés', TRUE),
('DISCOVERY_MINDFULNESS', 'Nivel de Mindfulness', 'Descubre qué tan presente estás en el momento', 'DISCOVERY', 'Mindfulness', TRUE);

