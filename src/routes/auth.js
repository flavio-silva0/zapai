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
const { criarToken, requireAuth, forbidViewer, credentialVersion } = require("../middleware/authMiddleware");

const router  = express.Router();
const { rateLimit } = require("../middleware/requestProtection");
router.use(["/login", "/register", "/change-password"], rateLimit({ limit: 15, windowMs: 15 * 60000 }));
router.use((req, res, next) => {
  if (req.method === "GET") return next();
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) return res.status(400).json({ error: "Dados inválidos." });
  for (const field of ["email", "password", "nome", "businessName", "botName", "botEmoji", "nicho", "senhaAtual", "novaSenha"]) {
    if (body[field] !== undefined && (typeof body[field] !== "string" || body[field].length > 254)) {
      return res.status(400).json({ error: "Campo inválido: " + field });
    }
  }
  for (const field of ["password", "senhaAtual", "novaSenha"]) {
    if (typeof body[field] === "string" && Buffer.byteLength(body[field], "utf8") > 72) {
      return res.status(400).json({ error: "A senha deve ter no máximo 72 bytes UTF-8." });
    }
  }
  next();
});
const supabase = require("../utils/database")();

const SALT_ROUNDS = 12;

// ── POST /api/auth/register ───────────────────────────────────
router.use(require("./registration"));

// ── POST /api/auth/login ──────────────────────────────────────
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "E-mail e senha são obrigatórios." });
  }

  // Busca usuário
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .single();

  if (!user || !user.is_active) {
    return res.status(401).json({ error: "E-mail ou senha incorretos." });
  }

  if (user.auth_user_id) {
    try {
      const { data, error } = await require("../utils/registration").authClient().auth.signInWithPassword({ email: user.email, password });
      if (error || !data.user?.email_confirmed_at || data.user.id !== user.auth_user_id) {
        return res.status(401).json({ error: "E-mail ou senha incorretos. Confirme seu e-mail antes de entrar." });
      }
    } catch (_) { return res.status(503).json({ error: "Autenticação temporariamente indisponível." }); }
  }
  const senhaCorreta = user.auth_user_id || await bcrypt.compare(password, user.password_hash);
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
    credentialVersion: credentialVersion(user.password_hash),
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
    .select("id, email, nome, role, tenant_id, is_active, created_at")
    .eq("id", req.user.userId)
    .single();

  if (!user) return res.status(404).json({ error: "Usuário não encontrado." });
  if (user.is_active === false) {
    return res.status(403).json({ error: "Usuário inativo ou desativado." });
  }

  let tenant = null;
  if (user.tenant_id) {
    const { data, error } = await supabase
      .from("tenants")
      .select("id, nome, status, bot_name, bot_emoji, clinic_name, clinic_phone, trial_ends_at, prompt_text, phone_number_id, plan")
      .eq("id", user.tenant_id)
      .single();
    if (error) {
      console.error("[AUTH] Erro ao buscar tenant no /me:", error.message || error);
    }
    tenant = data;
  }

  res.json({ user, tenant });
});

// ── POST /api/auth/change-password ────────────────────────────
router.post("/change-password", requireAuth, async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  if (!senhaAtual || !novaSenha) {
    return res.status(400).json({ error: "Senha atual e nova senha são obrigatórias." });
  }

  if (typeof novaSenha !== "string" || novaSenha.length < 8) {
    return res.status(400).json({ error: "A nova senha deve ter pelo menos 8 caracteres." });
  }

  if (novaSenha.length > 128) {
    return res.status(400).json({ error: "A nova senha não pode exceder 128 caracteres." });
  }

  const { data: user, error: uErr } = await supabase
    .from("users")
    .select("id, password_hash, is_active, auth_user_id")
    .eq("id", req.user.userId)
    .single();

  if (uErr || !user) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  if (user.is_active === false) {
    return res.status(403).json({ error: "Conta inativa." });
  }

  if (user.auth_user_id) return res.status(400).json({ error: "Use a recuperação de senha por e-mail na tela de login." });
  const matches = await bcrypt.compare(senhaAtual, user.password_hash);
  if (!matches) {
    return res.status(401).json({ error: "A senha atual informada está incorreta." });
  }

  const novoHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);
  const { error: updErr } = await supabase
    .from("users")
    .update({ password_hash: novoHash })
    .eq("id", user.id);

  if (updErr) {
    return res.status(500).json({ error: "Erro ao atualizar senha no banco de dados." });
  }

  res.json({ success: true, message: "Senha alterada com sucesso." });
});

// ── PUT /api/auth/profile ─────────────────────────────────────
router.put("/profile", requireAuth, forbidViewer, async (req, res) => {
  const { nome, email, tenant_nome, clinic_phone, bot_name } = req.body;

  try {
    const { data: current } = await supabase.from("users").select("email").eq("id", req.user.userId).single();
    if (!current || (email && email.trim().toLowerCase() !== current.email)) {
      return res.status(400).json({ error: "A alteração de e-mail exige uma nova confirmação e não está disponível neste formulário." });
    }
    // 1. Atualizar user
    const { error: errUser } = await supabase
      .from("users")
      .update({ nome })
      .eq("id", req.user.userId);

    if (errUser) throw errUser;

    // 2. Atualizar tenant (se não for admin global)
    if (req.user.tenantId && req.user.role === "owner") {
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
