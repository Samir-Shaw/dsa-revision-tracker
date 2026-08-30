import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { problemsApi, aiApi } from '../services/api.js';

const PATTERNS = [
  'Arrays', 'Hashing', 'Strings', 'Two Pointers', 'Sliding Window', 'Prefix Sum',
  'Binary Search', 'Sorting', 'Linked List', 'Stack', 'Monotonic Stack', 'Queue',
  'Heap / Priority Queue', 'Greedy', 'Backtracking', 'Recursion', 'Trees', 'Binary Tree',
  'Binary Search Tree', 'Trie', 'Graph', 'BFS', 'DFS', 'Dynamic Programming',
  'Bit Manipulation', 'Math', 'Number Theory', 'Intervals', 'Matrix', 'SQL / Database',
  'Topological Sort', 'Union Find', 'Shortest Path', 'Minimum Spanning Tree', 'Tree Traversal', 'Other',
];

export default function AddProblem() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    leetcode_number: '', title: '', difficulty: 'Medium', primary_pattern: '',
    secondary_patterns: [], date_solved: '', status: 'Solved', notes: '', leetcode_url: '',
  });
  const [classifying, setClassifying] = useState(false);
  const [confidence, setConfidence] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const autoCategorize = async () => {
    if (!form.title) {
      setError('Enter a title before auto-categorizing');
      return;
    }
    setClassifying(true);
    setError('');
    try {
      const result = await aiApi.classify({
        leetcode_number: form.leetcode_number ? Number(form.leetcode_number) : null,
        title: form.title,
        difficulty: form.difficulty,
      });
      setForm({ ...form, primary_pattern: result.primary_pattern, secondary_patterns: result.secondary_patterns });
      setConfidence(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setClassifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const { problem } = await problemsApi.create({
        ...form,
        leetcode_number: Number(form.leetcode_number),
        date_solved: form.date_solved || null,
      });
      navigate(`/problems/${problem.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <h1>Add Problem</h1>
      <form className="card" onSubmit={handleSubmit}>
        {error && <div style={{ color: 'var(--hard)', fontSize: 13, marginBottom: 12 }}>{error}</div>}

        <Field label="LeetCode Number">
          <input className="input" type="number" required value={form.leetcode_number} onChange={update('leetcode_number')} />
        </Field>
        <Field label="Problem Title">
          <input className="input" required value={form.title} onChange={update('title')} />
        </Field>
        <Field label="Difficulty">
          <select className="input" value={form.difficulty} onChange={update('difficulty')}>
            <option>Easy</option><option>Medium</option><option>Hard</option>
          </select>
        </Field>

        <div style={{ margin: '16px 0' }}>
          <button type="button" className="btn" onClick={autoCategorize} disabled={classifying}>
            <Sparkles size={15} /> {classifying ? 'Categorizing…' : 'Auto Categorize'}
          </button>
          {confidence?.needsReview && (
            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--medium)' }}>Needs Review (low confidence)</span>
          )}
        </div>

        <Field label="Primary Pattern">
          <select className="input" required value={form.primary_pattern} onChange={update('primary_pattern')}>
            <option value="">Select a pattern…</option>
            {PATTERNS.map((p) => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Date Solved">
          <input className="input" type="date" value={form.date_solved} onChange={update('date_solved')} />
        </Field>
        <Field label="LeetCode URL">
          <input className="input" value={form.leetcode_url} onChange={update('leetcode_url')} placeholder="https://leetcode.com/problems/…" />
        </Field>
        <Field label="Notes">
          <textarea className="input" rows={3} value={form.notes} onChange={update('notes')} />
        </Field>

        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={saving}>
          {saving ? 'Saving…' : 'Save Problem'}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, color: 'var(--text-dim)', display: 'block', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
