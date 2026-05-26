// Simple mock for Gemini generative API used in TEST_MODE
module.exports = {
  getGenerativeModel: function () {
    return {
      startChat: function () {
        return {
          sendMessage: async function (arrayMultiModal) {
            const payloadText = (Array.isArray(arrayMultiModal) ? arrayMultiModal[arrayMultiModal.length - 1].text : String(arrayMultiModal)) || "";
            // Simulate different behaviors based on input
            if (/hallucinate/i.test(payloadText)) {
              return { response: { text: () => "Informação inventada: Empresa X é cliente nosso.\nDraft:" } };
            }
            if (/draft/i.test(payloadText)) {
              return { response: { text: () => "Draft 1: rascunho\nResposta final: Olá, aqui está a resposta limpa." } };
            }

            // Default clean response
            return { response: { text: () => "Olá! Esta é uma resposta simulada e limpa." } };
          },
        };
      },
      embedContent: async function (text) {
        // Return a deterministic fake embedding
        return { embedding: { values: new Array(768).fill(0.001) } };
      },
    };
  },
};
