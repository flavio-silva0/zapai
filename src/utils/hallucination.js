// Utilitário simples para detectar sinais heurísticos de alucinação do modelo
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

module.exports = { detectPossibleHallucination };
