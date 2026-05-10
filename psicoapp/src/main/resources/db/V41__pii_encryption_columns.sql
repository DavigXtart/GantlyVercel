-- Widen PII columns to accommodate AES-256-GCM encrypted + Base64-encoded values.
-- Encrypted format: "ENC:" or "DENC:" prefix + Base64(12-byte IV + ciphertext + 16-byte GCM tag)
-- A 255-char plaintext can produce ~400 chars of ciphertext after Base64 + prefix.

ALTER TABLE users MODIFY COLUMN name VARCHAR(500) NOT NULL;
ALTER TABLE users MODIFY COLUMN email VARCHAR(500) NOT NULL;
