const { geminiApiKey, geminiModel } = require('../config/env');

const VALID_PATTERNS = [
  'Arrays', 'Hashing', 'Strings', 'Two Pointers', 'Sliding Window', 'Prefix Sum',
  'Binary Search', 'Sorting', 'Linked List', 'Stack', 'Monotonic Stack', 'Queue',
  'Heap / Priority Queue', 'Greedy', 'Backtracking', 'Recursion', 'Trees', 'Binary Tree',
  'Binary Search Tree', 'Trie', 'Graph', 'BFS', 'DFS', 'Dynamic Programming',
  'Bit Manipulation', 'Math', 'Number Theory', 'Intervals', 'Matrix', 'SQL / Database',
  'Topological Sort', 'Union Find', 'Shortest Path', 'Minimum Spanning Tree',
  'Tree Traversal', 'Other',
];

const CONFIDENCE_REVIEW_THRESHOLD = 0.6;

function buildPrompt({ leetcode_number, title, difficulty }) {
  return `You are classifying a LeetCode problem into DSA patterns for a study-tracking app.

Problem: #${leetcode_number ?? '?'} "${title}"
Difficulty: ${difficulty ?? 'unknown'}

Choose exactly one "primary_pattern" and 0-3 "secondary_patterns" from this fixed list ONLY:
${VALID_PATTERNS.join(', ')}

Respond with ONLY raw JSON, no markdown fences, no preamble, matching this exact shape:
{"primary_pattern": "...", "secondary_patterns": ["...", "..."], "confidence": 0.0}

Do not invent categories outside the provided list. If truly uncertain, use "Other" and a low confidence score.`;
}

/**
 * Classify a single problem via Gemini. Returns { primary_pattern, secondary_patterns, confidence, needsReview }.
 * Throws if GEMINI_API_KEY is not configured — callers should catch and fall back
 * to manual categorization / "Needs Review" rather than crash the request.
 */
async function classifyProblem({ leetcode_number, title, difficulty }) {
  if (!geminiApiKey) {
    const err = new Error('Gemini API key is not configured on the server');
    err.status = 503;
    throw err;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt({ leetcode_number, title, difficulty }) }] }],
      generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    const err = new Error(`Gemini API error (${response.status}): ${errText}`);
    err.status = 502;
    throw err;
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

  let parsed;
  try {
    parsed = JSON.parse(text.replace(/```json|```/g, '').trim());
  } catch {
    parsed = { primary_pattern: 'Other', secondary_patterns: [], confidence: 0 };
  }

  const primary = VALID_PATTERNS.includes(parsed.primary_pattern) ? parsed.primary_pattern : 'Other';
  const secondary = Array.isArray(parsed.secondary_patterns)
    ? parsed.secondary_patterns.filter((p) => VALID_PATTERNS.includes(p) && p !== primary).slice(0, 3)
    : [];
  const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0.5;

  return {
    primary_pattern: primary,
    secondary_patterns: secondary,
    confidence,
    needsReview: confidence < CONFIDENCE_REVIEW_THRESHOLD,
  };
}

/** Classify many problems, sequentially, tolerating individual failures. */
async function classifyBatch(problems, onProgress) {
  const results = [];
  for (let i = 0; i < problems.length; i++) {
    try {
      const result = await classifyProblem(problems[i]);
      results.push({ ...problems[i], ...result });
    } catch (err) {
      results.push({
        ...problems[i],
        primary_pattern: 'Other',
        secondary_patterns: [],
        confidence: 0,
        needsReview: true,
        classificationError: err.message,
      });
    }
    if (onProgress) onProgress(i + 1, problems.length);
  }
  return results;
}

module.exports = { classifyProblem, classifyBatch, VALID_PATTERNS };
