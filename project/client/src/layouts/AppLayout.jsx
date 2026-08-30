import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, ListChecks, Brain, RotateCcw, Shapes, Star,
  BarChart3, Upload, Settings as SettingsIcon, LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/problems', label: 'Problems', icon: ListChecks },
  { to: '/practice', label: 'Practice', icon: Brain },
  { to: '/revision', label: 'Revision', icon: RotateCcw },
  { to: '/patterns', label: 'Patterns', icon: Shapes },
  { to: '/favorites', label: 'Favorites', icon: Star },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/import', label: 'Import Problems', icon: Upload },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">DSA Revision Tracker</div>
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
            <Icon size={16} /> {label}
          </NavLink>
        ))}
        <div style={{ flex: 1 }} />
        <NavLink to="/settings" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          <SettingsIcon size={16} /> Settings
        </NavLink>
        <button className="nav-link" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'left' }} onClick={handleLogout}>
          <LogOut size={16} /> Logout ({user?.name})
        </button>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
