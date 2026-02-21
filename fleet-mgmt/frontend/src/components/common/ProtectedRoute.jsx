import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../common/index';

export default function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="flex flex-col items-center gap-3">
          <Spinner size="lg" />
          <p className="text-sm text-slate-500">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface-0">
        <div className="text-center">
          <p className="text-6xl mb-4">🚫</p>
          <h2 className="font-display font-bold text-xl text-slate-300 mb-2">Access Denied</h2>
          <p className="text-sm text-slate-500">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return children;
}
