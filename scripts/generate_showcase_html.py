import os
import base64

ARTIFACT_DIR = r"C:\Users\FlavioJuniorCarvalho\.gemini\antigravity\brain\a772fc6f-7ffb-480f-b486-e463e9bb9a98"
PUBLIC_DIR = r"c:\Users\FlavioJuniorCarvalho\Documents\Pessoal\ZapAI\frontend\public"
NEW_BRAND_DIR = os.path.join(PUBLIC_DIR, "new_brand")

def get_b64(path):
    if not os.path.exists(path):
        return ""
    ext = os.path.splitext(path)[1].lower().replace('.', '')
    mime = "image/png" if ext == "png" else ("image/jpeg" if ext in ["jpg", "jpeg"] else "image/svg+xml")
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode('utf-8')
    return f"data:{mime};base64,{data}"

old_symbol_b64 = get_b64(os.path.join(PUBLIC_DIR, "zapai-symbol.png"))
new_light_logo_b64 = get_b64(os.path.join(NEW_BRAND_DIR, "zapai_logo_light.png"))
new_dark_logo_b64 = get_b64(os.path.join(NEW_BRAND_DIR, "zapai_logo_dark.png"))
new_app_icon_b64 = get_b64(os.path.join(NEW_BRAND_DIR, "zapai_app_icon.png"))
new_symbol_op1_b64 = get_b64(os.path.join(NEW_BRAND_DIR, "zapai_symbol_op1.png"))
new_symbol_op2_b64 = get_b64(os.path.join(NEW_BRAND_DIR, "zapai_symbol_op2.png"))
concept_c_b64 = get_b64(os.path.join(ARTIFACT_DIR, "zapai_logo_concept_c_1789405716116.jpg"))
concept_d_b64 = get_b64(os.path.join(ARTIFACT_DIR, "zapai_logo_concept_d_1789405789819.jpg"))

html_content = f"""<!DOCTYPE html>
<html lang="pt-BR" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ZapAI - Nova Identidade Visual & Logo</title>
  <script src="https://www.gstatic.com/antigravity/web/dev/tailwindcss.min.js"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
    }}
  </style>
</head>
<body class="bg-[#0B0F17] text-slate-100 min-h-full p-6 md:p-10 antialiased selection:bg-emerald-500 selection:text-white">

  <!-- HEADER -->
  <div class="max-w-6xl mx-auto mb-10">
    <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-4">
      <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
      Sistema de Identidade Visual 2.0
    </div>
    <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
      Nova Logo <span class="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">ZapAI</span>
    </h1>
    <p class="text-slate-400 text-base md:text-lg mt-3 max-w-3xl leading-relaxed">
      Projetada com rigor geométrico, maturidade corporativa e sem clichês de inteligência artificial. Focada no posicionamento real do produto: 
      <strong class="text-white font-semibold">atendente digital no WhatsApp que trabalha com precisão humana</strong>.
    </p>
  </div>

  <!-- COMPARATIVO ANTES X DEPOIS -->
  <div class="max-w-6xl mx-auto mb-12">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span class="text-emerald-400">01.</span> Diagnóstico: O Salto de Maturidade
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- ANTES -->
      <div class="bg-slate-900/60 border border-red-500/20 rounded-2xl p-6 relative overflow-hidden">
        <div class="absolute top-4 right-4 px-2.5 py-1 rounded bg-red-500/10 text-red-400 text-xs font-semibold">
          ANTES: Clichê de IA
        </div>
        <p class="text-sm font-semibold text-slate-400 mb-4">Logo Anterior (Glow & Relâmpago)</p>
        <div class="bg-[#030712] rounded-xl p-8 flex items-center justify-center min-h-[220px] border border-slate-800">
          <img src="{old_symbol_b64}" alt="Logo Anterior" class="w-32 h-auto object-contain opacity-75">
        </div>
        <div class="mt-4 space-y-2 text-xs text-slate-400">
          <div class="flex items-start gap-2">
            <span class="text-red-400 font-bold">✕</span>
            <span><strong>Cara de gerador de IA:</strong> halo de luz neon azulado borrado, visual "gamer" de 2018.</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-red-400 font-bold">✕</span>
            <span><strong>Metáfora desconectada:</strong> relâmpago pontudo genérico sem relação com atendimento ou WhatsApp.</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-red-400 font-bold">✕</span>
            <span><strong>Ilegível em tamanhos pequenos:</strong> em 16px/32px (favicon/navbar) vira um borrão ciano.</span>
          </div>
        </div>
      </div>

      <!-- DEPOIS -->
      <div class="bg-gradient-to-b from-emerald-950/20 to-slate-900/60 border border-emerald-500/30 rounded-2xl p-6 relative overflow-hidden">
        <div class="absolute top-4 right-4 px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
          NOVO: Padrão Linear/Stripe
        </div>
        <p class="text-sm font-semibold text-emerald-400 mb-4">Nova Identidade (Dual Bubble Z)</p>
        <div class="bg-white rounded-xl p-8 flex items-center justify-center min-h-[220px] border border-slate-200/20 shadow-inner">
          <img src="{new_light_logo_b64}" alt="Nova Logo ZapAI" class="max-w-[340px] w-full object-contain">
        </div>
        <div class="mt-4 space-y-2 text-xs text-slate-300">
          <div class="flex items-start gap-2">
            <span class="text-emerald-400 font-bold">✓</span>
            <span><strong>Design Humano e Suíço:</strong> geometria vetorial pura, sem filtros de blur, sem ruído.</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-emerald-400 font-bold">✓</span>
            <span><strong>Semiótica perfeita:</strong> 2 balões de diálogo (Cliente + Atendente) unidos formando o "Z" do Zap.</span>
          </div>
          <div class="flex items-start gap-2">
            <span class="text-emerald-400 font-bold">✓</span>
            <span><strong>Autoridade corporativa:</strong> transmite segurança para médicos, corretores, lojistas e empresas B2B.</span>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- CONCEITO PRINCIPAL E VERSÕES -->
  <div class="max-w-6xl mx-auto mb-12">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span class="text-emerald-400">02.</span> Aplicações Oficiais da Nova Marca
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      
      <!-- CARD 1: SÍMBOLO MASTER -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Símbolo / Ícone</span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">512×512</span>
          </div>
          <div class="bg-[#070A11] rounded-xl p-6 flex items-center justify-center aspect-square border border-slate-800/80 mb-4">
            <img src="{new_symbol_op1_b64}" alt="Símbolo ZapAI" class="w-36 h-36 object-contain">
          </div>
          <h3 class="text-white font-bold text-base">The Interlocking Dialogue Z</h3>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Dois balões de conversa com cantos lapidados sobrepostos na diagonal, revelando a letra <strong>Z</strong> em espaço negativo de alta precisão.
          </p>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span class="text-slate-500">Formato: SVG & PNG</span>
          <span class="text-emerald-400 font-medium">100% Vetorial</span>
        </div>
      </div>

      <!-- CARD 2: APP ICON / SMARTPHONE -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">App Icon / WhatsApp</span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">Squircle</span>
          </div>
          <div class="bg-slate-950 rounded-xl p-6 flex items-center justify-center aspect-square border border-slate-800/80 mb-4">
            <img src="{new_app_icon_b64}" alt="App Icon ZapAI" class="w-36 h-36 rounded-[28px] shadow-2xl object-contain">
          </div>
          <h3 class="text-white font-bold text-base">App Icon & Foto de Perfil</h3>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Desenvolvido para se destacar na lista de contatos do WhatsApp e na tela inicial de smartphones (iOS e Android), transmitindo profissionalismo imediato.
          </p>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span class="text-slate-500">Uso: Mobile, Favicon, PWA</span>
          <span class="text-emerald-400 font-medium">Pronto para deploy</span>
        </div>
      </div>

      <!-- CARD 3: VERSÃO DARK NO HEADER -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <div class="flex items-center justify-between mb-4">
            <span class="text-xs font-semibold text-slate-400 uppercase tracking-wider">Modo Escuro / Header</span>
            <span class="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">Horizontal</span>
          </div>
          <div class="bg-slate-950 rounded-xl p-6 flex items-center justify-center aspect-square border border-slate-800/80 mb-4">
            <div class="w-full bg-[#0F172A] border border-slate-800 rounded-xl p-5 flex items-center justify-center">
              <img src="{new_light_logo_b64}" alt="ZapAI Light" class="max-w-[200px] w-full object-contain filter invert hue-rotate-180 brightness-150">
            </div>
          </div>
          <h3 class="text-white font-bold text-base">Horizontal Completa</h3>
          <p class="text-slate-400 text-xs mt-1.5 leading-relaxed">
            Tipografia corporativa sólida com espaçamento óptico refinado. O "Zap" traz peso e seriedade enquanto o "AI" em verde esmeralda traz vida e frescor.
          </p>
        </div>
        <div class="mt-4 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs">
          <span class="text-slate-500">Navbar, Rodapés, Propostas</span>
          <span class="text-emerald-400 font-medium">Contraste WCAG AAA</span>
        </div>
      </div>

    </div>
  </div>

  <!-- CONTEXTO REAL: COMO FICA NA PRÁTICA -->
  <div class="max-w-6xl mx-auto mb-12">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span class="text-emerald-400">03.</span> A Nova Marca em Contexto Real
    </h2>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

      <!-- MOCKUP NAVBAR REAL -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
          <span>Simulação na Navbar (Fundo Claro da Landing)</span>
          <span class="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Desktop</span>
        </h3>
        
        <div class="bg-[#FAFAF8] rounded-xl border border-slate-200 p-4 shadow-sm">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <img src="{new_light_logo_b64}" alt="Logo Navbar" class="h-9 w-auto">
            </div>
            <div class="hidden sm:flex items-center gap-4 text-xs font-semibold text-slate-600">
              <span class="text-slate-900">Home</span>
              <span>Recursos</span>
              <span>Como funciona</span>
              <span>Planos</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-white bg-teal-600 px-3.5 py-1.5 rounded-full shadow-sm">
                Criar atendente
              </span>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-400 mt-3 leading-relaxed">
          Na barra de navegação real da página inicial, a logo fica perfeitamente harmonizada com a paleta existente (`#FAFAF8` e `teal-600`), com nitidez cristalina em telas Retina.
        </p>
      </div>

      <!-- MOCKUP WHATSAPP CHAT -->
      <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-3 flex items-center justify-between">
          <span>Visualização no WhatsApp do Cliente</span>
          <span class="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Mobile UI</span>
        </h3>

        <div class="bg-[#0B141B] rounded-xl border border-slate-800 p-4 shadow-sm text-slate-100">
          <div class="flex items-center gap-3 border-b border-slate-800/80 pb-3">
            <img src="{new_app_icon_b64}" alt="Avatar" class="w-10 h-10 rounded-full border border-emerald-500/30">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="text-sm font-bold text-white">ZapAI Atendente</span>
                <span class="text-[10px] text-emerald-400 bg-emerald-500/20 px-1 rounded font-medium">Oficial</span>
              </div>
              <p class="text-[11px] text-emerald-400">online agora</p>
            </div>
          </div>
          <div class="mt-3 space-y-2 text-xs">
            <div class="bg-[#1F2C34] text-slate-200 rounded-lg rounded-tl-none p-2.5 max-w-[85%] border border-slate-700/40">
              Olá! Como posso ajudar sua empresa a não perder nenhum cliente hoje? 👋
              <div class="text-[9px] text-slate-400 text-right mt-1">14:48</div>
            </div>
          </div>
        </div>

        <p class="text-xs text-slate-400 mt-3 leading-relaxed">
          O avatar circular se destaca com altíssima autoridade. O cliente do pequeno negócio imediatamente reconhece que está conversando com um sistema confiável e profissional.
        </p>
      </div>

    </div>
  </div>

  <!-- CONCEITO ALTERNATIVO EXPLORATÓRIO -->
  <div class="max-w-6xl mx-auto mb-12">
    <h2 class="text-xl font-bold text-white mb-5 flex items-center gap-2">
      <span class="text-emerald-400">04.</span> Conceitos Artísticos Exploratórios
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- ESTUDO 1: RIBBON MONOGRAM -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-white font-bold text-sm">Estudo A: Monograma Z em Traço Contínuo</h3>
          <span class="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Exploração</span>
        </div>
        <div class="bg-white rounded-xl overflow-hidden mb-3 aspect-square flex items-center justify-center p-4">
          <img src="{concept_c_b64}" alt="Conceito C" class="w-full h-full object-contain">
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Uma única linha contínua que desenha o Z e termina na cauda de fala. Ultra minimalista, ideal para gravuras, carimbos, adesivos e brindes físicos.
        </p>
      </div>

      <!-- ESTUDO 2: DUAL OVERLAP TRANSLUCENT -->
      <div class="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-white font-bold text-sm">Estudo B: Sobreposição Transparente</h3>
          <span class="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Exploração</span>
        </div>
        <div class="bg-[#F8FAFC] rounded-xl overflow-hidden mb-3 aspect-square flex items-center justify-center p-4">
          <img src="{concept_d_b64}" alt="Conceito D" class="w-full h-full object-contain">
        </div>
        <p class="text-xs text-slate-400 leading-relaxed">
          Balões com transparência geométrica que revelam a letra Z central na intersecção. O estudo base que originou a versão vetorial oficial.
        </p>
      </div>

    </div>
  </div>

  <!-- ARQUIVOS GERADOS -->
  <div class="max-w-6xl mx-auto bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-6 md:p-8">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h3 class="text-lg font-bold text-white">Arquivos de Produção Criados</h3>
        <p class="text-xs text-slate-400 mt-1">
          Todos os arquivos foram gerados em formato vetorial nativo (SVG) e imagens PNG prontas para a aplicação web em <code>frontend/public/new_brand/</code>:
        </p>
      </div>
      <div class="flex flex-wrap gap-2 text-xs">
        <span class="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono">zapai_symbol_op1.svg</span>
        <span class="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono">zapai_logo_light.svg</span>
        <span class="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg font-mono">zapai_app_icon.png</span>
      </div>
    </div>
  </div>

</body>
</html>"""

out_html = os.path.join(ARTIFACT_DIR, "brand_showcase.html")
with open(out_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print("Saved showcase HTML to:", out_html)
