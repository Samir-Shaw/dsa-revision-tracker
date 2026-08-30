import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';

import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import AppLayout from './layouts/AppLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Problems from './pages/Problems.jsx';
import ProblemDetail from './pages/ProblemDetail.jsx';
import AddProblem from './pages/AddProblem.jsx';
import Import from './pages/Import.jsx';
import Revision from './pages/Revision.jsx';
import Practice from './pages/Practice.jsx';
import Patterns from './pages/Patterns.jsx';
import Favorites from './pages/Favorites.jsx';
import Analytics from './pages/Analytics.jsx';
import Settings from './pages/Settings.jsx';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="problems" element={<Problems />} />
        <Route path="problems/new" element={<AddProblem />} />
        <Route path="problems/:id" element={<ProblemDetail />} />
        <Route path="import" element={<Import />} />
        <Route path="revision" element={<Revision />} />
        <Route path="practice" element={<Practice />} />
        <Route path="patterns" element={<Patterns />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
