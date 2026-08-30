import { useState } from 'react';
import { importApi } from '../services/api.js';

const PATTERNS = [
  'Arrays', 'Hashing', 'Strings', 'Two Pointers', 'Sliding Window', 'Prefix Sum',
  'Binary Search', 'Sorting', 'Linked List', 'Stack', 'Monotonic Stack', 'Queue',
  'Heap / Priority Queue', 'Greedy', 'Backtracking', 'Recursion', 'Trees', 'Binary Tree',
  'Binary Search Tree', 'Trie', 'Graph', 'BFS', 'DFS', 'Dynamic Programming',
  'Bit Manipulation', 'Math', 'Number Theory', 'Intervals', 'Matrix', 'SQL / Database',
  'Topological Sort', 'Union Find', 'Shortest Path', 'Minimum Spanning Tree', 'Tree Traversal', 'Other',
];

export default function Import() {
  const [sourceType, setSourceType] = useState('paste');
  const [raw, setRaw] = useState('');
  const [rows, setRows] = useState(null);
  const [summary, setSummary] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    setSourceType(ext === 'csv' ? 'csv' : ext === 'json' ? 'json' : 'txt');
    setRaw(await file.text());
  };

  const analyze = async () => {
    setError('');
    setBusy(true);
    try {
      const res = await importApi.parse(sourceType, raw);
      setRows(res.rows);
      setSummary(res.summary);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const categorize = async () => {
    setBusy(true);
    try {
      const res = await importApi.classify(rows);
      setRows(res.rows);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const updateRow = (idx, field, value) => {
    const next = [...rows];
    next[idx] = { ...next[idx], [field]: value };
    setRows(next);
  };

  const confirmImport = async () => {
    setBusy(true);
    setError('');
    try {
      const importable = rows.filter((r) => r.importStatus !== 'invalid' && r.importStatus !== 'duplicate_in_file');
      const res = await importApi.save({ rows: importable, sourceType, duplicateStrategy: 'skip' });
      setResult(res);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const reset = () => { setRows(null); setSummary(null); setRaw(''); setResult(null); };

  if (result) {
    return (
      <div className="card" style={{ maxWidth: 480 }}>
        <h2>Import Complete 🎉</h2>
        <p>{result.total} Problems Analyzed</p>
        <ul>
          <li>{result.imported} Added</li>
          <li>{result.duplicates} Already Existed</li>
          <li>{result.invalid} Invalid</li>
        </ul>
        <button className="btn btn-primary" onClick={reset}>Import More</button>
      </div>
    );
  }

  if (rows) {
    const patternSummary = {};
    rows.forEach((r) => { if (r.primary_pattern) patternSummary[r.primary_pattern] = (patternSummary[r.primary_pattern] || 0) + 1; });

    return (
      <div>
        <h1>Import Preview</h1>
        <div className="card" style={{ marginBottom: 16 }}>
          <p><strong>{summary.totalDetected}</strong> Problems Detected — {summary.new} New, {summary.alreadyExists} Already Exist, {summary.duplicateInFile} Duplicate in File, {summary.invalid} Invalid</p>
          {Object.keys(patternSummary).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
              {Object.entries(patternSummary).map(([p, c]) => (
                <span key={p} className="badge" style={{ background: 'var(--surface-hover)', color: 'var(--text-dim)' }}>{p}: {c}</span>
              ))}
            </div>
          )}
        </div>

        {error && <div style={{ color: 'var(--hard)', marginBottom: 12 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          <button className="btn" onClick={categorize} disabled={busy}>{busy ? 'Categorizing…' : 'Categorize Missing Patterns'}</button>
          <button className="btn btn-primary" onClick={confirmImport} disabled={busy}>Confirm Import</button>
          <button className="btn" onClick={reset}>Cancel Import</button>
        </div>

        <div className="card" style={{ padding: 0, overflowX: 'auto', maxHeight: 500, overflowY: 'auto' }}>
          <table>
            <thead>
              <tr><th>#</th><th>Title</th><th>Difficulty</th><th>Primary Pattern</th><th>Status</th></tr>
            </thead>
            <tbody>
              {rows.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.number}</td>
                  <td>{r.title}</td>
                  <td>{r.difficulty || <span style={{ color: 'var(--medium)' }}>Needs Review</span>}</td>
                  <td>
                    <select className="input" value={r.primary_pattern || ''} onChange={(e) => updateRow(idx, 'primary_pattern', e.target.value)}>
                      <option value="">—</option>
                      {PATTERNS.map((p) => <option key={p}>{p}</option>)}
                    </select>
                  </td>
                  <td style={{ color: r.importStatus === 'new' ? 'var(--easy)' : r.importStatus === 'invalid' ? 'var(--hard)' : 'var(--text-dim)' }}>
                    {r.importStatus.replace(/_/g, ' ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 640 }}>
      <h1>Import Problems</h1>
      <div className="card">
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['paste', 'txt', 'csv', 'json'].map((t) => (
            <button key={t} className="btn" style={{ background: sourceType === t ? 'var(--surface-hover)' : undefined }} onClick={() => setSourceType(t)}>
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {sourceType === 'paste' ? (
          <textarea className="input" rows={10} placeholder="Paste your LeetCode problem list here…" value={raw} onChange={(e) => setRaw(e.target.value)} />
        ) : (
          <input type="file" accept={`.${sourceType}`} onChange={handleFile} />
        )}

        {error && <div style={{ color: 'var(--hard)', marginTop: 10 }}>{error}</div>}

        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={analyze} disabled={busy || !raw.trim()}>
          {busy ? 'Analyzing…' : 'Analyze Problems'}
        </button>
      </div>
    </div>
  );
}
