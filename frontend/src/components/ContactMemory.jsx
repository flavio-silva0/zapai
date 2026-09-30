import { Sparkles } from "lucide-react";

const CRM_FIELDS = new Set([
  "ai_insights", "email", "city", "deal_value", "deal_service",
  "tags", "notes", "notes_list", "tasks",
]);
const LABELS = {
  dor_atual: "Dor atual",
  interesse: "Interesse",
  disponibilidade: "Disponibilidade",
  intencao_compra: "Intenção de compra",
  preferencias: "Preferências",
  objetivo: "Objetivo",
  restricoes: "Restrições",
  historico: "Histórico",
};

function formatValue(value) {
  if (value == null) return "";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  if (Array.isArray(value)) return value.map(formatValue).filter(Boolean).join("; ");
  if (typeof value === "object") {
    return Object.entries(value).map(([key, item]) => {
      const text = formatValue(item);
      return text ? `${labelFor(key)}: ${text}` : "";
    }).filter(Boolean).join("; ");
  }
  return String(value).trim();
}

function labelFor(key) {
  return LABELS[key] || key.replace(/_/g, " ").replace(/^./, (letter) => letter.toUpperCase());
}

export function memoryEntries(memory) {
  if (!memory || typeof memory !== "object" || Array.isArray(memory)) return [];
  return Object.entries(memory)
    .filter(([key]) => !CRM_FIELDS.has(key))
    .map(([key, value]) => ({ key, label: labelFor(key), text: formatValue(value) }))
    .filter(({ text }) => text);
}

export default function ContactMemory({ memory }) {
  const entries = memoryEntries(memory);
  return (
    <section className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
        <Sparkles size={15} className="text-teal-600" />
        Memória do cliente
      </h3>
      <p className="text-[11px] text-[var(--text-muted)] mt-2 mb-4">Informações salvas pela Zap durante os atendimentos deste contato.</p>
      {entries.length ? (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {entries.map(({ key, label, text }) => (
            <div key={key} className="min-w-0 p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)]">
              <dt className="text-[11px] font-bold text-teal-600 mb-1.5">{label}</dt>
              <dd className="text-xs leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words">{text}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p className="text-xs text-[var(--text-muted)] italic">Ainda não há informações de memória registradas para este contato.</p>
      )}
    </section>
  );
}
