// Real application and configured Supabase. Bind only to this computer.
require('dotenv').config();
process.env.TEST_MODE = 'false';
require('../src/index').app.listen(3001, '127.0.0.1', () => {
  console.log('ZapAI: http://127.0.0.1:3001');
});
