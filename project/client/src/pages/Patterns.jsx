import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { problemsApi } from '../services/api.js';

export default function Patterns() {
  const [patterns, setPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { patterns } = await problemsApi.stats();
      // Fetch per-pattern breakdown by listing problems for each (kept simple; small N of patterns).
      const enriched = await Promise.all(
        patterns.map(async (p) => {
          const { problems } = await problemsApi.list({ pattern: p.primary_pattern, pageSize: 500 });
          const mastered = problems.filter((x) => x.status === 'Mastered').length;
          const due = problems.filter((x) => x.next_revision_at && new Date(x.next_revision_at) <= new Date()).length;
          return { ...p, mastered, due, needRevision: problems.length - mastered - due };
        })
      );
      setPatterns(enriched);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading…</p>;

  if (patterns.length === 0) {
    return <div className="empty-state card">No patterns yet — add or import some problems first.</div>;
  }

  return (
    <div>
      <h1>Your DSA Patterns</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {patterns.map((p) => (
          <div key={p.primary_pattern} className="card">
            <h3 style={{ marginTop: 0 }}>{p.primary_pattern}</h3>
            <p style={{ color: 'var(--text-dim)', margin: '4px 0 12px' }}>{p.count} Problems</p>
            <p style={{ fontSize: 13, margin: '4px 0' }}>{p.mastered} Mastered</p>
            <p style={{ fontSize: 13, margin: '4px 0' }}>{p.needRevision} Need Revision</p>
            <p style={{ fontSize: 13, margin: '4px 0 12px' }}>{p.due} Due</p>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => navigate(`/problems?pattern=${encodeURIComponent(p.primary_pattern)}`)}>
              Practice This Pattern
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
