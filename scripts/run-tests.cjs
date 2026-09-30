const { spawnSync } = require('node:child_process');
const env = { ...process.env, TEST_MODE: 'true', USE_REAL_GEMINI: 'false',
  NODE_ENV: 'test', JWT_SECRET: 'isolated-test-secret-not-for-production',
  SUPABASE_URL: 'http://127.0.0.1/mock', SUPABASE_SERVICE_KEY: 'mock',
  GEMINI_API_KEY: 'mock', META_APP_SECRET: '', META_VERIFY_TOKEN: 'mock' };
for (const file of ['account-registration-http.test.js', 'account-registration.test.js', 'ai-safety.test.js', 'hallucination.spec.js', 'security-regressions.test.js', 'notifications.test.js',
  'contact-insights.test.js', 'ai-quota-postgres.test.js', 'integration/webhook.integration.test.js', 'integration/integration.spec.js']) {
  const result = spawnSync(process.execPath, ['tests/' + file], { env, stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
