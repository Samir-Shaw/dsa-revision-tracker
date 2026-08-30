import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ExternalLink } from 'lucide-react';
import { problemsApi, revisionsApi, practiceApi } from '../services/api.js';

export default function ProblemDetail() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [notes, setNotes] = useState('');
  const [revisions, setRevisions] = useState([]);
  const [sessions, setSessions] = useState([]);

  const load = async () => {
    const { problem } = await problemsApi.get(id);
    setProblem(problem);
    setNotes(problem.notes || '');
    const [revHistory, practiceHistory] = await Promise.all([revisionsApi.history(), practiceApi.history()]);
    setRevisions(revHistory.revisions.filter((r) => r.problem_id === id));
    setSessions(practiceHistory.sessions.filter((s) => s.problem_id === id));
  };

  useEffect(() => { load(); }, [id]);

  const saveNotes = async () => {
    await problemsApi.update(id, { notes });
  };

  const toggleFavorite = async () => {
    await problemsApi.update(id, { is_favorite: !problem.is_favorite });
    load();
  };

  const revise = async (result) => {
    await revisionsApi.record({ problem_id: id, result });
    load();
  };

  if (!problem) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 700 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <span style={{ color: 'var(--text-dim)' }}>#{problem.leetcode_number}</span>
          <h1 style={{ margin: '4px 0' }}>{problem.title}</h1>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className={`badge badge-${problem.difficulty.toLowerCase()}`}>{problem.difficulty}</span>
            <span style={{ color: 'var(--text-dim)' }}>{problem.primary_pattern}</span>
          </div>
        </div>
        <button onClick={toggleFavorite} style={{ background: 'none', border: 'none' }}>
          <Star size={22} fill={problem.is_favorite ? 'var(--medium)' : 'none'} color={problem.is_favorite ? 'var(--medium)' : 'var(--text-dim)'} />
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, margin: '16px 0' }}>
        {problem.leetcode_url && (
          <a href={problem.leetcode_url} target="_blank" rel="noreferrer" className="btn"><ExternalLink size={15} /> Open LeetCode</a>
        )}
        <Link to="/practice" className="btn">Practice</Link>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>How did you perform on your last revision?</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => revise('Remembered')}>🟢 Remembered</button>
          <button className="btn" onClick={() => revise('Partially Remembered')}>🟡 Partially Remembered</button>
          <button className="btn" onClick={() => revise('Forgot')}>🔴 Forgot</button>
        </div>
        <p style={{ color: 'var(--text-dim)', fontSize: 13, marginBottom: 0, marginTop: 12 }}>
          Revision level: {problem.revision_level} · Status: {problem.status}
          {problem.next_revision_at && <> · Next: {new Date(problem.next_revision_at).toLocaleDateString()}</>}
        </p>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Notes</h3>
        <textarea className="input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} onBlur={saveNotes} placeholder="Add your approach, edge cases, gotchas…" />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Revision History</h3>
        {revisions.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>No revisions yet.</p> : (
          <ul style={{ paddingLeft: 18 }}>
            {revisions.map((r) => <li key={r.id}>{new Date(r.revision_date).toLocaleDateString()} — {r.result}</li>)}
          </ul>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Practice History</h3>
        {sessions.length === 0 ? <p style={{ color: 'var(--text-dim)' }}>No practice sessions yet.</p> : (
          <ul style={{ paddingLeft: 18 }}>
            {sessions.map((s) => <li key={s.id}>{new Date(s.practice_date).toLocaleDateString()} — {s.result}</li>)}
          </ul>
        )}
      </div>
    </div>
  );
}
