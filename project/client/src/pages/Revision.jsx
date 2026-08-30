import { useEffect, useState } from 'react';
import { revisionsApi } from '../services/api.js';

const TABS = [
  { key: 'due', label: 'Due Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'never', label: 'Never Revised' },
];

export default function Revision() {
  const [tab, setTab] = useState('due');
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await revisionsApi.due(tab);
      setProblems(res.problems);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [tab]);

  const revise = async (id, result) => {
    await revisionsApi.record({ problem_id: id, result });
    load();
  };

  return (
    <div>
      <h1>Revision</h1>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t.key} className="btn" style={{ background: tab === t.key ? 'var(--surface-hover)' : undefined }} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-dim)' }}>Loading…</p>
      ) : problems.length === 0 ? (
        <div className="empty-state card">You're all caught up 🎉 No problems here right now.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {problems.map((p) => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                <div>
                  <div style={{ fontWeight: 600 }}>#{p.leetcode_number} {p.title}</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13, marginTop: 4 }}>
                    {p.primary_pattern} · Level {p.revision_level}
                    {p.last_revised_at && <> · Last: {new Date(p.last_revised_at).toLocaleDateString()}</>}
                  </div>
                </div>
                <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
              </div>
              {tab !== 'mastered' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn" onClick={() => revise(p.id, 'Remembered')}>🟢 Remembered</button>
                  <button className="btn" onClick={() => revise(p.id, 'Partially Remembered')}>🟡 Partially</button>
                  <button className="btn" onClick={() => revise(p.id, 'Forgot')}>🔴 Forgot</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
