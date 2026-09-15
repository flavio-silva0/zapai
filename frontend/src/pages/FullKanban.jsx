import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, apiUrl } from "../api";
import ContactHubSpot from "./ContactHubSpot";
import {
  MessageSquare, Zap, Search, Plus, X, Phone,
  Clock, Bot, User, Check, Flame, Sun, Snowflake,
  Sparkles, Calendar, ArrowUpRight, Tag, FileText,
  Edit3, Save, RefreshCw, ExternalLink, Copy, CheckCircle2,
  SlidersHorizontal, CheckCheck, Send, LayoutGrid
} from "lucide-react";

// ── Colunas do Funil Kanban ─────────────────────────────────
const COLUMNS = [
  {
    status: "Novo",
    label: "Novos Leads",
    subtitle: "Aguardando qualificação",
    dot: "bg-slate-400",
    dotGlow: "shadow-slate-400/50",
    headerGrad: "from-slate-500/10 via-slate-500/5 to-transparent",
    borderColor: "rgba(148,163,184,0.25)",
    borderActive: "rgba(148,163,184,0.6)",
    dragBg: "rgba(148,163,184,0.05)",
    countColor: "text-slate-400",
    countBg: "bg-slate-400/10",
  },
  {
    status: "Em Atendimento",
    label: "Em Atendimento",
    subtitle: "Conversa ativa ou triagem",
    dot: "bg-amber-400",
    dotGlow: "shadow-amber-400/50",
    headerGrad: "from-amber-500/10 via-amber-500/5 to-transparent",
    borderColor: "rgba(251,191,36,0.25)",
    borderActive: "rgba(251,191,36,0.6)",
    dragBg: "rgba(251,191,36,0.05)",
    countColor: "text-amber-400",
    countBg: "bg-amber-400/10",
  },
  {
    status: "Agendado",
    label: "Agendados & Vendas",
    subtitle: "Convertidos com sucesso",
    dot: "bg-emerald-400",
    dotGlow: "shadow-emerald-400/50",
    headerGrad: "from-emerald-500/10 via-emerald-500/5 to-transparent",
    borderColor: "rgba(52,211,153,0.25)",
    borderActive: "rgba(52,211,153,0.6)",
    dragBg: "rgba(52,211,153,0.05)",
    countColor: "text-emerald-400",
    countBg: "bg-emerald-400/10",
  },
];

// ── Utilitários de Formatação ───────────────────────────────
function formatPhone(phone) {
  if (!phone) return "";
  const clean = String(phone).replace("@c.us", "").replace(/\D/g, "");
  if (clean.length === 13 && clean.startsWith("55")) {
    return `+55 (${clean.slice(2, 4)}) ${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  if (clean.length === 11) {
    return `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
  }
  return `+${clean}`;
}

function getInitials(name, phone) {
  if (name && name !== "Contato" && name !== "Novo Lead") {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  }
  const clean = (phone || "").replace(/\D/g, "");
  return clean.slice(-2) || "WA";
}

const AVATAR_COLORS = [
  "from-teal-500 to-emerald-600",
  "from-cyan-500 to-blue-600",
  "from-indigo-500 to-violet-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

function getAvatarColor(identifier = "") {
  let hash = 0;
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getLeadScore(patient) {
  if (patient.status_kanban === "Agendado") {
    return {
      score: 95,
      temp: "hot",
      label: "Quente",
      icon: Flame,
      color: "text-rose-500",
      bg: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400",
    };
  }
  if (patient.status_kanban === "Em Atendimento") {
    return {
      score: 65,
      temp: "warm",
      label: "Morno",
      icon: Sun,
      color: "text-amber-500",
      bg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
    };
  }
  return {
    score: 30,
    temp: "cold",
    label: "Frio",
    icon: Snowflake,
    color: "text-blue-400",
    bg: "bg-blue-400/15 border-blue-400/30 text-blue-600 dark:text-blue-400",
  };
}

// ── Modal de Novo Contato ───────────────────────────────────
function NewContactModal({ isOpen, onClose, onContactCreated }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [status, setStatus] = useState("Novo");
  const [tag, setTag] = useState("Prospecção");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!telefone.trim()) {
      setError("Telefone WhatsApp é obrigatório.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.trim() || "Novo Lead",
          telefone: telefone.trim(),
          status_kanban: status,
          tags: tag ? [tag] : [],
          notes: notes.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Falha ao criar contato.");
      onContactCreated(data);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl shadow-2xl p-6 z-10 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <Plus size={18} className="text-teal-600" />
            Cadastrar Novo Lead
          </h3>
          <button onClick={onClose} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Nome do Contato
            </label>
            <input
              type="text"
              placeholder="Ex: Carlos Ferreira"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] outline-hidden focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              WhatsApp (com DDD) *
            </label>
            <input
              type="text"
              placeholder="Ex: 11999998888"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] outline-hidden focus:border-teal-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Estágio Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] outline-hidden focus:border-teal-500"
              >
                <option value="Novo">Novos Leads</option>
                <option value="Em Atendimento">Em Atendimento</option>
                <option value="Agendado">Agendado</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
                Etiqueta Principal
              </label>
              <input
                type="text"
                placeholder="Ex: VIP, Indicação"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] outline-hidden focus:border-teal-500"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[var(--text-secondary)] block mb-1">
              Observações Iniciais
            </label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre a demanda do cliente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full text-xs p-3 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] outline-hidden focus:border-teal-500 resize-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white hover:bg-teal-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? "Cadastrando..." : "Cadastrar no Funil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Componente Principal FullKanban / CRM ───────────────────
export default function FullKanban() {
  const [patients, setPatients]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [draggingId, setDraggingId]     = useState(null);
  const [dragOver, setDragOver]         = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [crmView, setCrmView]           = useState("kanban"); // "kanban" | "contact"
  const [searchQuery, setSearchQuery]   = useState("");
  const [aiFilter, setAiFilter]         = useState("all"); // 'all' | 'ai' | 'human'
  const [tempFilter, setTempFilter]     = useState("all"); // 'all' | 'hot' | 'warm' | 'cold'
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const navigate                        = useNavigate();

  const fetchPatients = async () => {
    try {
      const res = await apiFetch("/api/patients");
      const data = await res.json();
      setPatients(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Erro ao buscar contatos do CRM:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // EventSource em tempo real
  useEffect(() => {
    const token = localStorage.getItem("sofia_token");
    const es = new EventSource(apiUrl(`/api/events?token=${token || ""}`));

    const handlePatientUpdate = (e) => {
      try {
        const updated = JSON.parse(e.data);
        if (updated?.id) {
          setPatients((prev) =>
            prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p))
          );
          setSelectedPatient((curr) => (curr?.id === updated.id ? { ...curr, ...updated } : curr));
        } else {
          fetchPatients();
        }
      } catch {
        fetchPatients();
      }
    };

    es.addEventListener("patient_updated", handlePatientUpdate);
    es.addEventListener("new_message", fetchPatients);

    return () => {
      es.removeEventListener("patient_updated", handlePatientUpdate);
      es.removeEventListener("new_message", fetchPatients);
      es.close();
    };
  }, []);

  // Drag & Drop
  const handleDragStart = (e, patientId) => {
    setDraggingId(patientId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, status) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(status);
  };

  const handleDrop = async (e, novoStatus) => {
    e.preventDefault();
    setDragOver(null);
    if (!draggingId) return;

    const paciente = patients.find((p) => p.id === draggingId);
    if (!paciente || paciente.status_kanban === novoStatus) {
      setDraggingId(null);
      return;
    }

    setPatients((prev) =>
      prev.map((p) => (p.id === draggingId ? { ...p, status_kanban: novoStatus } : p))
    );
    if (selectedPatient?.id === draggingId) {
      setSelectedPatient((prev) => ({ ...prev, status_kanban: novoStatus }));
    }
    setDraggingId(null);

    try {
      await apiFetch(`/api/patients/${draggingId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status_kanban: novoStatus }),
      });
    } catch {
      fetchPatients();
    }
  };

  const handleDragEnd = () => {
    setDraggingId(null);
    setDragOver(null);
  };

  const handleStatusChange = async (patientId, novoStatus) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, status_kanban: novoStatus } : p))
    );
    setSelectedPatient((prev) => (prev?.id === patientId ? { ...prev, status_kanban: novoStatus } : prev));
    try {
      await apiFetch(`/api/patients/${patientId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status_kanban: novoStatus }),
      });
    } catch {
      fetchPatients();
    }
  };

  const handleAiToggle = async (patientId, nextState) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, is_ai_active: nextState } : p))
    );
    setSelectedPatient((prev) => (prev?.id === patientId ? { ...prev, is_ai_active: nextState } : prev));
    try {
      await apiFetch(`/api/patients/${patientId}/ai-status`, {
        method: "PUT",
        body: JSON.stringify({ is_ai_active: nextState }),
      });
    } catch {
      fetchPatients();
    }
  };

  const handleUpdatePatient = async (patientId, updates) => {
    setPatients((prev) =>
      prev.map((p) => (p.id === patientId ? { ...p, ...updates } : p))
    );
    setSelectedPatient((prev) => (prev?.id === patientId ? { ...prev, ...updates } : prev));
    try {
      await apiFetch(`/api/patients/${patientId}`, {
        method: "PUT",
        body: JSON.stringify(updates),
      });
    } catch (err) {
      fetchPatients();
      throw err;
    }
  };

  const handleCardClick = (patient) => {
    setSelectedPatient(patient);
    setCrmView("contact");
  };

  const handleDoubleClick = (patientId) => {
    navigate(`/painel/chat?patientId=${patientId}`);
  };

  // Filtragem de Leads
  const filteredPatients = useMemo(() => {
    return patients.filter((p) => {
      // 1. Busca textual
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const nomeMatch = (p.nome || "").toLowerCase().includes(query);
        const foneMatch = (p.telefone || "").replace(/\D/g, "").includes(query.replace(/\D/g, ""));
        const tagMatch = (p.ai_memory?.tags || []).some((t) => t.toLowerCase().includes(query));
        if (!nomeMatch && !foneMatch && !tagMatch) return false;
      }

      // 2. Filtro de IA
      if (aiFilter === "ai" && !p.is_ai_active) return false;
      if (aiFilter === "human" && p.is_ai_active) return false;

      // 3. Filtro de Temperatura
      if (tempFilter !== "all") {
        const lead = getLeadScore(p);
        if (lead.temp !== tempFilter) return false;
      }

      return true;
    });
  }, [patients, searchQuery, aiFilter, tempFilter]);

  // Contadores para KPIs
  const totalLeads = patients.length;
  const emAtendimentoCount = patients.filter((p) => (p.status_kanban || "Novo") === "Em Atendimento").length;
  const agendadosCount = patients.filter((p) => (p.status_kanban || "Novo") === "Agendado").length;
  const conversionRate = totalLeads > 0 ? Math.round((agendadosCount / totalLeads) * 100) : 0;

  if (crmView === "contact" && selectedPatient) {
    return (
      <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-base)] animate-fade-in">
        {/* Barra de Abas do CRM (Estilo Workspace Multi-Tab do HubSpot) */}
        <div className="px-6 pt-3 pb-0 flex items-center gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <button
            onClick={() => setCrmView("kanban")}
            className="px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]"
          >
            <LayoutGrid size={14} />
            Quadro Funil Kanban
          </button>

          <div className="px-4 py-2.5 rounded-t-xl text-xs font-bold bg-[var(--bg-base)] border-t-2 border-teal-500 text-teal-600 dark:text-teal-400 flex items-center gap-2 shadow-xs">
            <User size={14} />
            <span className="truncate max-w-[200px]">
              {selectedPatient.nome || formatPhone(selectedPatient.telefone)}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatient(null);
                setCrmView("kanban");
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Fechar aba"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <ContactHubSpot
          contactId={selectedPatient.id}
          onBack={() => setCrmView("kanban")}
        />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 h-full flex flex-col min-h-0 bg-[var(--bg-base)]">

      {/* ── Barra de Abas do CRM (Estilo Workspace Multi-Tab do HubSpot) ── */}
      {selectedPatient && (
        <div className="flex items-center gap-2 mb-5 bg-[var(--bg-surface)] p-1.5 rounded-2xl border border-[var(--border-subtle)] w-fit shrink-0 shadow-xs">
          <button
            onClick={() => setCrmView("kanban")}
            className="px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 bg-teal-600 text-white shadow-xs"
          >
            <LayoutGrid size={14} />
            Quadro Funil
          </button>
          <div className="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 bg-[var(--bg-base)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)]">
            <button
              onClick={() => setCrmView("contact")}
              className="cursor-pointer flex items-center gap-2"
              title="Abrir aba completa do contato estilo HubSpot"
            >
              <User size={14} className="text-teal-600" />
              <span className="truncate max-w-[180px]">
                {selectedPatient.nome || formatPhone(selectedPatient.telefone)}
              </span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedPatient(null);
              }}
              className="ml-1 p-0.5 rounded-full hover:bg-[var(--bg-surface-active)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              title="Fechar aba do contato"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}

      {/* ── Header Principal do CRM ── */}
      <header className="shrink-0 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              CRM & Funil WhatsApp Oficial
            </span>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)]">
            Pipeline de Atendimentos
          </h1>
          <p className="text-[var(--text-secondary)] text-xs mt-0.5">
            Clique no card para abrir a ficha completa do contato · Arraste entre as colunas para atualizar a etapa
          </p>
        </div>

        {/* Ações do Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPatients()}
            className="p-2.5 rounded-xl border border-[var(--border-medium)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs hover:bg-teal-700 transition-all flex items-center gap-2 shadow-md shadow-teal-500/20 cursor-pointer"
          >
            <Plus size={15} />
            Novo Lead
          </button>
        </div>
      </header>

      {/* ── KPIs Rápidos do Funil ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 mb-6">
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-500/10 text-slate-500 flex items-center justify-center font-black">
            <User size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Total de Leads</p>
            <p className="text-xl font-black text-[var(--text-primary)]">{totalLeads}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-black">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Em Atendimento</p>
            <p className="text-xl font-black text-amber-600 dark:text-amber-400">{emAtendimentoCount}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-black">
            <CheckCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Agendados / Vendas</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">{agendadosCount}</p>
          </div>
        </div>

        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3.5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 text-teal-600 flex items-center justify-center font-black">
            <Sparkles size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-wider">Conversão</p>
            <p className="text-xl font-black text-teal-600 dark:text-teal-400">{conversionRate}%</p>
          </div>
        </div>
      </div>

      {/* ── Barra de Filtros e Busca ── */}
      <div className="shrink-0 mb-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-3">
        {/* Campo de Busca */}
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou #tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] text-xs"
            >
              ×
            </button>
          )}
        </div>

        {/* Filtros em Pílulas */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filtro IA */}
          <div className="flex items-center rounded-xl bg-[var(--bg-base)] p-1 border border-[var(--border-medium)] text-[11px] font-semibold">
            <button
              onClick={() => setAiFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${aiFilter === "all" ? "bg-teal-600 text-white" : "text-[var(--text-secondary)]"}`}
            >
              Todos
            </button>
            <button
              onClick={() => setAiFilter("ai")}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${aiFilter === "ai" ? "bg-teal-600 text-white" : "text-[var(--text-secondary)]"}`}
            >
              <Bot size={11} /> IA
            </button>
            <button
              onClick={() => setAiFilter("human")}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${aiFilter === "human" ? "bg-teal-600 text-white" : "text-[var(--text-secondary)]"}`}
            >
              <User size={11} /> Humano
            </button>
          </div>

          {/* Filtro Temperatura */}
          <div className="flex items-center rounded-xl bg-[var(--bg-base)] p-1 border border-[var(--border-medium)] text-[11px] font-semibold">
            <button
              onClick={() => setTempFilter("all")}
              className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${tempFilter === "all" ? "bg-teal-600 text-white" : "text-[var(--text-secondary)]"}`}
            >
              Temp
            </button>
            <button
              onClick={() => setTempFilter("hot")}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${tempFilter === "hot" ? "bg-rose-500 text-white" : "text-[var(--text-secondary)]"}`}
              title="Quentes"
            >
              🔥
            </button>
            <button
              onClick={() => setTempFilter("warm")}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${tempFilter === "warm" ? "bg-amber-500 text-white" : "text-[var(--text-secondary)]"}`}
              title="Mornos"
            >
              🌤️
            </button>
            <button
              onClick={() => setTempFilter("cold")}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${tempFilter === "cold" ? "bg-blue-500 text-white" : "text-[var(--text-secondary)]"}`}
              title="Frios"
            >
              ❄️
            </button>
          </div>
        </div>
      </div>

      {/* ── Quadro Kanban ── */}
      <div className="flex-1 min-h-0 overflow-x-auto">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-teal-600/10 border border-teal-600/20 flex items-center justify-center animate-pulse">
              <Zap size={22} className="text-teal-600" />
            </div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">Carregando CRM & Funil...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-full min-w-[850px] pb-4">
            {COLUMNS.map((col) => {
              const grupo = filteredPatients.filter(
                (p) => (p.status_kanban || "Novo") === col.status
              );
              const isDropZone = dragOver === col.status;

              return (
                <div
                  key={col.status}
                  onDragOver={(e) => handleDragOver(e, col.status)}
                  onDrop={(e) => handleDrop(e, col.status)}
                  onDragLeave={() => setDragOver(null)}
                  className="flex flex-col rounded-2xl overflow-hidden transition-all duration-200 bg-[var(--bg-surface)] border"
                  style={{
                    borderColor: isDropZone ? col.borderActive : col.borderColor,
                    background: isDropZone ? col.dragBg : undefined,
                    boxShadow: isDropZone ? "0 0 0 2px rgba(20,184,166,0.3)" : undefined,
                  }}
                >
                  {/* Cabeçalho da Coluna */}
                  <div
                    className={`px-4 py-3.5 bg-gradient-to-r ${col.headerGrad} shrink-0 border-b border-[var(--border-subtle)] flex items-center justify-between`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className={`w-2.5 h-2.5 rounded-full ${col.dot} shadow-sm ${col.dotGlow}`} />
                      <div>
                        <h3 className="font-bold text-sm text-[var(--text-primary)] leading-tight">
                          {col.label}
                        </h3>
                        <p className="text-[10px] text-[var(--text-muted)] leading-tight">
                          {col.subtitle}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-black px-2.5 py-0.5 rounded-full ${col.countBg} ${col.countColor}`}
                    >
                      {grupo.length}
                    </span>
                  </div>

                  {/* Lista de Cards da Coluna */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-3 min-h-[220px]">
                    {grupo.length === 0 ? (
                      <div
                        className="h-32 flex flex-col items-center justify-center rounded-xl border-2 border-dashed text-xs text-[var(--text-muted)] text-center p-4 transition-colors"
                        style={{
                          borderColor: isDropZone ? col.borderActive : "rgba(148,163,184,0.15)",
                        }}
                      >
                        <p>{isDropZone ? "Solte o contato aqui para mover" : "Nenhum lead nesta etapa"}</p>
                        <button
                          onClick={() => {
                            setIsNewModalOpen(true);
                          }}
                          className="mt-2 text-[11px] text-teal-600 font-bold hover:underline cursor-pointer"
                        >
                          + Adicionar Lead
                        </button>
                      </div>
                    ) : (
                      grupo.map((p) => {
                        const isAiOff = !p.is_ai_active;
                        const isDragging = draggingId === p.id;
                        const isSelected = selectedPatient?.id === p.id;
                        const leadScore = getLeadScore(p);
                        const tags = p.ai_memory?.tags || [];

                        return (
                          <div
                            key={p.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, p.id)}
                            onDragEnd={handleDragEnd}
                            onClick={() => handleCardClick(p)}
                            onDoubleClick={() => handleDoubleClick(p.id)}
                            title="Clique para ver ficha completa · Duplo clique para abrir chat"
                            className={`group rounded-xl p-4 cursor-pointer select-none transition-all duration-150 border relative ${
                              isSelected
                                ? "bg-teal-50/50 dark:bg-teal-950/40 border-teal-500 shadow-md ring-2 ring-teal-500/20"
                                : "bg-[var(--bg-base)] border-[var(--border-subtle)] hover:border-teal-500/40 hover:shadow-md hover:-translate-y-0.5"
                            } ${isDragging ? "opacity-30 scale-95" : "opacity-100"}`}
                          >
                            {/* Linha Topo: Avatar + Nome + Badge Temperatura */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div
                                  className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getAvatarColor(p.nome || p.telefone)} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs`}
                                >
                                  {getInitials(p.nome, p.telefone)}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="text-[var(--text-primary)] font-bold text-sm truncate group-hover:text-teal-600 transition-colors leading-tight">
                                    {p.nome || "Contato WhatsApp"}
                                  </h4>
                                  <p className="text-[var(--text-muted)] text-[11px] font-mono leading-tight">
                                    {formatPhone(p.telefone)}
                                  </p>
                                </div>
                              </div>

                              {/* Lead Temperature Score */}
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border shrink-0 ${leadScore.bg}`}
                                title={`Score de engajamento: ${leadScore.score} pontos`}
                              >
                                {leadScore.label}
                              </span>
                            </div>

                            {/* Tags do Card */}
                            {tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {tags.slice(0, 2).map((t) => (
                                  <span
                                    key={t}
                                    className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border-subtle)] truncate max-w-[120px]"
                                  >
                                    #{t}
                                  </span>
                                ))}
                                {tags.length > 2 && (
                                  <span className="text-[9px] font-semibold text-[var(--text-muted)]">
                                    +{tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}

                            {/* Rodapé do Card: Status da IA + Data + Ações */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-[var(--border-subtle)] text-[11px]">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full ${
                                    isAiOff ? "bg-amber-400" : "bg-emerald-400 animate-pulse"
                                  }`}
                                />
                                <span className="text-[10px] font-semibold text-[var(--text-secondary)]">
                                  {isAiOff ? "Humano" : "IA Ativa"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[var(--text-muted)]">
                                  {new Date(p.created_at).toLocaleDateString("pt-BR", {
                                    day: "2-digit",
                                    month: "2-digit",
                                  })}
                                </span>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`/painel/crm/contato/${p.id}`, "_blank");
                                  }}
                                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-cyan-600 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                                  title="Abrir perfil completo em nova aba do navegador"
                                >
                                  <ExternalLink size={13} />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDoubleClick(p.id);
                                  }}
                                  className="p-1 rounded-md text-[var(--text-muted)] hover:text-teal-600 hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                                  title="Abrir no Chat"
                                >
                                  <MessageSquare size={13} />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Modal de Novo Contato ── */}
      <NewContactModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onContactCreated={(newPatient) => {
          setPatients((prev) => [newPatient, ...prev]);
          setSelectedPatient(newPatient);
        }}
      />
    </div>
  );
}
