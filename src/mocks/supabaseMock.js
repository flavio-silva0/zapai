// Minimal in-memory supabase mock to support integration tests
const tenants = [
  {
    id: 1,
    nome: "Tenant Test",
    phone_number_id: "TEST_PHONE_ID",
    wa_access_token: "TEST_TOKEN",
    clinic_phone: "5511999999999",
  },
];

const users_whatsapp = [];
const messages = [];
let messageIdCounter = 1;

function from(table) {
  return {
    select: function () {
      const args = arguments;
      return {
        eq: function (field, value) {
          const self = this;
          return {
            single: async function () {
              if (table === "tenants") {
                console.log('[SUPABASE-MOCK] tenant lookup', field, value);
                const t = tenants.find((t) => String(t[field]) == String(value));
                return { data: t || null };
              }
              if (table === "users_whatsapp") {
                const u = users_whatsapp.find((u) => u[field] == value);
                return { data: u || null };
              }
              return { data: null };
            },
            maybeSingle: async function () {
              if (table === "tenants") {
                console.log('[SUPABASE-MOCK] tenant maybeSingle lookup', field, value);
                const t = tenants.find((t) => String(t[field]) == String(value));
                return { data: t || null };
              }
              if (table === "users_whatsapp") {
                const u = users_whatsapp.find((u) => u[field] == value);
                return { data: u || null };
              }
              return { data: null };
            },
            limit: function () { return this; },
            order: function () { return this; },
            single: async function () { return { data: null }; },
          };
        },
        not: function () { return this; },
        maybeSingle: async function () { return { data: null }; },
        insert: function (obj) {
          if (table === "users_whatsapp") {
            const id = users_whatsapp.length + 1;
            const row = { id, ...obj };
            users_whatsapp.push(row);
            return { data: row, error: null };
          }
          if (table === "messages") {
            const id = messageIdCounter++;
            const row = { id, ...obj, created_at: new Date().toISOString() };
            messages.push(row);
            return { data: row, error: null };
          }
          return { data: null, error: null };
        },
        update: function (obj) {
          return {
            eq: async function (_field, _val) {
              if (table === "users_whatsapp") {
                const u = users_whatsapp.find((x) => x.id == _val || x.telefone == _val);
                if (u) Object.assign(u, obj);
                return { data: u || null, error: null };
              }
              return { data: null, error: null };
            },
            select: async function () { return { data: null, error: null }; },
            single: async function () { return { data: null, error: null }; },
          };
        },
        selectAll: async function () { return { data: tenants }; },
      };
    },
    rpc: async function (name, params) {
      if (name === "match_knowledge") return { data: [], error: null };
      return { data: [], error: null };
    },
  };
}

module.exports = { from, tenants, users_whatsapp, messages };
