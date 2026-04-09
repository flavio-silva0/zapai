"use strict";

const express  = require("express");
const bcrypt   = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { requireAuth, requireSuperAdmin } = require("../middleware/authMiddleware");

const router  = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

// â”€â”€ POST /api/admin/seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cria o super_admin inicial. NÃƒO exige autenticaÃ§Ã£o (bootstrap).
// Auto-protegida: sÃ³ funciona se AINDA nÃ£o existir nenhum super_admin.
// ApÃ³s criar, essa rota para de funcionar automaticamente.
router.post("/seed", async (_req, res) => {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNome     = process.env.ADMIN_NOME ?? "Admin";

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ error: "Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env" });
  }

  // Verifica se jÃ¡ existe um super_admin
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("role", "super_admin")
    .limit(1)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ error: "Super admin jÃ¡ existe. Esta rota estÃ¡ desabilitada." });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      tenant_id:     null,
      email:         adminEmail.toLowerCase().trim(),
      password_hash: passwordHash,
      nome:          adminNome,
      role:          "super_admin",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  console.log(`ðŸ”‘  Super admin criado: ${adminEmail}`);
  res.status(201).json({ message: "Super admin criado com sucesso!", userId: user.id });
});

// â”€â”€ Todas as rotas ABAIXO exigem autenticaÃ§Ã£o + super_admin â”€â”€
router.use(requireAuth, requireSuperAdmin);


// â”€â”€ GET /api/admin/tenants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/tenants", async (_req, res) => {
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select(`
      id, nome, nicho, status, plan,
      bot_name, bot_emoji, clinic_name, clinic_phone,
      phone_number_id,
      trial_ends_at, created_at
    `)
    .order("created_at", { ascending: false });

  if (error) return res.status(500).json({ error: error.message });

  // Adicionar contagem de contatos por tenant
  const { data: counts } = await supabase
    .from("users_whatsapp")
    .select("tenant_id")
    .not("tenant_id", "is", null);

  const countMap = {};
  (counts ?? []).forEach((r) => {
    countMap[r.tenant_id] = (countMap[r.tenant_id] ?? 0) + 1;
  });

  res.json(tenants.map((t) => ({ ...t, totalContatos: countMap[t.id] ?? 0 })));
});

// â”€â”€ GET /api/admin/tenants/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
router.get("/tenants/:id", async (req, res) => {
  const { data: tenant } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", req.params.id)
    .single();

  if (!tenant) return res.status(404).json({ error: "Tenant nÃ£o encontrado." });

  const { data: users } = await supabase
    .from("users")
    .select("id, email, nome, role, is_active, created_at")
    .eq("tenant_id", req.params.id);

  res.json({ tenant, users: users ?? [] });
});

// â”€â”€ PUT /api/admin/tenants/:id â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Campos que vocÃª pode atualizar: status, phone_number_id, wa_access_token,
//   prompt_text, bot_name, bot_emoji, clinic_name, clinic_phone, plan
router.put("/tenants/:id", async (req, res) => {
  const campos = [
    "status", "phone_number_id", "wa_access_token",
    "prompt_text", "bot_name", "bot_emoji",
    "clinic_name", "clinic_phone", "plan", "nicho",
  ];

  const update = {};
  campos.forEach((c) => { if (req.body[c] !== undefined) update[c] = req.body[c]; });

  if (Object.keys(update).length === 0) {
    return res.status(400).json({ error: "Nenhum campo vÃ¡lido para atualizar." });
  }

  const { data, error } = await supabase
    .from("tenants")
    .update(update)
    .eq("id", req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  console.log(`ðŸ”§  Admin atualizou tenant ${req.params.id}: ${JSON.stringify(update)}`);
  res.json(data);
});

// â”€â”€ POST /api/admin/seed â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Cria o super_admin inicial. SÃ³ funciona se ainda nÃ£o existir.
// Chame UMA VEZ apÃ³s o primeiro deploy, depois proteja ou remova.
router.post("/seed", async (req, res) => {
  const adminEmail    = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminNome     = process.env.ADMIN_NOME ?? "Admin";

  if (!adminEmail || !adminPassword) {
    return res.status(400).json({ error: "Configure ADMIN_EMAIL e ADMIN_PASSWORD no .env" });
  }

  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", adminEmail)
    .single();

  if (existing) {
    return res.status(409).json({ error: "Super admin jÃ¡ existe." });
  }

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const { data: user, error } = await supabase
    .from("users")
    .insert({
      tenant_id:     null,
      email:         adminEmail,
      password_hash: passwordHash,
      nome:          adminNome,
      role:          "super_admin",
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  console.log(`ðŸ”‘  Super admin criado: ${adminEmail}`);
  res.status(201).json({ message: "Super admin criado com sucesso.", userId: user.id });
});

module.exports = router;

