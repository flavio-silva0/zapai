// Mock to capture sendMessage calls during tests
const sent = [];

async function sendMessage(to, text, tenant) {
  sent.push({ to, text, tenant, ts: Date.now() });
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 10));
  return true;
}

function getSent() {
  return sent.slice();
}

function clear() {
  sent.length = 0;
}

module.exports = { sendMessage, getSent, clear };
