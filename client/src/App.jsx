import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Claims from './pages/Claims.jsx';
import ClaimDetail from './pages/ClaimDetail.jsx';
import NewClaim from './pages/NewClaim.jsx';
import MasterData from './pages/MasterData.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Employees from './pages/Employees.jsx';
import ImportWizard from './pages/ImportWizard.jsx';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface">
        <div className="text-body-lg text-primary">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Claims />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims/new"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <ErrorBoundary>
              <NewClaim />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/claims/:id"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <ClaimDetail />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/master-data"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <MasterData />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit-logs"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <ErrorBoundary>
              <AuditLogs />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Employees />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/imports"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <ErrorBoundary>
              <ImportWizard />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="/registry" element={<Navigate to="/claims" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
