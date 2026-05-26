const http = require('http');
const axios = require('axios');

process.env.TEST_MODE = '1';
process.env.PORT = '0';
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost/mock';
process.env.SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'test-key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaTEST';

const app = require('../../src/index');
const metaMock = require('../../src/mocks/metaMock');
const supabaseMock = require('../../src/mocks/supabaseMock');

async function runTest() {
  const server = http.createServer(app);
  await new Promise((res) => server.listen(0, res));
  const port = server.address().port;
  console.log('[TEST] Server listening on port', port);

  // Prepare webhook payload
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: 'TEST_PHONE_ID' },
              contacts: [{ profile: { name: 'Test User' } }],
              messages: [ { id: 'msg-1', from: '5511999999999', type: 'text', text: { body: 'Olá, por favor responda' } } ]
            }
          }
        ]
      }
    ]
  };

  // Clear mock records
  metaMock.clear();

  // Post webhook
  await axios.post(`http://127.0.0.1:${port}/webhook/whatsapp`, payload, { timeout: 5000 });

  // Wait briefly for async processing
  await new Promise((r) => setTimeout(r, 500));

  const sent = metaMock.getSent();
  console.log('[TEST] metaMock sent:', sent);

  // Validate that at least one message was sent by the bot
  if (!sent.length) {
    console.error('[TEST][FAIL] No messages sent via metaMock');
    process.exit(2);
  }

  // Validate that messages were saved in supabase mock (messages array)
  const msgs = supabaseMock.messages;
  if (!Array.isArray(msgs) || msgs.length === 0) {
    console.error('[TEST][FAIL] No messages saved to supabaseMock');
    process.exit(3);
  }

  console.log('[TEST][OK] Integration test passed');
  server.close();
}

runTest().catch((err) => { console.error('[TEST][ERROR]', err); process.exit(1); });
