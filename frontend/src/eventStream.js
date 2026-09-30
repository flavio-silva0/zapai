import { apiUrl } from "./api";

// EventSource cannot send Authorization; use fetch so session tokens never enter URLs.
export function createEventStream() {
  const controller = new AbortController();
  const listeners = new Map();
  let retryTimer;
  const stream = {
    onerror: null,
    addEventListener(type, callback) {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type).add(callback);
    },
    removeEventListener(type, callback) { listeners.get(type)?.delete(callback); },
    close() { controller.abort(); clearTimeout(retryTimer); },
  };
  async function connect() {
    if (controller.signal.aborted) return;
    const token = localStorage.getItem("sofia_token");
    if (!token) return;
    try {
      const response = await fetch(apiUrl("/api/events"), {
        headers: { Authorization: `Bearer ${token}`, Accept: "text/event-stream" },
        signal: controller.signal,
      });
      if ([401, 403].includes(response.status)) return;
      if (!response.ok) throw new Error("Stream indisponível");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let pending = "";
      while (!controller.signal.aborted) {
        const { value, done } = await reader.read();
        if (done) break;
        pending += decoder.decode(value, { stream: true }).replace(/\r\n/g, "\n");
        let separator;
        while ((separator = pending.indexOf("\n\n")) !== -1) {
          const block = pending.slice(0, separator);
          pending = pending.slice(separator + 2);
          let type = "message";
          const data = [];
          for (const line of block.split("\n")) {
            if (line.startsWith("event:")) type = line.slice(6).trim();
            if (line.startsWith("data:")) data.push(line.slice(5).replace(/^ /, ""));
          }
          if (data.length) for (const callback of listeners.get(type) || []) callback({ data: data.join("\n") });
        }
      }
    } catch (error) {
      if (!controller.signal.aborted) stream.onerror?.(error);
    }
    if (!controller.signal.aborted) retryTimer = setTimeout(connect, 3000);
  }
  connect();
  return stream;
}
