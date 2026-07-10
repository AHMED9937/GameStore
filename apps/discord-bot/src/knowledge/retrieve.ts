import { KNOWLEDGE_DOCS } from './faq-pack';
import type { KnowledgeDoc } from './types';

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function scoreDoc(doc: KnowledgeDoc, question: string, tokens: string[]): number {
  const q = question.toLowerCase();
  let score = 0;

  for (const keyword of doc.keywords) {
    const kw = keyword.toLowerCase();
    if (q.includes(kw)) {
      score += kw.includes(' ') ? 4 : 2;
    }
  }

  for (const tag of doc.tags) {
    if (tokens.includes(tag.toLowerCase())) {
      score += 1;
    }
  }

  for (const token of tokens) {
    if (doc.id.includes(token)) score += 0.5;
    for (const keyword of doc.keywords) {
      if (keyword.toLowerCase().split(/\s+/).includes(token)) {
        score += 0.5;
      }
    }
  }

  return score;
}

/**
 * Lightweight retrieval: score all docs, return top-k above minimum threshold.
 */
export function retrieveKnowledge(
  question: string,
  limit = 5,
  minScore = 0.5,
): KnowledgeDoc[] {
  const tokens = tokenize(question);
  const scored = KNOWLEDGE_DOCS.map((doc) => ({
    doc,
    score: scoreDoc(doc, question, tokens),
  }))
    .filter((entry) => entry.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((entry) => entry.doc);
}

/** Merge retrieval from question + optional intent/doc id hint. */
export function retrieveForQuestion(
  question: string,
  intentHint?: string | null,
  limit = 5,
): KnowledgeDoc[] {
  const fromQuestion = retrieveKnowledge(question, limit, 0.5);
  if (!intentHint) return fromQuestion;

  const hinted = KNOWLEDGE_DOCS.find((d) => d.id === intentHint);
  if (!hinted) return fromQuestion;

  const ids = new Set<string>();
  const merged: KnowledgeDoc[] = [];
  for (const doc of [hinted, ...fromQuestion]) {
    if (!ids.has(doc.id)) {
      ids.add(doc.id);
      merged.push(doc);
    }
  }
  return merged.slice(0, limit);
}

export function bestKnowledgeMatch(question: string): {
  doc: KnowledgeDoc | null;
  score: number;
} {
  const tokens = tokenize(question);
  let best: KnowledgeDoc | null = null;
  let bestScore = 0;

  for (const doc of KNOWLEDGE_DOCS) {
    const score = scoreDoc(doc, question, tokens);
    if (score > bestScore) {
      bestScore = score;
      best = doc;
    }
  }

  return { doc: bestScore >= 1 ? best : null, score: bestScore };
}
