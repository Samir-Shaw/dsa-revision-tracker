import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Star, Trash2, Grid, List as ListIcon } from 'lucide-react';
import { problemsApi } from '../services/api.js';

const DIFFICULTIES = ['All', 'Easy', 'Medium', 'Hard'];
const STATUSES = ['All', 'Solved', 'Need Revision', 'In Revision', 'Mastered'];

export default function Problems() {
  const [urlParams] = useSearchParams();
  const [problems, setProblems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(window.innerWidth < 768 ? 'card' : 'table');
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('All');
  const [status, setStatus] = useState('All');
  const [pattern] = useState(urlParams.get('pattern') || 'All');
  const [sortBy, setSortBy] = useState('leetcode_number');
  const [sortDir, setSortDir] = useState('asc');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await problemsApi.list({ search, difficulty, status, pattern, sortBy, sortDir, pageSize: 200 });
      setProblems(res.problems);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [search, difficulty, status, pattern, sortBy, sortDir]);

  useEffect(() => {
    const t = setTimeout(load, 300); // debounce search
    return () => clearTimeout(t);
  }, [load]);

  const toggleFavorite = async (p) => {
    await problemsApi.update(p.id, { is_favorite: !p.is_favorite });
    load();
  };

  const remove = async (p) => {
    if (!confirm(`Delete #${p.leetcode_number} ${p.title}?`)) return;
    await problemsApi.delete(p.id);
    load();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>
          Problems <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 16 }}>({total})</span>
          {pattern !== 'All' && <span style={{ color: 'var(--text-dim)', fontWeight: 400, fontSize: 15 }}> · filtered: {pattern}</span>}
        </h1>
        <Link to="/problems/new" className="btn btn-primary"><Plus size={16} /> Add Problem</Link>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: '1 1 240px' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-dim)' }} />
          <input
            className="input"
            style={{ paddingLeft: 34 }}
            placeholder="Search by number, title, pattern, notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select className="input" style={{ width: 140 }} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          {DIFFICULTIES.map((d) => <option key={d}>{d}</option>)}
        </select>
        <select className="input" style={{ width: 160 }} value={status} onChange={(e) => setStatus(e.target.value)}>
          {STATUSES.map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" style={{ width: 170 }} value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="leetcode_number">Sort: LeetCode No.</option>
          <option value="title">Sort: Title</option>
          <option value="difficulty">Sort: Difficulty</option>
          <option value="date_solved">Sort: Date Solved</option>
          <option value="next_revision_at">Sort: Next Revision</option>
        </select>
        <button className="btn" onClick={() => setSortDir(sortDir === 'asc' ? 'desc' : 'asc')}>{sortDir === 'asc' ? '↑' : '↓'}</button>
        <button className="btn" onClick={() => setView(view === 'table' ? 'card' : 'table')}>
          {view === 'table' ? <Grid size={16} /> : <ListIcon size={16} />}
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>Loading…</p>
      ) : problems.length === 0 ? (
        <div className="empty-state card">
          <p>No problems match your filters yet.</p>
        </div>
      ) : view === 'table' ? (
        <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>#</th><th>Problem</th><th>Difficulty</th><th>Pattern</th><th>Status</th><th>Fav</th><th></th>
              </tr>
            </thead>
            <tbody>
              {problems.map((p) => (
                <tr key={p.id}>
                  <td>{p.leetcode_number}</td>
                  <td><Link to={`/problems/${p.id}`}>{p.title}</Link></td>
                  <td><span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span></td>
                  <td>{p.primary_pattern}</td>
                  <td>{p.status}</td>
                  <td>
                    <button onClick={() => toggleFavorite(p)} style={{ background: 'none', border: 'none' }}>
                      <Star size={16} fill={p.is_favorite ? 'var(--medium)' : 'none'} color={p.is_favorite ? 'var(--medium)' : 'var(--text-dim)'} />
                    </button>
                  </td>
                  <td>
                    <button onClick={() => remove(p)} style={{ background: 'none', border: 'none' }}>
                      <Trash2 size={15} color="var(--text-dim)" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          {problems.map((p) => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>#{p.leetcode_number}</span>
                <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
              </div>
              <Link to={`/problems/${p.id}`}><h4 style={{ margin: '8px 0' }}>{p.title}</h4></Link>
              <p style={{ color: 'var(--text-dim)', fontSize: 13, margin: 0 }}>{p.primary_pattern}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
