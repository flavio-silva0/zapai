/**
 * api.js — Helper centralizado para chamadas ao backend
 *
 * Em desenvolvimento: usa /api/* (proxy do Vite → localhost:3001)
 * Em produção (Vercel): usa VITE_API_URL/* (Render/Railway)
 */

// URL base do backend — vem da variável de ambiente do Vite
// Em dev: vazia (usa proxy local). Em prod: URL configurada.
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Constrói a URL completa da API
 * @param {string} path - Ex: "/api/stats" ou "/api/patients"
 */
export function apiUrl(path) {
  return `${BASE_URL}${path}`;
}

// Armazena requisições GET em andamento para evitar chamadas simultâneas duplicadas
const inFlightGets = new Map();

/**
 * Fetch com tratamento inteligente de cabeçalhos e deduplicação de requisições GET simultâneas
 * @param {string} path - Caminho da API ex: "/api/patients"
 * @param {RequestInit} options - Opções do fetch (method, body, etc.)
 */
export async function apiFetch(path, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const token = localStorage.getItem("sofia_token");

  // In-flight deduplication apenas para GET
  const isGet = method === "GET" && !options.body;
  const inFlightKey = isGet ? `${token || "anon"}:${path}` : null;

  if (inFlightKey && inFlightGets.has(inFlightKey)) {
    try {
      const activeResponse = await inFlightGets.get(inFlightKey);
      return activeResponse.clone();
    } catch {
      // Se a requisição ativa falhar, prossegue com nova tentativa
    }
  }

  const headers = {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // Não adiciona Content-Type em GET ou quando o corpo for FormData/Blob/etc.
  const isJsonBody = options.body && typeof options.body === "string" && !headers["Content-Type"];
  if (isJsonBody && method !== "GET" && method !== "HEAD") {
    headers["Content-Type"] = "application/json";
  }

  const fetchPromise = fetch(apiUrl(path), {
    ...options,
    method,
    headers,
  });

  if (inFlightKey) {
    inFlightGets.set(inFlightKey, fetchPromise);
  }

  try {
    const response = await fetchPromise;
    return response;
  } finally {
    if (inFlightKey) {
      inFlightGets.delete(inFlightKey);
    }
  }
}
