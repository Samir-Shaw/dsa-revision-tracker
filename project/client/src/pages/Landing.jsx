import { Link } from 'react-router-dom';
import { Upload, Sparkles, RotateCcw, Brain, BarChart3 } from 'lucide-react';

const FEATURES = [
  { icon: Upload, title: 'Smart Import', desc: 'Bring in your solved problems from TXT, CSV, JSON, or a quick paste.' },
  { icon: Sparkles, title: 'Automatic Categorization', desc: 'AI classifies every problem into the right DSA pattern for you.' },
  { icon: RotateCcw, title: 'Spaced Revision', desc: 'A revision schedule that adapts to what you remember and forget.' },
  { icon: Brain, title: 'Pattern Practice', desc: 'Drill the patterns you\u2019re weak on, not the ones you already know.' },
  { icon: BarChart3, title: 'Progress Analytics', desc: 'See your real solve rate, streaks, and pattern strengths over time.' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <nav style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px' }}>
        <div style={{ fontWeight: 700 }}>DSA Revision Tracker</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" className="btn">Log In</Link>
          <Link to="/register" className="btn btn-primary">Start Tracking Free</Link>
        </div>
      </nav>

      <section style={{ textAlign: 'center', padding: '80px 20px 60px', maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ fontSize: 44, lineHeight: 1.15, marginBottom: 16 }}>
          Master DSA Through Smart Revision.
        </h1>
        <p style={{ color: 'var(--text-dim)', fontSize: 17, marginBottom: 32 }}>
          Track your LeetCode problems, automatically organize them by pattern, and practice exactly
          what you need to revise.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '12px 22px' }}>Start Tracking Free</Link>
          <Link to="/login" className="btn" style={{ padding: '12px 22px' }}>Explore Demo</Link>
        </div>
      </section>

      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, maxWidth: 1100, margin: '0 auto', padding: '0 40px 80px' }}>
        {FEATURES.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="card">
            <Icon size={20} color="var(--accent)" />
            <h3 style={{ margin: '12px 0 6px', fontSize: 16 }}>{title}</h3>
            <p style={{ color: 'var(--text-dim)', fontSize: 14, margin: 0 }}>{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
