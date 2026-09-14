// Local entry point using the actual .env and application, without audit mocks.
const path = require('path');
process.chdir(path.resolve(__dirname, '../../..'));
require('dotenv').config();
process.env.TEST_MODE = '0';
const { app } = require(path.resolve('src/index.js'));
app.listen(3001, '127.0.0.1', () => {
  console.log('ZapAI local: http://127.0.0.1:3001; actual configured database; no audit mocks.');
});
