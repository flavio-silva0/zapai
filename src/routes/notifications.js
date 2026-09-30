"use strict";
const express = require('express');
const database = require('../utils/database');
const { requireAuth } = require('../middleware/authMiddleware');
const router = express.Router();

function buildNotifications(messages, contacts, now = Date.now()) {
  const names = new Map(contacts.map(p => [`${p.tenant_id}:${p.id}`, p.nome || 'Contato sem nome']));
  const cutoff = now - 30 * 24 * 60 * 60 * 1000;
  const recent = date => Number.isFinite(Date.parse(date)) && Date.parse(date) >= cutoff && Date.parse(date) <= now;
  const notifications = contacts.filter(p => recent(p.created_at)).map(p => ({
    id: `contact:${p.id}`, type: 'newConversation', title: 'Novo contato no CRM',
    text: `${p.nome || 'Contato sem nome'} foi adicionado ao CRM.`,
    created_at: p.created_at, patient_id: p.id,
    href: `/painel/crm/contato/${encodeURIComponent(p.id)}`,
  }));
  for (const message of messages) {
    if (message.origin !== 'user' || !message.patient_id || !recent(message.created_at)) continue;
    const name = names.get(`${message.tenant_id}:${message.patient_id}`) || 'Cliente';
    notifications.push({ id: `message:${message.id}`, type: 'newMessages',
      title: `Mensagem de ${name}`, text: String(message.texto || 'Mensagem recebida no WhatsApp').slice(0, 240),
      created_at: message.created_at, patient_id: message.patient_id,
      href: `/painel/chat?patientId=${encodeURIComponent(message.patient_id)}` });
  }
  return notifications.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, 100);
}

router.get('/', requireAuth, async (req, res) => {
  const tenantId = req.user.tenantId;
  if (!tenantId && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Empresa não identificada.' });
  const db = database();
  const scoped = query => tenantId ? query.eq('tenant_id', tenantId) : query;
  try {
    const [messageResult, contactResult] = await Promise.all([
      scoped(db.from('messages').select('id, patient_id, tenant_id, texto, origin, created_at').eq('origin', 'user'))
        .order('created_at', { ascending: false }).limit(100),
      scoped(db.from('users_whatsapp').select('id, tenant_id, nome, created_at'))
        .order('created_at', { ascending: false }).limit(100),
    ]);
    if (messageResult.error || contactResult.error) throw new Error('query failed');
    const messages = messageResult.data || [];
    const contacts = contactResult.data || [];
    const known = new Set(contacts.map(p => String(p.id)));
    const missingIds = [...new Set(messages.map(m => m.patient_id).filter(id => id && !known.has(String(id))))];
    if (missingIds.length) {
      const result = await scoped(db.from('users_whatsapp').select('id, tenant_id, nome, created_at').in('id', missingIds));
      if (result.error) throw new Error('contact query failed');
      contacts.push(...(result.data || []));
    }
    res.set('Cache-Control', 'no-store');
    res.json({ notifications: buildNotifications(messages, contacts) });
  } catch {
    res.status(503).json({ error: 'Não foi possível atualizar as notificações. Tente novamente.' });
  }
});
module.exports = { router, buildNotifications };
