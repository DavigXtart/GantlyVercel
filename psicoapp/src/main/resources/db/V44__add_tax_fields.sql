ALTER TABLE appointments ADD COLUMN tax_rate DECIMAL(5,4) DEFAULT 0.0000;
ALTER TABLE appointments ADD COLUMN tax_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE appointments ADD COLUMN total_amount DECIMAL(10,2);
ALTER TABLE appointments ADD COLUMN tax_exempt BOOLEAN DEFAULT TRUE;

-- Set total_amount = price for existing appointments
UPDATE appointments SET total_amount = price WHERE price IS NOT NULL;
