"use strict";
const excluded = new Set(['ai_insights', 'email', 'city', 'deal_value', 'deal_service', 'tags', 'notes', 'notes_list', 'tasks']);
const labels = { dor_atual: 'Dor atual', interesse: 'Interesse', disponibilidade: 'Disponibilidade', intencao_compra: 'Intenção de compra' };
function label(key) { return labels[key] || key.replace(/_/g, ' ').replace(/^./, c => c.toUpperCase()); }
function valueText(value) {
  if (value == null) return '';
  if (typeof value === 'boolean') return value ? 'Sim' : 'Não';
  if (Array.isArray(value)) return value.map(valueText).filter(Boolean).join('; ');
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => valueText(v) ? `${label(k)}: ${valueText(v)}` : '').filter(Boolean).join('; ');
  return String(value).trim();
}
function recordedInsights(memory, messages = [], notice) {
  const points = memory && typeof memory === 'object' && !Array.isArray(memory)
    ? Object.entries(memory).filter(([k]) => !excluded.has(k)).map(([k, v]) => valueText(v) ? `${label(k)}: ${valueText(v)}` : '').filter(Boolean) : [];
  const lastCustomerMessage = [...messages].reverse().find(m => m.origin === 'user' && m.texto);
  const summary = points.length ? points.join('. ') : lastCustomerMessage
    ? `Última mensagem registrada do cliente: ${lastCustomerMessage.texto}`
    : messages.length ? `Há ${messages.length} mensagens no histórico consultado. Ainda não há memória registrada do cliente.`
    : 'Ainda não há mensagens ou memória registradas para este contato.';
  return { summary, key_points: points, source: 'saved_records', lead_score: null,
    generation_notice: notice || null, updated_at: new Date().toISOString() };
}
const sentimentLabels = { positivo: 'Positivo', neutro: 'Neutro', cauteloso: 'Cauteloso', objecao: 'Objeção', indeterminado: 'Evidência insuficiente' };
function normalizeAiInsights(data) {
  const text = value => typeof value === 'string' ? value.trim() : '';
  const unique = values => new Set(values.map(value => value.toLocaleLowerCase('pt-BR'))).size === values.length;
  const points = Array.isArray(data?.key_points) ? data.key_points.map(text) : [];
  const steps = Array.isArray(data?.next_steps) ? data.next_steps.map(step => ({
    action: text(step?.action), reason: text(step?.reason), priority: step?.priority,
  })) : [];
  if (!text(data?.summary) || points.length !== 3 || points.some(point => !point) || !unique(points)
      || steps.length !== 5 || !unique(steps.map(step => step.action))
      || steps.some(step => !step.action || !step.reason || !Number.isInteger(step.priority) || step.priority < 0 || step.priority > 10)
      || !Object.hasOwn(sentimentLabels, data?.sentiment) || !text(data?.sentiment_reason)
      || !(data.lead_score === null || (Number.isFinite(data.lead_score) && data.lead_score >= 0 && data.lead_score <= 100))
      || !text(data?.closing_reason)) {
    throw new Error('A IA retornou uma análise incompleta. Tente reanalisar.');
  }
  return {
    schema_version: 2, source: 'ai', summary: text(data.summary), key_points: points,
    next_steps: steps.sort((a, b) => b.priority - a.priority),
    sentiment: data.sentiment, sentiment_label: sentimentLabels[data.sentiment],
    sentiment_reason: text(data.sentiment_reason), lead_score: data.lead_score,
    closing_reason: text(data.closing_reason),
    updated_at: new Date().toISOString(),
  };
}
module.exports = { recordedInsights, normalizeAiInsights };
