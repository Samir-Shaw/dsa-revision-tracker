import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await register(form);
      // New users always start with zero problems — no auto-copy of demo data.
      navigate('/dashboard?welcome=1');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Create your account</h2>
        {error && <div style={{ color: 'var(--hard)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Name</label>
          <input className="input" value={form.name} onChange={update('name')} required style={{ marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Email</label>
          <input className="input" type="email" value={form.email} onChange={update('email')} required style={{ marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Password</label>
          <input className="input" type="password" value={form.password} onChange={update('password')} required style={{ marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Confirm Password</label>
          <input className="input" type="password" value={form.confirmPassword} onChange={update('confirmPassword')} required style={{ marginTop: 6 }} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Creating account…' : 'Start Tracking Free'}
        </button>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent)' }}>Log in</Link>
        </div>
      </form>
    </div>
  );
}
