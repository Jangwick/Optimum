import { lazy, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import { ErrorBoundary } from './components/ErrorBoundary.jsx';

const Login = lazy(() => import('./pages/Login.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Claims = lazy(() => import('./pages/Claims.jsx'));
const ClaimDetail = lazy(() => import('./pages/ClaimDetail.jsx'));
const NewClaim = lazy(() => import('./pages/NewClaim.jsx'));
const MasterData = lazy(() => import('./pages/MasterData.jsx'));
const AuditLogs = lazy(() => import('./pages/AuditLogs.jsx'));
const Employees = lazy(() => import('./pages/Employees.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
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

export default function App(): JSX.Element {
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
        path="/reports"
        element={
          <ProtectedRoute>
            <ErrorBoundary>
              <Reports />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route
        path="/employees"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <ErrorBoundary>
              <Employees />
            </ErrorBoundary>
          </ProtectedRoute>
        }
      />
      <Route path="/registry" element={<Navigate to="/claims" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
