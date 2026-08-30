import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { Flame } from 'lucide-react';
import { analyticsApi } from '../services/api.js';

const COLORS = ['#5b6cff', '#34c77b', '#e8a83c', '#f0575c', '#a56cf0', '#3cc7e8', '#e85ca8', '#8bd450'];

export default function Analytics() {
  const [data, setData] = useState(null);

  useEffect(() => {
    analyticsApi.get().then(setData);
  }, []);

  if (!data) return <p>Loading…</p>;

  const total = Number(data.totals.total || 0);
  if (total === 0) {
    return (
      <div>
        <h1>Analytics</h1>
        <div className="empty-state card">Solve or import a few problems and your analytics will show up here.</div>
      </div>
    );
  }

  return (
    <div>
      <h1>Analytics</h1>

      <div className="stat-grid">
        <Stat label="Total Problems" value={total} />
        <Stat label="Mastered" value={data.totals.mastered || 0} />
        <Stat label="Revision Due" value={data.totals.revision_due || 0} />
        <Stat label="Practice Accuracy" value={data.practiceAccuracy.rate !== null ? `${data.practiceAccuracy.rate}%` : '—'} />
        <Stat label={<><Flame size={13} style={{ verticalAlign: -2 }} /> Current Streak</>} value={`${data.streak.current}d`} />
        <Stat label="Longest Streak" value={`${data.streak.longest}d`} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Problems Solved Over Time</h3>
          {data.solvedOverTime.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={data.solvedOverTime}>
                <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Pattern Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={data.patternDistribution} dataKey="count" nameKey="primary_pattern" outerRadius={80}>
                {data.patternDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Practice Accuracy by Pattern</h3>
          {data.patternAccuracy.length === 0 ? <Empty /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.patternAccuracy}>
                <XAxis dataKey="pattern" stroke="var(--text-dim)" fontSize={10} interval={0} angle={-30} textAnchor="end" height={60} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
                <Bar dataKey="rate" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Recommended for You</h3>
          <Recommendations data={data} />
        </div>
      </div>
    </div>
  );
}

function Recommendations({ data }) {
  const weak = data.patternAccuracy.filter((p) => p.rate !== null && p.rate < 60 && p.total >= 3);
  if (weak.length === 0) {
    return <p style={{ color: 'var(--text-dim)' }}>Not enough practice data yet to spot weak patterns — keep practicing!</p>;
  }
  return (
    <ul style={{ paddingLeft: 18, margin: 0 }}>
      {weak.map((w) => (
        <li key={w.pattern} style={{ marginBottom: 6 }}>
          Your {w.pattern} accuracy is {w.rate}% — worth another pass.
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function Empty() {
  return <p style={{ color: 'var(--text-dim)' }}>Not enough data yet.</p>;
}
