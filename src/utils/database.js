"use strict";
let client;
module.exports = function database() {
  if (process.env.TEST_MODE === 'true' || process.env.TEST_MODE === '1') {
    return require('../mocks/supabaseMock');
  }
  return client ||= require('@supabase/supabase-js').createClient(
    process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
};
