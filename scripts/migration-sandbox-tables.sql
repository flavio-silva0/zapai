-- ============================================================
-- Migration: Sandbox Tables for Test Tenant Isolation
-- Tenant de teste: c8038ec9-cb47-4c24-ac5a-4899d285bcf7
-- ============================================================

-- 1. Marcar tenant como sandbox
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_sandbox boolean NOT NULL DEFAULT false;
UPDATE tenants SET is_sandbox = true WHERE id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';

-- 2. Tabela sandbox para contatos/leads (espelho de users_whatsapp)
CREATE TABLE IF NOT EXISTS users_whatsapp_sandbox (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid REFERENCES tenants(id) ON DELETE CASCADE,
  telefone      text NOT NULL,
  nome          text DEFAULT 'Contato',
  status_kanban text DEFAULT 'Novo',
  is_ai_active  boolean DEFAULT true,
  ai_memory     jsonb,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_whatsapp_sandbox_tenant_id
  ON users_whatsapp_sandbox(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_whatsapp_sandbox_telefone
  ON users_whatsapp_sandbox(telefone);

ALTER TABLE users_whatsapp_sandbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role bypass" ON users_whatsapp_sandbox;
CREATE POLICY "service_role bypass" ON users_whatsapp_sandbox
  TO service_role USING (true) WITH CHECK (true);

-- 3. Tabela sandbox para mensagens (espelho de messages)
CREATE TABLE IF NOT EXISTS messages_sandbox (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   uuid REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id  uuid REFERENCES users_whatsapp_sandbox(id) ON DELETE CASCADE,
  texto       text NOT NULL,
  origin      text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sandbox_tenant_id
  ON messages_sandbox(tenant_id);
CREATE INDEX IF NOT EXISTS idx_messages_sandbox_patient_id
  ON messages_sandbox(patient_id);

ALTER TABLE messages_sandbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role bypass" ON messages_sandbox;
CREATE POLICY "service_role bypass" ON messages_sandbox
  TO service_role USING (true) WITH CHECK (true);

-- 4. Tabela sandbox para idempotencia (espelho de whatsapp_message_processing)
CREATE TABLE IF NOT EXISTS whatsapp_message_processing_sandbox (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  whatsapp_message_id   text NOT NULL UNIQUE,
  tenant_id             uuid REFERENCES tenants(id) ON DELETE CASCADE,
  patient_id            text,
  phone_number_id       text,
  from_phone            text,
  status                text NOT NULL DEFAULT 'received'
                        CHECK (status IN ('received', 'processing', 'answered', 'failed')),
  last_error            text,
  received_at           timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_message_processing_sandbox_tenant_id
  ON whatsapp_message_processing_sandbox(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_message_processing_sandbox_status
  ON whatsapp_message_processing_sandbox(status);

ALTER TABLE whatsapp_message_processing_sandbox ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "service_role bypass" ON whatsapp_message_processing_sandbox;
CREATE POLICY "service_role bypass" ON whatsapp_message_processing_sandbox
  TO service_role USING (true) WITH CHECK (true);

-- 5. (Opcional) Mover dados existentes do tenant de teste para as tabelas sandbox
-- Descomente as linhas abaixo se quiser migrar os dados ja existentes:

-- INSERT INTO users_whatsapp_sandbox SELECT * FROM users_whatsapp WHERE tenant_id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';
-- INSERT INTO messages_sandbox SELECT * FROM messages WHERE tenant_id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';
-- INSERT INTO whatsapp_message_processing_sandbox SELECT * FROM whatsapp_message_processing WHERE tenant_id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';

-- DELETE FROM messages WHERE tenant_id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';
-- DELETE FROM users_whatsapp WHERE tenant_id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';
-- DELETE FROM whatsapp_message_processing WHERE tenant_id = 'c8038ec9-cb47-4c24-ac5a-4899d285bcf7';
