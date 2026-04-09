/**
 * api.js — Helper centralizado para chamadas ao backend
 *
 * Em desenvolvimento: usa /api/* (proxy do Vite → localhost:3001)
 * Em produção (Vercel): usa VITE_API_URL/* (Railway)
 */

// URL base do backend — vem da variável de ambiente do Vite
// Em dev: vazia (usa proxy local). Em prod: URL do Railway.
const BASE_URL = import.meta.env.VITE_API_URL ?? "";

/**
 * Constrói a URL completa da API
 * @param {string} path - Ex: "/api/stats" ou "/api/patients"
 */
export function apiUrl(path) {
  return `${BASE_URL}${path}`;
}

/**
 * Fetch autenticado — adiciona o token JWT automáticamente
 * @param {string} path - Caminho da API ex: "/api/patients"
 * @param {RequestInit} options - Opções do fetch (method, body, etc.)
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem("sofia_token");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(apiUrl(path), {
    ...options,
    headers,
  });

  return response;
}
