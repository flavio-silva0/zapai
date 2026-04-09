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
const JWT_SECRET = process.env.JWT_SECRET ?? "CHANGE_ME";

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
 * Helpers para criar tokens.
 */
function criarToken(payload, expiresIn = "7d") {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

module.exports = { requireAuth, requireSuperAdmin, criarToken };
