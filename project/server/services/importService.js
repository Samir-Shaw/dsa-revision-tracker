const Problem = require('../models/Problem');

/**
 * Parses raw TXT in a few common shapes:
 *   "1. Two Sum"
 *   "1. Two Sum - Easy"
 *   "7. Reverse Integer\nMedium"
 * Missing difficulty is left null and flagged for review.
 */
function parseTxt(raw) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const results = [];
  const DIFF_WORDS = ['Easy', 'Medium', 'Hard', 'Med.'];
  const diffMap = { Easy: 'Easy', Medium: 'Medium', 'Med.': 'Medium', Hard: 'Hard' };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // "1. Title - Easy" or "1. Title"
    const m = line.match(/^(\d+)\.\s*(.+?)(?:\s*-\s*(Easy|Medium|Hard|Med\.))?$/i);
    if (!m) continue;

    const number = parseInt(m[1], 10);
    let title = m[2].trim();
    let difficulty = m[3] ? diffMap[m[3]] : null;

    // Difficulty may be on the *next* line instead of inline.
    if (!difficulty && lines[i + 1] && DIFF_WORDS.includes(lines[i + 1])) {
      difficulty = diffMap[lines[i + 1]];
      i++; // consume that line
    }

    results.push({
      number,
      title,
      difficulty: difficulty || null,
      needsReview: !difficulty,
    });
  }
  return results;
}

/** CSV: number,title,difficulty,pattern,dateSolved,status,notes (header optional) */
function parseCsv(raw) {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];

  const headerLike = /number|title|difficulty/i.test(lines[0]);
  const dataLines = headerLike ? lines.slice(1) : lines;

  return dataLines.map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const [number, title, difficulty, pattern, dateSolved, status, notes] = cols;
    return {
      number: parseInt(number, 10),
      title: title || '',
      difficulty: ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : null,
      primary_pattern: pattern || null,
      date_solved: dateSolved || null,
      status: status || 'Solved',
      notes: notes || null,
      needsReview: !title || isNaN(parseInt(number, 10)),
    };
  });
}

/** JSON: array of {number, title, difficulty, ...} */
function parseJson(raw) {
  let arr;
  try {
    arr = JSON.parse(raw);
  } catch {
    const err = new Error('Invalid JSON — please check the file for syntax errors.');
    err.status = 400;
    throw err;
  }
  if (!Array.isArray(arr)) {
    const err = new Error('JSON import must be an array of problem objects.');
    err.status = 400;
    throw err;
  }
  return arr.map((item) => ({
    number: parseInt(item.number ?? item.leetcode_number, 10),
    title: item.title || '',
    difficulty: ['Easy', 'Medium', 'Hard'].includes(item.difficulty) ? item.difficulty : null,
    primary_pattern: item.primary_pattern || null,
    date_solved: item.date_solved || item.dateSolved || null,
    status: item.status || 'Solved',
    notes: item.notes || null,
    needsReview: !item.title || isNaN(parseInt(item.number ?? item.leetcode_number, 10)),
  }));
}

function parse(sourceType, raw) {
  if (sourceType === 'txt' || sourceType === 'paste') return parseTxt(raw);
  if (sourceType === 'csv') return parseCsv(raw);
  if (sourceType === 'json') return parseJson(raw);
  const err = new Error(`Unsupported import source type: ${sourceType}`);
  err.status = 400;
  throw err;
}

/** Cross-references parsed rows against the user's existing problems (user_id + leetcode_number). */
async function detectDuplicates(userId, parsedRows) {
  const seen = new Set();
  const annotated = [];

  for (const row of parsedRows) {
    if (!row.number || isNaN(row.number) || !row.title) {
      annotated.push({ ...row, importStatus: 'invalid' });
      continue;
    }
    if (seen.has(row.number)) {
      annotated.push({ ...row, importStatus: 'duplicate_in_file' });
      continue;
    }
    seen.add(row.number);

    const existing = await Problem.findByLeetcodeNumber(userId, row.number);
    annotated.push({ ...row, importStatus: existing ? 'already_exists' : 'new' });
  }
  return annotated;
}

module.exports = { parse, detectDuplicates };
