"use strict";
// Bounded, process-local abuse protection. Use a shared gateway for multi-instance deployments.
function rateLimit({ limit = 20, windowMs = 60000, maxKeys = 10000 } = {}) {
  const entries = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, value] of entries) if (value.until <= now) entries.delete(key);
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= maxKeys) return res.status(503).json({ error: 'Tente novamente em instantes.' });
      entry = { count: 0, until: now + windowMs };
      entries.set(key, entry);
    }
    if (++entry.count > limit) {
      res.setHeader('Retry-After', Math.ceil((entry.until - now) / 1000));
      return res.status(429).json({ error: 'Muitas tentativas. Aguarde antes de tentar novamente.' });
    }
    next();
  };
}
module.exports = { rateLimit };
