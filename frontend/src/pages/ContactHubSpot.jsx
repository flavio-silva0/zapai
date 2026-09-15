import { useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiFetch } from "../api";
import {
  ArrowLeft, ExternalLink, Phone, Copy, Check, Bot, User,
  Sparkles, Flame, Sun, Snowflake, Tag, MessageSquare, Send,
  Edit3, Save, X, RefreshCw, Calendar, Clock, DollarSign,
  Briefcase, CheckCircle2, AlertCircle, Plus, ChevronRight,
  ShieldCheck, ArrowUpRight, CheckCheck, ListTodo, FileText,
  Building, MapPin, Mail, ThumbsUp, HelpCircle
} from "lucide-react";

// ── Utilitários ──────────────────────────────────────────────
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

const STAGES = [
  { id: "Novo", label: "1. Novos Leads", shortLabel: "Novos Leads", color: "slate" },
  { id: "Em Atendimento", label: "2. Em Atendimento", shortLabel: "Em Atendimento", color: "amber" },
  { id: "Agendado", label: "3. Agendados & Vendas", shortLabel: "Agendados / Ganho", color: "emerald" },
];

export default function ContactHubSpot({ contactId: propContactId, onBack: propOnBack }) {
  const params = useParams();
  const navigate = useNavigate();
  const contactId = propContactId || params.id;

  // Estados principais
  const [patient, setPatient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Abas do workspace central
  const [activeTab, setActiveTab] = useState("insights"); // "insights" | "chat" | "notes" | "tasks"

  // Edição de dados do contato
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [dealValueInput, setDealValueInput] = useState("");
  const [dealServiceInput, setDealServiceInput] = useState("");
  const [savingProperties, setSavingProperties] = useState(false);

  // Tags
  const [tagInput, setTagInput] = useState("");

  // Notas da equipe
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Tarefas
  const [newTask, setNewTask] = useState("");

  // Envio de mensagem direta no WhatsApp
  const [directMsg, setDirectMsg] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  // Análise com IA (HubSpot Breeze AI)
  const [analyzingAi, setAnalyzingAi] = useState(false);
  const [aiInsights, setAiInsights] = useState(null);

  // Feedback de cópia
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedReply, setCopiedReply] = useState(false);

  const messagesEndRef = useRef(null);

  // Carrega dados completos do contato e histórico de mensagens
  const loadData = async (forceInsights = false) => {
    if (!contactId) return;
    try {
      setLoading(true);
      setError("");

      const [pRes, mRes] = await Promise.all([
        apiFetch(`/api/patients/${contactId}`),
        apiFetch(`/api/patients/${contactId}/messages?limit=200`),
      ]);

      if (!pRes.ok) throw new Error("Contato não encontrado ou sem permissão.");
      const pData = await pRes.json();
      const mData = mRes.ok ? await mRes.json() : [];

      setPatient(pData);
      setMessages(mData || []);
      setNameInput(pData.nome || "");
      setEmailInput(pData.ai_memory?.email || "");
      setCityInput(pData.ai_memory?.city || "");
      setDealValueInput(pData.ai_memory?.deal_value || "");
      setDealServiceInput(pData.ai_memory?.deal_service || "");

      // Insights pré-existentes na memória
      if (pData.ai_memory?.ai_insights && !forceInsights) {
        setAiInsights(pData.ai_memory.ai_insights);
      } else {
        // Gera novos insights
        fetchAiInsights();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAiInsights = async () => {
    if (!contactId) return;
    try {
      setAnalyzingAi(true);
      const res = await apiFetch(`/api/patients/${contactId}/ai-insights`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAiInsights(data);
      }
    } catch (err) {
      console.warn("Falha ao gerar insights:", err);
    } finally {
      setAnalyzingAi(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contactId]);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  // Ações de alteração de estágio (Pipeline)
  const handleStageChange = async (newStage) => {
    if (!patient || patient.status_kanban === newStage) return;
    setPatient((prev) => ({ ...prev, status_kanban: newStage }));
    try {
      await apiFetch(`/api/patients/${contactId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status_kanban: newStage }),
      });
    } catch (err) {
      console.error("Erro ao mudar estágio:", err);
    }
  };

  // Alternar automação da IA
  const handleToggleAi = async () => {
    if (!patient) return;
    const nextState = !patient.is_ai_active;
    setPatient((prev) => ({ ...prev, is_ai_active: nextState }));
    try {
      await apiFetch(`/api/patients/${contactId}/ai-status`, {
        method: "PUT",
        body: JSON.stringify({ is_ai_active: nextState }),
      });
    } catch (err) {
      console.error("Erro ao alterar status da IA:", err);
    }
  };

  // Salvar propriedades editadas (Nome, E-mail, Cidade, Deal)
  const handleSaveProperties = async () => {
    if (!patient) return;
    setSavingProperties(true);
    try {
      const updatedMemory = {
        ...(patient.ai_memory || {}),
        email: emailInput.trim(),
        city: cityInput.trim(),
        deal_value: dealValueInput.trim(),
        deal_service: dealServiceInput.trim(),
      };
      const res = await apiFetch(`/api/patients/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({
          nome: nameInput.trim() || "Contato sem nome",
          ai_memory: updatedMemory,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setPatient(updated);
        setIsEditingName(false);
      }
    } catch (err) {
      console.error("Erro ao salvar propriedades:", err);
    } finally {
      setSavingProperties(false);
    }
  };

  // Tags
  const tags = useMemo(() => {
    return Array.isArray(patient?.ai_memory?.tags) ? patient.ai_memory.tags : [];
  }, [patient]);

  const handleAddTag = async (e) => {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (!tags.includes(clean)) {
        const newTags = [...tags, clean];
        const updatedMemory = { ...(patient?.ai_memory || {}), tags: newTags };
        setPatient((prev) => ({ ...prev, ai_memory: updatedMemory }));
        setTagInput("");
        await apiFetch(`/api/patients/${contactId}`, {
          method: "PUT",
          body: JSON.stringify({ ai_memory: updatedMemory }),
        });
      }
    }
  };

  const handleRemoveTag = async (tagToRemove) => {
    const newTags = tags.filter((t) => t !== tagToRemove);
    const updatedMemory = { ...(patient?.ai_memory || {}), tags: newTags };
    setPatient((prev) => ({ ...prev, ai_memory: updatedMemory }));
    await apiFetch(`/api/patients/${contactId}`, {
      method: "PUT",
      body: JSON.stringify({ ai_memory: updatedMemory }),
    });
  };

  // Notas
  const notesList = useMemo(() => {
    const raw = patient?.ai_memory?.notes_list;
    if (Array.isArray(raw)) return raw;
    if (patient?.ai_memory?.notes) {
      return [{ id: "legacy-note", text: patient.ai_memory.notes, author: "Equipe", date: patient.created_at }];
    }
    return [];
  }, [patient]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const noteObj = {
        id: `note-${Date.now()}`,
        text: newNote.trim(),
        author: "Atendente",
        date: new Date().toISOString(),
      };
      const updatedList = [noteObj, ...notesList];
      const updatedMemory = { ...(patient?.ai_memory || {}), notes_list: updatedList, notes: newNote.trim() };
      setPatient((prev) => ({ ...prev, ai_memory: updatedMemory }));
      setNewNote("");
      await apiFetch(`/api/patients/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({ ai_memory: updatedMemory }),
      });
    } catch (err) {
      console.error("Erro ao salvar nota:", err);
    } finally {
      setSavingNote(false);
    }
  };

  // Tarefas
  const tasksList = useMemo(() => {
    return Array.isArray(patient?.ai_memory?.tasks) ? patient.ai_memory.tasks : [];
  }, [patient]);

  const handleAddTask = async (e) => {
    if (e.key === "Enter" && newTask.trim()) {
      e.preventDefault();
      const taskObj = {
        id: `task-${Date.now()}`,
        title: newTask.trim(),
        completed: false,
        created_at: new Date().toISOString(),
      };
      const updatedTasks = [taskObj, ...tasksList];
      const updatedMemory = { ...(patient?.ai_memory || {}), tasks: updatedTasks };
      setPatient((prev) => ({ ...prev, ai_memory: updatedMemory }));
      setNewTask("");
      await apiFetch(`/api/patients/${contactId}`, {
        method: "PUT",
        body: JSON.stringify({ ai_memory: updatedMemory }),
      });
    }
  };

  const handleToggleTask = async (taskId) => {
    const updatedTasks = tasksList.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
    const updatedMemory = { ...(patient?.ai_memory || {}), tasks: updatedTasks };
    setPatient((prev) => ({ ...prev, ai_memory: updatedMemory }));
    await apiFetch(`/api/patients/${contactId}`, {
      method: "PUT",
      body: JSON.stringify({ ai_memory: updatedMemory }),
    });
  };

  // Envio de mensagem direta no WhatsApp
  const handleSendDirectMessage = async (textToSend) => {
    const content = (textToSend || directMsg).trim();
    if (!content || sendingMsg) return;
    setSendingMsg(true);
    try {
      const res = await apiFetch(`/api/patients/${contactId}/send`, {
        method: "POST",
        body: JSON.stringify({ texto: content }),
      });
      if (res.ok) {
        const newMsg = await res.json();
        setMessages((prev) => [...prev, newMsg]);
        setDirectMsg("");
        setSendSuccess(true);
        setTimeout(() => setSendSuccess(false), 3000);
        // Atualiza status do paciente localmente (a IA pausa automaticamente em intervenção humana)
        setPatient((prev) => ({ ...prev, is_ai_active: false }));
      }
    } catch (err) {
      console.error("Erro ao enviar mensagem:", err);
    } finally {
      setSendingMsg(false);
    }
  };

  // Copiar número
  const handleCopyPhone = () => {
    if (!patient?.telefone) return;
    navigator.clipboard.writeText(patient.telefone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  // Copiar resposta sugerida
  const handleCopyReply = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedReply(true);
    setTimeout(() => setCopiedReply(false), 2000);
  };

  const handleBack = () => {
    if (propOnBack) propOnBack();
    else navigate("/painel/crm");
  };

  const handleOpenNewTab = () => {
    window.open(`/painel/crm/contato/${contactId}`, "_blank");
  };

  const waLink = useMemo(() => {
    if (!patient?.telefone) return "#";
    const clean = patient.telefone.replace(/\D/g, "");
    return `https://wa.me/${clean}`;
  }, [patient]);

  if (loading) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[var(--bg-base)]">
        <div className="w-10 h-10 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center animate-pulse mb-3">
          <Sparkles size={20} className="text-teal-500 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-[var(--text-primary)]">Carregando perfil completo do contato...</p>
        <span className="text-xs text-[var(--text-muted)] mt-1">Conectando ao histórico e dados do CRM</span>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex-1 min-h-[70vh] flex flex-col items-center justify-center p-8 bg-[var(--bg-base)]">
        <AlertCircle size={32} className="text-rose-500 mb-3" />
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Contato não encontrado</h3>
        <p className="text-xs text-[var(--text-muted)] mt-1 mb-4">{error || "O registro pode ter sido excluído ou você não tem acesso."}</p>
        <button
          onClick={handleBack}
          className="px-4 py-2 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-medium)] text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] cursor-pointer"
        >
          Voltar ao Funil CRM
        </button>
      </div>
    );
  }

  const avatarColor = getAvatarColor(patient.nome || patient.telefone);
  const initials = getInitials(patient.nome, patient.telefone);
  const currentStageIndex = STAGES.findIndex((s) => s.id === (patient.status_kanban || "Novo"));

  return (
    <div className="flex-1 min-h-screen bg-[var(--bg-base)] flex flex-col animate-fade-in text-[var(--text-primary)] pb-12">
      
      {/* ── 1. Top Bar & Breadcrumb (Estilo HubSpot CRM) ── */}
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md sticky top-0 z-30 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Breadcrumb e Retorno */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Voltar ao Funil"
            >
              <ArrowLeft size={16} />
              <span className="hidden sm:inline">Voltar ao Funil</span>
            </button>

            <span className="text-[var(--border-medium)] text-sm">/</span>

            <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-medium">CRM & Funil</span>
              <ChevronRight size={13} />
              <span className="text-teal-600 dark:text-teal-400 font-bold truncate max-w-[200px]">
                {patient.nome || formatPhone(patient.telefone)}
              </span>
            </div>
          </div>

          {/* Ações de Topo */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenNewTab}
              className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              title="Abrir em nova aba do navegador"
            >
              <ExternalLink size={16} />
            </button>

            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-600/20 transition-all cursor-pointer"
            >
              <Phone size={13} />
              <span className="hidden md:inline">WhatsApp Web</span>
              <ArrowUpRight size={12} />
            </a>

            <button
              onClick={handleToggleAi}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                patient.is_ai_active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
              }`}
            >
              <Bot size={14} />
              {patient.is_ai_active ? "IA Ativa (Pausar)" : "Humano (Ativar IA)"}
            </button>

            <button
              onClick={fetchAiInsights}
              disabled={analyzingAi}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Sparkles size={14} className={analyzingAi ? "animate-spin" : ""} />
              <span className="hidden sm:inline">{analyzingAi ? "Analisando..." : "Atualizar IA"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 pt-6 flex flex-col gap-6">

        {/* ── 2. Hero Header do Contato & Pipeline Chevron ── */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          
          {/* Identificação do Contato */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${avatarColor} text-white flex items-center justify-center font-bold text-xl shadow-md shrink-0`}>
              {initials}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1">
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      className="text-xl font-bold px-2 py-0.5 rounded-lg bg-[var(--bg-base)] border border-[var(--clr-primary)] text-[var(--text-primary)] outline-hidden"
                      autoFocus
                    />
                    <button
                      onClick={handleSaveProperties}
                      disabled={savingProperties}
                      className="p-1.5 rounded-lg bg-teal-600 text-white hover:bg-teal-700 cursor-pointer"
                    >
                      <Save size={14} />
                    </button>
                    <button
                      onClick={() => setIsEditingName(false)}
                      className="p-1.5 rounded-lg bg-[var(--bg-surface-hover)] text-[var(--text-muted)] cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight">
                      {patient.nome || "Contato sem nome"}
                    </h1>
                    <button
                      onClick={() => setIsEditingName(true)}
                      className="text-[var(--text-muted)] hover:text-teal-600 p-1 transition-colors cursor-pointer"
                      title="Editar nome"
                    >
                      <Edit3 size={15} />
                    </button>
                  </div>
                )}

                {/* Score & Sentiment */}
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Flame size={12} />
                  Score: {aiInsights?.lead_score || 85} pts
                </span>

                {/* Intent Badge */}
                {aiInsights?.intent && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                    {aiInsights.intent}
                  </span>
                )}
              </div>

              {/* Informações rápidas abaixo do nome */}
              <div className="flex items-center gap-4 text-xs text-[var(--text-secondary)] flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono">{formatPhone(patient.telefone)}</span>
                  <button
                    onClick={handleCopyPhone}
                    className="text-[var(--text-muted)] hover:text-teal-600 transition-colors p-0.5 cursor-pointer"
                    title="Copiar telefone"
                  >
                    {copiedPhone ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                  </button>
                </div>

                {emailInput && (
                  <span className="flex items-center gap-1">
                    <Mail size={13} className="text-[var(--text-muted)]" />
                    {emailInput}
                  </span>
                )}

                {cityInput && (
                  <span className="flex items-center gap-1">
                    <MapPin size={13} className="text-[var(--text-muted)]" />
                    {cityInput}
                  </span>
                )}

                <span className="text-[11px] text-[var(--text-muted)]">
                  Criado em: {new Date(patient.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline de Estágios Horizontal (HubSpot Stage Chevron) */}
          <div className="flex items-center gap-1 bg-[var(--bg-base)] p-1.5 rounded-2xl border border-[var(--border-subtle)] overflow-x-auto">
            {STAGES.map((stg, idx) => {
              const isActive = (patient.status_kanban || "Novo") === stg.id;
              const isPast = currentStageIndex > idx;
              return (
                <button
                  key={stg.id}
                  onClick={() => handleStageChange(stg.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? "bg-teal-600 text-white shadow-md shadow-teal-500/20"
                      : isPast
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/15"
                      : "text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {isPast ? <CheckCircle2 size={13} /> : <span className="w-2 h-2 rounded-full bg-current opacity-60" />}
                  {stg.shortLabel}
                </button>
              );
            })}
          </div>

        </div>

        {/* ── 3. Layout Principal 3 Colunas (HubSpot CRM Classic Layout) ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ◀️ COLUNA ESQUERDA (3 colunas): Sobre este Contato & Propriedades ◀️ */}
          <div className="lg:col-span-3 flex flex-col gap-5">
            
            {/* Bloco 1: Propriedades Principais */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Building size={14} className="text-teal-600" />
                  Sobre este Contato
                </h3>
                <button
                  onClick={handleSaveProperties}
                  disabled={savingProperties}
                  className="text-[11px] text-teal-600 hover:underline font-bold cursor-pointer"
                >
                  {savingProperties ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">WhatsApp</label>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] font-mono text-[11px]">
                    <span>{formatPhone(patient.telefone)}</span>
                    <button onClick={handleCopyPhone} className="text-[var(--text-muted)] hover:text-teal-600 cursor-pointer">
                      <Copy size={12} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@cliente.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Cidade / Região</label>
                  <input
                    type="text"
                    placeholder="Ex: São Paulo, SP"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Origem do Lead</label>
                  <div className="p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-[11px] text-[var(--text-secondary)] flex items-center justify-between">
                    <span>WhatsApp Oficial Meta</span>
                    <ShieldCheck size={13} className="text-teal-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Bloco 2: Oportunidade & Negócio (Deals) */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[var(--border-subtle)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <DollarSign size={14} className="text-amber-500" />
                  Negócio & Oportunidade
                </h3>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Valor Estimado (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[var(--text-muted)] text-xs">R$</span>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={dealValueInput}
                      onChange={(e) => setDealValueInput(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">Serviço / Interesse</label>
                  <input
                    type="text"
                    placeholder="Ex: Corte + Barba, Implante..."
                    value={dealServiceInput}
                    onChange={(e) => setDealServiceInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-amber-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSaveProperties}
                    disabled={savingProperties}
                    className="w-full py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold transition-all cursor-pointer"
                  >
                    Salvar Oportunidade
                  </button>
                </div>
              </div>
            </div>

            {/* Bloco 3: Tags do Lead */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                  <Tag size={14} className="text-teal-600" />
                  Tags & Segmentação
                </h3>
                <span className="text-[10px] text-[var(--text-muted)]">Enter p/ add</span>
              </div>

              <div className="flex flex-wrap gap-1.5 mb-3">
                {tags.map((tg) => (
                  <span
                    key={tg}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20"
                  >
                    #{tg}
                    <button
                      onClick={() => handleRemoveTag(tg)}
                      className="hover:text-rose-500 cursor-pointer ml-0.5 text-sm"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <input
                type="text"
                placeholder="Adicionar tag (ex: VIP, Retorno)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500"
              />
            </div>

          </div>

          {/* ⏺️ COLUNA CENTRAL (6 colunas): Workspace, Contexto de IA & Atividade ⏺️ */}
          <div className="lg:col-span-6 flex flex-col gap-5">
            
            {/* Navegador de Abas Central (HubSpot Style Tabs) */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveTab("insights")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "insights"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <Sparkles size={14} />
                Inteligência de IA (Contexto)
              </button>

              <button
                onClick={() => setActiveTab("chat")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "chat"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <MessageSquare size={14} />
                WhatsApp ({messages.length})
              </button>

              <button
                onClick={() => setActiveTab("notes")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "notes"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <FileText size={14} />
                Notas da Equipe ({notesList.length})
              </button>

              <button
                onClick={() => setActiveTab("tasks")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  activeTab === "tasks"
                    ? "bg-teal-600 text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]"
                }`}
              >
                <ListTodo size={14} />
                Tarefas ({tasksList.length})
              </button>
            </div>

            {/* CONTEÚDO DA ABA 1: INTELIGÊNCIA & CONTEXTO DE IA */}
            {activeTab === "insights" && (
              <div className="flex flex-col gap-5 animate-fade-in">
                
                {/* 1. Resumo Executivo do Atendimento (O Destaque Principal!) */}
                <div className="bg-gradient-to-br from-teal-500/10 via-[var(--bg-surface)] to-cyan-500/5 border-2 border-teal-500/30 rounded-3xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-teal-500/20">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-md">
                        <Sparkles size={16} />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-[var(--text-primary)]">Resumo Executivo da Conversa</h3>
                        <p className="text-[11px] text-[var(--text-muted)]">Síntese contextual gerada com Inteligência Artificial</p>
                      </div>
                    </div>

                    <button
                      onClick={fetchAiInsights}
                      disabled={analyzingAi}
                      className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw size={12} className={analyzingAi ? "animate-spin" : ""} />
                      {analyzingAi ? "Atualizando..." : "Reanalisar"}
                    </button>
                  </div>

                  <p className="text-sm leading-relaxed text-[var(--text-primary)] font-medium">
                    {aiInsights?.summary || "Aguardando geração de resumo com o histórico de mensagens..."}
                  </p>
                </div>

                {/* 2. Principais Pontos Identificados (Key Takeaways) */}
                <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-3 flex items-center gap-1.5">
                    <CheckCircle2 size={15} className="text-teal-600" />
                    Principais Pontos da Conversa
                  </h3>

                  {aiInsights?.key_points && aiInsights.key_points.length > 0 ? (
                    <div className="space-y-2.5">
                      {aiInsights.key_points.map((pt, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)]">
                          <span className="w-5 h-5 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{pt}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] italic">Nenhum ponto registrado ainda.</p>
                  )}
                </div>

                {/* 3. Termômetro & Sentimento do Lead */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                      Sentimento do Cliente
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-[var(--text-primary)]">
                        {aiInsights?.sentiment_label || "Interesse Alto 🔥"}
                      </span>
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
                      Avaliado pelo tom das mensagens e prontidão de resposta.
                    </p>
                  </div>

                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-2">
                      Probabilidade de Fechamento
                    </span>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-lg font-bold text-teal-600 font-mono">
                        {aiInsights?.lead_score || 85}%
                      </span>
                      <span className="text-[11px] font-bold text-emerald-500">Alta Chance</span>
                    </div>
                    <div className="w-full h-2 bg-[var(--bg-base)] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${aiInsights?.lead_score || 85}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Próxima Melhor Ação Recomendada (Next Best Action) */}
                {aiInsights?.recommended_action && (
                  <div className="bg-amber-500/10 border border-amber-500/25 rounded-3xl p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-amber-600 dark:text-amber-400 font-bold text-xs">
                      <Briefcase size={14} />
                      Próxima Ação Recomendada para o Vendedor
                    </div>
                    <p className="text-xs text-[var(--text-primary)] leading-relaxed font-medium">
                      {aiInsights.recommended_action}
                    </p>
                  </div>
                )}

                {/* 5. Sugestão de Resposta Rápida (1-Click Reply) */}
                {aiInsights?.suggested_reply && (
                  <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-teal-600" />
                        Sugestão de Resposta Personalizada da IA
                      </h4>
                      <button
                        onClick={() => handleCopyReply(aiInsights.suggested_reply)}
                        className="text-[11px] text-teal-600 hover:underline flex items-center gap-1 cursor-pointer font-semibold"
                      >
                        {copiedReply ? <Check size={12} /> : <Copy size={12} />}
                        {copiedReply ? "Copiado!" : "Copiar"}
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] text-xs text-[var(--text-primary)] leading-relaxed mb-3 italic">
                      "{aiInsights.suggested_reply}"
                    </div>

                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleSendDirectMessage(aiInsights.suggested_reply)}
                        disabled={sendingMsg}
                        className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send size={13} />
                        {sendingMsg ? "Enviando..." : "Enviar esta resposta no WhatsApp"}
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

            {/* CONTEÚDO DA ABA 2: HISTÓRICO COMPLETO DO WHATSAPP */}
            {activeTab === "chat" && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs flex flex-col h-[650px] animate-fade-in">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--border-subtle)]">
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">Histórico de Mensagens WhatsApp</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Conversa em tempo real sincronizada via Meta Cloud API</p>
                  </div>
                  <button
                    onClick={() => loadData(false)}
                    className="p-2 rounded-xl hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] cursor-pointer"
                    title="Recarregar mensagens"
                  >
                    <RefreshCw size={14} />
                  </button>
                </div>

                {/* Balões de Conversa */}
                <div className="flex-1 overflow-y-auto space-y-3 p-2 pr-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                      <MessageSquare size={32} className="opacity-30 mb-2" />
                      <p className="text-xs">Nenhuma mensagem registrada ainda para este contato.</p>
                    </div>
                  ) : (
                    messages.map((msg, i) => {
                      const isUser = msg.origin === "user";
                      return (
                        <div
                          key={msg.id || i}
                          className={`flex flex-col ${isUser ? "items-start" : "items-end"}`}
                        >
                          <div
                            className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                              isUser
                                ? "bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] rounded-tl-xs"
                                : "bg-teal-700 text-white rounded-tr-xs"
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.texto}</p>
                            <div
                              className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                isUser ? "text-[var(--text-muted)]" : "text-teal-100"
                              }`}
                            >
                              <span>{new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                              {!isUser && <CheckCheck size={12} className="text-teal-200" />}
                            </div>
                          </div>
                          <span className="text-[10px] text-[var(--text-muted)] mt-0.5 px-1">
                            {isUser ? patient.nome || "Cliente" : msg.origin === "human" ? "Operador Humano" : "IA Sofia"}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Campo de Envio Rápido */}
                <div className="pt-3 border-t border-[var(--border-subtle)]">
                  {sendSuccess && (
                    <div className="mb-2 p-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-xs font-semibold flex items-center gap-1.5">
                      <Check size={14} /> Mensagem enviada com sucesso no WhatsApp do cliente!
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Digite uma mensagem para enviar pelo WhatsApp oficial..."
                      value={directMsg}
                      onChange={(e) => setDirectMsg(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendDirectMessage()}
                      className="flex-1 text-xs px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500"
                    />
                    <button
                      onClick={() => handleSendDirectMessage()}
                      disabled={sendingMsg || !directMsg.trim()}
                      className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all shadow-md shadow-teal-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
                    >
                      <Send size={13} />
                      {sendingMsg ? "Enviando..." : "Enviar"}
                    </button>
                  </div>
                  <p className="text-[10px] text-[var(--text-muted)] mt-1.5">
                    * Ao enviar uma mensagem manual, a IA será pausada automaticamente para este contato.
                  </p>
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 3: NOTAS DA EQUIPE */}
            {activeTab === "notes" && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xs flex flex-col gap-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Notas Internas da Equipe</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Anotações visíveis apenas para operadores e administradores</p>
                </div>

                {/* Editor de nova nota */}
                <div className="space-y-2">
                  <textarea
                    rows={3}
                    placeholder="Adicione uma anotação sobre a negociação (ex: cliente pediu desconto para pagamento à vista)..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="w-full text-xs p-3 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddNote}
                      disabled={savingNote || !newNote.trim()}
                      className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shadow-sm"
                    >
                      <Save size={13} />
                      {savingNote ? "Salvando..." : "Adicionar Nota"}
                    </button>
                  </div>
                </div>

                {/* Feed de notas */}
                <div className="space-y-3 pt-2">
                  {notesList.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhuma nota interna registrada.</p>
                  ) : (
                    notesList.map((nt) => (
                      <div key={nt.id} className="p-3.5 rounded-2xl bg-[var(--bg-base)] border border-[var(--border-subtle)] space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-teal-600">{nt.author || "Equipe"}</span>
                          <span className="text-[var(--text-muted)]">{new Date(nt.date).toLocaleString("pt-BR")}</span>
                        </div>
                        <p className="text-xs text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">{nt.text}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* CONTEÚDO DA ABA 4: TAREFAS */}
            {activeTab === "tasks" && (
              <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-6 shadow-xs flex flex-col gap-4 animate-fade-in">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">Tarefas & Follow-up do Lead</h3>
                  <p className="text-[11px] text-[var(--text-muted)]">Acompanhe compromissos e tarefas pendentes</p>
                </div>

                {/* Adicionar tarefa */}
                <input
                  type="text"
                  placeholder="Nova tarefa (ex: Enviar catálogo em PDF, ligar na sexta)... [Pressione Enter]"
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={handleAddTask}
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-[var(--bg-base)] border border-[var(--border-medium)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden focus:border-teal-500"
                />

                {/* Lista de tarefas */}
                <div className="space-y-2 pt-2">
                  {tasksList.length === 0 ? (
                    <p className="text-xs text-[var(--text-muted)] italic text-center py-6">Nenhuma tarefa pendente para este contato.</p>
                  ) : (
                    tasksList.map((t) => (
                      <div
                        key={t.id}
                        onClick={() => handleToggleTask(t.id)}
                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                          t.completed
                            ? "bg-[var(--bg-base)]/50 border-[var(--border-subtle)] opacity-60"
                            : "bg-[var(--bg-base)] border-[var(--border-medium)] hover:border-teal-500"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={t.completed}
                          onChange={() => handleToggleTask(t.id)}
                          className="w-4 h-4 rounded text-teal-600 cursor-pointer"
                        />
                        <span className={`text-xs flex-1 ${t.completed ? "line-through text-[var(--text-muted)]" : "text-[var(--text-primary)] font-medium"}`}>
                          {t.title}
                        </span>
                        <span className="text-[10px] text-[var(--text-muted)]">
                          {new Date(t.created_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

          </div>

          {/* ▶️ COLUNA DIREITA (3 colunas): Atribuição, Canal & Integrações ▶️ */}
          <div className="lg:col-span-3 flex flex-col gap-5">

            {/* Bloco 1: Conexão Oficial WhatsApp */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pb-3 mb-3 border-b border-[var(--border-subtle)] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                Canal & Integração
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Provedor</span>
                  <span className="font-semibold text-[var(--text-primary)]">Meta Cloud API v20.0</span>
                </div>

                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Organização / Tenant</span>
                  <span className="font-semibold text-[var(--text-primary)]">{patient.tenants?.nome || "Empresa Principal"}</span>
                </div>

                <div>
                  <span className="text-[11px] text-[var(--text-muted)] block">Phone Number ID</span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {patient.tenants?.phone_number_id || "Oficial Conectado"}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Webhook & API Operacionais
                </div>
              </div>
            </div>

            {/* Bloco 2: Estatísticas de Engajamento */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pb-3 mb-3 border-b border-[var(--border-subtle)] flex items-center gap-1.5">
                <Clock size={14} className="text-teal-600" />
                Métricas do Atendimento
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Total de Mensagens</span>
                  <span className="font-bold font-mono">{messages.length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Mensagens do Cliente</span>
                  <span className="font-bold font-mono">{messages.filter((m) => m.origin === "user").length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Respostas por IA</span>
                  <span className="font-bold font-mono">{messages.filter((m) => m.origin === "bot").length}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[var(--text-muted)]">Tempo Médio Resposta</span>
                  <span className="font-bold text-teal-600 font-mono">~2.4s</span>
                </div>
              </div>
            </div>

            {/* Bloco 3: Ações Rápidas do CRM */}
            <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-3xl p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] pb-3 mb-3 border-b border-[var(--border-subtle)]">
                Ações Rápidas
              </h3>

              <div className="space-y-2">
                <button
                  onClick={() => navigate("/painel/chat")}
                  className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <MessageSquare size={13} className="text-teal-600" />
                    Abrir no Chat de Atendimento
                  </span>
                  <ChevronRight size={13} className="text-[var(--text-muted)]" />
                </button>

                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-2.5 px-3 rounded-xl bg-[var(--bg-base)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)] text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <ExternalLink size={13} className="text-cyan-600" />
                    Abrir em Nova Aba do Navegador
                  </span>
                  <ChevronRight size={13} className="text-[var(--text-muted)]" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
