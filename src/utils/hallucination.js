// Utilitário simples para detectar sinais heurísticos de alucinação do modelo
function detectPossibleHallucination(modelText, ragUsed = false) {
  if (!modelText || typeof modelText !== 'string') return false;

  // Heurística: menções a empresas/clientes/cases com nomes próprios sem RAG
  try {
    const mentionsFacts = /\b(empresa|parceir|cliente|cases?|contrato|marca|parceiro)\b/i.test(modelText);
    // Captura nomes próprios simples (Tozzo) e compostos (Tozzo Aceville)
    const probableNames = /[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôç]{2,}(?:\s+[A-ZÁÉÍÓÚÂÊÔÇ][a-záéíóúâêôç]{2,})*/g;
    const foundNames = modelText.match(probableNames) || [];

    if (!ragUsed && mentionsFacts && foundNames.length > 0) {
      return true;
    }
  } catch (e) {
    return false;
  }

  return false;
}

module.exports = { detectPossibleHallucination };
