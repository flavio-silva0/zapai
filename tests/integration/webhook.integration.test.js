// Integration test (lightweight) for TEST_MODE behavior

process.env.TEST_MODE = 'true';
// Minimal envs to avoid early-createClient errors in route modules
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-service-key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIza_TEST_KEY';

const assert = require('assert');
const { enviarMensagemMeta, consultarGeminiDinamicamente, testState, clearTestState } = require('../../src/index.js');

async function run() {
  clearTestState();

  // Test: Gemini returns clean response
  const res1 = await consultarGeminiDinamicamente([], { textoUsuario: 'Olá, preciso de ajuda' }, { id: 'tenant-1' });
  assert.strictEqual(res1.text, 'Resposta final limpa e natural.');
  console.log('✅ Gemini clean response OK');

  // Test: Gemini draft detection
  const resDraft = await consultarGeminiDinamicamente([], { textoUsuario: '__DRAFT__ rascunho interno' }, { id: 'tenant-1' });
  assert.ok(resDraft.text.toLowerCase().includes('draft'));
  console.log('✅ Gemini draft response OK');

  // Test: Gemini hallucination detection (returns possibleHallucination true)
  const resHall = await consultarGeminiDinamicamente([], { textoUsuario: '__HALLU__ inventou cliente' }, { id: 'tenant-1' });
  assert.strictEqual(resHall.possibleHallucination, true);
  console.log('✅ Gemini hallucination response OK');

  // Test: enviarMensagemMeta returns the simulated message object in TEST_MODE
  const ret = await enviarMensagemMeta('5511999999999', 'Mensagem de teste', { nome: 'tenant-test' });
  assert.ok(ret && ret.text === 'Mensagem de teste');
  console.log('✅ enviarMensagemMeta mock returned message OK');

  console.log('\nAll integration checks passed ✅');
  process.exit(0);
}

run().catch((err) => {
  console.error('Integration test failed:', err);
  process.exit(1);
});
