import { useState, useEffect, useContext } from "react";
import {
  BookOpen, Link as LinkIcon, FileText, Trash2, Plus, Loader2, Globe,
  Edit3, Check, X, Upload, File as FileIcon, FileImage, FileCode, Search, Camera
} from "lucide-react";
import { apiFetch } from "../api";
import { AuthContext } from "../context/AuthContext";

function FileTypeIcon({ name }) {
  if (!name) return <FileText size={14} className="text-indigo-400" />;
  if (name.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return <FileImage size={14} className="text-pink-400" />;
  if (name.match(/\.pdf$/i)) return <FileText size={14} className="text-rose-400" />;
  if (name.match(/\.(docx|doc)$/i)) return <FileCode size={14} className="text-blue-400" />;
  if (name.startsWith("http")) return <Globe size={14} className="text-cyan-400" />;
  return <FileText size={14} className="text-indigo-400" />;
}

function KnowledgeCard({ item, onEdit, onDelete, editingId, editingContent, setEditingContent, isSavingEdit, onEditSave, onCancelEdit }) {
  const isEditing = editingId === item.id;
  const contentPreview = item.content?.slice(0, 140) + (item.content?.length > 140 ? "..." : "");
  const date = new Date(item.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-4 group transition-all hover:bg-[var(--bg-surface-hover)]">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-[var(--clr-primary)]/10 border border-[var(--clr-primary)]/20">
          <FileTypeIcon name={item.source || item.content} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editingContent}
                onChange={e => setEditingContent(e.target.value)}
                disabled={isSavingEdit}
                className="input-premium resize-y text-[12px] leading-relaxed min-h-[100px]"
                style={{ background: "rgba(0,0,0,0.3)", borderColor: "rgba(124,58,237,0.3)" }}
              />
              <div className="flex items-center gap-2">
                <button onClick={() => onEditSave(item.id)} disabled={isSavingEdit || !editingContent.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 bg-[var(--clr-success)]/10 text-[var(--clr-success)] border border-[var(--clr-success)]/20">
                  {isSavingEdit ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Salvar
                </button>
                <button onClick={onCancelEdit} disabled={isSavingEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-[var(--bg-surface-hover)] text-[var(--text-muted)] border border-[var(--border-subtle)]">
                  <X size={13} /> Cancelar
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed font-medium text-[var(--text-primary)]">
                {contentPreview}
              </p>
              <p className="text-[10px] font-semibold uppercase tracking-wide mt-2 text-[var(--text-muted)]">
                Adicionado em {date}
              </p>
            </>
          )}
        </div>

        {/* Actions */}
        {!isEditing && (
          <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <button onClick={() => onEdit(item)}
              className="p-1.5 rounded-lg transition-all bg-[var(--clr-primary)]/10 text-[var(--clr-primary)] hover:bg-[var(--clr-primary)]/20"
              title="Editar">
              <Edit3 size={13} />
            </button>
            <button onClick={() => onDelete(item.id)}
              className="p-1.5 rounded-lg transition-all bg-[var(--clr-danger)]/10 text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/20"
              title="Remover">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function KnowledgeBase() {
  const { token, tenant } = useContext(AuthContext);
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("texto");
  const [inputValue, setInputValue] = useState("");
  const [fileValue, setFileValue] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => { fetchKnowledge(); }, []);

  // Thumbnail preview para imagens ou prints colados
  useEffect(() => {
    if (fileValue && (fileValue.type?.startsWith("image/") || fileValue.name?.match(/\.(jpg|jpeg|png|webp|gif)$/i))) {
      const url = URL.createObjectURL(fileValue);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [fileValue]);

  // Listener para Ctrl+V (colar prints direto da área de transferência)
  useEffect(() => {
    const handlePaste = (e) => {
      const clipboardData = e.clipboardData || window.clipboardData;
      if (!clipboardData) return;

      const items = clipboardData.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type && item.type.indexOf("image") !== -1) {
          e.preventDefault();
          const blob = item.getAsFile();
          if (blob) {
            const now = new Date();
            const timeStr = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
            const pastedFile = new window.File([blob], `print_colado_${timeStr}.png`, { type: blob.type || "image/png" });
            setFileValue(pastedFile);
            setActiveTab("print");
            setMessage({
              type: "success",
              text: "📸 Print colado com sucesso! Clique em 'Processar Print com IA'.",
            });
            return;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const fetchKnowledge = async () => {
    try {
      const res = await apiFetch("/api/admin/knowledge", { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setKnowledgeList(await res.json());
    } catch (err) {
      console.error("Erro RAG:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const isFileOrPrint = activeTab === "arquivo" || activeTab === "print";
    if (!isFileOrPrint && !inputValue.trim()) return;
    if (isFileOrPrint && !fileValue) return;

    setSubmitting(true);
    setMessage(null);
    const payload = { tipo: isFileOrPrint ? "file" : activeTab };

    if (activeTab === "url") {
      payload.url = inputValue.trim();
    } else if (activeTab === "texto") {
      payload.texto = inputValue.trim();
    } else if (isFileOrPrint) {
      if (fileValue.name.endsWith(".txt")) {
        payload.tipo = "texto";
        payload.texto = await fileValue.text();
      } else {
        if (fileValue.size > 10 * 1024 * 1024) {
          setMessage({ type: "error", text: "O arquivo excede o limite de 10MB." });
          setSubmitting(false);
          return;
        }
        const base64Data = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target.result.split(",")[1]);
          reader.readAsDataURL(fileValue);
        });
        payload.tipo = "file";
        let fallbackType = "application/pdf";
        if (fileValue.name.endsWith(".docx")) fallbackType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
        payload.fileType = fileValue.type || fallbackType;
        payload.base64Data = base64Data;
      }
    }

    try {
      const res = await apiFetch("/api/admin/knowledge", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage({ type: "success", text: `✓ ${data.chunksIngested} memórias adicionadas à base de conhecimento!` });
      setInputValue("");
      setFileValue(null);
      fetchKnowledge();
    } catch (err) {
      let msg = err.message;
      if (msg.includes("503") || msg.includes("overloaded")) msg = "Servidores sobrecarregados. Tente novamente em alguns segundos.";
      setMessage({ type: "error", text: msg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover este conhecimento? O atendente não terá mais acesso a essa informação.")) return;
    try {
      const res = await apiFetch(`/api/admin/knowledge/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setKnowledgeList(prev => prev.filter(k => k.id !== id));
    } catch (err) { console.error(err); }
  };

  const handleEditSave = async (id) => {
    if (!editingContent.trim()) return;
    setIsSavingEdit(true);
    try {
      const res = await apiFetch(`/api/admin/knowledge/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content: editingContent.trim() })
      });
      if (res.ok) {
        setKnowledgeList(prev => prev.map(k => k.id === id ? { ...k, content: editingContent.trim() } : k));
        setEditingId(null);
        setEditingContent("");
      }
    } catch (err) { console.error(err); }
    finally { setIsSavingEdit(false); }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) { setFileValue(file); setActiveTab("arquivo"); }
  };

  const filtered = knowledgeList.filter(k =>
    !search || k.content?.toLowerCase().includes(search.toLowerCase())
  );

  const tabConfig = [
    { id: "texto", label: "Texto", icon: FileText },
    { id: "url", label: "URL", icon: Globe },
    { id: "print", label: "Colar Print", icon: Camera },
    { id: "arquivo", label: "Subir Arquivo", icon: Upload },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">

      {/* ── Header ── */}
      <header>
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full animate-pulse bg-[var(--clr-primary)]" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-[var(--clr-primary)]">
            Inteligência do Atendente
          </span>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-black text-[var(--text-primary)] mb-1">
          Base de Conhecimento
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Ensine seu atendente com FAQs, manuais, catálogos e páginas do seu site
        </p>
      </header>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Documentos", value: knowledgeList.length, icon: "📄" },
          { label: "Resoluções Automatizadas", value: "72%", icon: "⚡" },
          { label: "Status", value: "Ativo", icon: "🟢" },
        ].map((s, i) => (
          <div key={i} className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl px-4 py-3 flex items-center gap-3">
            <span className="text-xl">{s.icon}</span>
            <div>
              <p className="text-[var(--text-primary)] font-black text-lg font-display leading-tight">{s.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ── Upload Form ── */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5">
            <h2 className="text-[var(--text-primary)] font-bold text-sm mb-4 flex items-center gap-2">
              <Plus size={15} className="text-[var(--clr-primary)]" />
              Adicionar Conhecimento
            </h2>

            {/* Tabs */}
            <div className="flex gap-1 p-1 rounded-xl mb-4 bg-[var(--bg-surface-hover)] border border-[var(--border-subtle)]">
              {tabConfig.map(({ id, label, icon: Icon }) => (
                <button key={id} onClick={() => { setActiveTab(id); setMessage(null); }}
                  className={`flex-1 flex items-center justify-center gap-1 py-2 text-[10px] sm:text-[11px] font-bold rounded-lg transition-all ${activeTab === id ? "bg-gradient-to-br from-[var(--clr-primary)] to-[var(--clr-info)] text-white shadow-sm" : "text-[var(--text-muted)] hover:bg-[var(--bg-surface)]"}`}
                >
                  <Icon size={12} />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <form onSubmit={handleAdd} className="space-y-3">
              {activeTab === "texto" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-[var(--text-muted)]">
                    Cole seu FAQ ou Conteúdo
                  </label>
                  <textarea
                    value={inputValue}
                    onChange={e => setInputValue(e.target.value)}
                    placeholder="Ex: Nossos planos custam a partir de R$99 e atendemos nas regiões Sul e Sudeste..."
                    className="input-premium resize-none h-36 text-[13px]"
                    required
                  />
                </div>
              )}

              {activeTab === "url" && (
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest mb-1.5 block text-[var(--text-muted)]">
                    URL do Site ou Página
                  </label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                    <input type="url" value={inputValue} onChange={e => setInputValue(e.target.value)}
                      placeholder="https://suaempresa.com.br"
                      className="input-premium pl-9 text-[13px]"
                      required />
                  </div>
                  <p className="text-[10px] mt-1.5 text-[var(--text-muted)]">
                    O atendente irá extrair todo o conteúdo visível desta URL
                  </p>
                </div>
              )}

              {activeTab === "print" && (
                <div>
                  <div
                    tabIndex={0}
                    className={`rounded-xl border-2 border-dashed p-6 text-center transition-all outline-none focus:border-[var(--clr-primary)] focus:bg-[var(--clr-primary)]/5 ${fileValue ? "border-[var(--clr-success)] bg-[var(--clr-success)]/5" : "border-[var(--border-medium)] bg-[var(--bg-surface-hover)] hover:border-[var(--clr-primary)]"}`}
                  >
                    {fileValue && previewUrl ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="relative group/preview my-1">
                          <img
                            src={previewUrl}
                            alt="Print Preview"
                            className="max-h-36 rounded-lg object-contain border border-[var(--border-subtle)] shadow-md bg-black/30"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFileValue(null);
                            }}
                            className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors"
                            title="Remover print"
                          >
                            <X size={12} />
                          </button>
                        </div>
                        <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate max-w-[220px]">{fileValue.name}</p>
                        <p className="text-[10px] text-[var(--clr-success)] font-bold">
                          ✓ Print colado! ({(fileValue.size / 1024).toFixed(0)} KB)
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2.5 py-2">
                        <div className="w-12 h-12 rounded-full bg-[var(--clr-primary)]/10 flex items-center justify-center border border-[var(--clr-primary)]/20 text-[var(--clr-primary)]">
                          <Camera size={22} />
                        </div>
                        <p className="text-[13px] font-bold text-[var(--text-primary)]">
                          Clique aqui e aperte <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-medium)] text-[var(--clr-primary)] font-mono text-xs shadow-sm">Ctrl + V</kbd>
                        </p>
                        <p className="text-[11px] text-[var(--text-muted)] max-w-xs leading-relaxed">
                          Tire print de qualquer tela ou conversa e cole diretamente aqui sem precisar salvar arquivo!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "arquivo" && (
                <div>
                  <div
                    className={`rounded-xl border-2 border-dashed p-5 text-center transition-all cursor-pointer relative ${isDragging ? "border-[var(--clr-primary)] bg-[var(--clr-primary)]/10" : "border-[var(--border-medium)] bg-[var(--bg-surface-hover)]"}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("file-upload").click()}
                  >
                    {fileValue ? (
                      <div className="flex flex-col items-center gap-2">
                        {previewUrl ? (
                          <div className="relative group/preview my-1">
                            <img
                              src={previewUrl}
                              alt="File Preview"
                              className="max-h-28 rounded-lg object-contain border border-[var(--border-subtle)] shadow-sm bg-black/20"
                            />
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setFileValue(null);
                              }}
                              className="absolute -top-2 -right-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full p-1 shadow-md transition-colors"
                              title="Remover arquivo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <FileIcon size={24} className="text-[var(--clr-primary)]" />
                        )}
                        <p className="text-[12px] font-semibold text-[var(--text-primary)] truncate max-w-[220px]">{fileValue.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          {(fileValue.size / 1024).toFixed(0)} KB
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Upload size={22} className="text-[var(--text-muted)]" />
                        <p className="text-[12px] font-semibold text-[var(--text-primary)]">
                          Arraste ou clique para selecionar
                        </p>
                        <p className="text-[10px] text-[var(--text-muted)]">
                          PDF, DOCX, TXT, Imagens · Máx. 10MB
                        </p>
                      </div>
                    )}
                  </div>
                  <input id="file-upload" type="file" className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp"
                    onChange={e => setFileValue(e.target.files[0])} />
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-xl text-[12px] font-medium border ${message.type === "error" ? "bg-[var(--clr-danger)]/10 border-[var(--clr-danger)]/20 text-[var(--clr-danger)]" : "bg-[var(--clr-success)]/10 border-[var(--clr-success)]/20 text-[var(--clr-success)]"}`}>
                  {message.text}
                </div>
              )}

              <button type="submit"
                disabled={submitting || ((activeTab === "arquivo" || activeTab === "print") ? !fileValue : !inputValue.trim())}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                {submitting ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
                {submitting ? "Processando..." : (activeTab === "print" ? "Processar Print com IA" : "Adicionar à Base")}
              </button>
            </form>
          </div>
        </div>

        {/* ── Knowledge List ── */}
        <div className="lg:col-span-2 bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-5 min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[var(--text-primary)] font-bold text-sm flex items-center gap-2">
              <BookOpen size={15} className="text-[var(--clr-primary)]" />
              Base Ativa
              <span className="badge badge-brand text-[10px]">{knowledgeList.length} documentos</span>
            </h2>

            {/* Search */}
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="input-premium pl-7 pr-3 py-1.5 text-[12px] h-8 w-36"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 size={28} className="animate-spin text-[var(--clr-primary)]" />
              <p className="text-[12px] font-medium animate-pulse text-[var(--text-muted)]">
                Carregando base de conhecimento...
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--clr-primary)]/10 border border-[var(--clr-primary)]/20">
                <FileText size={22} className="text-[var(--text-muted)]" />
              </div>
              <div>
                <p className="text-[var(--text-primary)] font-semibold text-sm">
                  {search ? "Nenhum resultado encontrado" : "Base de conhecimento vazia"}
                </p>
                <p className="text-[12px] mt-1 max-w-xs text-[var(--text-muted)]">
                  {search ? "Tente outros termos" : "Adicione FAQs, manuais ou links para que o atendente possa responder com precisão."}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filtered.map(item => (
                <KnowledgeCard
                  key={item.id}
                  item={item}
                  onEdit={i => { setEditingId(i.id); setEditingContent(i.content); }}
                  onDelete={handleDelete}
                  editingId={editingId}
                  editingContent={editingContent}
                  setEditingContent={setEditingContent}
                  isSavingEdit={isSavingEdit}
                  onEditSave={handleEditSave}
                  onCancelEdit={() => { setEditingId(null); setEditingContent(""); }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
