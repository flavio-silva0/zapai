"use strict";
const assert = require('node:assert/strict');
const { normalizeAiInsights } = require('../src/utils/contactInsights');
const analysis = {
  summary: 'O cliente quer agendar uma consulta, mas aguarda esclarecimento sobre o profissional. A confirmação depende da resposta da equipe.',
  key_points: ['Intenção de agendamento explícita.', 'Dúvida sobre o profissional responsável.', 'Preferência de atendimento à tarde.'],
  next_steps: [2, 10, 6, 8, 0].map((priority, i) => ({ action: `Ação ${i}`, reason: `Evidência ${i}`, priority })),
  sentiment: 'cauteloso', sentiment_reason: 'O cliente pede informações antes de confirmar.',
  lead_score: 65, closing_reason: 'Há intenção, mas não confirmação.',
};
const result = normalizeAiInsights(analysis);
assert.deepEqual(result.next_steps.map(step => step.priority), [10, 8, 6, 2, 0]);
assert.equal(result.key_points.length, 3);
assert.equal(result.next_steps.length, 5);
assert.equal(result.source, 'ai');
assert.equal(result.schema_version, 2);
assert.equal(result.sentiment_label, 'Cauteloso');
assert.equal(normalizeAiInsights({ ...analysis, lead_score: 0 }).lead_score, 0);
assert.equal(normalizeAiInsights({ ...analysis, lead_score: null, sentiment: 'indeterminado' }).lead_score, null);
for (const invalid of [
  { key_points: analysis.key_points.slice(0, 2) },
  { key_points: [...analysis.key_points, 'Quarto ponto'] },
  { key_points: ['Repetido', 'repetido', 'Outro'] },
  { next_steps: analysis.next_steps.slice(0, 4) },
  { next_steps: analysis.next_steps.map(step => ({ ...step, action: 'Repetido' })) },
  { next_steps: analysis.next_steps.map(step => ({ ...step, priority: 11 })) },
  { next_steps: analysis.next_steps.map(step => ({ ...step, priority: '8' })) },
  { lead_score: 101 }, { lead_score: -1 }, { lead_score: '65' },
  { sentiment: 'inventado' }, { sentiment_reason: '' }, { closing_reason: '' }, { summary: '' },
]) assert.throws(() => normalizeAiInsights({ ...analysis, ...invalid }));
assert.throws(() => normalizeAiInsights(null));
console.log('Contact insights passed: complete analysis, three unique points, five ranked steps, evidence and bounded estimates.');
