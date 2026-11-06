-- Replaces the three legacy job categories while preserving jobs and trades.
BEGIN;

INSERT INTO "JobCategory" ("id", "nameEn", "nameSi", "nameTa") VALUES
  ('skilled-trades-technical-services', 'Skilled Trades & Technical Services', 'Skilled Trades & Technical Services', 'Skilled Trades & Technical Services'),
  ('construction-infrastructure', 'Construction & Infrastructure', 'Construction & Infrastructure', 'Construction & Infrastructure'),
  ('manufacturing-production', 'Manufacturing & Production', 'Manufacturing & Production', 'Manufacturing & Production'),
  ('agriculture-farming', 'Agriculture & Farming', 'Agriculture & Farming', 'Agriculture & Farming'),
  ('information-technology-digital-services', 'Information Technology & Digital Services', 'Information Technology & Digital Services', 'Information Technology & Digital Services'),
  ('administration-office-support', 'Administration & Office Support', 'Administration & Office Support', 'Administration & Office Support'),
  ('sales-marketing-retail', 'Sales, Marketing & Retail', 'Sales, Marketing & Retail', 'Sales, Marketing & Retail'),
  ('hospitality-tourism', 'Hospitality & Tourism', 'Hospitality & Tourism', 'Hospitality & Tourism'),
  ('transportation-logistics', 'Transportation & Logistics', 'Transportation & Logistics', 'Transportation & Logistics'),
  ('healthcare-caregiving', 'Healthcare & Caregiving', 'Healthcare & Caregiving', 'Healthcare & Caregiving'),
  ('education-training', 'Education & Training', 'Education & Training', 'Education & Training'),
  ('beauty-fashion-personal-services', 'Beauty, Fashion & Personal Services', 'Beauty, Fashion & Personal Services', 'Beauty, Fashion & Personal Services'),
  ('cleaning-maintenance-facility-services', 'Cleaning, Maintenance & Facility Services', 'Cleaning, Maintenance & Facility Services', 'Cleaning, Maintenance & Facility Services'),
  ('finance-accounting-business-services', 'Finance, Accounting & Business Services', 'Finance, Accounting & Business Services', 'Finance, Accounting & Business Services'),
  ('general-labor-other-services', 'General Labor & Other Services', 'General Labor & Other Services', 'General Labor & Other Services')
ON CONFLICT ("id") DO UPDATE SET "nameEn" = EXCLUDED."nameEn", "nameSi" = EXCLUDED."nameSi", "nameTa" = EXCLUDED."nameTa";

UPDATE "Trade" SET "categoryId" = 'construction-infrastructure' WHERE "id" IN ('construction-labor', 'mason');
UPDATE "Trade" SET "categoryId" = 'agriculture-farming' WHERE "id" = 'agriculture-worker';
UPDATE "Trade" SET "categoryId" = 'manufacturing-production' WHERE "id" = 'factory-worker';
UPDATE "Trade" SET "categoryId" = 'cleaning-maintenance-facility-services' WHERE "id" = 'cleaner-janitor';
UPDATE "Trade" SET "categoryId" = 'transportation-logistics' WHERE "id" = 'driver-delivery';
UPDATE "Trade" SET "categoryId" = 'skilled-trades-technical-services' WHERE "id" IN ('electrician', 'plumber', 'carpenter', 'mechanic', 'welder');
UPDATE "Trade" SET "categoryId" = 'beauty-fashion-personal-services' WHERE "id" = 'tailor';
UPDATE "Trade" SET "categoryId" = 'finance-accounting-business-services' WHERE "id" = 'accountant-clerk';
UPDATE "Trade" SET "categoryId" = 'administration-office-support' WHERE "id" = 'data-entry';
UPDATE "Trade" SET "categoryId" = 'sales-marketing-retail' WHERE "id" = 'sales-executive';
UPDATE "Trade" SET "categoryId" = 'information-technology-digital-services' WHERE "id" = 'it-support';

-- Keep any additional custom trades attached to a valid replacement category.
UPDATE "Trade" SET "categoryId" = 'general-labor-other-services' WHERE "categoryId" = 'blue-collar';
UPDATE "Trade" SET "categoryId" = 'skilled-trades-technical-services' WHERE "categoryId" = 'skilled-trades';
UPDATE "Trade" SET "categoryId" = 'administration-office-support' WHERE "categoryId" = 'white-collar';

-- These legacy values are the existing three broad categories; jobs are retained.
UPDATE "Job" SET "category" = 'general-labor-other-services' WHERE "category" = 'blue-collar';
UPDATE "Job" SET "category" = 'skilled-trades-technical-services' WHERE "category" IN ('skilled-trades', 'skilled tradesperson');
UPDATE "Job" SET "category" = 'administration-office-support' WHERE "category" = 'white-collar';

DELETE FROM "JobCategory" WHERE "id" IN ('blue-collar', 'skilled-trades', 'white-collar');

COMMIT;
