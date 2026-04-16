import { useState, useEffect, useContext } from "react";
import { BookOpen, Link as LinkIcon, FileText, Trash2, Plus, Loader2, Globe, DatabaseZap } from "lucide-react";
import { apiFetch } from "../api";
import { AuthContext } from "../context/AuthContext";

export default function KnowledgeBase() {
  const { token, tenant } = useContext(AuthContext);
  const [knowledgeList, setKnowledgeList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("texto"); // texto ou url
  const [inputValue, setInputValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchKnowledge();
  }, []);

  const fetchKnowledge = async () => {
    try {
      const res = await apiFetch("/api/admin/knowledge", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKnowledgeList(data);
      }
    } catch (err) {
      console.error("Erro ao puxar RAG:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    setSubmitting(true);
    setMessage(null);

    const payload = { tipo: activeTab };
    if (activeTab === "url") payload.url = inputValue.trim();
    else payload.texto = inputValue.trim();

    try {
      const res = await apiFetch("/api/admin/knowledge", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessage({ type: "success", text: `Injeção de ${data.chunksIngested} memórias feita com sucesso!` });
      setInputValue("");
      fetchKnowledge();
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remover esta memória? A IA não saberá mais sobre isso.")) return;

    try {
      const res = await apiFetch(`/api/admin/knowledge/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setKnowledgeList(knowledgeList.filter(k => k.id !== id));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* ── HEADER ── */}
      <div className="glass p-6 md:p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <DatabaseZap size={120} />
        </div>
        <div className="relative z-10 flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/25">
            <BookOpen className="text-white" size={24} />
          </div>
          <div>
            <h1 className="font-display font-black text-2xl text-white tracking-tight mb-1">Base de Conhecimento</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Ensine regras de negócio, preçários e manuais para sua IA. 
              Ao inserir conteúdo aqui, a inteligência artificial passará a consultar esses dados ativamente sempre que houver dúvidas.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 align-top">
        
        {/* ── FORMS (INJEÇÃO) ── */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="glass rounded-2xl p-6 flex-1">
            <h2 className="text-white font-bold text-lg mb-4 flex items-center gap-2">
              <Plus size={18} className="text-indigo-400" /> Nova Injeção
            </h2>

            <div className="flex bg-white/5 rounded-xl p-1 mb-6">
              <button 
                onClick={() => setActiveTab("texto")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'texto' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Texto
              </button>
              <button 
                onClick={() => setActiveTab("url")}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${activeTab === 'url' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Site (URL)
              </button>
            </div>

            <form onSubmit={handleAdd} className="flex flex-col gap-4">
              {activeTab === "texto" ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Cole o FAQ ou Manual</label>
                  <textarea 
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Ex: Nossos planos custam a partir de R$ 99 e atendemos nas regiões Sul e Sudeste..."
                    className="w-full h-40 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all border resize-none"
                    style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                    onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.4)"; }}
                    onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
                    required
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Link do Site para Raspar</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Globe size={16} className="text-slate-500" />
                    </div>
                    <input 
                      type="url"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="https://suaempresa.com.br"
                      className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none transition-all border"
                      style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }}
                      onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.4)"; }}
                      onBlur={(e)  => { e.target.style.borderColor = "rgba(255,255,255,0.07)"; }}
                      required
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-2">A IA irá extrair e ler todo o conteúdo visível deste link em segundos.</p>
                </div>
              )}

              {message && (
                <div className={`p-3 rounded-xl text-xs font-medium border ${message.type === 'error' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                  {message.text}
                </div>
              )}

              <button 
                type="submit"
                disabled={submitting || !inputValue.trim()}
                className="mt-2 w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-white text-sm font-bold transition-all disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
                {submitting ? "Vetorizando Conhecimento..." : "Injetar na Memória"}
              </button>
            </form>
          </div>
        </div>

        {/* ── LISTING (MEMÓRIAS ATIVAS) ── */}
        <div className="lg:col-span-2 glass rounded-2xl p-6 relative min-h-[400px]">
          <h2 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
             <DatabaseZap size={18} className="text-emerald-400" /> Cérebro Expandido (Matrizes RAG)
          </h2>

          {loading ? (
             <div className="absolute inset-0 flex flex-col items-center justify-center">
               <Loader2 size={32} className="animate-spin text-indigo-500 mb-2" />
               <p className="text-sm text-slate-400 font-medium tracking-wide animate-pulse">Sincronizando vetores...</p>
             </div>
          ) : knowledgeList.length === 0 ? (
             <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border border-slate-700/50">
                  <FileText className="text-slate-500" size={24} />
                </div>
                <h3 className="text-white font-semibold mb-1">Nenhum conhecimento ativo</h3>
                <p className="text-sm text-slate-500 max-w-sm mx-auto">Sua IA ainda depende unicamente do Prompt principal. Injete FAQs ou URLs ao lado para deixá-la mais inteligente.</p>
             </div>
          ) : (
             <div className="space-y-3">
               {knowledgeList.map(item => (
                 <div key={item.id} className="group relative flex gap-4 p-4 rounded-xl border transition-all"
                   style={{ background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.05)" }}
                   onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
                   onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.015)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)"; }}
                 >
                   <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0">
                     <FileText size={14} className="text-indigo-400" />
                   </div>
                   <div className="flex-1 min-w-0 pr-8">
                     <p className="text-sm text-slate-300 leading-relaxed font-medium line-clamp-2">{item.content}</p>
                     <p className="text-[10px] text-slate-500 font-semibold mt-2 uppercase tracking-wide">
                        Adicionado em {new Date(item.created_at).toLocaleDateString()}
                     </p>
                   </div>
                   
                   <button 
                     onClick={() => handleDelete(item.id)}
                     className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-lg text-rose-500 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
                     title="Remover Neurônio"
                   >
                     <Trash2 size={14} />
                   </button>
                 </div>
               ))}
             </div>
          )}
        </div>

      </div>
    </div>
  );
}
