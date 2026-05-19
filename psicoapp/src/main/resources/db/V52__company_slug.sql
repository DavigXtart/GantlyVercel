ALTER TABLE companies ADD COLUMN slug VARCHAR(80);
ALTER TABLE companies ADD COLUMN description TEXT;
ALTER TABLE companies ADD COLUMN public_visible BOOLEAN NOT NULL DEFAULT FALSE;
CREATE UNIQUE INDEX idx_companies_slug ON companies(slug) WHERE slug IS NOT NULL;
