import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { problemsApi } from '../services/api.js';

export default function Favorites() {
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const res = await problemsApi.list({ favoritesOnly: true, pageSize: 200 });
      setProblems(res.problems);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p>Loading…</p>;

  if (problems.length === 0) {
    return (
      <div>
        <h1>Favorites</h1>
        <div className="empty-state card">No favorites yet. Save important problems here for quick revision.</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Favorites</h1>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Link to="/practice" className="btn btn-primary">Practice Favorites</Link>
        <Link to="/revision" className="btn">Revise Favorites</Link>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
        {problems.map((p) => (
          <Link key={p.id} to={`/problems/${p.id}`} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>#{p.leetcode_number}</span>
              <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
            </div>
            <h4 style={{ margin: '8px 0' }}>{p.title}</h4>
            <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>{p.primary_pattern}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
