-- TradeMind AI — RBAC catalogue and B2B demo lead pipeline.

CREATE TABLE IF NOT EXISTS roles (
  key text PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  is_system boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS permissions (
  key text PRIMARY KEY,
  description text NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_key text NOT NULL REFERENCES roles(key) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permissions(key) ON DELETE CASCADE,
  PRIMARY KEY (role_key, permission_key)
);

INSERT INTO roles (key, name, description) VALUES
  ('owner_admin', 'Owner / Admin', 'Full tenant control, billing, members and integrations.'),
  ('cfo', 'CFO', 'Complete financial analytics, simulations and audit visibility.'),
  ('procurement_manager', 'Procurement Manager', 'Supply chain, vendor and market data access.'),
  ('logistics_specialist', 'Logistics Specialist', 'Shipment tracking and inventory operations.'),
  ('auditor', 'Auditor', 'Read-only access to financial, supply chain and audit records.')
ON CONFLICT (key) DO NOTHING;

INSERT INTO permissions (key, description) VALUES
  ('tenant:manage', 'Manage tenant settings and verification'),
  ('tenant:billing', 'Manage subscription and billing'),
  ('members:manage', 'Invite and change member roles'),
  ('integrations:manage', 'Connect or revoke integrations'),
  ('integrations:read', 'View integration status'),
  ('financials:read', 'Read financial ledgers and analytics'),
  ('financials:write', 'Write financial records'),
  ('supplychain:read', 'Read inventory and logistics data'),
  ('supplychain:write', 'Write inventory and logistics data'),
  ('market:read', 'Read market intelligence'),
  ('simulations:run', 'Run scenario and stress tests'),
  ('alerts:manage', 'Manage notification channels and alerts'),
  ('audit:read', 'Read audit trail'),
  ('ingestion:write', 'Ingest data through APIs, files or SFTP')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_key, permission_key)
SELECT * FROM (VALUES
  ('owner_admin','tenant:manage'), ('owner_admin','tenant:billing'), ('owner_admin','members:manage'),
  ('owner_admin','integrations:manage'), ('owner_admin','integrations:read'),
  ('owner_admin','financials:read'), ('owner_admin','financials:write'),
  ('owner_admin','supplychain:read'), ('owner_admin','supplychain:write'),
  ('owner_admin','market:read'), ('owner_admin','simulations:run'),
  ('owner_admin','alerts:manage'), ('owner_admin','audit:read'), ('owner_admin','ingestion:write'),
  ('cfo','financials:read'), ('cfo','financials:write'), ('cfo','market:read'),
  ('cfo','simulations:run'), ('cfo','alerts:manage'), ('cfo','audit:read'),
  ('cfo','integrations:read'), ('cfo','supplychain:read'),
  ('procurement_manager','supplychain:read'), ('procurement_manager','supplychain:write'),
  ('procurement_manager','market:read'), ('procurement_manager','integrations:read'),
  ('procurement_manager','ingestion:write'),
  ('logistics_specialist','supplychain:read'), ('logistics_specialist','supplychain:write'),
  ('logistics_specialist','market:read'),
  ('auditor','financials:read'), ('auditor','supplychain:read'), ('auditor','market:read'),
  ('auditor','integrations:read'), ('auditor','audit:read')
) AS seed(role_key, permission_key)
ON CONFLICT DO NOTHING;

-- Enforce the RBAC catalogue at the database layer as well.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_fk') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_fk FOREIGN KEY (role) REFERENCES roles(key);
  END IF;
END $$;

-- Demo leads are intentionally global (not tenant-owned). Access is restricted
-- to the backend admin API key / CRM worker; do not expose this table to tenants.
CREATE TABLE IF NOT EXISTS demo_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_email text NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  annual_trade_volume text NOT NULL,
  primary_erp text NOT NULL,
  primary_marketplace text NOT NULL,
  country char(2),
  status text NOT NULL DEFAULT 'pending_confirmation'
    CHECK (status IN ('pending_confirmation','confirmed','provisioned','rejected')),
  confirmation_token_hash text NOT NULL UNIQUE,
  source text NOT NULL DEFAULT 'landing' CHECK (source IN ('landing','auth')),
  lead_score integer NOT NULL DEFAULT 0 CHECK (lead_score BETWEEN 0 AND 100),
  provisioned_tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  provisioned_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  confirmed_at timestamptz,
  provisioned_at timestamptz
);
CREATE INDEX IF NOT EXISTS demo_requests_email_idx ON demo_requests(lower(business_email));
CREATE INDEX IF NOT EXISTS demo_requests_status_idx ON demo_requests(status, created_at DESC);

CREATE TABLE IF NOT EXISTS demo_lead_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_request_id uuid NOT NULL REFERENCES demo_requests(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
