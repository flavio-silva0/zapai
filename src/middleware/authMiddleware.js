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
function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Token não fornecido." });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = {
      userId:   payload.userId,
      tenantId: payload.tenantId ?? null,  // null para super_admin
      role:     payload.role,
      email:    payload.email,
    };
    next();
  } catch {
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
function criarToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { requireAuth, requireSuperAdmin, requireRole, forbidViewer, criarToken };

