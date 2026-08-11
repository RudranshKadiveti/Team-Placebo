import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProfilePage } from './pages/ProfilePage';
import { fetchHealthStatus } from './services/api';
import { HealthCheckState } from './types';
import { Activity, Database, Server, RefreshCw, CheckCircle2, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SystemStatusPage: React.FC = () => {
  const [status, setStatus] = React.useState<HealthCheckState>({
    backend: 'Checking...',
    database: 'Checking...',
    loading: true,
  });

  const checkStatus = async () => {
    setStatus((prev) => ({ ...prev, loading: true, error: undefined }));
    try {
      const data = await fetchHealthStatus();
      setStatus({
        backend: data.success ? 'Connected' : 'Disconnected',
        database: data.database === 'connected' ? 'Connected' : 'Disconnected',
        message: data.message,
        loading: false,
      });
    } catch (err: unknown) {
      const errorResponse = (err as { response?: { status?: number; data?: { database?: string } } }).response;
      const is503 = errorResponse?.status === 503;
      const dbStatus = errorResponse?.data?.database === 'connected' ? 'Connected' : 'Disconnected';

      setStatus({
        backend: errorResponse ? 'Connected' : 'Disconnected',
        database: is503 ? dbStatus : 'Disconnected',
        loading: false,
        error: errorResponse ? 'Database Service Degraded' : 'Unable to connect to backend server',
      });
    }
  };

  React.useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />

      <main className="w-full max-w-xl bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-2xl p-8 shadow-2xl relative z-10">
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-4 tracking-wide uppercase">
            <ShieldCheck className="w-4 h-4" /> System Foundation Setup
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent mb-2">
            CareerPilot AI
          </h1>
          <p className="text-slate-400 text-base font-medium">
            Your AI-powered career intelligence platform.
          </p>
        </header>

        <section className="space-y-4 mb-8">
          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400">
                <Server className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-200">Backend Status</span>
            </div>
            <div className="flex items-center gap-2">
              {status.backend === 'Connected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : status.backend === 'Checking...' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  Checking...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                <Database className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold text-slate-200">Database Status</span>
            </div>
            <div className="flex items-center gap-2">
              {status.database === 'Connected' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>
              ) : status.database === 'Checking...' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
                  Checking...
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" /> Disconnected
                </span>
              )}
            </div>
          </div>
        </section>

        {status.error && (
          <div className="mb-6 p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-center font-medium">
            {status.error}
          </div>
        )}

        <div className="flex justify-between items-center gap-4">
          <button
            onClick={checkStatus}
            disabled={status.loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm transition-all duration-150 border border-slate-700"
          >
            <RefreshCw className={`w-4 h-4 ${status.loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition-all duration-150 shadow-lg shadow-blue-600/20"
          >
            Go to Login <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </main>

      <footer className="mt-8 text-center text-xs text-slate-500 flex items-center gap-2">
        <Activity className="w-3.5 h-3.5" /> CareerPilot AI Infrastructure v1.0.0
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="/status" element={<SystemStatusPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
