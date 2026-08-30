import { useEffect, useState } from 'react';
import { profileApi, authApi } from '../services/api.js';

export default function Settings() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    profileApi.get().then(({ user, settings }) => {
      setProfile(user);
      setName(user.name);
      setTheme(settings?.theme || 'dark');
    });
  }, []);

  const saveProfile = async () => {
    await profileApi.update({ name });
    setMessage('Profile updated');
  };

  const saveTheme = async (t) => {
    setTheme(t);
    await profileApi.updateSettings({ theme: t });
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await authApi.changePassword(passwords);
      setMessage('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setMessage(err.message);
    }
  };

  const exportData = (format) => {
    window.location.href = `/api/profile/export?format=${format}`;
  };

  if (!profile) return <p>Loading…</p>;

  return (
    <div style={{ maxWidth: 480 }}>
      <h1>Settings</h1>
      {message && <div className="card" style={{ marginBottom: 16, fontSize: 14 }}>{message}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Profile</h3>
        <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Name</label>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} style={{ margin: '6px 0 12px' }} />
        <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Email</label>
        <input className="input" value={profile.email} disabled style={{ margin: '6px 0 12px', opacity: 0.6 }} />
        <button className="btn btn-primary" onClick={saveProfile}>Save Profile</button>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Theme</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          {['dark', 'light', 'system'].map((t) => (
            <button key={t} className="btn" style={{ background: theme === t ? 'var(--surface-hover)' : undefined, textTransform: 'capitalize' }} onClick={() => saveTheme(t)}>
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Import / Export</h3>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn" onClick={() => exportData('json')}>Export JSON</button>
          <button className="btn" onClick={() => exportData('csv')}>Export CSV</button>
        </div>
      </div>

      <form className="card" onSubmit={changePassword}>
        <h3 style={{ marginTop: 0 }}>Change Password</h3>
        <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>Current Password</label>
        <input className="input" type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} style={{ margin: '6px 0 12px' }} />
        <label style={{ fontSize: 13, color: 'var(--text-dim)' }}>New Password</label>
        <input className="input" type="password" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} style={{ margin: '6px 0 12px' }} />
        <button className="btn btn-primary">Change Password</button>
      </form>
    </div>
  );
}
