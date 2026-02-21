import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Spinner } from '../components/common';

export default function Login() {
  const { user, login } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (email) => setForm({ email, password: 'password123' });

  return (
    <div className="min-h-screen bg-surface-0 flex">
      {/* Left panel */}
      <div className="hidden lg:flex w-1/2 bg-surface-1 border-r border-surface-3 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-display font-bold text-xl">F</span>
          </div>
          <span className="font-display font-bold text-2xl text-slate-100">Fleet Management System</span>
        </div>

        <div>
          <h1 className="font-display font-bold text-5xl text-slate-100 leading-tight mb-6">
            Fleet operations,<br />
            <span className="text-brand-400">intelligently</span><br />
            managed.
          </h1>
          <p className="text-slate-400 text-lg leading-relaxed max-w-md">
            End-to-end fleet lifecycle management. Vehicles, drivers, dispatch, maintenance, fuel, and compliance — unified.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Vehicles Tracked', value: '∞' },
            { label: 'Real-time Status', value: '✓' },
            { label: 'Cost Analytics', value: '✓' }
          ].map(stat => (
            <div key={stat.label} className="bg-surface-2 rounded-xl p-4 border border-surface-3">
              <p className="font-display font-bold text-2xl text-brand-400">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-brand-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-display font-bold">F</span>
            </div>
            <span className="font-display font-bold text-xl text-slate-100">Fleet Management System</span>
          </div>

          <h2 className="font-display font-bold text-2xl text-slate-100 mb-1">Sign in</h2>
          <p className="text-slate-500 text-sm mb-8">Enter your credentials to access the platform</p>

          {error && (
            <div className="bg-accent-red/10 border border-accent-red/20 rounded-xl px-4 py-3 text-sm text-accent-red mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                placeholder="you@fleet.com"
                value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                type="password"
                className="input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                required
              />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full mt-2 py-3 text-base">
              {loading ? <Spinner size="sm" className="mx-auto" /> : 'Sign In'}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-8">
            <p className="text-xs text-slate-500 mb-3 uppercase tracking-wider">Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { role: 'Manager', email: 'manager@fleet.com' },
                { role: 'Dispatcher', email: 'dispatcher@fleet.com' },
                // { role: 'Safety', email: 'safety@fleet.com' },
                // { role: 'Finance', email: 'finance@fleet.com' }
              ].map(acc => (
                <button
                  key={acc.role}
                  onClick={() => quickFill(acc.email)}
                  className="text-left px-3 py-2 bg-surface-2 hover:bg-surface-3 rounded-xl border border-surface-3 transition-colors"
                >
                  <p className="text-xs font-medium text-slate-300">{acc.role}</p>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{acc.email}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
