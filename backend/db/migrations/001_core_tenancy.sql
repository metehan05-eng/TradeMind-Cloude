-- TradeMind AI — Core multi-tenant schema (PostgreSQL 15+)
-- Apply with: psql "$DATABASE_URL" -f db/migrations/001_core_tenancy.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- The API sets `SET LOCAL app.tenant_id = '<uuid>'` inside every transaction.
CREATE OR REPLACE FUNCTION app_current_tenant() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.tenant_id', true), '')::uuid
$$;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name text NOT NULL,
  display_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  country char(2) NOT NULL,
  tax_id text NOT NULL,
  tax_id_type text NOT NULL CHECK (tax_id_type IN ('vkn','mersis','duns','eu_vat','other')),
  plan text NOT NULL DEFAULT 'professional' CHECK (plan IN ('starter','professional','enterprise')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','suspended')),
  kyb_status text NOT NULL DEFAULT 'not_started'
    CHECK (kyb_status IN ('not_started','pending','verified','failed','manual_review')),
  kyb_registry_provider text,
  kyb_registry_reference text,
  kyb_verified_at timestamptz,
  kyb_reason text,
  primary_domain text NOT NULL,
  domain_verification_level text NOT NULL DEFAULT 'none'
    CHECK (domain_verification_level IN ('none','email','dns','document')),
  domain_verified_at timestamptz,
  data_retention text NOT NULL DEFAULT 'standard'
    CHECK (data_retention IN ('standard','zero_retention')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  CONSTRAINT tenants_tax_id_unique UNIQUE (tax_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS tenants_primary_domain_uq ON tenants (lower(primary_domain));

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  job_title text NOT NULL DEFAULT '',
  role text NOT NULL DEFAULT 'auditor',
  status text NOT NULL DEFAULT 'invited' CHECK (status IN ('active','invited','disabled')),
  email_verified boolean NOT NULL DEFAULT false,
  password_hash text NOT NULL,
  last_login_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_email_uq ON users (lower(email));
CREATE INDEX IF NOT EXISTS users_tenant_idx ON users(tenant_id);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  user_agent text,
  ip inet,
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS refresh_sessions_user_idx ON refresh_sessions(tenant_id, user_id);

CREATE TABLE IF NOT EXISTS domain_verification_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  domain text NOT NULL,
  level text NOT NULL CHECK (level IN ('email','dns','document')),
  token text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired')),
  expires_at timestamptz NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS domain_challenges_tenant_idx
  ON domain_verification_challenges(tenant_id, level, created_at DESC);

CREATE TABLE IF NOT EXISTS sso_configurations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('saml','oidc')),
  enabled boolean NOT NULL DEFAULT true,
  idp_name text NOT NULL,
  issuer text NOT NULL,
  client_id text NOT NULL,
  encrypted_client_secret text,
  authorization_endpoint text,
  token_endpoint text,
  userinfo_endpoint text,
  saml_entry_point text,
  saml_certificate text,
  domains text[] NOT NULL,
  auto_route boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS sso_domains_gin ON sso_configurations USING gin (domains);

CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  actor_id text NOT NULL,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  metadata jsonb,
  ip inet,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_logs_tenant_time_idx ON audit_logs(tenant_id, created_at DESC);

CREATE TRIGGER tenants_set_updated_at BEFORE UPDATE ON tenants
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sso_set_updated_at BEFORE UPDATE ON sso_configurations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Row-Level Security: every tenant-owned table is isolated by app.tenant_id.
-- The connection used by the API must not be a superuser / BYPASSRLS role.
-- ---------------------------------------------------------------------------
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_verification_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE sso_configurations ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenants_isolation ON tenants
  USING (id = app_current_tenant())
  WITH CHECK (id = app_current_tenant());

CREATE POLICY users_isolation ON users
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY refresh_sessions_isolation ON refresh_sessions
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY domain_challenges_isolation ON domain_verification_challenges
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY sso_isolation ON sso_configurations
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());

CREATE POLICY audit_logs_isolation ON audit_logs
  USING (tenant_id = app_current_tenant())
  WITH CHECK (tenant_id = app_current_tenant());
