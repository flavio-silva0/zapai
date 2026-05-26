"use strict";

// Minimal in-memory Supabase mock to support integration tests.
const tenants = [
  {
    id: 1,
    nome: "Tenant Test",
    phone_number_id: "TEST_PHONE_ID",
    wa_access_token: "TEST_TOKEN",
    clinic_phone: "5511999999999",
    prompt_text: "Você é uma assistente de atendimento via WhatsApp.",
  },
];

const users_whatsapp = [];
const messages = [];
const whatsapp_message_processing = [];
let messageIdCounter = 1;

function tableRows(table) {
  if (table === "tenants") return tenants;
  if (table === "users_whatsapp") return users_whatsapp;
  if (table === "messages") return messages;
  if (table === "whatsapp_message_processing") return whatsapp_message_processing;
  return [];
}

function applyFilters(rows, filters) {
  return rows.filter((row) => {
    for (const filter of filters) {
      if (filter.op === "eq" && String(row[filter.field]) !== String(filter.value)) return false;
      if (filter.op === "not_null" && (row[filter.field] === null || row[filter.field] === undefined)) return false;
    }
    return true;
  });
}

function createSelectBuilder(table) {
  const state = {
    filters: [],
    orderField: null,
    ascending: true,
    limitCount: null,
  };

  const builder = {
    eq(field, value) {
      state.filters.push({ op: "eq", field, value });
      return builder;
    },
    not(field, operator, value) {
      if (operator === "is" && value === null) {
        state.filters.push({ op: "not_null", field });
      }
      return builder;
    },
    order(field, options = {}) {
      state.orderField = field;
      state.ascending = options.ascending !== false;
      return builder;
    },
    limit(count) {
      state.limitCount = count;
      return builder;
    },
    async maybeSingle() {
      const { data, error } = await builder.execute();
      return { data: data[0] || null, error };
    },
    async single() {
      const { data, error } = await builder.execute();
      return { data: data[0] || null, error };
    },
    async execute() {
      let data = applyFilters([...tableRows(table)], state.filters);

      if (state.orderField) {
        data.sort((a, b) => {
          const left = a[state.orderField] || "";
          const right = b[state.orderField] || "";
          if (left < right) return state.ascending ? -1 : 1;
          if (left > right) return state.ascending ? 1 : -1;
          return 0;
        });
      }

      if (typeof state.limitCount === "number") data = data.slice(0, state.limitCount);
      return { data, error: null, count: data.length };
    },
    then(resolve, reject) {
      return builder.execute().then(resolve, reject);
    },
  };

  return builder;
}

function createInsertBuilder(table, payload) {
  const rows = Array.isArray(payload) ? payload : [payload];
  const inserted = rows.map((item) => {
    if (table === "users_whatsapp") {
      const row = {
        id: users_whatsapp.length + 1,
        nome: "Contato",
        is_ai_active: true,
        status_kanban: "Novo",
        ...item,
      };
      users_whatsapp.push(row);
      return row;
    }

    if (table === "messages") {
      const row = {
        id: messageIdCounter++,
        ...item,
        created_at: new Date().toISOString(),
      };
      messages.push(row);
      return row;
    }

    const row = { id: tableRows(table).length + 1, ...item };
    tableRows(table).push(row);
    return row;
  });

  return {
    select() {
      return this;
    },
    async single() {
      return { data: inserted[0] || null, error: null };
    },
    then(resolve, reject) {
      return Promise.resolve({ data: inserted, error: null }).then(resolve, reject);
    },
  };
}

function createUpdateBuilder(table, payload) {
  const state = { filters: [] };

  const builder = {
    eq(field, value) {
      state.filters.push({ op: "eq", field, value });
      return builder;
    },
    select() {
      return builder;
    },
    async single() {
      const data = applyFilters(tableRows(table), state.filters);
      for (const row of data) Object.assign(row, payload);
      return { data: data[0] || null, error: null };
    },
    async execute() {
      const data = applyFilters(tableRows(table), state.filters);
      for (const row of data) Object.assign(row, payload);
      return { data, error: null };
    },
    then(resolve, reject) {
      return builder.execute().then(resolve, reject);
    },
  };

  return builder;
}

function from(table) {
  return {
    select() {
      return createSelectBuilder(table);
    },
    insert(payload) {
      return createInsertBuilder(table, payload);
    },
    update(payload) {
      return createUpdateBuilder(table, payload);
    },
  };
}

async function rpc(name) {
  if (name === "match_knowledge") return { data: [], error: null };
  return { data: [], error: null };
}

function reset() {
  users_whatsapp.length = 0;
  messages.length = 0;
  whatsapp_message_processing.length = 0;
  messageIdCounter = 1;
}

module.exports = { from, messages, reset, rpc, tenants, users_whatsapp, whatsapp_message_processing };
