# UX, produto, acessibilidade e performance

Data: 09/09/2026. Evidências de código referem-se ao checkout local, commit 20726db. Estado remoto privado não foi inspecionado. Código da aplicação não foi alterado.

Estados: **VERIFICADO**, **PROBLEMA ENCONTRADO**, **NÃO FOI POSSÍVEL VERIFICAR**. Uma demonstração com mocks não prova comportamento do fornecedor real.

## UX-001 — Canais exibem conexão e métricas fictícias

- **ID:** UX-001
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Channels.jsx:166`

**Estado atual / Problema:** Telefone, conexão, atividade e métricas são fixos; verificar status apenas anima.

**Impacto:** Cliente acredita que número está pronto sem onboarding Meta real.

**Como reproduzir:** Ler Channels e comparar cliente recém-criado sem Meta com tela conectada.

**Correção recomendada:** Conectar a status verificado do backend; ocultar simulados; checklist guiado de conexão.

**Esforço:** M

**Verificação pós-correção:** Conta nova mostra desconectada e explica ação; só confirma após checagem real.

## UX-002 — Configurações, billing, equipe e 2FA são maquetes

- **ID:** UX-002
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Settings.jsx:49`

**Estado atual / Problema:** Botões sem persistência; plano/uso/cartão/equipe/API key estáticos.

**Impacto:** Promessas comerciais sem implementação; falsa percepção de segurança.

**Como reproduzir:** Settings contém plano Pro fixo e toggle 2FA com callback vazio.

**Correção recomendada:** Remover ou marcar indisponível; priorizar conta real, cobrança contratual e limites server-side.

**Esforço:** M

**Verificação pós-correção:** Nenhuma ação mostra sucesso sem efeito; plano vem do servidor.

## UX-003 — Sliders de personalidade não são salvos nem usados pela IA

- **ID:** UX-003
- **Severidade:** P1
- **Categoria:** product
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/AiSetup.jsx:87`

**Estado atual / Problema:** Valores só alteram preview local e voltam a defaults no reload; fullForm não contém sliders.

**Impacto:** Configuração principal aparenta funcionar mas não altera comportamento.

**Como reproduzir:** Alterar slider/recarregar; inspecionar fullForm e payload de save.

**Correção recomendada:** Persistir parâmetros estruturados e compilar prompt; carregá-los no mount.

**Esforço:** M

**Verificação pós-correção:** Valor e comportamento sobrevivem reload; teste por API e UI.

## UX-004 — Inbox de conversa cortado no celular

- **ID:** UX-004
- **Severidade:** P1
- **Categoria:** ux
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Chat.jsx:82`

**Estado atual / Problema:** Lista fixa ocupa 320px em viewport 360px e área de conversa fica comprimida/cortada.

**Impacto:** PME não consegue operar atendimento pelo celular.

**Como reproduzir:** Revisão visual evidence/local-painel-chat-360.png; overflow false não detecta clipping.

**Correção recomendada:** Layout de duas telas lista/conversa no mobile, com voltar e composer visível.

**Esforço:** M

**Verificação pós-correção:** Selecionar contato, ler e enviar a 360/390px sem corte e com teclado virtual.

## UX-005 — Métrica de resolução confunde IA ativa com sucesso

- **ID:** UX-005
- **Severidade:** P2
- **Categoria:** analytics
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/src/pages/Analytics.jsx:117`

**Estado atual / Problema:** Calcula aiAtivo/total como resolução; segmentos misturam dimensões sobrepostas; filtro período não refaz dados.

**Impacto:** Cliente recebe indicadores que não medem resultado.

**Como reproduzir:** Inspeção Analytics linhas 120-145.

**Correção recomendada:** Eventos de encerramento/handoff; intervalos reais no servidor e métricas com definição.

**Esforço:** S

**Verificação pós-correção:** Fixture com IA ativa mas não resolvida não conta como resolução.

## SEO-001 — Robots e sitemap retornam shell SPA

- **ID:** SEO-001
- **Severidade:** P2
- **Categoria:** seo
- **Estado:** PROBLEMA ENCONTRADO
- **Evidência:** `frontend/vercel.json:4`

**Estado atual / Problema:** Arquivos ausentes caem no fallback; canonical é global.

**Impacto:** SEO e rastreamento com respostas enganosas.

**Como reproduzir:** Navegação produção /robots.txt e /sitemap.xml termina na Home; status 200/304.

**Correção recomendada:** Publicar robots/sitemap válidos e metadata por rota; 404 real onde cabível.

**Esforço:** S

**Verificação pós-correção:** Content-Type e conteúdo corretos; rotas privadas excluídas; canonical coerente.

## Revisão visual e navegação

Produção: Home/Sobre/Planos/Privacidade/Login/Cadastro e redirect /painel em 390/1440px; sem erros JS e sem requests 4xx/5xx nas navegações coletadas. Não foram clicados links que enviam WhatsApp nem formulários em produção. Local: todas as 17 páginas e fallback capturados em 360/390/768/1024/1440px, conforme evidence/local-browser.json. Capturas de páginas com scroll interno representam viewport inicial; screenshot fullPage não torna conteúdo interno visível. Capturas públicas sem rolar podem ocultar conteúdo com animação de entrada: não classificado como 'página vazia'.

Inspeção humana das imagens encontrou clipping no Chat, apesar de scrollWidth não acusar overflow. Settings mobile comprime descrições em uma coluna estreita devido a inputs de 200px. Sliders sem rótulo acessível; inputs de cabeçalho e controles de configurações sem label adequado. Login/cadastro têm labels e autocomplete. Falta revisão com leitor de tela, contraste instrumental completo e teclado virtual real: NÃO FOI POSSÍVEL VERIFICAR WCAG integral.

### Onboarding e proposta

Landing tem linguagem simples e CTAs claros, com exemplos de agendamento que vão além das ações executáveis atuais. Não há agenda real; dizer 'Agendei' só é correto se integração confirmar. Cadastro em etapas → painel → IA → base → conexão assistida pelo admin → teste → primeiro evento: ao menos 6 marcos, sem wizard guiado ou estado de conclusão. Tempo até valor não foi medido; depende de habilitação Meta externa. Exibir checklist e confirmação real, concentrando primeiro sucesso no teste em 3 etapas do produto.

### /painel/ia

A primeira aba transmite simplicidade mas sliders não fazem parte do prompt salvo. 'BDR/SDR', 'tenant' e 'prompt' são termos técnicos em partes da UI. Preferir 'Objetivo do atendimento', exemplos de regras e handoff. Salvar parâmetros junto da compilação; não exigir edição de texto técnico para comportamento comum.

### Performance

Build passou: entrada principal 241.66kB (gzip72.75), CSS62.84kB (gzip11.99), router chunk42.26kB. Rotas secundárias lazy. Assets públicos incluem logo.png ~6.8MB e favicon ~460KB; não assumir que todos são carregados. Converter/comprimir apenas usados, dimensionar favicon e verificar rede. App é SPA sem hydration SSR; recomendações Next/Server Components não se aplicam. Nenhum Lighthouse/Core Web Vitals de campo medido. Requisições GET são deduplicadas em voo; Layout+Home consultam stats e SSE dispara refetch global.

### SEO

Title/description/OG/Twitter/canonical/favicon existem em index.html. Alguns títulos mudam em useEffect, mas canonical/OG são globais; og:image relativo. Não há structured data/robots/sitemap real. Panel usa shell index/follow. Ver diferenças produção/local em evidence, sem alegar igualdade do commit do deploy por semelhança visual.
