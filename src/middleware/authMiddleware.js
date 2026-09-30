/**
 * authMiddleware.js
 * Middleware de autenticação JWT multi-tenant.
 *
 * - Extrai o token do header Authorization: Bearer <token>
 * - Verifica assinatura com JWT_SECRET
 * - Injeta req.user = { userId, tenantId, role, email } em todos os handlers
 * - Se role === 'super_admin': tenantId pode ser null (acesso global)
 */

"use strict";

const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const database = require("../utils/database");
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ ERRO CRÍTICO: JWT_SECRET não está definido no ambiente.");
  // Não lançamos Error para não crashear o import, mas sim no middleware, ou exportamos config.
  // Como é inicialização, é melhor avisar fortemente, ou forçar falha:
  // process.exit(1); 
  // No caso, se chamarem jwt.verify sem secret vai dar erro. Vamos lançar um erro explícito.
  throw new Error("FATAL: JWT_SECRET must be defined in environment variables.");
}

/**
 * Middleware principal — rejeita requests sem token válido.
 */
function credentialVersion(hash) {
  return crypto.createHmac("sha256", JWT_SECRET).update(hash || "").digest("hex");
}

async function validateSession(token) {
  const payload = jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
  if (!payload.userId) throw new Error("invalid session");
  const { data: user, error } = await database().from("users")
    .select("id, tenant_id, role, email, is_active, password_hash").eq("id", payload.userId).maybeSingle();
  if (error) throw Object.assign(new Error("session database unavailable"), { statusCode: 503 });
  if (!user || !user.is_active || payload.credentialVersion !== credentialVersion(user.password_hash)) {
    throw new Error("revoked session");
  }
  if (!["owner", "agent", "viewer", "super_admin"].includes(user.role)) throw new Error("invalid role");
  if (user.role !== "super_admin") {
    if (!user.tenant_id) throw new Error("missing tenant");
    const { data: tenant, error: tenantError } = await database().from("tenants")
      .select("id, status, trial_ends_at").eq("id", user.tenant_id).maybeSingle();
    if (tenantError) throw Object.assign(new Error("tenant database unavailable"), { statusCode: 503 });
    if (!tenant || ["pausado", "cancelado"].includes(tenant.status)) throw new Error("inactive tenant");
  }
  // A membership change invalidates the old session instead of silently moving its scope.
  if (String(payload.tenantId ?? "") !== String(user.tenant_id ?? "")) throw new Error("changed tenant");
  return { userId: user.id, tenantId: user.tenant_id ?? null, role: user.role, email: user.email, exp: payload.exp };
}

async function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  try {
    req.user = await validateSession(token);
    next();
  } catch (error) {
    if (error.statusCode === 503) return res.status(503).json({ error: "Autenticação temporariamente indisponível." });
    return res.status(401).json({ error: "Token inválido ou expirado." });
  }
}

/**
 * Middleware adicional — só passa se role === 'super_admin'.
 * Use depois de requireAuth.
 */
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ error: "Acesso restrito ao administrador." });
  }
  next();
}

/**
 * Middleware RBAC — permite apenas papéis listados.
 * Super admin tem passe livre.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Não autenticado." });
    }
    if (req.user.role === "super_admin" || allowedRoles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({ error: "Acesso negado: permissões insuficientes para esta ação." });
  };
}

/**
 * Middleware RBAC — bloqueia expressamente o perfil 'viewer' de executar mutações.
 */
function forbidViewer(req, res, next) {
  if (req.user?.role === "viewer") {
    return res.status(403).json({ error: "Perfil de visualizador não possui permissão para executar alterações." });
  }
  next();
}

/**
 * Helpers para criar tokens.
 */
function criarToken(payload, expiresIn = "8h") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { requireAuth, requireSuperAdmin, requireRole, forbidViewer, criarToken, credentialVersion, validateSession };

