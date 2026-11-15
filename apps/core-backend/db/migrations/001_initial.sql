CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS obligations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  student_name TEXT NOT NULL,
  student_reference TEXT,
  concept TEXT NOT NULL,
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  currency CHAR(3) NOT NULL DEFAULT 'MXN' CHECK (currency = 'MXN'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS obligations_school_created_idx
  ON obligations (school_id, created_at DESC) WHERE archived_at IS NULL;

CREATE TABLE IF NOT EXISTS payment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id TEXT NOT NULL,
  obligation_id UUID NOT NULL REFERENCES obligations(id),
  reference TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('creating', 'requested', 'failed', 'paid', 'cancelled')),
  provider_transaction_id TEXT,
  payment_url TEXT,
  qr_code TEXT,
  provider_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS payment_requests_school_obligation_idx
  ON payment_requests (school_id, obligation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS audit_ledger (
  sequence BIGSERIAL PRIMARY KEY,
  operation_id UUID NOT NULL,
  school_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  previous_state JSONB,
  new_state JSONB,
  source TEXT NOT NULL,
  transaction_id TEXT,
  actor TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL,
  previous_hash TEXT NOT NULL,
  event_hash TEXT NOT NULL UNIQUE
);

CREATE INDEX IF NOT EXISTS audit_ledger_school_sequence_idx
  ON audit_ledger (school_id, sequence);

CREATE OR REPLACE FUNCTION prevent_audit_ledger_mutation()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_ledger is append-only';
END;
$$;

DROP TRIGGER IF EXISTS audit_ledger_no_update ON audit_ledger;
CREATE TRIGGER audit_ledger_no_update
  BEFORE UPDATE OR DELETE ON audit_ledger
  FOR EACH ROW EXECUTE FUNCTION prevent_audit_ledger_mutation();
