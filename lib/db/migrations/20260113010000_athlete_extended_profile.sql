-- Add extended profile fields to athlete table
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "youtube_videos" jsonb DEFAULT '[]';
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "education_institution" text;
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "education_year" text;
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "expected_graduation_date" timestamp with time zone;
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "gpa" numeric(4, 2);
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "dietary_restrictions" text;
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "allergies" text;
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "residence_city" text;
ALTER TABLE "athlete" ADD COLUMN IF NOT EXISTS "residence_country" text;

-- Add comments for documentation
COMMENT ON COLUMN "athlete"."youtube_videos" IS 'Array of YouTube video URLs for highlight plays';
COMMENT ON COLUMN "athlete"."education_institution" IS 'School/University name for student athletes';
COMMENT ON COLUMN "athlete"."education_year" IS 'Academic year (e.g., 5to año, Freshman)';
COMMENT ON COLUMN "athlete"."expected_graduation_date" IS 'Expected graduation date';
COMMENT ON COLUMN "athlete"."gpa" IS 'Grade Point Average (0-10 scale)';
COMMENT ON COLUMN "athlete"."dietary_restrictions" IS 'Dietary restrictions (vegetarian, vegan, etc.)';
COMMENT ON COLUMN "athlete"."allergies" IS 'Food and medical allergies';
COMMENT ON COLUMN "athlete"."residence_city" IS 'City of residence';
COMMENT ON COLUMN "athlete"."residence_country" IS 'Country of residence';
