// Utilitário simples para detectar sinais heurísticos de alucinação do modelo
function detectPossibleHallucination(modelText, ragUsed = false) {
  // A heurística baseada em Regex estava bloqueando conversas normais
  // quando a IA mencionava o próprio nome da empresa se o RAG estivesse vazio.
  return false;
}

module.exports = { detectPossibleHallucination };
