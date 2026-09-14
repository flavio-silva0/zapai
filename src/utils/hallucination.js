// Utilitário para detectar sinais heurísticos de alucinação do modelo e tentativas de injeção
function detectPossibleHallucination(modelText, ragUsed = false) {
  if (ragUsed) return false;
  if (!modelText || typeof modelText !== "string") return false;

  // Detecta se a IA inventou parcerias com nomes específicos sem RAG
  const patterns = [
    /\b(trabalhamos com|parceria com|atendemos a|cases recentes com)\s+(Tozzo|Aceville|[A-Z][a-z]+(\s+e\s+[A-Z][a-z]+)?)\b/i,
    /\b(Tozzo|Aceville)\b/i,
  ];

  return patterns.some((re) => re.test(modelText));
}

/**
 * Detecta tentativas de prompt injection / jailbreak nos inputs
 */
function detectPromptInjection(inputText) {
  if (!inputText || typeof inputText !== "string") return false;
  const injectionPatterns = [
    /ignore\s+(previous|todas\s+as|as)\s+(instructions|instruções|diretrizes)/i,
    /system\s+prompt|prompt\s+do\s+sistema/i,
    /desconsidere\s+(as|todas\s+as)?\s*(regras|instruções|mensagens)/i,
    /você\s+agora\s+é\s+(um|o)?\s*(dan|jailbreak|desenvolvedor)/i,
    /mode:\s*developer|dan\s+mode/i,
    /reveal\s+(api\s+key|token|secret|password|senha)/i,
  ];
  return injectionPatterns.some((re) => re.test(inputText));
}

module.exports = { detectPossibleHallucination, detectPromptInjection };

