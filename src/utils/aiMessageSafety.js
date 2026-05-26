"use strict";

const DEFAULT_AI_FALLBACK =
  "Perfeito. Entendi sua mensagem. Me diga em uma frase o que você quer saber e eu te respondo de forma direta.";

const SAFE_ERROR_FALLBACK =
  "Tive uma instabilidade aqui, mas já posso continuar te ajudando. Pode me mandar sua dúvida de novo?";

const TECHNICAL_LABEL_RE =
  /^(?:assistant|assistente|model|modelo|bot|sofia|beatriz|bia|resposta|response|output|content|json)\s*[:\-]\s*/i;

const FINAL_LABEL_RE =
  /(?:resposta\s+final|mensagem\s+final|final\s+answer|reply\s+final)\s*[:\-]\s*/gi;

const FORBIDDEN_PATTERNS = [
  /\bdrafting(?:\s+message)?\b/i,
  /\bdraft\s*(?:message)?\s*[12]?\b/i,
  /\bmessage\s*[12]\b/i,
  /\bassistant\s+notes?\b/i,
  /\bsystem\s+notes?\b/i,
  /\binternal\b/i,
  /\bdebug\b/i,
  /\bthought\b/i,
  /\breasoning\b/i,
  /\bsystem\s+prompt\b/i,
  /\binstru(?:ç|c)(?:ões|oes)\s+internas\b/i,
  /\bferramentas?\s+internas?\b/i,
  /\bstack\s+trace\b/i,
  /\b(?:TypeError|ReferenceError|SyntaxError|RangeError|UnhandledPromiseRejection|ECONNRESET|ETIMEDOUT)\b/,
  /^\s*at\s+[\w.<>]+\s+\(.+:\d+:\d+\)\s*$/m,
  /\bminha\s+mensagem\s+acabou\b/i,
  /\bmensagem\s+cortad[ao]\b/i,
  /\bcontinua(?:ndo)?\s+na\s+pr[oó]xima\b/i,
];

function normalizeWhitespace(text) {
  return String(text || "")
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function hasCommercialIntent(text) {
  const value = String(text || "").toLowerCase();
  return /saber\s+mais|servi(?:ç|c)os?|valores?|pre(?:ç|c)o|or(?:ç|c)amento|como\s+funciona|ag[eê]ncia|propaganda|marketing|branding/.test(value);
}

function getSafeFallback(contextText = "") {
  void contextText;
  return DEFAULT_AI_FALLBACK;
}

function coerceToText(value, reasons) {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) {
    reasons.push("empty_value");
    return "";
  }
  if (value instanceof Error) {
    reasons.push("error_object");
    return "";
  }
  if (typeof value === "object") {
    reasons.push("raw_object");
    return "";
  }
  return String(value);
}

function stripCodeFences(text) {
  return text
    .replace(/^```(?:json|javascript|js|ts|text|md|markdown)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/```/g, "");
}

function extractFinalSegment(text) {
  let match;
  let lastMatch = null;
  FINAL_LABEL_RE.lastIndex = 0;
  while ((match = FINAL_LABEL_RE.exec(text)) !== null) {
    lastMatch = match;
  }
  if (!lastMatch) return null;
  return text.slice(lastMatch.index + lastMatch[0].length).trim();
}

function looksLikeRawJson(text) {
  const clean = text.trim();
  if (!clean) return false;

  if (/^\s*[\[{]/.test(clean)) {
    try {
      JSON.parse(clean);
      return true;
    } catch (_) {
      if (/^\s*[\[{][\s\S]*["'](?:role|content|parts|candidates|choices|output_text|systemInstruction|message)["']\s*:/.test(clean)) {
        return true;
      }
    }
  }

  return /["'](?:role|content|parts|candidates|choices|output_text|systemInstruction|assistant|system)["']\s*:/.test(clean);
}

function hasForbiddenPattern(text) {
  return FORBIDDEN_PATTERNS.some((pattern) => pattern.test(text));
}

function removeTechnicalLines(text) {
  return text
    .split("\n")
    .filter((line) => {
      const clean = line.trim();
      if (!clean) return true;
      if (/^(?:assistant|system)\s+notes?\s*:/i.test(clean)) return false;
      if (/^(?:internal|debug|thought|reasoning)\s*:/i.test(clean)) return false;
      if (/^total\s+messages?\s*:/i.test(clean)) return false;
      if (/^\d+\s+chars?\.?$/i.test(clean)) return false;
      if (/^\s*at\s+[\w.<>]+\s+\(.+:\d+:\d+\)\s*$/i.test(clean)) return false;
      return true;
    })
    .join("\n");
}

function stripTechnicalPrefixes(text) {
  let clean = text.trim();
  for (let i = 0; i < 4; i += 1) {
    const next = clean.replace(TECHNICAL_LABEL_RE, "").trim();
    if (next === clean) break;
    clean = next;
  }
  return clean;
}

function stripBrokenMarkdown(text) {
  return text
    .replace(/^\s*#{1,6}\s+/gm, "")
    .replace(/[*_`]{1,3}/g, "")
    .replace(/\[\s*\]/g, "")
    .replace(/\(\s*\)/g, "");
}

function stripLooseWrappers(text) {
  return text
    .replace(/^[\s"'`.,;:)\]}]+/, "")
    .replace(/[\s"'`([{]+$/, "")
    .trim();
}

function collapseRepeatedSentences(text) {
  const parts = text.match(/[^.!?\n]+[.!?]?|\n+/g);
  if (!parts) return text;

  const seenInRow = new Set();
  const result = [];
  let previous = "";

  for (const part of parts) {
    if (/^\n+$/.test(part)) {
      result.push(part);
      previous = "";
      seenInRow.clear();
      continue;
    }

    const clean = part.trim();
    const key = clean.toLowerCase().replace(/[.!?]+$/, "");
    if (!clean) continue;

    if (key === previous || seenInRow.has(key)) continue;
    result.push(clean);
    previous = key;
    seenInRow.add(key);
  }

  return normalizeWhitespace(result.join(" "));
}

function looksLikeNoise(text) {
  const clean = text.trim().toLowerCase();
  if (!clean) return true;
  if (["undefined", "null", "nil", "none", "n/a", "]).", "[]", "{}", "[", "]", "{", "}"].includes(clean)) return true;
  if (/^[\])}.,;:"'`*\-\s]+$/.test(clean)) return true;
  return false;
}

function looksLikeGenericGreetingOnly(text) {
  const clean = normalizeWhitespace(text).toLowerCase();
  if (!clean || clean.length > 140) return false;

  const hasGreeting = /\b(oi|ol[aá]|tudo\s+(?:bem|[óo]timo)|bom\s+dia|boa\s+tarde|boa\s+noite)\b/.test(clean);
  const asksBack = /\b(e\s+com\s+vo(?:c|ç)[eê]|como\s+vo(?:c|ç)[eê]\s+est[aá]|em\s+que\s+posso\s+ajudar)/.test(clean);
  const hasBusinessTerm = /servi(?:ç|c)o|valor|pre(?:ç|c)o|ag[eê]ncia|propaganda|marketing|branding/.test(clean);

  return hasGreeting && asksBack && !hasBusinessTerm;
}

function looksIncompleteTail(text) {
  const clean = normalizeWhitespace(text);
  if (!clean || clean.length < 18) return false;
  if (/[.!?:]$/.test(clean)) return false;

  const tail = clean.toLowerCase().split(/\s+/).slice(-3).join(" ");
  const connectorTail = /\b(?:a|o|as|os|de|da|do|das|dos|e|em|para|por|com|sobre|que|se)\s*$/.test(clean.toLowerCase());
  const abruptTail = /\b(?:mas|porque|quando|como|então|entao|al[eé]m)\s*$/.test(clean.toLowerCase());
  const tinyTail = tail.length <= 8;

  return connectorTail || abruptTail || tinyTail;
}

function limitText(text, maxChars) {
  if (!maxChars || text.length <= maxChars) return text;

  const slice = text.slice(0, Math.max(0, maxChars - 4));
  const lastSpace = slice.lastIndexOf(" ");
  const trimmed = (lastSpace > 80 ? slice.slice(0, lastSpace) : slice).trim();
  return `${trimmed}...`;
}

function sanitizeAiMessageWithReport(value, options = {}) {
  const reasons = [];
  const contextText = options.contextText || "";
  const fallback = options.fallback || getSafeFallback(contextText);
  const allowFallback = options.allowFallback !== false;
  const raw = coerceToText(value, reasons);

  let clean = normalizeWhitespace(stripCodeFences(raw));

  if (!clean) reasons.push("empty");
  if (clean.includes("]).")) reasons.push("broken_brackets");
  if (looksLikeRawJson(clean)) reasons.push("raw_json");

  const finalSegment = extractFinalSegment(clean);
  if (finalSegment) {
    clean = normalizeWhitespace(stripCodeFences(finalSegment));
    reasons.push("final_segment_extracted");
  }

  clean = removeTechnicalLines(clean);
  clean = stripTechnicalPrefixes(clean);
  clean = stripBrokenMarkdown(clean);
  clean = stripLooseWrappers(clean);
  clean = collapseRepeatedSentences(clean);

  if (hasForbiddenPattern(clean)) reasons.push("internal_artifact");
  if (looksLikeRawJson(clean)) reasons.push("raw_json");
  if (looksLikeNoise(clean)) reasons.push("noise");
  if (looksIncompleteTail(clean)) reasons.push("incomplete_tail");
  if (hasCommercialIntent(contextText) && looksLikeGenericGreetingOnly(clean)) {
    reasons.push("generic_greeting_for_business_intent");
  }

  clean = limitText(clean, options.maxChars);

  const fatalReasons = reasons.filter((reason) => !["final_segment_extracted"].includes(reason));
  const valid = fatalReasons.length === 0 && !looksLikeNoise(clean);

  if (!valid) {
    return {
      text: allowFallback ? fallback : "",
      valid: false,
      usedFallback: allowFallback,
      reasons: [...new Set(fatalReasons.length ? fatalReasons : reasons)],
      original: raw,
    };
  }

  return {
    text: clean,
    valid: true,
    usedFallback: false,
    reasons: [...new Set(reasons)],
    original: raw,
  };
}

function sanitizeAiMessage(value, options = {}) {
  return sanitizeAiMessageWithReport(value, options).text;
}

function validateAiMessage(value, options = {}) {
  const report = sanitizeAiMessageWithReport(value, { ...options, allowFallback: false });
  return {
    valid: report.valid,
    text: report.text,
    reasons: report.reasons,
  };
}

function sanitizeHistoryUserText(text) {
  const clean = normalizeWhitespace(text);
  if (!clean) return "";
  if (/system\s+prompt|systemInstruction|#\s*regras\s+finais/i.test(clean)) return "";
  return limitText(clean, 2500);
}

function buildGeminiHistoryFromRows(rows, options = {}) {
  if (!Array.isArray(rows)) return [];

  const limit = Math.max(2, Number(options.limit || 20));
  const normalized = [];

  for (const row of rows) {
    const origin = String(row?.origin || "").toLowerCase();
    let role = null;

    if (origin === "user") role = "user";
    if (["bot", "assistant", "model", "human"].includes(origin)) role = "model";
    if (!role) continue;

    let text = "";
    if (role === "user") {
      text = sanitizeHistoryUserText(row?.texto);
    } else {
      const report = sanitizeAiMessageWithReport(row?.texto, { allowFallback: false });
      text = report.valid ? report.text : "";
    }

    if (!text) continue;

    const last = normalized[normalized.length - 1];
    if (last && last.role === role) {
      last.parts[0].text = normalizeWhitespace(`${last.parts[0].text}\n${text}`);
    } else {
      normalized.push({ role, parts: [{ text }] });
    }
  }

  let relevant = normalized.slice(-limit);
  while (relevant.length > 0 && relevant[0].role !== "user") {
    relevant = relevant.slice(1);
  }

  return relevant;
}

function extractAiTextFromProviderResponse(result) {
  if (typeof result === "string") return result;

  const responseText = result?.response?.text;
  if (typeof responseText === "function") return responseText.call(result.response);
  if (typeof responseText === "string") return responseText;

  if (typeof result?.output_text === "string") return result.output_text;
  if (typeof result?.text === "string") return result.text;

  const choiceContent = result?.choices?.[0]?.message?.content || result?.choices?.[0]?.text;
  if (typeof choiceContent === "string") return choiceContent;
  if (Array.isArray(choiceContent)) {
    return choiceContent.map((part) => part?.text || "").filter(Boolean).join("");
  }

  const candidateParts = result?.candidates?.[0]?.content?.parts;
  if (Array.isArray(candidateParts)) {
    return candidateParts.map((part) => part?.text || "").filter(Boolean).join("");
  }

  const responseCandidates = result?.response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(responseCandidates)) {
    return responseCandidates.map((part) => part?.text || "").filter(Boolean).join("");
  }

  return "";
}

module.exports = {
  DEFAULT_AI_FALLBACK,
  SAFE_ERROR_FALLBACK,
  buildGeminiHistoryFromRows,
  extractAiTextFromProviderResponse,
  getSafeFallback,
  sanitizeAiMessage,
  sanitizeAiMessageWithReport,
  validateAiMessage,
};
