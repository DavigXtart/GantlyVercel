-- Widen totp_secret column to accommodate PII-encrypted values (ENC: prefix + AES-256-GCM ciphertext)
ALTER TABLE users MODIFY COLUMN totp_secret VARCHAR(500);
