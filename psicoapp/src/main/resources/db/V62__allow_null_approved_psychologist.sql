-- Allow NULL in psychologist_profiles.approved to represent "pending re-review" state
-- NULL = resubmitted/pending re-review, FALSE = rejected, TRUE = approved
ALTER TABLE psychologist_profiles ALTER COLUMN approved DROP NOT NULL;
