import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

export default function LandingSobre() {
  return (
    <div className="pt-20 font-body bg-white selection:bg-cyan-100 selection:text-cyan-900">
      
      {/* ══════════════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════════════ */}
      <section className="pt-24 lg:pt-32 pb-24 px-5 text-center bg-slate-900 border-b border-slate-800">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-[1.1]">
            Nascemos para resolver o caos do atendimento.
          </h1>
          <p className="text-lg text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
            A tecnologia não deve complicar a vida de quem vende. Deve apenas garantir que nenhum cliente fique sem resposta.
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          O PROBLEMA
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
          <div className="pr-0 md:pr-10">
            <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight leading-[1.1]">
              A complexidade nos afasta do que realmente importa: vender.
            </h2>
            <p className="text-slate-600 leading-relaxed mb-6 font-medium">
              Vimos empresas perdendo clientes simplesmente porque não conseguiam responder o WhatsApp a tempo. Ao procurar soluções, esbarravam em ferramentas com dezenas de botões que a equipe não tinha tempo de aprender.
            </p>
            <p className="text-slate-600 leading-relaxed">
              O WhatsApp já é o lugar onde a venda acontece. A ZapAI foi criada para viver dentro dessa realidade, assumindo a carga operacional para que o humano atue apenas no fechamento.
            </p>
          </div>
          
          <div className="relative">
            {/* Visual Element: Chaos vs Order */}
            <div className="absolute -top-10 -left-10 w-40 h-40 bg-rose-100 rounded-full blur-3xl opacity-50 z-0"></div>
            <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-cyan-100 rounded-full blur-3xl opacity-50 z-0"></div>
            
            <div className="relative z-10 flex flex-col gap-4">
              {/* Card 1: Chaotic */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm opacity-50 translate-x-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-slate-100 rounded-full" />
                  <div className="flex flex-col gap-1">
                    <div className="w-24 h-2 bg-slate-200 rounded" />
                    <div className="w-16 h-2 bg-slate-200 rounded" />
                  </div>
                </div>
                <div className="text-[10px] text-rose-500 font-bold uppercase tracking-widest mt-2 border-t border-slate-100 pt-2">Conversa Perdida</div>
              </div>

              {/* Card 2: Organized (ZapAI) */}
              <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl -translate-x-4 scale-105">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-900 rounded-full flex items-center justify-center text-cyan-400 font-bold border border-cyan-800">
                      ML
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">Marcos Lead</div>
                      <div className="text-cyan-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Atendimento Estruturado</div>
                    </div>
                  </div>
                  <Check size={20} className="text-cyan-400" />
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span className="text-xs text-slate-300">Intenção classificada em 2s.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span className="text-xs text-slate-300">Dados do cliente coletados sem erro humano.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                    <span className="text-xs text-slate-300">Transferido para o vendedor exato.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          A EQUIPE / POSICIONAMENTO
      ══════════════════════════════════════════════════════ */}
      <section className="py-24 px-5 bg-slate-900 text-white relative overflow-hidden">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-white mb-6 tracking-tight">Construído para o mundo real</h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-10">
            Nós não vendemos "o futuro da inteligência artificial". Nós entregamos uma operação redonda onde a IA trabalha nos bastidores, fazendo o trabalho operacional, para que sua empresa ganhe produtividade.
          </p>
          
          <div className="flex justify-center border-t border-slate-800 pt-10">
            <div className="text-left">
              <span className="block text-cyan-400 font-bold text-xs uppercase tracking-wider mb-2">Compromisso B2B</span>
              <p className="text-white font-medium">Uso exclusivo de APIs oficiais.</p>
              <p className="text-white font-medium">Privacidade de dados dos seus clientes.</p>
              <p className="text-white font-medium">Infraestrutura escalável no Brasil.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════ */}
      <section className="section-padding px-5 bg-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 mb-6 tracking-tight">
            Pronto para profissionalizar sua operação?
          </h2>
          <Link to="/cadastro" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
            Criar conta
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

    </div>
  );
}
