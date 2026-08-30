const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const importService = require('../services/importService');
const gemini = require('../services/geminiService');
const Problem = require('../models/Problem');
const { AppError } = require('../middleware/errorHandler');

/** Step 1: parse + duplicate detection. Does NOT touch the database's problems table. */
async function parseImport(req, res, next) {
  try {
    const { sourceType, raw } = req.body;
    if (!raw || !raw.trim()) throw new AppError('No content to import');

    const parsed = importService.parse(sourceType, raw);
    const annotated = await importService.detectDuplicates(req.userId, parsed);

    const summary = {
      totalDetected: annotated.length,
      new: annotated.filter((r) => r.importStatus === 'new').length,
      alreadyExists: annotated.filter((r) => r.importStatus === 'already_exists').length,
      duplicateInFile: annotated.filter((r) => r.importStatus === 'duplicate_in_file').length,
      invalid: annotated.filter((r) => r.importStatus === 'invalid').length,
    };

    res.json({ rows: annotated, summary });
  } catch (err) {
    next(err);
  }
}

/** Step 2: run AI categorization on rows missing a pattern (only rows the client sends). */
async function classifyImport(req, res, next) {
  try {
    const { rows } = req.body;
    if (!Array.isArray(rows)) throw new AppError('rows must be an array');

    const needsClassification = rows.filter((r) => !r.primary_pattern);
    const classified = await gemini.classifyBatch(
      needsClassification.map((r) => ({ leetcode_number: r.number, title: r.title, difficulty: r.difficulty }))
    );

    const byNumber = new Map(classified.map((c) => [c.leetcode_number, c]));
    const merged = rows.map((r) => {
      if (r.primary_pattern) return r;
      const c = byNumber.get(r.number);
      return c
        ? { ...r, primary_pattern: c.primary_pattern, secondary_patterns: c.secondary_patterns, confidence: c.confidence, needsReview: c.needsReview }
        : r;
    });

    res.json({ rows: merged });
  } catch (err) {
    next(err);
  }
}

/** Step 3: confirmed insert — only rows the user approved, skipping/updating duplicates per their choice. */
async function saveImport(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { rows, sourceType = 'paste', filename = null, duplicateStrategy = 'skip' } = req.body;
    if (!Array.isArray(rows) || rows.length === 0) throw new AppError('No rows to import');

    await conn.beginTransaction();

    let imported = 0, duplicates = 0, invalid = 0;

    for (const row of rows) {
      if (!row.number || !row.title || !row.difficulty || !row.primary_pattern) {
        invalid++;
        continue;
      }

      const existing = await Problem.findByLeetcodeNumber(req.userId, row.number);
      if (existing) {
        duplicates++;
        if (duplicateStrategy === 'update') {
          await Problem.update(req.userId, existing.id, {
            title: row.title,
            difficulty: row.difficulty,
            primary_pattern: row.primary_pattern,
            secondary_patterns: row.secondary_patterns || [],
            status: row.status || 'Solved',
            date_solved: row.date_solved || null,
            notes: row.notes || null,
          });
        }
        continue;
      }

      await Problem.create(req.userId, {
        leetcode_number: row.number,
        title: row.title,
        difficulty: row.difficulty,
        primary_pattern: row.primary_pattern,
        secondary_patterns: row.secondary_patterns || [],
        status: row.status || 'Solved',
        date_solved: row.date_solved || null,
        notes: row.notes || null,
      });
      imported++;
    }

    await conn.query(
      `INSERT INTO imports (id, user_id, filename, source_type, total_detected, total_imported, total_duplicates, total_invalid)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), req.userId, filename, sourceType, rows.length, imported, duplicates, invalid]
    );

    await conn.commit();
    res.json({ imported, duplicates, invalid, total: rows.length });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { parseImport, classifyImport, saveImport };
