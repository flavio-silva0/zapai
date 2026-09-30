"use strict";
const { AsyncLocalStorage } = require('node:async_hooks');
const database = require('./database');
const context = new AsyncLocalStorage();

async function reserve(tenantId) {
  if (process.env.AI_DISABLED === 'true') throw Object.assign(new Error('IA temporariamente pausada.'), { statusCode: 503, quota: true });
  if (!tenantId) throw Object.assign(new Error('Tenant obrigatório para usar IA.'), { statusCode: 403 });
  const { data, error } = await database().rpc('reserve_ai_call', { p_tenant_id: tenantId });
  if (error) throw Object.assign(new Error('Controle de uso de IA indisponível.'), { statusCode: 503, quota: true });
  if (data !== true) throw Object.assign(new Error('Limite de IA atingido ou plano inativo.'), { statusCode: 429, quota: true });
}

// Reserve before EVERY provider attempt: embeddings, retries, repair, memory and chat.
function quotaModel(client, tenantId, options) {
  const model = client.getGenerativeModel({ ...options, generationConfig: {
    ...options.generationConfig,
    maxOutputTokens: Math.min(options.generationConfig?.maxOutputTokens || 1024, 2048),
  } });
  function wrap(target) {
    return new Proxy(target, {
      get(object, name) {
        const value = object[name];
        if (typeof value !== 'function') return value;
        if (name === 'startChat') return (...args) => wrap(value.apply(object, args));
        if (['generateContent', 'embedContent', 'sendMessage'].includes(name)) {
          return async (...args) => {
            if (Buffer.byteLength(JSON.stringify(args), 'utf8') > 6 * 1024 * 1024) {
              throw Object.assign(new Error('Conteúdo excede o limite de entrada da IA.'), { statusCode: 413 });
            }
            await reserve(typeof tenantId === 'function' ? tenantId() : tenantId);
            return value.apply(object, args);
          };
        }
        return value.bind(object);
      },
    });
  }
  return wrap(model);
}
module.exports = { reserve, quotaModel, context };
