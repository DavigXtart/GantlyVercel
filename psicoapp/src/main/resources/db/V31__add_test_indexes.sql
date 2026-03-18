-- V31: Añadir índices para optimizar queries de tests
--
-- Estas tablas se consultan frecuentemente en:
-- - TestResultService (cálculo de resultados)
-- - AdminService (gestión de tests)
-- - TestFlowController (completar tests)

-- Índices en questions
CREATE INDEX idx_questions_test_id ON questions(test_id);
CREATE INDEX idx_questions_subfactor_id ON questions(subfactor_id);

-- Índices en subfactors
CREATE INDEX idx_subfactors_test_id ON subfactors(test_id);
CREATE INDEX idx_subfactors_factor_id ON subfactors(factor_id);

-- Índices en factors
CREATE INDEX idx_factors_test_id ON factors(test_id);

-- Índices en user_answers
CREATE INDEX idx_user_answers_user_id ON user_answers(user_id);
CREATE INDEX idx_user_answers_question_id ON user_answers(question_id);
CREATE INDEX idx_user_answers_session_id ON user_answers(session_id);

-- Índices en test_results y factor_results
CREATE INDEX idx_test_results_user_test ON test_results(user_id, test_id);
CREATE INDEX idx_factor_results_user_test ON factor_results(user_id, test_id);
