-- Migration: Simplify member roles
--
-- This migration converts the 5-value role system to a simplified 4-value system:
-- - coach -> staff (coaches get staff-level access)
-- - athlete -> member (athletes get basic member access)
-- - owner, admin, member remain unchanged
--
-- The actual coach/athlete status is now determined by coachTable/athleteTable profiles,
-- not by the role in memberTable.

-- Migrate coach role to staff
UPDATE "member" SET "role" = 'staff' WHERE "role" = 'coach';

-- Migrate athlete role to member
UPDATE "member" SET "role" = 'member' WHERE "role" = 'athlete';
