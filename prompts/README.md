# 📁 prompts/ — Biblioteca de Prompts por Nicho

Esta pasta é a **central de configuração da IA** para cada cliente.
Para trocar o nicho ou cliente, você só precisa apontar o arquivo correto no `.env`.

---

## Como funciona

O sistema lê o arquivo de prompt definido pela variável `PROMPT_FILE` no `.env`:

```env
# No .env do projeto:
PROMPT_FILE=dental-odontosorriso
BOT_NAME=Sofia
```

O sistema vai carregar o arquivo `prompts/dental-odontosorriso.txt` automaticamente.

---

## Arquivos disponíveis

| Arquivo | Nicho | Status |
|---|---|---|
| `dental-odontosorriso.txt` | Clínica dental OdontoSorriso (exemplo real, pronto) | ✅ Pronto |
| `_TEMPLATE-dental.txt` | Clínicas odontológicas | 📋 Template |
| `_TEMPLATE-petshop.txt` | Pet shops | 📋 Template |
| `_TEMPLATE-imobiliaria.txt` | Imobiliárias e corretores | 📋 Template |
| `_TEMPLATE-restaurante.txt` | Restaurantes e bares | 📋 Template |
| `_TEMPLATE-salao-beleza.txt` | Salões de beleza e barbearias | 📋 Template |
| `_TEMPLATE-academia.txt` | Academias e studios de fitness | 📋 Template |
| `_TEMPLATE-clinica-estetica.txt` | Clínicas de estética e beleza | 📋 Template |
| `_TEMPLATE-clinica-psicologia.txt` | Psicólogos e clínicas de saúde mental | 📋 Template |
| `_TEMPLATE-clinica-veterinaria.txt` | Clínicas veterinárias | 📋 Template |
| `_TEMPLATE-clinica-nutricao.txt` | Nutricionistas e clínicas de nutrição | 📋 Template |
| `_TEMPLATE-escola-cursos.txt` | Escolas e cursos profissionalizantes | 📋 Template |
| `_TEMPLATE-escola-idiomas.txt` | Escolas de idiomas | 📋 Template |
| `_TEMPLATE-loja-roupas.txt` | Lojas de roupas e moda | 📋 Template |
| `_TEMPLATE-corretora-seguros.txt` | Corretoras de seguros | 📋 Template |
| `_TEMPLATE-oficina-mecanica.txt` | Oficinas mecânicas | 📋 Template |
| `_TEMPLATE-empresa-eventos.txt` | Empresas de eventos e cerimoniais | 📋 Template |
| `_TEMPLATE-escritorio-contabilidade.txt` | Escritórios de contabilidade | 📋 Template |
| `_TEMPLATE-empresa-ti-suporte.txt` | Empresas de TI e suporte técnico | 📋 Template |
| `_TEMPLATE-empresa-construcao.txt` | Construtoras e reformas | 📋 Template |

> **Convenção de nomes:**
> - `_TEMPLATE-` = modelo base, não edite diretamente.
> - `nicho-nomedonegocio.txt` = arquivo pronto para um cliente específico.

---

## Como criar um prompt para um novo cliente

### Passo 1 — Copie o template do nicho

```bash
# Exemplo: novo cliente é uma clínica dental
copy prompts\_TEMPLATE-dental.txt prompts\dental-nome-da-clinica.txt

# Ou no Linux/Mac:
cp prompts/_TEMPLATE-dental.txt prompts/dental-nome-da-clinica.txt
```

### Passo 2 — Preencha os dados do cliente

Abra o arquivo copiado e substitua todos os valores marcados com `[COLCHETES]`.
Cada template já tem instruções de o que preencher em cada seção.

Os campos mais importantes de qualquer prompt:
- **Nome da atendente** (a persona da IA — pode ser sempre "Sofia" ou trocar por cliente)
- **Nome do negócio**
- **Endereço, telefone, horários**
- **Lista de serviços e preços**
- **Formas de pagamento**
- **Política de agendamento**

### Passo 3 — Aponte no `.env`

```env
PROMPT_FILE=dental-nome-da-clinica
BOT_NAME=Sofia
CLINIC_NAME=Nome Oficial da Clínica
CLINIC_PHONE=(11) 99999-9999
```

### Passo 4 — Reinicie o servidor

```bash
# Via PM2 (produção):
pm2 restart sofia-backend

# Via terminal (dev):
npm start
```

Pronto! A IA já estará respondendo com a personalidade e informações do novo cliente.

---

## Dicas para escrever um bom prompt

1. **Seja específico** — Quanto mais detalhes (preços, horários, políticas), menos a IA vai "inventar".
2. **Escreva no tom certo** — Petshop = carinhoso. Imobiliária = profissional. Salão = descolado.
3. **Defina os limites** — Sempre diga o que a IA JAMAIS deve fazer (diagnósticos, promessas, etc.).
4. **FAQs são ouro** — As perguntas frequentes pré-respondem 80% das dúvidas e deixam a IA mais assertiva.
5. **Teste sempre** — Use a aba "Testar Agente" no painel para validar o prompt antes de colocar para o cliente.

---

## Exemplo de fluxo completo para um novo cliente

```
Novo cliente: PetShop do Zé, São Paulo

1. cp prompts/_TEMPLATE-petshop.txt prompts/petshop-ze-sp.txt
2. Editar prompts/petshop-ze-sp.txt com dados reais do Zé
3. No .env:
   PROMPT_FILE=petshop-ze-sp
   BOT_NAME=Mel
   CLINIC_NAME=PetShop do Zé
   CLINIC_PHONE=(11) 98888-7777
4. pm2 restart sofia-backend
5. Testar no painel → aba "Testar Agente"
6. Mostrar para o Zé e coletar feedback
7. Ajustar o .txt se necessário, repetir passo 4
```
