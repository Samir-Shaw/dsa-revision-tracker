import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { Flame, Plus, Upload } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { problemsApi, revisionsApi, analyticsApi } from '../services/api.js';

const DIFF_COLORS = { Easy: 'var(--easy)', Medium: 'var(--medium)', Hard: 'var(--hard)' };

export default function Dashboard() {
  const { user } = useAuth();
  const [params] = useSearchParams();
  const [stats, setStats] = useState(null);
  const [due, setDue] = useState([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsRes, dueRes, analyticsRes] = await Promise.all([
          problemsApi.stats(),
          revisionsApi.due('due'),
          analyticsApi.get(),
        ]);
        setStats(statsRes);
        setDue(dueRes.problems.slice(0, 5));
        setStreak(analyticsRes.streak);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div>Loading dashboard…</div>;

  const total = Number(stats?.totals?.total || 0);
  const isNewUser = total === 0;

  return (
    <div>
      <h1 style={{ marginBottom: 4 }}>Good to see you, {user?.name?.split(' ')[0]} 👋</h1>
      <p style={{ color: 'var(--text-dim)', marginTop: 0 }}>Keep solving. Keep revising. Keep improving.</p>

      {params.get('welcome') && isNewUser && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Your DSA journey starts here 🚀</h3>
          <p style={{ color: 'var(--text-dim)' }}>Import your solved problems or add your first one.</p>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/import" className="btn btn-primary"><Upload size={16} /> Import Problems</Link>
            <Link to="/problems/new" className="btn"><Plus size={16} /> Add First Problem</Link>
          </div>
        </div>
      )}

      {isNewUser ? (
        <div className="empty-state card">
          <h3>Your DSA journey starts here 🚀</h3>
          <p>Import your solved problems or add your first problem to see your dashboard come alive.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
            <Link to="/import" className="btn btn-primary"><Upload size={16} /> Import Problems</Link>
            <Link to="/problems/new" className="btn"><Plus size={16} /> Add First Problem</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="stat-grid">
            <StatCard label="Total Problems" value={total} />
            <StatCard label="Solved" value={total} />
            <StatCard label="Due Today" value={stats.totals.due_today || 0} />
            <StatCard label="Need Revision" value={stats.totals.need_revision || 0} />
            <StatCard label="Mastered" value={stats.totals.mastered || 0} />
            <StatCard label={<span><Flame size={13} style={{ verticalAlign: -2 }} /> Streak</span>} value={`${streak.current} day${streak.current === 1 ? '' : 's'}`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 8 }}>
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Difficulty Distribution</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={[
                  { name: 'Easy', count: Number(stats.totals.easy || 0) },
                  { name: 'Medium', count: Number(stats.totals.medium || 0) },
                  { name: 'Hard', count: Number(stats.totals.hard || 0) },
                ]}>
                  <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={12} />
                  <YAxis stroke="var(--text-dim)" fontSize={12} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {['Easy', 'Medium', 'Hard'].map((d) => <Cell key={d} fill={DIFF_COLORS[d]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Today's Revision</h3>
              {due.length === 0 ? (
                <p style={{ color: 'var(--text-dim)' }}>You're all caught up 🎉 No problems are due right now.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {due.map((p) => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>#{p.leetcode_number} {p.title}</span>
                      <span className={`badge badge-${p.difficulty.toLowerCase()}`}>{p.difficulty}</span>
                    </div>
                  ))}
                  <Link to="/revision" className="btn btn-primary" style={{ marginTop: 8, justifyContent: 'center' }}>Start Revision</Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
