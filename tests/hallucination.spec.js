const assert = require('assert');
const { detectPossibleHallucination } = require('../src/utils/hallucination');

console.log('Running hallucination heuristics tests...');

// Caso 1: menciona empresas e nomes sem RAG -> deve detectar
const text1 = 'Nós trabalhamos com Tozzo e Aceville em cases recentes.';
assert.strictEqual(detectPossibleHallucination(text1, false), true, 'Deveria detectar alucinação quando cita nomes sem RAG');

// Caso 2: menciona empresas mas RAG usado -> não detectar
const text2 = 'Conforme nossa base, Tozzo é parceiro.';
assert.strictEqual(detectPossibleHallucination(text2, true), false, 'Não deve detectar se RAG foi usado');

// Caso 3: texto curto sem nomes -> não detectar
const text3 = 'Olá! Tudo bem? Posso ajudar.';
assert.strictEqual(detectPossibleHallucination(text3, false), false, 'Não deve detectar para texto genérico');

// Caso 4: menção de "cliente" mas sem nome próprio -> não detectar
const text4 = 'Temos clientes no setor logístico.';
assert.strictEqual(detectPossibleHallucination(text4, false), false, 'Não detecta quando não há nomes próprios');

console.log('All tests passed ✅');
