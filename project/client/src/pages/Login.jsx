import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="card auth-card" onSubmit={handleSubmit}>
        <h2 style={{ marginTop: 0 }}>Welcome back</h2>
        {error && <div style={{ color: 'var(--hard)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginTop: 6 }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginTop: 6 }} />
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} disabled={loading}>
          {loading ? 'Logging in…' : 'Log In'}
        </button>
        <div style={{ marginTop: 16, fontSize: 13, color: 'var(--text-dim)', textAlign: 'center' }}>
          No account? <Link to="/register" style={{ color: 'var(--accent)' }}>Sign up</Link>
        </div>
      </form>
    </div>
  );
}
