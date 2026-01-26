-- Rename age columns to birth year columns
ALTER TABLE "age_category" RENAME COLUMN "min_age" TO "min_birth_year";
ALTER TABLE "age_category" RENAME COLUMN "max_age" TO "max_birth_year";
