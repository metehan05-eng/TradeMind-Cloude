-- TradeMind AI — Integrations, credentials and ingestion schema.
-- Every credential column stores an AES-256-GCM envelope: v1.iv.tag.ciphertext.

CREATE TABLE IF NOT EXISTS integration_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('amazon','shopify','etsy','trendyol')),
  account_label text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('connected','pending','error','revoked')),
  scopes text[] NOT NULL DEFAULT '{}',
  encrypted_access_token text NOT NULL,
  encrypted_refresh_token text,
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}',
  last_refreshed_at timestamptz,
  last_error text,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, provider)
);
CREATE INDEX IF NOT EXISTS integration_connections_tenant_idx ON integration_connections(tenant_id);
CREATE INDEX IF NOT EXISTS integration_connections_expiry_idx
  ON integration_connections(expires_at) WHERE status = 'connected';

CREATE TABLE IF NOT EXISTS oauth_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  state text NOT NULL UNIQUE,
  code_verifier text,
  redirect_uri text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS oauth_states_tenant_idx ON oauth_states(tenant_id, expires_at);

CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  prefix text NOT NULL UNIQUE,
  hashed_key text NOT NULL,
  encrypted_signing_secret text NOT NULL,
  scopes text[] NOT NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS api_keys_tenant_idx ON api_keys(tenant_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS ingest_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('bulk_upload','erp_webhook','sftp','oauth_sync')),
  status text NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued','parsing','mapping','completed','failed')),
  file_name text,
  format text CHECK (format IN ('csv','xlsx','json')),
  total_rows integer NOT NULL DEFAULT 0,
  processed_rows integer NOT NULL DEFAULT 0,
  failed_rows integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]',
  mapping jsonb,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS ingest_jobs_tenant_time_idx ON ingest_jobs(tenant_id, created_at DESC);

CREATE TABLE IF NOT EXISTS inventory_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  sku text NOT NULL,
  product_name text NOT NULL,
  quantity integer NOT NULL DEFAULT 0,
  unit_cost numeric(18,4) NOT NULL DEFAULT 0,
  currency char(3) NOT NULL DEFAULT 'USD',
  warehouse text,
  source text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (tenant_id, sku)
);
CREATE INDEX IF NOT EXISTS inventory_tenant_idx ON inventory_records(tenant_id);

CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  external_id text,
  type text NOT NULL CHECK (type IN ('invoice','payment','cash_flow','inventory_delta')),
  amount numeric(18,2) NOT NULL,
  currency char(3) NOT NULL DEFAULT 'USD',
  description text NOT NULL,
  counterparty text,
  occurred_at timestamptz NOT NULL,
  source text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS transactions_tenant_time_idx
  ON financial_transactions(tenant_id, occurred_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS transactions_external_uq
  ON financial_transactions(tenant_id, external_id) WHERE external_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS processed_webhook_events (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  event_id text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT NOW(),
  PRIMARY KEY (tenant_id, event_id)
);

CREATE TABLE IF NOT EXISTS notification_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('slack','teams','email')),
  label text NOT NULL,
  encrypted_endpoint text NOT NULL,
  events text[] NOT NULL DEFAULT '{alert.arbitrage}',
  enabled boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS notification_channels_tenant_idx ON notification_channels(tenant_id);

CREATE TABLE IF NOT EXISTS sftp_ingest_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
  host text NOT NULL,
  username text NOT NULL,
  encrypted_private_key text NOT NULL,
  remote_path text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  last_run_at timestamptz,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE TRIGGER integration_connections_set_updated_at BEFORE UPDATE ON integration_connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER ingest_jobs_set_updated_at BEFORE UPDATE ON ingest_jobs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER notification_channels_set_updated_at BEFORE UPDATE ON notification_channels
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sftp_configs_set_updated_at BEFORE UPDATE ON sftp_ingest_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE integration_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingest_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE sftp_ingest_configs ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'integration_connections','oauth_states','api_keys','ingest_jobs','inventory_records',
    'financial_transactions','processed_webhook_events','notification_channels','sftp_ingest_configs'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (tenant_id = app_current_tenant()) WITH CHECK (tenant_id = app_current_tenant())',
      table_name || '_isolation',
      table_name
    );
  END LOOP;
END $$;
