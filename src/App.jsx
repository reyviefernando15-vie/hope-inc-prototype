import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import LoginPage    from './pages/LoginPage.jsx';
import Layout       from './components/Layout.jsx';
import Dashboard    from './pages/Dashboard.jsx';
import Transactions from './pages/Transactions.jsx';
import Analytics    from './pages/Analytics.jsx';
import DeletedItems from './pages/DeletedItems.jsx';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'USER') return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index          element={<Dashboard />} />
        <Route path="transactions" element={<Transactions />} />
        <Route path="analytics"    element={<Analytics />} />
        <Route path="deleted"      element={<AdminRoute><DeletedItems /></AdminRoute>} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
