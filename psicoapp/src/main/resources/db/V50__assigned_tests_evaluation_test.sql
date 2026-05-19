-- Allow assigned_tests to reference evaluation_tests (clinical tests) in addition to tests (personality tests)
-- Make test_id nullable (was NOT NULL) since now either test_id OR evaluation_test_id must be set
ALTER TABLE assigned_tests ALTER COLUMN test_id DROP NOT NULL;

-- Add evaluation_test_id column with FK to evaluation_tests
ALTER TABLE assigned_tests ADD COLUMN evaluation_test_id BIGINT;
ALTER TABLE assigned_tests ADD CONSTRAINT fk_assigned_tests_evaluation_test
    FOREIGN KEY (evaluation_test_id) REFERENCES evaluation_tests(id);

-- Index for efficient lookups
CREATE INDEX idx_assigned_tests_evaluation_test_id ON assigned_tests(evaluation_test_id);

-- Ensure at least one of test_id or evaluation_test_id is set
ALTER TABLE assigned_tests ADD CONSTRAINT chk_assigned_tests_has_test
    CHECK (test_id IS NOT NULL OR evaluation_test_id IS NOT NULL);
