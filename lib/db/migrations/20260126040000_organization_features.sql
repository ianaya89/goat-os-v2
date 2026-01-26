-- Organization feature flags table
-- Stores which features are enabled/disabled per organization
-- If a feature doesn't have a record, it's considered enabled by default

CREATE TABLE organization_feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint: each feature can only appear once per organization
CREATE UNIQUE INDEX org_feature_unique_idx ON organization_feature(organization_id, feature);

-- Index for fast lookup by organization
CREATE INDEX org_feature_org_idx ON organization_feature(organization_id);
