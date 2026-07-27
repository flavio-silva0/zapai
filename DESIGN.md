# ZapAI - Design System Avançado & Arquitetura Visual (Densidade Controlada)

Este documento dita as regras para a interface premium da ZapAI. Focamos em profundidade de software corporativo.

## 1. Direção Visual "Central em Movimento"
- **Sensação:** Produto digital sofisticado, de alto padrão (Stripe/Linear-like), focado em visualizar fluxos de dados reais.
- **Anti-padrões absolutos:** 
  - Grids de 3 colunas repetitivos ("titulo + icon + desc").
  - Vazio excessivo.
  - "Neon glassmorphism".
  - Design monocromático de template.

## 2. Densidade Visual Controlada
A interface precisa de profundidade baseada em informações reais do sistema.
- Uso de **Micro-Labels:** Textos em UPPERCASE com `text-[10px]` para status (`INTENÇÃO DETECTADA`, `RESOLVIDO`).
- **Conectores (Orbitais):** Elementos flutuantes na tela (ex: pop-up de mensagem recebida) conectados com linhas SVG precisas e sutis (`stroke-slate-300` ou escuro `stroke-slate-700`).
- **Bento Grids (Assimetria):** Elementos em grid `span-2` ou `row-span-2` para quebrar monotonias.

## 3. Tipografia e Cores
- **Inter** continua como fonte mestre. Hierarquia drástica (Títulos em `text-[3.5rem]` ao lado de badgets `text-[10px]`).
- **Cores principais:**
  - `slate-900` e `slate-950` para blocos escuros estruturais.
  - `white` e `slate-50` para blocos claros de leitura.
  - O **Ciano** e o **Roxo** agora são usados puramente em labels, pontos indicadores de atividade (pontos de loading/notificação) e linhas conectoras de dados, criando "pulsos" de energia onde há ação.

## 4. Microinterações
- Painéis de abas dinâmicas.
- Fade-ins controlados.
- Nenhuma partícula giratória. Animações focam em "surgimento de mensagem" ou "mudança de tag".
