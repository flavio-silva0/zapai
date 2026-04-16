/**
 * auth.js — Rotas de autenticação multi-tenant
 *
 * POST /api/auth/register  — cria tenant + usuário owner
 * POST /api/auth/login     — retorna JWT com tenantId e role
 * GET  /api/auth/me        — retorna dados do usuário logado
 */

"use strict";

const express  = require("express");
const bcrypt   = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { criarToken, requireAuth } = require("../middleware/authMiddleware");

const router  = express.Router();
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const SALT_ROUNDS = 12;

// Templates de prompt por nicho (resumidos — expansível depois)
const PROMPT_DEFAULTS = {
  dental:       "Você é a Sofia, recepcionista de uma clínica odontológica. Seja acolhedora e profissional.",
  imobiliaria:  "Você é a Sofia, corretora de imóveis. Seja consultiva e ajude o cliente a encontrar o imóvel ideal.",
  academia:     "Você é a Sofia, consultora de uma academia. Seja energética e motivadora.",
  petshop:      "Você é a Sofia, atendente de um petshop. Ame os animais e cuide de quem os cuida.",
  restaurante:  "Você é a Sofia, atendente de um restaurante. Seja simpática e ajude com cardápio e reservas.",
  salao:        "Você é a Sofia, recepcionista de um salão de beleza. Seja elegante e cuidadosa.",
  psicologia:   "Você é a Sofia, recepcionista de uma clínica de psicologia. Seja acolhedora e discreta.",
  veterinaria:  "Você é a Sofia, atendente de uma clínica veterinária. Demonstre carinho pelos animais.",
  estetica:     "Você é a Sofia, consultora de uma clínica estética. Seja sofisticada e atenciosa.",
  contabilidade:"Você é a Sofia, consultora de um escritório de contabilidade. Seja clara e confiável.",
  educacao:     "Você é a Sofia, consultora de uma escola ou curso. Seja motivadora e consultiva.",
  ti:           "Você é a Sofia, consultora de uma empresa de TI. Seja técnica e acessível.",
  eventos:      "Você é a Sofia, consultora de uma empresa de eventos. Seja criativa e animada.",
  construcao:   "Você é a Sofia, consultora de uma construtora. Seja séria e confiável.",
  geral:        "Você é a Sofia, atendente virtual. Seja educada, atenciosa e prestativa.",
};

// ── POST /api/auth/register ───────────────────────────────────
router.post("/register", async (req, res) => {
  const {
    email, password, nome,
    businessName, nicho = "geral",
    botName = "Sofia", botEmoji = "🤖",
  } = req.body;

  if (!email || !password || !nome || !businessName) {
    return res.status(400).json({ error: "Campos obrigatórios: email, password, nome, businessName." });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: "A senha deve ter pelo menos 8 caracteres." });
  }

  // Verifica se e-mail já existe
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (existing) {
    return res.status(409).json({ error: "Este e-mail já está cadastrado." });
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const promptText   = PROMPT_DEFAULTS[nicho] ?? PROMPT_DEFAULTS.geral;
  const trialEndsAt  = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Cria tenant
  const { data: tenant, error: tenantErr } = await supabase
    .from("tenants")
    .insert({
      nome:          businessName.trim(),
      nicho,
      bot_name:      botName,
      bot_emoji:     botEmoji,
      clinic_name:   businessName.trim(),
      status:        "trial",
      prompt_text:   promptText,
      trial_ends_at: trialEndsAt,
    })
    .select()
    .single();

  if (tenantErr) {
    console.error("Erro ao criar tenant:", tenantErr);
    return res.status(500).json({ error: "Erro ao criar conta. Tente novamente." });
  }

  // Cria usuário owner
  const { data: user, error: userErr } = await supabase
    .from("users")
    .insert({
      tenant_id:     tenant.id,
      email:         email.toLowerCase().trim(),
      password_hash: passwordHash,
      nome:          nome.trim(),
      role:          "owner",
    })
    .select()
    .single();

  if (userErr) {
    console.error("Erro ao criar usuário:", userErr);
    // Rollback do tenant
    await supabase.from("tenants").delete().eq("id", tenant.id);
    return res.status(500).json({ error: "Erro ao criar usuário. Tente novamente." });
  }

  const token = criarToken({
    userId:   user.id,
    tenantId: tenant.id,
    role:     user.role,
    email:    user.email,
  });

  console.log(`🆕  Novo cliente: ${businessName} (${email}) | Nicho: ${nicho}`);

  res.status(201).json({
    token,
    user:   { id: user.id, nome: user.nome, email: user.email, role: user.role },
    tenant: { id: tenant.id, nome: tenant.nome, status: tenant.status, botName: tenant.bot_name, botEmoji: tenant.bot_emoji },
  });
});

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  // Busca usuário
  const { data: user } = await supabase
    .from("users")
    .select("id, tenant_id, email, nome, password_hash, role, is_active")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user || !user.is_active) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  const senhaCorreta = await bcrypt.compare(password, user.password_hash);
  if (!senhaCorreta) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  // Para super_admin, não precisa de tenant
  let tenant = null;
  if (user.role !== "super_admin" && user.tenant_id) {
    const { data } = await supabase
      .from("tenants")
      .select("id, nome, status, bot_name, bot_emoji, clinic_name, clinic_phone, trial_ends_at, prompt_text")
      .eq("id", user.tenant_id)
      .single();
    tenant = data;
  }

  const token = criarToken({
    userId:   user.id,
    tenantId: user.tenant_id,
    role:     user.role,
    email:    user.email,
  });

  res.json({
    token,
    user:   { id: user.id, nome: user.nome, email: user.email, role: user.role },
    tenant,
  });
});

// ── GET /api/auth/me ──────────────────────────────────────────
router.get("/me", requireAuth, async (req, res) => {
  const { data: user } = await supabase
    .from("users")
    .select("id, email, nome, role, tenant_id, created_at")
    .eq("id", req.user.userId)
    .single();

  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });

  let tenant = null;
  if (user.tenant_id) {
    const { data } = await supabase
      .from("tenants")
      .select("id, nome, status, bot_name, bot_emoji, clinic_name, clinic_phone, trial_ends_at, prompt_text")
      .eq("id", user.tenant_id)
      .single();
    tenant = data;
  }

  res.json({ user, tenant });
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put("/profile", requireAuth, async (req, res) => {
  const { nome, email, tenant_nome, clinic_phone, bot_name } = req.body;

  try {
    // 1. Atualizar user
    const { error: errUser } = await supabase
      .from("users")
      .update({ nome, email })
      .eq("id", req.user.userId);

    if (errUser) throw errUser;

    // 2. Atualizar tenant (se não for admin global)
    if (req.user.tenantId) {
      const { error: errTenant } = await supabase
        .from("tenants")
        .update({
          nome: tenant_nome,
          clinic_phone: clinic_phone,
          bot_name: bot_name
        })
        .eq("id", req.user.tenantId);

      if (errTenant) throw errTenant;
    }

    res.json({ message: "Perfil atualizado com sucesso" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
